/**
 * Registrations and newsletter signups from the static site.
 *
 * The form endpoints (src/pages/api/) are the only code that runs on the Worker. They
 * validate here, store in D1 (see migrations/), then hand off to src/lib/notify.ts for
 * emails and the automation webhook. The browser's checks are a convenience, not a guarantee.
 */
import { AGES, CLASS_TYPES, DAYS, MAX_CHILDREN, TEACHER_PREFS, TIMES, TIMEZONES } from '../data/form-options';
import { plans, subjects } from '../data/content';

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** A problem the visitor can fix; its message is safe to show them. */
export class SubmissionError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');
const oneOf = (v: unknown, allowed: readonly string[], fallback: string) => (typeof v === 'string' && allowed.includes(v) ? v : fallback);
const someOf = (v: unknown, allowed: readonly string[]) =>
  (Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === 'string' && allowed.includes(x)))] : []);

export interface Child {
  name: string; age: string; grade: string; subjects: string[]; type: string;
  time: string; days: string[]; teacher: string; goals: string;
}

export interface Registration {
  id: string;
  createdAt: string;
  parent: { name: string; email: string; phone: string; tz: string };
  plan: { id: string; title: string };
  children: Child[];
  /** Plain-text summary of the children, for emails and quick reading. */
  summary: string;
}

/* ---------------- validation ---------------- */

/** Turn a raw form body into a clean registration, or throw a SubmissionError. */
export function validateRegistration(body: unknown): Omit<Registration, 'id' | 'createdAt'> {
  const b = (body ?? {}) as Record<string, any>;
  const p = (b.parent ?? {}) as Record<string, unknown>;

  const parent = {
    name: str(p.name, 100),
    email: str(p.email, 254).toLowerCase(),
    phone: str(p.phone, 40),
    tz: oneOf(p.tz, TIMEZONES, 'Other'),
  };
  if (!parent.name) throw new SubmissionError('Please enter your name.');
  if (!EMAIL_RE.test(parent.email)) throw new SubmissionError('Please enter a valid email address.');
  if (parent.phone.replace(/\D/g, '').length < 7) throw new SubmissionError('Please enter a phone or WhatsApp number.');

  const allSubjects = subjects.flatMap((g) => g.items);
  const plan = plans.find((x) => x.id === b.plan) ?? plans[0];

  const rawKids = Array.isArray(b.kids) ? b.kids.slice(0, MAX_CHILDREN) : [];
  const children: Child[] = rawKids.map((k: Record<string, unknown>) => ({
    name: str(k?.name, 60),
    age: oneOf(k?.age, AGES, ''),
    grade: str(k?.grade, 40),
    subjects: someOf(k?.subjects, allSubjects),
    type: oneOf(k?.type, CLASS_TYPES, CLASS_TYPES[0]),
    time: oneOf(k?.time, TIMES, 'Afternoon'),
    days: someOf(k?.days, DAYS),
    teacher: oneOf(k?.teacher, TEACHER_PREFS, TEACHER_PREFS[0]),
    goals: str(k?.goals, 500),
  }));
  if (!children.length) throw new SubmissionError('Please add at least one child.');
  children.forEach((c, i) => {
    if (!c.name || !c.age) throw new SubmissionError(`Add a name and age for child ${i + 1}.`);
    if (!c.subjects.length) throw new SubmissionError(`Pick at least one subject for ${c.name}.`);
  });

  return { parent, plan: { id: plan.id, title: plan.title }, children, summary: summarizeChildren(children) };
}

export function summarizeChildren(children: Child[]) {
  return children.map((c) => [
    `${c.name} (age ${c.age}${c.grade ? `, ${c.grade}` : ''})`,
    `  Subjects: ${c.subjects.join(', ')}`,
    `  ${c.type} · ${c.days.length ? c.days.join(', ') : 'Any day'} · ${c.time} · ${c.teacher}`,
    c.goals ? `  Goals: ${c.goals}` : '',
  ].filter(Boolean).join('\n')).join('\n\n');
}

/* ---------------- storage ---------------- */

// Abuse limits. Generous for real families, tight enough to stop the form being used to
// flood the team or to send confirmation emails to someone else's inbox.
const MAX_PER_IP_PER_HOUR = 5;
const MAX_PER_EMAIL_PER_DAY = 3;

/** Salted SHA-256 of the sender's IP: enough to rate-limit, without storing the IP itself. */
export async function hashIp(ip: string | null, salt: string) {
  if (!ip) return null;
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${ip}`));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

const isoAgo = (ms: number) => new Date(Date.now() - ms).toISOString();

/** Apply the rate limits, then store the registration. */
export async function saveRegistration(
  db: D1Database,
  data: Omit<Registration, 'id' | 'createdAt'>,
  ipHash: string | null,
): Promise<Registration> {
  const [byIp, byEmail] = await db.batch<{ n: number }>([
    db.prepare('SELECT COUNT(*) AS n FROM registrations WHERE ip_hash = ? AND created_at > ?').bind(ipHash, isoAgo(60 * 60 * 1000)),
    db.prepare('SELECT COUNT(*) AS n FROM registrations WHERE parent_email = ? AND created_at > ?').bind(data.parent.email, isoAgo(24 * 60 * 60 * 1000)),
  ]);
  if (ipHash && (byIp.results[0]?.n ?? 0) >= MAX_PER_IP_PER_HOUR) {
    throw new SubmissionError('Too many registrations from your network. Please try again later, or email us.', 429);
  }
  if ((byEmail.results[0]?.n ?? 0) >= MAX_PER_EMAIL_PER_DAY) {
    throw new SubmissionError('We’ve already received registrations for this email today — our team will be in touch soon.', 429);
  }

  const reg: Registration = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  await db
    .prepare(`INSERT INTO registrations
      (id, created_at, parent_name, parent_email, parent_phone, timezone, plan, children_count, children_json, children_summary, ip_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(
      reg.id, reg.createdAt, reg.parent.name, reg.parent.email, reg.parent.phone, reg.parent.tz,
      reg.plan.title, reg.children.length, JSON.stringify(reg.children), reg.summary, ipHash,
    )
    .run();
  return reg;
}

/** Add an email to the newsletter list. Returns whether it was new (false if already subscribed). */
export async function saveSubscriber(db: D1Database, raw: unknown) {
  const email = str(raw, 254).toLowerCase();
  if (!EMAIL_RE.test(email)) throw new SubmissionError('Please enter a valid email address.');
  const result = await db.prepare('INSERT OR IGNORE INTO subscribers (email) VALUES (?)').bind(email).run();
  return { email, isNew: (result.meta.changes ?? 0) > 0 };
}

/* ---------------- request guards ---------------- */

/**
 * Basic abuse guards for the public form endpoints: same-site requests only, JSON only,
 * and a size cap. Returns an error response, or null when the request may proceed.
 */
export function guardRequest(request: Request, maxBytes = 32_000): Response | null {
  const origin = request.headers.get('origin');
  if (!origin || origin !== new URL(request.url).origin) {
    return Response.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }
  if (!request.headers.get('content-type')?.includes('application/json')) {
    return Response.json({ ok: false, error: 'Expected JSON' }, { status: 415 });
  }
  if (Number(request.headers.get('content-length') ?? 0) > maxBytes) {
    return Response.json({ ok: false, error: 'Too large' }, { status: 413 });
  }
  return null;
}

/** Read a JSON body with a hard size cap (content-length can be absent or wrong). */
export async function readJson(request: Request, maxBytes = 32_000): Promise<Record<string, unknown>> {
  const text = await request.text();
  if (text.length > maxBytes) throw new SubmissionError('Submission too large.', 413);
  try {
    const value = JSON.parse(text);
    return value && typeof value === 'object' ? value : {};
  } catch {
    throw new SubmissionError('Invalid submission.');
  }
}

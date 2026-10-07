/**
 * Automation after a submission is stored:
 *   - registration → confirmation email to the parent, alert email to the team, webhook
 *   - newsletter signup → webhook
 *
 * Emails go through Resend (https://resend.com, free tier ~3,000/month); the webhook posts
 * JSON to Make / Zapier / n8n so more steps (WhatsApp, CRM, Slack…) need no code changes.
 * Each step is optional: it is skipped when its setting is missing, and a failure is logged
 * without affecting the visitor, because the submission is already saved in D1.
 */
import { home } from '../data/content';
import type { Registration } from './submissions';

export interface NotifyEnv {
  SITE_URL?: string;
  EMAIL_FROM?: string;
  TEAM_EMAIL?: string;
  RESEND_API_KEY?: string;
  AUTOMATION_WEBHOOK_URL?: string;
  WEBHOOK_SECRET?: string;
}

const TIMEOUT_MS = 8000;

const esc = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, (c) => (
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as Record<string, string>)[c]
));

/* ---------------- entry points ---------------- */

export async function onRegistration(env: NotifyEnv, reg: Registration) {
  await settle('registration', [
    sendEmail(env, {
      to: [reg.parent.email],
      subject: 'We’ve received your Likulearn registration',
      ...parentEmail(reg),
      idempotencyKey: `registration-${reg.id}-parent`,
      replyTo: home.contact_email,
    }),
    sendEmail(env, {
      to: (env.TEAM_EMAIL ?? '').split(',').map((s) => s.trim()).filter(Boolean),
      subject: `New registration: ${reg.parent.name} — ${reg.children.length === 1 ? reg.children[0].name : `${reg.children.length} children`}`,
      ...teamEmail(reg),
      idempotencyKey: `registration-${reg.id}-team`,
      replyTo: reg.parent.email,
    }),
    postWebhook(env, 'registration.created', {
      id: reg.id,
      created_at: reg.createdAt,
      parent: reg.parent,
      plan: reg.plan,
      children_count: reg.children.length,
      children: reg.children,
      summary: reg.summary,
    }),
  ]);
}

export async function onSubscriber(env: NotifyEnv, email: string) {
  await settle('subscriber', [
    postWebhook(env, 'newsletter.subscribed', { email, created_at: new Date().toISOString() }),
  ]);
}

/** Run steps side by side; log failures instead of throwing. */
async function settle(label: string, steps: Promise<unknown>[]) {
  const results = await Promise.allSettled(steps);
  for (const r of results) {
    if (r.status === 'rejected') console.error(`[notify:${label}]`, r.reason instanceof Error ? r.reason.message : r.reason);
  }
}

/* ---------------- delivery ---------------- */

async function sendEmail(env: NotifyEnv, msg: {
  to: string[]; subject: string; html: string; text: string; replyTo?: string; idempotencyKey: string;
}) {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM || !msg.to.length) return 'skipped';
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      // Resend drops duplicates with the same key, so a retried request never double-sends.
      'Idempotency-Key': msg.idempotencyKey,
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: msg.to,
      subject: msg.subject,
      html: msg.html,
      text: msg.text,
      reply_to: msg.replyTo,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return 'sent';
}

/** POST a JSON event, signed with HMAC-SHA256 of the raw body when WEBHOOK_SECRET is set. */
async function postWebhook(env: NotifyEnv, event: string, data: Record<string, unknown>) {
  if (!env.AUTOMATION_WEBHOOK_URL) return 'skipped';
  const body = JSON.stringify({ event, site: env.SITE_URL ?? '', data });
  const headers: Record<string, string> = { 'Content-Type': 'application/json', 'X-Likulearn-Event': event };
  if (env.WEBHOOK_SECRET) headers['X-Likulearn-Signature'] = `sha256=${await hmacHex(env.WEBHOOK_SECRET, body)}`;
  const res = await fetch(env.AUTOMATION_WEBHOOK_URL, { method: 'POST', headers, body, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Webhook ${res.status}`);
  return 'sent';
}

async function hmacHex(secret: string, body: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/* ---------------- email content ---------------- */

const BRAND = { green: '#0E3B36', orange: '#FF7A1A', ink: '#14211F', muted: '#5D6B69', cream: '#FFF4EC' };

function layout(title: string, inner: string) {
  return `<!doctype html><html><body style="margin:0;background:#F4F6F5;font-family:Arial,Helvetica,sans-serif;color:${BRAND.ink}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F6F5;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden">
<tr><td style="background:${BRAND.green};padding:20px 28px;color:#fff;font-size:20px;font-weight:bold"><span style="color:#FF9A47">liku</span>learn</td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 12px;font-size:22px;font-weight:normal">${esc(title)}</h1>
${inner}
</td></tr>
<tr><td style="padding:16px 28px;background:${BRAND.cream};font-size:12px;color:${BRAND.muted}">Likulearn · Live online classes for ages 3–18 · <a href="mailto:${esc(home.contact_email)}" style="color:${BRAND.muted}">${esc(home.contact_email)}</a></td></tr>
</table></td></tr></table></body></html>`;
}

function childBlocks(reg: Registration) {
  return reg.children.map((c) => `<div style="border:1px solid #EEE6DF;border-radius:12px;padding:14px 16px;margin:0 0 10px">
<strong>${esc(c.name)}</strong> <span style="color:${BRAND.muted}">· age ${esc(c.age)}${c.grade ? ` · ${esc(c.grade)}` : ''}</span><br>
<span style="color:${BRAND.muted};font-size:14px">${esc(c.subjects.join(', '))}<br>${esc(c.type)} · ${esc(c.days.length ? c.days.join(', ') : 'Any day')} · ${esc(c.time)}</span>
${c.goals ? `<br><span style="color:${BRAND.muted};font-size:14px">“${esc(c.goals)}”</span>` : ''}
</div>`).join('');
}

function parentEmail(reg: Registration) {
  const first = reg.parent.name.split(' ')[0] || 'there';
  const html = layout(`Thank you, ${first}!`, `
<p style="margin:0 0 16px;line-height:1.6">We’ve received your registration. Here’s what you sent us:</p>
${childBlocks(reg)}
<p style="margin:16px 0 8px;line-height:1.6"><strong>Plan:</strong> ${esc(reg.plan.title)} — every child starts with a free trial class.</p>
<h2 style="font-size:16px;margin:24px 0 8px">What happens next</h2>
<ol style="margin:0;padding-left:20px;line-height:1.7;color:${BRAND.muted}">
<li>We match a teacher for every subject, within 48 hours.</li>
<li>We email you the trial class time, in ${esc(reg.parent.tz)}.</li>
<li>Your child joins the live class — then you pick the plan that fits.</li>
</ol>
<p style="margin:24px 0 0;line-height:1.6;color:${BRAND.muted}">Questions? Just reply to this email.</p>`);
  const text = `Thank you, ${first}!

We've received your registration:

${reg.summary}

Plan: ${reg.plan.title} — every child starts with a free trial class.

What happens next
1. We match a teacher for every subject, within 48 hours.
2. We email you the trial class time, in ${reg.parent.tz}.
3. Your child joins the live class — then you pick the plan that fits.

Questions? Just reply to this email.
Likulearn · ${home.contact_email}`;
  return { html, text };
}

function teamEmail(reg: Registration) {
  const digits = reg.parent.phone.replace(/\D/g, '');
  const wa = digits.length >= 7 ? `https://wa.me/${digits}` : '';
  const html = layout('New free-trial registration', `
<table role="presentation" cellpadding="0" cellspacing="0" style="font-size:14px;line-height:1.7;margin:0 0 16px">
<tr><td style="color:${BRAND.muted};padding-right:16px">Parent</td><td><strong>${esc(reg.parent.name)}</strong></td></tr>
<tr><td style="color:${BRAND.muted};padding-right:16px">Email</td><td><a href="mailto:${esc(reg.parent.email)}">${esc(reg.parent.email)}</a></td></tr>
<tr><td style="color:${BRAND.muted};padding-right:16px">Phone</td><td>${esc(reg.parent.phone)}${wa ? ` · <a href="${esc(wa)}">WhatsApp</a>` : ''}</td></tr>
<tr><td style="color:${BRAND.muted};padding-right:16px">Time zone</td><td>${esc(reg.parent.tz)}</td></tr>
<tr><td style="color:${BRAND.muted};padding-right:16px">Plan</td><td>${esc(reg.plan.title)}</td></tr>
</table>
${childBlocks(reg)}
<p style="margin:16px 0 0;font-size:12px;color:${BRAND.muted}">Reply to this email to answer the parent. Ref ${esc(reg.id)}</p>`);
  const text = `New free-trial registration

Parent: ${reg.parent.name}
Email: ${reg.parent.email}
Phone: ${reg.parent.phone}${wa ? ` (WhatsApp: ${wa})` : ''}
Time zone: ${reg.parent.tz}
Plan: ${reg.plan.title}

${reg.summary}

Ref ${reg.id}`;
  return { html, text };
}

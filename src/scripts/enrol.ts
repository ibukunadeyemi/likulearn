import { CLASS_TYPES, TIMES, DAYS, TIMEZONES, AGES, TEACHER_PREFS, MAX_CHILDREN } from '../data/form-options';
import type { Plan, SubjectGroup } from '../data/content';

// Registrations are saved to the "Registrations" collection in the CMS (src/pages/api/enrol.ts).
const ENROL_ENDPOINT = '/api/enrol';

// Plans and subjects are edited in the CMS; the page passes them in (see initEnrolForm).
let PLANS: Plan[] = [];
let SUBJECTS: SubjectGroup[] = [];

// Unfinished registrations are kept in this browser for a week so a refresh doesn't lose them.
const DRAFT_KEY = 'likulearn-enrol-draft';
const DRAFT_TTL = 7 * 24 * 60 * 60 * 1000;

export const EMAIL_RE = /^\S+@\S+\.\S+$/;

export const esc = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, (c) => (
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as Record<string, string>)[c]
));

/** A message from the server that is safe to show the visitor (a 400 validation error). */
export class ServerMessage extends Error {}

export async function postJSON(url: string, body: unknown) {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  if (r.status === 400 && typeof data.error === 'string') throw new ServerMessage(data.error);
  if (!r.ok || data.ok === false) throw new Error(`HTTP ${r.status}`);
  return data;
}

interface Kid {
  name: string; age: string; grade: string; subjects: string[]; type: string;
  time: string; days: string[]; teacher: string; goals: string; open: boolean;
}
interface Parent { name: string; email: string; phone: string; tz: string }
interface State {
  step: number;
  /** Furthest step reached; steps up to here can be jumped to from the stepper. */
  maxStep: number;
  parent: Parent;
  kids: Kid[];
  plan: string;
  submitted: boolean;
  sending: boolean;
  /** Field-level messages keyed like "parent.email" or "kid.0.subjects". */
  errors: Record<string, string>;
  /** Form-level message shown above the buttons. */
  notice: string;
  restored: boolean;
  undo: { kid: Kid; index: number } | null;
}
interface RenderOpts {
  dir?: 'next' | 'back';
  pop?: string | null;
  shake?: boolean;
  /** 'heading' | 'invalid' | a selector; omitted keeps focus on the element that had it. */
  focus?: string;
  enterKid?: number;
  scroll?: boolean;
}

const STEPS = [
  { id: 'parent', label: 'Parent', title: 'About you', sub: 'We’ll send your trial class details here.' },
  { id: 'kids', label: 'Children', title: 'Your children', sub: 'Add each child and the subjects they’d like help with.' },
  { id: 'plan', label: 'Plan', title: 'Choose a plan', sub: 'The trial is free and needs no card. Pick how you’d like to continue afterwards. You can change it anytime.' },
  { id: 'review', label: 'Review', title: 'Check and submit', sub: 'Make sure everything looks right. You can edit any section.' },
] as const;
type StepId = typeof STEPS[number]['id'];

const ICON = {
  check: '<svg class="chip-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',
  tick: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',
  arrow: '<svg class="arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>',
  back: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>',
  chevron: '<svg class="chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
  trash: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>',
  plus: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  alert: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>',
  close: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>',
};

/** Best guess at the family's time zone option from the browser. */
function detectTz(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (/^Africa\/(Lagos|Kinshasa|Luanda|Douala|Libreville|Malabo|Niamey|Ndjamena|Porto-Novo|Bangui|Brazzaville)/.test(tz)) return 'West Africa (WAT)';
    if (/^(Europe\/(London|Dublin|Lisbon)|Africa\/(Accra|Abidjan|Dakar|Banjul|Freetown|Monrovia|Bamako|Conakry|Lome|Ouagadougou)|UTC|Etc\/(UTC|GMT)|GMT)/.test(tz)) return 'GMT / UTC';
    if (/^Europe\//.test(tz)) return 'Central Europe (CET)';
    if (/^America\/(New_York|Toronto|Detroit|Indiana|Kentucky|Montreal|Nassau)/.test(tz)) return 'US Eastern (ET)';
    if (/^America\/(Los_Angeles|Vancouver|Tijuana)/.test(tz)) return 'US Pacific (PT)';
    if (/^Asia\/(Dubai|Muscat)/.test(tz)) return 'Gulf (GST)';
    if (/^Asia\/(Kolkata|Calcutta)/.test(tz)) return 'India (IST)';
    return tz ? 'Other' : 'GMT / UTC';
  } catch {
    return 'GMT / UTC';
  }
}

const newKid = (): Kid => ({ name: '', age: '', grade: '', subjects: [], type: '1-on-1', time: 'Afternoon', days: [], teacher: 'No preference', goals: '', open: true });
const initial = (): State => ({
  step: 0, maxStep: 0,
  parent: { name: '', email: '', phone: '', tz: detectTz() },
  kids: [newKid()], plan: PLANS[0]?.id ?? '',
  submitted: false, sending: false, errors: {}, notice: '', restored: false, undo: null,
});
const toggle = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
const fid = (key: string) => 'f-' + key.replace(/\./g, '-');
const motionOn = () => document.documentElement.classList.contains('js-motion');

/* ---------------- validation ---------------- */

function kidErrors(k: Kid, i: number): Record<string, string> {
  const e: Record<string, string> = {};
  if (!k.name.trim()) e[`kid.${i}.name`] = 'Please enter your child’s name.';
  if (!k.age) e[`kid.${i}.age`] = 'Please choose an age.';
  if (!k.subjects.length) e[`kid.${i}.subjects`] = 'Pick at least one subject.';
  return e;
}

function stepErrors(s: State, id: StepId): Record<string, string> {
  const e: Record<string, string> = {};
  if (id === 'parent') {
    const p = s.parent;
    if (!p.name.trim()) e['parent.name'] = 'Please enter your name.';
    if (!p.email.trim()) e['parent.email'] = 'Please enter your email address.';
    else if (!EMAIL_RE.test(p.email.trim())) e['parent.email'] = 'That email doesn’t look right. Check for typos.';
    const digits = p.phone.replace(/\D/g, '');
    if (!p.phone.trim()) e['parent.phone'] = 'Please enter a phone or WhatsApp number.';
    else if (digits.length < 7) e['parent.phone'] = 'That number looks too short. Include the country code.';
  }
  if (id === 'kids') s.kids.forEach((k, i) => Object.assign(e, kidErrors(k, i)));
  return e;
}

function kidSummary(k: Kid) {
  const bits = [k.age ? `Age ${k.age}` : '', k.grade.trim()];
  if (k.subjects.length) bits.push(k.subjects.length > 2 ? `${k.subjects.slice(0, 2).join(', ')} +${k.subjects.length - 2}` : k.subjects.join(', '));
  return bits.filter(Boolean).join(' · ');
}

/* ---------------- draft persistence ---------------- */

function loadDraft(): State | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (!d || typeof d !== 'object' || Date.now() - Number(d.savedAt) > DRAFT_TTL || !Array.isArray(d.kids) || !d.kids.length) {
      localStorage.removeItem(DRAFT_KEY);
      return null;
    }
    const base = initial();
    const step = Math.min(Math.max(Number(d.step) || 0, 0), STEPS.length - 1);
    return {
      ...base,
      step,
      maxStep: Math.min(Math.max(Number(d.maxStep) || step, step), STEPS.length - 1),
      parent: { ...base.parent, ...d.parent },
      // Drop subjects that have since been renamed or removed in the CMS.
      kids: d.kids.slice(0, MAX_CHILDREN).map((k: Partial<Kid>) => {
        const kid = { ...newKid(), ...k };
        const known = SUBJECTS.flatMap((g) => g.items);
        return { ...kid, subjects: kid.subjects.filter((x) => known.includes(x)) };
      }),
      plan: PLANS.some((p) => p.id === d.plan) ? d.plan : base.plan,
      restored: true,
    };
  } catch {
    return null;
  }
}

function saveDraft(s: State) {
  try {
    const hasContent = s.parent.name || s.parent.email || s.parent.phone || s.kids.some((k) => k.name || k.subjects.length);
    if (s.submitted || !hasContent) { localStorage.removeItem(DRAFT_KEY); return; }
    const { step, maxStep, parent, kids, plan } = s;
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ step, maxStep, parent, kids, plan, savedAt: Date.now() }));
  } catch { /* storage unavailable (private mode); the form still works */ }
}

/* ---------------- form ---------------- */

export function initEnrolForm(
  root: HTMLElement,
  progress: HTMLElement | null,
  status: HTMLElement | null,
  opts: { plans: Plan[]; subjects: SubjectGroup[] },
) {
  PLANS = opts.plans;
  SUBJECTS = opts.subjects;
  let state: State = loadDraft() ?? initial();
  let saveTimer = 0;
  let undoTimer = 0;
  const card = root.closest<HTMLElement>('.form-card') ?? root;

  const announce = (msg: string) => {
    if (!status) return;
    status.textContent = '';
    window.setTimeout(() => { status.textContent = msg; }, 60);
  };
  const queueSave = () => { clearTimeout(saveTimer); saveTimer = window.setTimeout(() => saveDraft(state), 300); };

  /* ----- markup helpers ----- */

  function field(o: { key: string; label: string; required?: boolean; hint?: string; cls?: string; control: (attrs: string) => string }) {
    const err = state.errors[o.key] ?? '';
    const id = fid(o.key);
    const describedBy = [o.hint ? `${id}-hint` : '', `${id}-err`].filter(Boolean).join(' ');
    const attrs = `id="${id}" aria-describedby="${describedBy}"${o.required ? ' aria-required="true"' : ''}${err ? ' aria-invalid="true"' : ''}`;
    return `<div class="field${err ? ' has-error' : ''}${o.cls ? ` ${o.cls}` : ''}" data-key="${o.key}">
      <label for="${id}">${o.label}${o.required ? '<span class="req" aria-hidden="true">*</span>' : '<span class="opt">Optional</span>'}</label>
      ${o.control(attrs)}
      ${o.hint ? `<p class="field-hint" id="${id}-hint">${o.hint}</p>` : ''}
      <p class="field-error" id="${id}-err">${ICON.alert}<span>${esc(err)}</span></p>
    </div>`;
  }

  function group(o: { key: string; legend: string; required?: boolean; aside?: string; hint?: string; cls?: string; body: string }) {
    const err = state.errors[o.key] ?? '';
    const id = fid(o.key);
    return `<fieldset class="group${err ? ' has-error' : ''}${o.cls ? ` ${o.cls}` : ''}" data-key="${o.key}" aria-describedby="${o.hint ? `${id}-hint ` : ''}${id}-err">
      <legend><span class="legend-text">${o.legend}${o.required ? '<span class="req" aria-hidden="true">*</span>' : ''}</span>${o.aside ?? ''}</legend>
      ${o.hint ? `<p class="field-hint" id="${id}-hint">${o.hint}</p>` : ''}
      ${o.body}
      <p class="field-error" id="${id}-err">${ICON.alert}<span>${esc(err)}</span></p>
    </fieldset>`;
  }

  /** Toggle chip (aria-pressed) or, with `radio`, one option of a roving-tabindex radio group. */
  function chip(on: boolean, label: string, action: string, opts: { cls?: string; radio?: boolean } = {}) {
    const a11y = opts.radio ? `role="radio" aria-checked="${on}" tabindex="${on ? 0 : -1}"` : `aria-pressed="${on}"`;
    return `<button type="button" class="chip ${opts.cls ?? ''}" ${a11y} data-action="${action}" data-value="${esc(label)}">${ICON.check}<span>${esc(label)}</span></button>`;
  }

  const options = (list: string[], selected: string) =>
    list.map((v) => `<option value="${esc(v)}"${v === selected ? ' selected' : ''}>${esc(v)}</option>`).join('');

  /* ----- steps ----- */

  function renderParent() {
    const p = state.parent;
    return `<div class="grid-2">
      ${field({ key: 'parent.name', label: 'Full name', required: true, cls: 'span-2', control: (a) => `<input ${a} data-parent="name" value="${esc(p.name)}" placeholder="e.g. Amara Okafor" autocomplete="name" enterkeyhint="next">` })}
      ${field({ key: 'parent.email', label: 'Email', required: true, control: (a) => `<input ${a} type="email" data-parent="email" value="${esc(p.email)}" placeholder="you@example.com" autocomplete="email" inputmode="email" autocapitalize="off" spellcheck="false" enterkeyhint="next">` })}
      ${field({ key: 'parent.phone', label: 'Phone / WhatsApp', required: true, hint: 'Include your country code, e.g. +234 or +44.', control: (a) => `<input ${a} type="tel" data-parent="phone" value="${esc(p.phone)}" placeholder="+234 801 234 5678" autocomplete="tel" inputmode="tel" enterkeyhint="next">` })}
      ${field({ key: 'parent.tz', label: 'Your time zone', required: true, cls: 'span-2', hint: 'We schedule classes in your local time.', control: (a) => `<select ${a} data-parent="tz">${options(TIMEZONES, p.tz)}</select>` })}
    </div>`;
  }

  function renderKid(k: Kid, i: number, enter: boolean) {
    const many = state.kids.length > 1;
    const errs = kidErrors(k, i);
    const shownErr = Object.keys(state.errors).some((x) => x.startsWith(`kid.${i}.`));
    const complete = !Object.keys(errs).length;
    const open = !many || k.open;
    const title = esc(k.name.trim() || `Child ${i + 1}`);
    const summary = kidSummary(k);
    const head = many
      ? `<button type="button" class="kid-toggle" data-action="toggle-kid" aria-expanded="${open}" aria-controls="kid-body-${i}">
          <span class="kid-num${complete ? ' complete' : ''}">${complete && !open ? ICON.tick : i + 1}</span>
          <span class="kid-meta"><span class="kid-name" data-heading>${title}</span>
            <span class="kid-sum">${shownErr ? '<span class="tag-warn">Needs attention</span>' : summary ? esc(summary) : 'Not started yet'}</span></span>
          ${ICON.chevron}
        </button>
        <button type="button" class="kid-remove" data-action="remove-kid" aria-label="Remove ${title}">${ICON.trash}<span>Remove</span></button>`
      : `<div class="kid-solo"><span class="kid-num">1</span><span class="kid-name" data-heading>${title}</span></div>`;

    return `<div class="kid${open ? ' open' : ''}${shownErr ? ' has-error' : ''}${enter ? ' kid-enter' : ''}" data-kid="${i}">
      <div class="kid-head">${head}</div>
      <div class="kid-body" id="kid-body-${i}"${open ? '' : ' hidden'}>
        <div class="grid-kid">
          ${field({ key: `kid.${i}.name`, label: 'Child’s first name', required: true, control: (a) => `<input ${a} data-field="name" value="${esc(k.name)}" placeholder="e.g. Tobi" autocomplete="off" autocapitalize="words" enterkeyhint="next">` })}
          ${field({ key: `kid.${i}.age`, label: 'Age', required: true, control: (a) => `<select ${a} data-field="age"><option value="">Select</option>${options(AGES, k.age)}</select>` })}
          ${field({ key: `kid.${i}.grade`, label: 'School year', control: (a) => `<input ${a} data-field="grade" value="${esc(k.grade)}" placeholder="e.g. Year 7, JSS1" autocomplete="off" enterkeyhint="next">` })}
        </div>
        ${group({
          key: `kid.${i}.subjects`, legend: 'Subjects', required: true,
          aside: `<span class="count${k.subjects.length ? ' on' : ''}">${k.subjects.length ? `${k.subjects.length} selected` : 'Pick any'}</span>`,
          body: SUBJECTS.map((g) => `<div class="subject-row">
            <span class="subject-row-label">${esc(g.label)}</span>
            <div class="chips">${g.items.map((n) => chip(k.subjects.includes(n), n, 'subject')).join('')}</div>
          </div>`).join(''),
        })}
        <div class="grid-2">
          ${group({ key: `kid.${i}.type`, legend: 'Class type', body: `<div class="seg" role="radiogroup" aria-label="Class type">${CLASS_TYPES.map((n) => chip(k.type === n, n, 'type', { cls: 'box', radio: true })).join('')}</div>` })}
          ${group({ key: `kid.${i}.time`, legend: 'Preferred time', body: `<div class="seg" role="radiogroup" aria-label="Preferred time">${TIMES.map((n) => chip(k.time === n, n, 'time', { cls: 'box', radio: true })).join('')}</div>` })}
        </div>
        ${group({
          key: `kid.${i}.days`, legend: 'Preferred days', hint: 'Leave empty if any day works.',
          aside: `<span class="quick">
            <button type="button" class="quick-btn" data-action="days-preset" data-value="weekdays">Weekdays</button>
            <button type="button" class="quick-btn" data-action="days-preset" data-value="weekends">Weekends</button>
            ${k.days.length ? '<button type="button" class="quick-btn" data-action="days-preset" data-value="clear">Clear</button>' : ''}
          </span>`,
          body: `<div class="days">${DAYS.map((n) => chip(k.days.includes(n), n, 'day', { cls: 'day' })).join('')}</div>`,
        })}
        <div class="grid-2">
          ${field({ key: `kid.${i}.teacher`, label: 'Teacher preference', control: (a) => `<select ${a} data-field="teacher">${options(TEACHER_PREFS, k.teacher)}</select>` })}
          ${field({ key: `kid.${i}.goals`, label: 'Learning goals', control: (a) => `<textarea ${a} data-field="goals" rows="2" placeholder="Exam prep, catching up, extra challenge…">${esc(k.goals)}</textarea>` })}
        </div>
      </div>
    </div>`;
  }

  function renderKids(o: RenderOpts) {
    const u = state.undo;
    return `<div class="kids">
      ${state.kids.map((k, i) => renderKid(k, i, o.enterKid === i)).join('')}
      ${u ? `<div class="undo-bar" role="status"><span>Removed ${esc(u.kid.name.trim() || 'child')}.</span><button type="button" data-action="undo">Undo</button></div>` : ''}
      ${state.kids.length < MAX_CHILDREN ? `<button type="button" class="add-kid" data-action="add-kid">${ICON.plus}Add another child</button>` : ''}
    </div>`;
  }

  function renderPlan() {
    return `<div class="plans" role="radiogroup" aria-label="Plan after the free trial">
      ${PLANS.map((p) => {
        const on = state.plan === p.id;
        return `<button type="button" class="plan" role="radio" aria-checked="${on}" tabindex="${on ? 0 : -1}" data-action="plan" data-value="${p.id}">
          <span class="plan-dot" aria-hidden="true"></span>
          <span class="plan-text"><span class="plan-title">${esc(p.title)}</span><span class="plan-desc">${esc(p.desc)}</span></span>
          <span class="plan-price">${esc(p.price)}</span>
        </button>`;
      }).join('')}
    </div>`;
  }

  function renderReview() {
    const { parent, kids, plan } = state;
    const planTitle = (PLANS.find((p) => p.id === plan) ?? PLANS[0])?.title ?? 'Not chosen';
    const edit = (step: number, label: string, kid?: number) =>
      `<button type="button" class="edit-btn" data-action="edit" data-value="${step}"${kid != null ? ` data-target="${kid}"` : ''} aria-label="Edit ${esc(label)}">Edit</button>`;
    return `<div class="review">
      <section class="review-box">
        <div class="rb-head"><h4>Parent</h4>${edit(0, 'parent details')}</div>
        <p class="rb-main">${esc(parent.name)}</p>
        <p class="sub">${esc(parent.email)} · ${esc(parent.phone)}</p>
        <p class="sub">${esc(parent.tz)}</p>
      </section>
      ${kids.map((k, i) => `<section class="review-box">
        <div class="rb-head"><h4>${esc(k.name || `Child ${i + 1}`)} <span class="rb-age">${k.age ? ` · age ${esc(k.age)}` : ''}${k.grade ? ` · ${esc(k.grade)}` : ''}</span></h4>${edit(1, k.name || `child ${i + 1}`, i)}</div>
        <div class="rb-tags">${k.subjects.map((s) => `<span class="rb-tag">${esc(s)}</span>`).join('')}</div>
        <p class="sub">${esc(k.type)} · ${esc(k.days.length ? k.days.join(', ') : 'Any day')} · ${esc(k.time)}${k.teacher !== 'No preference' ? ` · ${esc(k.teacher)}` : ''}</p>
        ${k.goals ? `<p class="sub">“${esc(k.goals)}”</p>` : ''}
      </section>`).join('')}
      <section class="review-box review-plan">
        <div class="rb-head"><h4>Plan: ${esc(planTitle)}</h4>${edit(2, 'plan')}</div>
        <p class="sub">Every child starts with a free trial class.</p>
      </section>
      <p class="consent">By submitting, you agree that Likulearn may contact you about your trial by email or WhatsApp.</p>
    </div>`;
  }

  function renderDone() {
    const { parent, kids } = state;
    const first = parent.name.trim().split(' ')[0] || 'there';
    const what = kids.length === 1 ? `${kids[0].name || 'your child'}’s registration` : `registrations for ${kids.length} children`;
    return `<div class="enrol-done">
      <div class="done-check"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></div>
      <h3 tabindex="-1" class="done-title">Thank you, ${esc(first)}!</h3>
      <p>We've received ${esc(what)}.</p>
      <ol class="next-steps">
        <li><span>1</span><div><strong>We match a teacher</strong><small>Within 48 hours, for every subject.</small></div></li>
        <li><span>2</span><div><strong>You get the trial time</strong><small>Sent to ${esc(parent.email)}.</small></div></li>
        <li><span>3</span><div><strong>Join the live class</strong><small>Free, then pick the plan that fits.</small></div></li>
      </ol>
      <button type="button" class="btn btn-outline-green" data-action="reset">Register another family</button>
    </div>`;
  }

  function renderStepper() {
    return `<ol class="stepper" aria-label="Registration progress">
      ${STEPS.map((s, i) => {
        const cls = i < state.step ? 'is-done' : i === state.step ? 'is-current' : '';
        const reachable = i <= state.maxStep && i !== state.step;
        return `<li class="${cls}">
          <button type="button" class="step-btn" data-action="go" data-value="${i}"${i === state.step ? ' aria-current="step"' : ''}${reachable ? '' : ' disabled'}>
            <span class="step-dot">${i < state.step ? ICON.tick : i + 1}</span><span class="step-label">${s.label}</span>
          </button>
        </li>`;
      }).join('')}
    </ol>`;
  }

  /* ----- render ----- */

  /** A selector that finds the "same" control after a re-render, so focus survives it. */
  function selectorFor(el: Element | null): string | null {
    if (!(el instanceof HTMLElement) || !root.contains(el)) return null;
    const kid = el.closest<HTMLElement>('[data-kid]')?.dataset.kid;
    const pre = kid != null ? `[data-kid="${kid}"] ` : '';
    if (el.dataset.action) {
      const v = el.dataset.value != null ? `[data-value="${CSS.escape(el.dataset.value)}"]` : '';
      const t = el.dataset.target != null ? `[data-target="${el.dataset.target}"]` : '';
      return `${pre}[data-action="${el.dataset.action}"]${v}${t}`;
    }
    if (el.id) return `#${CSS.escape(el.id)}`;
    return null;
  }

  function render(o: RenderOpts = {}) {
    const keep = o.focus ? null : selectorFor(document.activeElement);
    if (progress) progress.style.width = state.submitted ? '100%' : `${((state.step + 1) / STEPS.length) * 100}%`;

    if (state.submitted) {
      root.innerHTML = renderDone();
      root.querySelector<HTMLElement>('.done-title')?.focus({ preventScroll: true });
      clearTimeout(saveTimer);
      saveDraft(state); // clears the stored draft
      return;
    }

    const s = STEPS[state.step];
    const last = state.step === STEPS.length - 1;
    const body = { parent: renderParent, kids: () => renderKids(o), plan: renderPlan, review: renderReview }[s.id]();
    root.innerHTML = `
      ${renderStepper()}
      <form class="form-body" novalidate>
        <div class="hp" aria-hidden="true"><label>Website <input name="website" tabindex="-1" autocomplete="off"></label></div>
        ${state.restored ? `<div class="restore-bar" role="status">
          <span>Welcome back! We kept your progress.</span>
          <button type="button" class="link" data-action="start-over">Start over</button>
          <button type="button" class="icon-x" data-action="dismiss-restore" aria-label="Dismiss">${ICON.close}</button>
        </div>` : ''}
        <div class="step-panel${o.dir ? ` enter-${o.dir}` : ''}">
          <div class="step-head">
            <p class="step-count">Step ${state.step + 1} of ${STEPS.length}</p>
            <h3 class="step-title" tabindex="-1">${s.title}</h3>
            <p class="step-sub">${s.sub}</p>
          </div>
          ${body}
        </div>
        <div class="form-nav">
          ${state.notice ? `<div class="form-alert${o.shake ? ' shake' : ''}" role="alert">${ICON.alert}<span>${esc(state.notice)}</span></div>` : ''}
          <div class="form-nav-row">
            ${state.step > 0 ? `<button type="button" class="btn btn-back" data-action="back" aria-label="Back">${ICON.back}<span>Back</span></button>` : ''}
            <button type="submit" class="btn btn-orange btn-next"${state.sending ? ' disabled aria-busy="true"' : ''}>
              ${state.sending ? '<span class="spinner" aria-hidden="true"></span>Sending…' : `${last ? 'Submit registration' : `Continue to ${STEPS[state.step + 1].label.toLowerCase()}`}${ICON.arrow}`}
            </button>
          </div>
        </div>
      </form>`;

    if (o.pop) root.querySelector(o.pop)?.classList.add('just-toggled');

    if (o.scroll) {
      const top = card.getBoundingClientRect().top;
      if (top < 0 || top > window.innerHeight * 0.4) card.scrollIntoView({ behavior: motionOn() ? 'smooth' : 'auto', block: 'start' });
    }

    if (o.focus === 'heading') {
      root.querySelector<HTMLElement>('.step-title')?.focus({ preventScroll: true });
    } else if (o.focus === 'invalid') {
      const bad = root.querySelector<HTMLElement>('[aria-invalid="true"], .group.has-error button');
      if (bad) {
        bad.focus({ preventScroll: true });
        bad.closest('.field, .group')?.scrollIntoView({ behavior: motionOn() ? 'smooth' : 'auto', block: 'center' });
      }
    } else if (o.focus) {
      root.querySelector<HTMLElement>(o.focus)?.focus({ preventScroll: true });
    } else if (keep) {
      root.querySelector<HTMLElement>(keep)?.focus({ preventScroll: true });
    }
    queueSave();
  }

  function setState(patch: Partial<State>, o: RenderOpts = {}) {
    state = { ...state, ...patch };
    render(o);
  }

  /** Update one field's error in place, without re-rendering (keeps the caret where it is). */
  function paintError(key: string, msg: string) {
    const errors = { ...state.errors };
    if (msg) errors[key] = msg; else delete errors[key];
    state = { ...state, errors, notice: Object.keys(errors).length ? state.notice : '' };
    const wrap = root.querySelector<HTMLElement>(`[data-key="${key}"]`);
    if (wrap) {
      wrap.classList.toggle('has-error', !!msg);
      const span = wrap.querySelector('.field-error span');
      if (span) span.textContent = msg;
      wrap.querySelectorAll('input, select, textarea').forEach((c) => (msg ? c.setAttribute('aria-invalid', 'true') : c.removeAttribute('aria-invalid')));
    }
    if (!state.notice) root.querySelector('.form-alert')?.remove();
  }

  const errorFor = (key: string) => stepErrors(state, STEPS[state.step].id)[key] ?? '';

  const updateKid = (i: number, patch: Partial<Kid>) => state.kids.map((k, j) => (j === i ? { ...k, ...patch } : k));

  /** Clear the field error that a click-based control (chips) may have fixed. */
  function revalidate(key: string) {
    if (!state.errors[key]) return {};
    const errors = { ...state.errors };
    const msg = errorFor(key);
    if (msg) errors[key] = msg; else delete errors[key];
    return { errors, notice: Object.keys(errors).length ? state.notice : '' };
  }

  /* ----- navigation ----- */

  function failStep(errs: Record<string, string>) {
    const n = Object.keys(errs).length;
    const kids = state.kids.map((k, i) => (Object.keys(errs).some((x) => x.startsWith(`kid.${i}.`)) ? { ...k, open: true } : k));
    const notice = n === 1 ? 'Please check the highlighted field.' : `Please check the ${n} highlighted fields.`;
    setState({ errors: errs, kids, notice }, { shake: true, focus: 'invalid' });
    announce(notice);
  }

  function moveTo(step: number, dir: 'next' | 'back', extra: Partial<State> = {}) {
    const leavingKids = STEPS[state.step].id === 'kids' && dir === 'next';
    const kids = leavingKids && state.kids.length > 1 ? state.kids.map((k) => ({ ...k, open: false })) : state.kids;
    setState({ kids, ...extra, step, maxStep: Math.max(state.maxStep, step), errors: {}, notice: '', restored: false, undo: null }, { dir, focus: 'heading', scroll: true });
    announce(`Step ${step + 1} of ${STEPS.length}: ${STEPS[step].title}`);
  }

  function goTo(target: number, extra: Partial<State> = {}) {
    if (target === state.step) return;
    if (target > state.step) {
      for (let i = state.step; i < target; i++) {
        const errs = stepErrors(state, STEPS[i].id);
        if (Object.keys(errs).length) {
          if (i !== state.step) moveTo(i, 'next');
          return failStep(errs);
        }
      }
    }
    moveTo(target, target > state.step ? 'next' : 'back', extra);
  }

  async function submit() {
    // Read the honeypot before re-rendering resets it.
    const website = root.querySelector<HTMLInputElement>('input[name="website"]')?.value ?? '';
    setState({ sending: true, notice: '' }, { focus: '.btn-next' });
    try {
      const { parent, kids, plan } = state;
      await postJSON(ENROL_ENDPOINT, { parent, kids: kids.map(({ open: _open, ...k }) => k), plan, website });
      setState({ sending: false, submitted: true, restored: false }, { scroll: true });
      announce('Registration received. Thank you!');
    } catch (e) {
      const notice = e instanceof ServerMessage ? e.message : 'We couldn’t send your registration. Check your connection and try again.';
      setState({ sending: false, notice }, { shake: true, focus: '.btn-next' });
      announce(notice);
    }
  }

  function next() {
    if (state.sending) return;
    const errs = stepErrors(state, STEPS[state.step].id);
    if (Object.keys(errs).length) return failStep(errs);
    if (state.step === STEPS.length - 1) return void submit();
    moveTo(state.step + 1, 'next');
  }

  /* ----- events ----- */

  root.addEventListener('submit', (ev) => { ev.preventDefault(); next(); });

  root.addEventListener('click', (ev) => {
    const btn = (ev.target as Element).closest<HTMLElement>('[data-action]');
    if (!btn || (btn as HTMLButtonElement).disabled) return;
    const { action = '', value = '' } = btn.dataset;
    const kidEl = btn.closest<HTMLElement>('[data-kid]');
    const i = kidEl ? Number(kidEl.dataset.kid) : -1;
    const kid = state.kids[i];
    const pop = selectorFor(btn);

    // An undo offer only lasts until the next change.
    if (state.undo && action !== 'undo') { state = { ...state, undo: null }; clearTimeout(undoTimer); }

    switch (action) {
      case 'go': return goTo(Number(value));
      case 'back': return moveTo(state.step - 1, 'back');
      case 'edit': {
        const target = btn.dataset.target;
        const kids = target != null ? state.kids.map((k, j) => ({ ...k, open: j === Number(target) })) : state.kids;
        return goTo(Number(value), { kids });
      }
      case 'reset':
      case 'start-over':
        state = initial();
        saveDraft(state);
        return setState({}, { dir: 'back', focus: 'heading', scroll: true });
      case 'dismiss-restore': return setState({ restored: false }, { focus: '.step-title' });
      case 'plan': return setState({ plan: value }, { pop });
      case 'toggle-kid': return setState({ kids: updateKid(i, { open: !kid.open }) });
      case 'add-kid': {
        // Tuck finished children away so the new one gets the focus.
        const kids = state.kids.map((k, j) => (Object.keys(kidErrors(k, j)).length ? k : { ...k, open: false }));
        const n = kids.length;
        setState({ kids: [...kids, newKid()], notice: '' }, { enterKid: n, focus: `#${fid(`kid.${n}.name`)}` });
        root.querySelector(`[data-kid="${n}"]`)?.scrollIntoView({ behavior: motionOn() ? 'smooth' : 'auto', block: 'center' });
        return;
      }
      case 'remove-kid': {
        let removed = false;
        const doRemove = () => {
          if (removed) return;
          removed = true;
          // Re-key errors for the children that shift up.
          const errors: Record<string, string> = {};
          for (const [k, msg] of Object.entries(state.errors)) {
            const m = /^kid\.(\d+)\.(.+)$/.exec(k);
            if (!m) { errors[k] = msg; continue; }
            const j = Number(m[1]);
            if (j < i) errors[k] = msg; else if (j > i) errors[`kid.${j - 1}.${m[2]}`] = msg;
          }
          const undo = { kid: state.kids[i], index: i };
          setState({ kids: state.kids.filter((_, j) => j !== i), errors, undo }, { focus: '[data-action="undo"]' });
          announce(`Removed ${undo.kid.name.trim() || 'child'}. Undo is available.`);
          clearTimeout(undoTimer);
          undoTimer = window.setTimeout(() => { if (state.undo === undo) setState({ undo: null }); }, 10000);
        };
        if (!motionOn()) return doRemove();
        kidEl!.classList.add('kid-leave');
        kidEl!.addEventListener('animationend', (e) => { if (e.target === kidEl) doRemove(); });
        // Fallback: animations don't run in background tabs, so don't wait on them forever.
        window.setTimeout(doRemove, 400);
        return;
      }
      case 'undo': {
        const u = state.undo;
        if (!u) return;
        clearTimeout(undoTimer);
        const kids = [...state.kids];
        kids.splice(u.index, 0, { ...u.kid, open: true });
        return setState({ kids, undo: null }, { enterKid: u.index, focus: `[data-kid="${u.index}"] .kid-toggle` });
      }
      case 'subject': {
        state = { ...state, kids: updateKid(i, { subjects: toggle(kid.subjects, value) }) };
        return setState(revalidate(`kid.${i}.subjects`), { pop });
      }
      case 'day': return setState({ kids: updateKid(i, { days: toggle(kid.days, value) }) }, { pop });
      case 'days-preset': {
        const days = value === 'weekdays' ? DAYS.slice(0, 5) : value === 'weekends' ? DAYS.slice(5) : [];
        return setState({ kids: updateKid(i, { days }) }, { focus: value === 'clear' ? `[data-kid="${i}"] .day` : undefined });
      }
      case 'type': return setState({ kids: updateKid(i, { type: value }) }, { pop });
      case 'time': return setState({ kids: updateKid(i, { time: value }) }, { pop });
    }
  });

  // Arrow keys move between options in a radio group (roving tabindex).
  root.addEventListener('keydown', (ev) => {
    const t = ev.target as HTMLElement;
    if (t.getAttribute('role') !== 'radio') return;
    const d = ({ ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 } as Record<string, number>)[ev.key];
    if (!d) return;
    ev.preventDefault();
    const radios = [...t.closest('[role="radiogroup"]')!.querySelectorAll<HTMLElement>('[role="radio"]')];
    const nextRadio = radios[(radios.indexOf(t) + d + radios.length) % radios.length];
    nextRadio.focus();
    nextRadio.click();
  });

  // Typing updates state without re-rendering so focus and caret are kept.
  const onFieldInput = (ev: Event) => {
    const el = ev.target as HTMLInputElement;
    const key = el.closest<HTMLElement>('[data-key]')?.dataset.key;
    if (el.dataset.parent) {
      state = { ...state, parent: { ...state.parent, [el.dataset.parent]: el.value } };
    } else if (el.dataset.field) {
      const kidEl = el.closest<HTMLElement>('[data-kid]')!;
      const i = Number(kidEl.dataset.kid);
      state = { ...state, kids: updateKid(i, { [el.dataset.field]: el.value }) };
      if (el.dataset.field === 'name') kidEl.querySelector('[data-heading]')!.textContent = el.value.trim() || `Child ${i + 1}`;
    } else {
      return;
    }
    // Clear an error as soon as the field is fixed; new errors wait for blur.
    if (key && state.errors[key] && !errorFor(key)) paintError(key, '');
    // Selects commit on change, so check them straight away.
    if (key && el.tagName === 'SELECT' && ev.type === 'change' && state.errors[key]) paintError(key, errorFor(key));
    queueSave();
  };
  root.addEventListener('input', onFieldInput);
  root.addEventListener('change', onFieldInput);

  // Check a field when the user leaves it, but don't nag about empty fields they're just tabbing past.
  root.addEventListener('focusout', (ev) => {
    const el = ev.target as HTMLInputElement;
    if (!el.matches?.('input, textarea')) return;
    const key = el.closest<HTMLElement>('.field[data-key]')?.dataset.key;
    if (!key || (!el.value.trim() && !state.errors[key])) return;
    paintError(key, errorFor(key));
  });

  window.addEventListener('pagehide', () => saveDraft(state));

  render();
}

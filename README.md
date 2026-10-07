# Likulearn

Static Astro site on Cloudflare (free plan). Every page is prerendered HTML served as a
static asset. The only code that runs on the Worker is the two form endpoints:

| Endpoint          | Does                                                                                     |
| ----------------- | ---------------------------------------------------------------------------------------- |
| `/api/enrol`      | Validates a registration → saves it in D1 → emails the parent and the team → webhook      |
| `/api/subscribe`  | Saves a newsletter signup in D1 → webhook                                                 |

## Develop

```bash
npm install
npm run db:migrate   # create the local D1 tables (once)
npm run dev          # http://localhost:4327 (4321 is taken by another local project)
```

Copy `.dev.vars.example` to `.dev.vars` to try emails or the webhook locally. With no
settings, submissions are still validated and saved; the emails and webhook are skipped.

## Editing content

All copy lives in [`src/data/content.ts`](src/data/content.ts): home page text, steps,
benefits, teach section, testimonials, blog posts, plans and subjects. Edit and redeploy.
In headings, wrap a word in `*asterisks*` to colour it; `\n` starts a new line.

## Automation

On every registration (each step is skipped if its setting is missing; failures are logged
and never lose the registration, which is already saved):

1. **Parent confirmation email** — summary of what they registered and what happens next.
2. **Team alert email** to `TEAM_EMAIL` — full details; reply goes straight to the parent.
3. **Webhook** to `AUTOMATION_WEBHOOK_URL` (Make / Zapier / n8n "custom webhook"):

```json
{ "event": "registration.created", "site": "https://likulearn.com",
  "data": { "id": "…", "created_at": "…", "parent": { "name", "email", "phone", "tz" },
            "plan": { "id", "title" }, "children_count": 1, "children": [ … ], "summary": "…" } }
```

Newsletter signups send `{ "event": "newsletter.subscribed", "data": { "email", "created_at" } }`.
When `WEBHOOK_SECRET` is set, each request carries `X-Likulearn-Signature: sha256=<HMAC-SHA256 of the raw body>`.

Abuse protection: same-site requests only, a hidden honeypot field, strict validation, and
rate limits (5 registrations per network per hour, 3 per email per day). IPs are stored only
as salted hashes.

## Viewing registrations

Each one arrives by email. To list the latest from the database:

```bash
npm run registrations
```

Update a status (new → contacted → trial booked → enrolled → closed):

```bash
npx wrangler d1 execute likulearn --remote --command "UPDATE registrations SET status='contacted' WHERE id='<id>'"
```

## Deploy

```bash
npx wrangler login
npm run deploy          # build, deploy, then apply D1 migrations
```

The first deploy creates the D1 database. Then set the secrets:

```bash
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put AUTOMATION_WEBHOOK_URL
npx wrangler secret put WEBHOOK_SECRET
npx wrangler secret put IP_HASH_SALT
```

and adjust `EMAIL_FROM`, `TEAM_EMAIL` and `SITE_URL` under `vars` in `wrangler.jsonc`.
`EMAIL_FROM` must use a domain verified in Resend (add Resend's DNS records to likulearn.com).

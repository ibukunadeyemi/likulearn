import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { onRegistration } from '../../lib/notify';
import { guardRequest, hashIp, readJson, saveRegistration, SubmissionError, validateRegistration } from '../../lib/submissions';

// The only dynamic routes: everything else is prerendered static HTML.
export const prerender = false;

/** Free-trial registrations from the enrolment form. */
export const POST: APIRoute = async ({ request, locals }) => {
  const blocked = guardRequest(request);
  if (blocked) return blocked;
  try {
    const body = await readJson(request);
    // Honeypot: people never see this field, bots fill it in. Pretend it worked.
    if (body.website) return Response.json({ ok: true });

    const data = validateRegistration(body);
    const ipHash = await hashIp(request.headers.get('cf-connecting-ip'), env.IP_HASH_SALT || env.SITE_URL || 'likulearn');
    const reg = await saveRegistration(env.DB, data, ipHash);

    // Saved — reply now, and finish the emails and webhook in the background.
    locals.cfContext.waitUntil(onRegistration(env, reg));
    return Response.json({ ok: true });
  } catch (e) {
    if (e instanceof SubmissionError) return Response.json({ ok: false, error: e.message }, { status: e.status });
    console.error('[enrol]', e);
    return Response.json({ ok: false, error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
};

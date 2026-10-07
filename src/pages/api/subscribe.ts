import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { onSubscriber } from '../../lib/notify';
import { guardRequest, readJson, saveSubscriber, SubmissionError } from '../../lib/submissions';

export const prerender = false;

/** Newsletter signups from the footer. */
export const POST: APIRoute = async ({ request, locals }) => {
  const blocked = guardRequest(request, 2_000);
  if (blocked) return blocked;
  try {
    const body = await readJson(request, 2_000);
    if (body.website) return Response.json({ ok: true }); // honeypot
    const { email, isNew } = await saveSubscriber(env.DB, body.email);
    if (isNew) locals.cfContext.waitUntil(onSubscriber(env, email));
    return Response.json({ ok: true });
  } catch (e) {
    if (e instanceof SubmissionError) return Response.json({ ok: false, error: e.message }, { status: e.status });
    console.error('[subscribe]', e);
    return Response.json({ ok: false }, { status: 500 });
  }
};

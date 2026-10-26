import type { APIRoute } from 'astro';
import { sortedPosts } from '../data/content';
import { SITE_URL } from '../lib/seo';

/** Every indexable page. Add new top-level pages here. */
export const GET: APIRoute = () => {
  const latest = sortedPosts[0]?.date;
  const urls = [
    { path: '/', lastmod: latest },
    { path: '/how-it-works' },
    { path: '/why-likulearn' },
    { path: '/enrol' },
    { path: '/teach' },
    { path: '/faq' },
    { path: '/blog', lastmod: latest },
    { path: '/privacy', lastmod: '2026-10-26' },
    { path: '/terms', lastmod: '2026-10-26' },
    ...sortedPosts.map((p) => ({ path: `/blog/${p.slug}`, lastmod: p.date })),
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${new URL(u.path, SITE_URL).href}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`).join('\n')}
</urlset>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};

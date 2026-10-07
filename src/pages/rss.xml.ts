import type { APIRoute } from 'astro';
import { sortedPosts } from '../data/content';
import { SITE_URL } from '../lib/seo';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const GET: APIRoute = () => {
  const items = sortedPosts.map((p) => {
    const url = new URL(`/blog/${p.slug}`, SITE_URL).href;
    return `    <item>
      <title>${esc(p.title)}</title>
      <link>${url}</link>
      <guid>${url}</guid>
      <description>${esc(p.excerpt)}</description>
      <pubDate>${new Date(p.date).toUTCString()}</pubDate>
    </item>`;
  });
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Likulearn Blog</title>
    <link>${new URL('/blog', SITE_URL).href}</link>
    <atom:link href="${new URL('/rss.xml', SITE_URL).href}" rel="self" type="application/rss+xml" />
    <description>Insights and parenting tips for children learning online.</description>
    <language>en</language>
${items.join('\n')}
  </channel>
</rss>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};

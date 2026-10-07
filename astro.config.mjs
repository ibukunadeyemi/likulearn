// @ts-check
import cloudflare from '@astrojs/cloudflare';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://likulearn.com',
  // Every page is prerendered to static HTML and served by Cloudflare as a plain asset.
  // Only the form endpoints in src/pages/api/ run on the Worker (they set `prerender = false`).
  output: 'static',
  adapter: cloudflare({
    // Images are served straight from their source (Unsplash sizes them via URL params).
    imageService: 'passthrough',
  }),
  // No sessions needed, so no KV namespace.
  session: false,
  // 4321 (Astro's default) is used by another local site.
  server: { port: 4327 },
  devToolbar: { enabled: false },
});

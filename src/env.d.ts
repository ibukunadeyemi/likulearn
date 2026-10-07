/// <reference types="@astrojs/cloudflare/types.d.ts" />

// Secrets (set with `wrangler secret put`, and in .dev.vars locally). All optional:
// the matching automation step is skipped when one is missing.
declare namespace Cloudflare {
  interface Env {
    RESEND_API_KEY?: string;
    AUTOMATION_WEBHOOK_URL?: string;
    WEBHOOK_SECRET?: string;
    IP_HASH_SALT?: string;
  }
}

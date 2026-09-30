# Repository Instructions

## Source Of Truth

- Use `PLAN_DESARROLLO_LANDING_ALEJANDRO.md` as the product and implementation specification.
- Once executable config exists, trust manifests, scripts, and CI over commands described in prose; update this file if they diverge.
- Work one approved phase at a time. Do not advance to the next phase or add post-MVP features without an explicit request.
- Keep section 1.2 of the plan current: mark the active phase `EN CURSO`, and mark it completed with the date only after its criteria and available verification pass.
- The plan mentioning commits is not authorization to commit; commit only when the user explicitly requests it.

## Current Bootstrap State

- If no root manifest exists, the repository has not completed Phase 0. Initialize Next.js with App Router, TypeScript, Tailwind, ESLint, Prettier, and Motion before feature work.
- After initialization, the required baseline verification is `npm run lint` followed by `npm run build`; use only additional scripts that actually exist in `package.json`.
- Keep `.env.local` ignored and document required names without values in `.env.example`.

## Product Constraints

- User-facing copy is Argentine Spanish using `vos`; keep it professional and avoid medical claims, guaranteed outcomes, or invented proof.
- Never invent the WhatsApp number, service areas, prices, schedules, certifications, testimonials, ratings, social profiles, or photos. Development placeholders must be unmistakable and must not reach production.
- The public MVP must not be blocked by Supabase analytics, Telegram, or the daily report; those are separate releases defined in section 54 of the plan.

## Conversion And Analytics

- Every WhatsApp CTA must use the shared `WhatsAppButton`, rendered as a real `href` that works without JavaScript.
- Never await tracking or call `preventDefault` before navigating to WhatsApp. Send analytics non-blockingly with `sendBeacon` or `fetch(..., { keepalive: true })`.
- Preserve these CTA sources exactly: `hero_primary`, `hero_secondary`, `floating_whatsapp`, and `final_cta`; page views use `landing`.
- Internal analytics accepts only `page_view` and `whatsapp_click` until both API validation and the database constraint are deliberately migrated.
- Sessions expire after 30 minutes of inactivity. Do not describe session IDs as people or users.
- Respect `Do Not Track`: do not create an identifier or emit events, but keep every WhatsApp link functional.
- Treat the primary metric as `whatsapp_click_rate` / tasa de intención de contacto, not a confirmed business conversion.

## Server Boundaries

- Supabase access is server-only through `/api/events`; do not introduce browser Supabase credentials or public table policies.
- Never expose `SUPABASE_SERVICE_ROLE_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, or `CRON_SECRET` to Client Components or logs.
- Keep event insertion idempotent through `clientEventId`, validate closed event/source values, limit payload sizes, and rate-limit the production endpoint.
- Daily report boundaries use `America/Argentina/Buenos_Aires`; Vercel Cron schedules are UTC and must be converted explicitly.

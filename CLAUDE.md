@AGENTS.md

# StarLoop — Claude Context

## Stack
Next.js 16.2.6 (App Router) · TypeScript strict · PostgreSQL/Railway via Prisma v7 · NextAuth v5 (JWT) · next-intl v4 (EN + ZH-CN, auto-detect via Accept-Language, no switcher) · Tailwind v4 · Geist font · Resend · Twilio · Claude haiku-4-5-20251001 · Stripe · lucide-react · Railway

## Critical Gotchas
- **Middleware**: `proxy.ts` at root, NOT `middleware.ts` — Next.js 16 breaking change
- **params**: always `const { locale } = await params` — Next.js 16 makes params a Promise
- **SessionProvider**: client components using `useSession()` need `AuthProvider` (`components/layout/AuthProvider.tsx`) wrapping `app/[locale]/layout.tsx`
- **Resend**: lazy init only — `new Resend()` inside getter, never at module top level (build fails at Railway without env var)
- **Prisma**: never `prisma migrate dev` on prod — use `prisma db execute --file migration.sql`; always `IF NOT EXISTS` in SQL
- **Build check**: `npx tsc --noEmit` + `npm run build` before every push

## Design Tokens
| Context | Values |
|---------|--------|
| Dark pages (landing/login/onboarding) | bg `#0A0A0A`, card `#111111`, border `#1F1F1F` |
| Dashboard | bg `#F9FAFB`, card `bg-white border border-[#E5E7EB] rounded-xl` |
| Text | primary `#0D1117`, on-dark `#FFFFFF`, secondary `#6B7280` / `#A1A1AA` |
| Accent | teal `#00C9A7`, blue `#4A6FFF`, success `#10B981`, error `#EF4444`, warning `#F59E0B` |
| Buttons | solid `#0D1117` primary · border `#E5E7EB` secondary — no gradients |
| Logo | "starl∞p" — SVG ∞ replacing "oo", accent `#00C9A7` |

## API Route Rules
- Every route: `try/catch` all DB + external calls, `console.error("[RouteName]", err)`
- Auth check: `const session = await auth(); if (!session?.user) return 401`
- No `console.log` in production paths

## Deployment
```
Build:  prisma generate && next build
Start:  prisma migrate deploy && next start -H 0.0.0.0 -p $PORT
```
Required env vars: `DATABASE_URL` `DIRECT_URL` `NEXTAUTH_SECRET` `NEXTAUTH_URL` `ANTHROPIC_API_KEY` `RESEND_API_KEY` `TWILIO_*` `STRIPE_*` `GOOGLE_CLIENT_*` `NEXT_PUBLIC_APP_URL`

## Known Issues
- Stripe `STRIPE_SECRET_KEY` on Railway is truncated — needs manual update in Railway Variables
- Twilio trial: can't send URLs in SMS (Error 30044) — workaround already in place
- DB schema drift exists — always `IF NOT EXISTS`, never `prisma migrate dev`

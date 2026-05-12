@AGENTS.md

# StarLoop — Project Context for Claude

## What This Project Is
StarLoop is a SaaS product for local businesses to automate Google review collection, intercept bad reviews privately, and reply with AI. Target market: Toronto local businesses (cleaning, landscaping, restaurants, etc.).

## Tech Stack
- **Framework**: Next.js 16.2.6 (App Router) — see AGENTS.md for breaking changes
- **Language**: TypeScript (strict, zero errors required before every commit)
- **Database**: PostgreSQL on Railway via Prisma v7
- **Auth**: NextAuth v5 (JWT strategy) — `auth()` in server, `useSession()` in client
- **i18n**: next-intl v4 — all user-facing strings use `t()`, bilingual EN + ZH-CN
- **Styling**: Tailwind CSS v4 + inline styles for non-standard colors
- **Font**: Geist (configured globally in `app/[locale]/layout.tsx`) — never use Inter
- **Email**: Resend (`lib/resend.ts`)
- **SMS**: Twilio (`lib/twilio.ts`) — trial account, cannot send URLs (Error 30044)
- **AI**: Anthropic Claude (`lib/claude.ts`) — model `claude-haiku-4-5-20251001`
- **Payments**: Stripe (`lib/stripe.ts`) — API version `2026-04-22.dahlia`
- **Deployment**: Railway (auto-deploy from GitHub main branch)

## Critical Conventions

### Next.js 16 Specific
- Middleware file is `proxy.ts` (root), NOT `middleware.ts` — Next.js 16 renamed it
- `params` in page/layout/route handlers is always `Promise<{...}>` — must `await params`
- Do NOT create `middleware.ts` — it will conflict with `proxy.ts` and break the build

### Auth
- `SessionProvider` is required for any client component using `useSession()`
- `SessionProvider` wrapper lives in `components/layout/AuthProvider.tsx`
- `AuthProvider` wraps the entire locale layout in `app/[locale]/layout.tsx`
- Server components use `auth()` from `@/lib/auth`
- Client components use `useSession()` from `next-auth/react`

### API Routes
- Every API route MUST have `try/catch` wrapping all DB and external calls
- Auth check pattern: `const session = await auth(); if (!session?.user) return 401`
- Always return `NextResponse.json({ error: "..." }, { status: NNN })`

### Database / Prisma
- Prisma v7 config is in `prisma.config.ts` (not inline in schema)
- Raw SQL queries use `prisma.$queryRawUnsafe()` with positional `$1, $2` params
- New columns should use `IF NOT EXISTS` in migration SQL (DB may have drift)
- Run `npx prisma db execute --file migration.sql` to apply locally, commit the file for Railway
- `prisma migrate deploy` runs automatically at Railway startup (via `npm start`)
- Never run `prisma migrate dev` against the production DB — it will prompt to reset

### Resend (Email)
- `lib/resend.ts` uses lazy initialization — `new Resend()` is inside a getter, NOT at module top level (causes build failure)
- From address: `StarLoop <onboarding@resend.dev>` (until starloop.app domain is verified in Resend)

### i18n
- Translation files: `messages/en.json` and `messages/zh-CN.json` — keys must stay in sync
- Server components: `getTranslations()` from `next-intl/server`
- Client components: `useTranslations()` from `next-intl`
- Locale detected by `proxy.ts` middleware, routes live under `app/[locale]/`

## Design System
- **Dark pages** (landing, login, register, onboarding): background `#0A0A0A`, card `#111111`, border `#1F1F1F`
- **Dashboard pages**: background `#F9FAFB`, card `bg-white border border-[#E5E7EB] rounded-xl`
- **Primary text**: `#0D1117` (dark), `#FFFFFF` (on dark)
- **Secondary text**: `#6B7280` (light), `#A1A1AA` (dark)
- **Accent teal**: `#00C9A7`
- **Accent blue**: `#4A6FFF`
- **Success**: `#10B981` / `#F0FDF4`
- **Error**: `#EF4444` / `#FEF2F2`
- **Warning**: `#F59E0B` / `#FFFBEB`
- **Focus ring**: `boxShadow: "0 0 0 2px #0D1117"`
- **Buttons**: solid `#0D1117` (primary), border `#E5E7EB` (secondary) — no gradient backgrounds
- **Icons**: lucide-react (installed)
- **Logo text**: "starl∞p" — SVG ∞ symbol replacing "oo" in "loop", color `#00C9A7`

## File Structure (Key Files)
```
app/
  [locale]/
    layout.tsx          — locale root, wraps AuthProvider + NextIntlClientProvider
    page.tsx            — dark landing page (server component)
    auth/login/         — two-column dark/light layout (client)
    auth/register/      — same pattern
    dashboard/
      layout.tsx        — auth guard + Sidebar + Header
      page.tsx          — stats overview + rating chart + recent reviews
      reviews/page.tsx  — 口碑工作台 (reputation workbench)
      requests/page.tsx — review request management
      customers/page.tsx
      settings/page.tsx
      reports/page.tsx
    onboarding/page.tsx — dark premium flow, 2 steps
  api/
    auth/[...nextauth]/ — NextAuth handler
    auth/register/      — creates user + business + sends welcome email
    business/           — CRUD for business profile
    customers/          — create customers
    requests/           — send review requests (SMS/EMAIL), scheduled sends
    reviews/            — GET list (with taskStatus auto-archive), PATCH status
    reviews/[id]/reply/ — publish AI reply to Google
    reviews/[id]/status/— update taskStatus (new/in_progress/resolved/archived)
    review-gate/        — public gate page API (token-based)
    ai/generate-reply/  — Claude AI reply generation
    ai/chat/            — AI assistant chat
    analytics/ratings/  — weekly rating trend data
    google/connect/     — Google OAuth initiation
    stripe/checkout/    — Stripe checkout session
    stripe/webhook/     — Stripe webhook handler
    widget/[businessId]/— embeddable review widget
components/
  layout/
    AuthProvider.tsx    — SessionProvider wrapper (client)
    Sidebar.tsx         — dashboard sidebar (client, uses useSession)
    Header.tsx          — dashboard header
  dashboard/
    ReviewTaskCard      — part of reviews/page.tsx (inline)
    ReviewCard.tsx      — used on dashboard home page
    RequestForm.tsx
    StatsOverview.tsx
    RatingChart.tsx
    AiAssistant.tsx
  ui/
    Logo.tsx, Button.tsx, Card.tsx, Input.tsx
lib/
  auth.ts, prisma.ts, claude.ts, resend.ts, twilio.ts, stripe.ts, google.ts, utils.ts
  design-system.ts      — color/radius/shadow tokens
proxy.ts                — next-intl middleware (NOT middleware.ts)
```

## Review Flow
1. Business sends request → customer gets SMS/email with `/en/review/[token]` link
2. Customer rates 1-3★ → private feedback form → saved as `Review` with `source=PRIVATE`, `isNegative=true`
3. Customer rates 4-5★ → redirected to Google Review URL
4. On negative: Claude generates AI draft reply, stores in `aiDraftReply`, sends email alert to business owner
5. Business sees review in 口碑工作台, uses one-click AI reply or edits, marks resolved
6. Auto-archive: reviews with `taskStatus=resolved` older than 7 days → `archived`

## Review taskStatus States
`new` → `in_progress` (after AI reply sent) → `resolved` (manual or after publish) → `archived` (auto after 7 days)

## Deployment
- **Platform**: Railway
- **Build**: `prisma generate && next build`
- **Start**: `prisma migrate deploy && next start -H 0.0.0.0 -p $PORT`
- **Required env vars**:
  - `DATABASE_URL`, `DIRECT_URL` — PostgreSQL (Railway internal)
  - `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
  - `ANTHROPIC_API_KEY`
  - `RESEND_API_KEY`
  - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
  - `STRIPE_SECRET_KEY` ⚠️ (currently invalid — needs updating in Railway Variables)
  - `STRIPE_STARTER_PRICE_ID`, `STRIPE_PRO_PRICE_ID`
  - `STRIPE_WEBHOOK_SECRET`
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
  - `NEXT_PUBLIC_APP_URL` (e.g. `https://starloop.up.railway.app`)

## Known Issues / Decisions
- **Stripe**: `STRIPE_SECRET_KEY` on Railway is invalid (truncated) — user needs to update it
- **Twilio trial**: Cannot send URLs in SMS (Error 30044). The `messageBody` intentionally omits the review URL for trial accounts. Upgrade Twilio to fix.
- **Google OAuth**: Connected but review sync needs Google Business Profile API approval
- **SMS language**: Auto-detected from `user.preferredLanguage` field
- **`proxy.ts` drift**: The database has columns added via `prisma db push` that aren't in migration history. Always use `IF NOT EXISTS` in migration SQL. Do NOT run `prisma migrate dev`.

## Code Quality Rules
- TypeScript zero errors — run `npx tsc --noEmit` before committing
- All API routes wrapped in `try/catch` with `console.error("[RouteName]", err)`
- No `console.log` in production paths (only `console.error` in catch blocks)
- No module-level instantiation of external SDK clients that require env vars (Resend, Stripe) — use lazy init
- Build must pass `npm run build` before pushing

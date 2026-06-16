# Service Star 交接文档
Updated: 2026-06-16 (PATCH-5: Client Hub, Reviews, Cancellation)

---

## PATCH-5 Summary

**6-part feature build on top of PATCH-4:**

### Part 1 — Client Hub (`/pay/[token]`)
- Public page with 3 states: Confirmed → Awaiting Payment → Paid
- Stripe Payment Element (Apple Pay, Link, credit card) on the payment state
- Email collection → receipt email via Resend → Google review button (30min delay after paid)
- `Job.clientToken` (UUID) generated on every job create (manual + booking page)

### Part 2 — Complete Payment Flow
- "Mark Complete" modal now shows payment method choice: Online / Cash / Cheque
- Cash/Cheque → transitions directly to PAID (no Stripe), review request still fires
- Online → transitions to AWAITING_PAYMENT, SMS sent with `/pay/[clientToken]` URL

### Part 3 — Review Request Flow
- On transition to PAID: `reviewRequestScheduledAt = now + 30min` is set
- New cron endpoint: `POST /api/cron/review-requests` — run every 5 minutes
  - Finds PAID jobs where `reviewRequestScheduledAt <= now` and `reviewRequestSentAt = null`
  - Sends SMS (Twilio) + email (Resend) simultaneously
  - Creates `JobReviewStatus` record
- `GET /api/review-click/[token]` — tracks clicks and redirects to Google review URL
- 48-hour SMS reminder if `reviewClicked = false`

### Part 4 — Cancellation System
- New "Cancellation Policy" tab in Settings page
- Toggles: cancellationProtection, noShowFee; fields: window hours, fee type/amount, policy text
- Cancel modal now has: Cancelled vs No-Show toggle, reason dropdown, flag-high-risk checkbox
- No-show → `Customer.noShowCount++` incremented
- Cancellation fee: if `setupIntentId` on job and owner selects charge → Stripe PaymentIntent created

### Part 5 — Jobs Page Improvements
- Both dashboard/jobs and dashboard/jobs/[id] now have the payment-choice modal on "Mark Complete"
- Cancel modal improved with dropdown reasons + no-show toggle

### Part 6 — Schema Changes (applied)
- Job: `clientToken`, `addressLine1`, `addressLine2`, `country`, `paymentMethod`, `cancelledBy`, `setupIntentId`, `reviewRequestScheduledAt`, `reviewRequestSentAt`, `reviewClicked`, `reviewClickedAt`, `reviewClickedVia`
- Customer: `noShowCount`, `isHighRisk`, `requiresDeposit`
- Business: 7 cancellation policy fields
- New model: `JobReviewStatus`

**Migration to run:**
```
railway run npx prisma db execute --file migrations/v5_client_hub_reviews_cancellation.sql
```

**Files created/modified:**
- `prisma/schema.prisma` — schema updated, Prisma client regenerated
- `migrations/v5_client_hub_reviews_cancellation.sql` — NEW
- `app/pay/[token]/page.tsx` — NEW (Client Hub public page)
- `app/api/pay/[token]/route.ts` — NEW
- `app/api/pay/[token]/create-payment-intent/route.ts` — NEW
- `app/api/pay/[token]/save-email/route.ts` — NEW
- `app/api/cron/review-requests/route.ts` — NEW
- `app/api/review-click/[token]/route.ts` — NEW
- `app/api/customers/[id]/flag/route.ts` — NEW
- `lib/job-state-machine.ts` — reviewRequestScheduledAt on PAID, clientToken URL in SMS, paymentMethod/cancelledBy fields
- `app/api/jobs/create/route.ts` — clientToken generation, structured address fields
- `app/api/booking/create/route.ts` — clientToken generation
- `app/api/jobs/[id]/complete/route.ts` — paymentChoice: online/cash/cheque
- `app/api/jobs/[id]/cancel/route.ts` — cancelledBy, toNoShow, noShowCount++, fee charge
- `app/api/business/profile/route.ts` — PATCH method + cancellation policy fields
- `app/dashboard/jobs/page.tsx` — paymentChoice modal in Mark Complete
- `app/dashboard/jobs/[id]/page.tsx` — paymentChoice modal, improved cancel modal
- `app/dashboard/settings/page.tsx` — new Cancellation tab
- `app/book/[businessSlug]/page.tsx` — pass cancellation fields to BookingFlow
- `app/book/[businessSlug]/BookingFlow.tsx` — show cancellation policy text on confirm step

**Manual test steps:**
1. Run migration: `railway run npx prisma db execute --file migrations/v5_client_hub_reviews_cancellation.sql`
2. Create a job → open `/pay/[clientToken]` — should show State 1 (Confirmed)
3. Mark Complete → select "Send online payment link" → verify job goes to AWAITING_PAYMENT, SMS sent with `/pay/` URL
4. Open `/pay/[token]` → should show State 2 (payment form), enter test card
5. After payment → page shows State 3 (green checkmark). Review button hidden initially (30-min timer)
6. Mark Complete → select "Cash received" → job goes directly to PAID
7. Trigger `POST /api/cron/review-requests` (with `x-cron-secret` header) → verify SMS + email sent
8. Click review link → `GET /api/review-click/[token]` → redirects to Google, `reviewClicked=true`
9. Settings → Cancellation tab → enable protection, set policy text → verify it appears on /book/[slug]
10. Cancel a job → new modal with dropdown reason + no-show toggle

**Credentials needed from Gavin:**
- Stripe key must be valid (truncation bug) for online payment flow to work
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` must be set for Payment Element on `/pay/[token]`
- `CRON_SECRET` must be set; cron-job.org should POST `/api/cron/review-requests` every 5 minutes
- `RESEND_API_KEY` for receipt emails and review request emails

---

## PATCH-4 Summary

The Booking → Job → Payment flow is now professional grade:

**State Machine (8 states, strict transitions):**
```
SCHEDULED ──→ IN_PROGRESS ──→ COMPLETED ──→ AWAITING_PAYMENT ──→ PAID
     │              │               └──────────────────────────→ PARTIALLY_PAID ──→ PAID
     ├──→ CANCELLED (terminal)                                          │
     └──→ NO_SHOW  (terminal)
```

**Zero re-entry:** Every booking source (web form, Erin voice, dashboard) writes
`customerName`, `customerPhone`, `serviceDescription`, `address` directly to the Job.
The owner never types a customer name twice.

**Side effects wired automatically:**
- → `in_progress`: records `actualStart`
- → `completed`: records `actualEnd`, auto-generates Stripe payment link (stored, not sent yet)
- → `awaiting_payment`: sends SMS to customer with link + notifies owner
- → `partially_paid`: records balance, creates new Stripe link for remainder
- → `paid`: marks payment, fires thank-you + review request (idempotent)
- → `cancelled`: saves reason, frees slot, SMS to customer
- → `no_show`: frees slot

**All 30 integration tests pass:** `npx tsx scripts/test-state-machine.ts`

---

生成时间：2026-06-09

## 生产URL
https://service-star-production.up.railway.app

## 代码路径
~/Desktop/service-star

## 数据库
postgresql://postgres:lKkDTdnPdCYHXEPmuyIJHgFCReNwblfJ@acela.proxy.rlwy.net:50804/railway

## 测试账号
Email: gavin@test.com
Password: test1234

## 环境变量（全部在.env.local）
DATABASE_URL / NEXTAUTH_SECRET / NEXTAUTH_URL
ANTHROPIC_API_KEY / TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER=+12892765799
STRIPE_SECRET_KEY / STRIPE_PUBLISHABLE_KEY
GOOGLE_CLIENT_ID

## 技术栈
Next.js + PostgreSQL/Railway + Prisma + NextAuth
Twilio + Claude API + Stripe

## 产品定位
本地服务商（HVAC/Plumbing/Electrical/Cleaning等）的全自动收入系统
口号：Your business, on autopilot.
定价：Free($0) / Pro($49/month)

## 已完成功能
- 落地页
- 注册4步Onboarding
- Dashboard（Revenue Loop可视化）
- Customers页面（客户管理）
- Campaigns页面（召回活动）
- Settings页面
- 公开档案页 /b/[slug]（PLG传播）
- 5个Agent骨架：Intake/Follow-up/Reputation/Winback/Referral
- 数据库：User/Business/Customer/Campaign/CampaignResult/PublicProfile/Call/Review
- Twilio webhook配置完成（+12892765799）
- Railway部署成功

## 待完成功能（按优先级）

### 1. 工单系统（最重要）
数据库需新增：Job/Invoice/TeamMember/Availability/TimeOff
Job状态流转：requested→quoted→confirmed→scheduled→in_progress→completed→invoiced→paid
商家点「Mark Complete」触发所有后续自动化
工单来源：电话/短信/网页预约/手动创建

### 2. 客户预约流程（/b/[slug]）
4步预约：选服务→联系信息→选时间→确认
时间槽基于商家Availability设置
预约成功→创建Job→通知商家→确认短信给客户

### 3. 商家可用时间设置
Availability model：工作日/时间/每单时长/缓冲时间
TimeOff model：休假/不可用日期
/api/availability/slots：返回真实可用时间槽
Schedule页面：日历视图，绿/橙/灰显示状态

### 4. UI重设计
风格：Linear + Stripe，极简专业
去掉彩色方块Revenue Loop
Revenue Loop改为横向时间线：
Call→Book→Service→Payment→Review→Winback→Referral
落地页文案：Your business, on autopilot.
不在UI里展示Agent名字，只展示结果

### 5. 5个Agent完整实现
Intake：来电接待+紧急转接+自动预约
Follow-up：完工后发感谢+评价请求+7天关怀
Reputation：Google评价监控+差评提醒+AI回复建议
Winback：按客户价值分层召回，A/B测试
Referral：C端转介绍（客户→新客户）+B端（商家→新商家）

### 6. PLG传播机制
召回短信→/b/[slug]档案页→页面底部注册入口
每条短信带商家专属链接
ref参数追踪转化来源

### 7. PWA手机端
manifest.json + Service Worker
手机底部导航栏
推送通知（新工单提醒）

## CC开发指令方式
用git worktree并行开发：
git worktree add ../ss-jobs feature/job-system
git worktree add ../ss-payment feature/payment
git worktree add ../ss-agents feature/agents
git worktree add ../ss-ui feature/ui
git worktree add ../ss-mobile feature/mobile
git worktree add ../ss-booking feature/booking

## 核心业务逻辑
1. 商家点Mark Complete是所有自动化的触发点
2. 收款方式商家自己决定，Service Star不处理收款
3. Stripe可选集成（商家想用时帮他接）
4. PLG核心：召回短信→档案页→底部注册入口
5. 不对用户展示「5个Agent」技术架构
6. 工单系统是产品完整的核心，没有它不能称为产品

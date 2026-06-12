# BLOCKERS — 需要 Gavin 本人处理

| # | 阻塞项 | 影响范围 | 绕行方案 |
|---|-------|---------|---------|
| 1 | **域名 servicestar.app 未绑定 Railway** | 短信链接全为 railway.app 死链，客户侧体验差 | 代码已用 `NEXT_PUBLIC_APP_URL` env var，Gavin 绑域名后改一个变量即可 |
| 2 | **Twilio 试用账号无法发 URL（Error 30044）** | 发票链接、评价请求链接、winback /b/slug 链接全被封 | 代码已做降级处理：发纯文字版，检测到付费后自动加链接；短信内容留`{LINK}`占位符 |
| 3 | **Vapi 6 agents: env vars 未设置** ✅ 代码完成 | Front Office 页面各 Agent Configure 弹窗显示占位 ID | (1) Railway Variables 设置 `VAPI_API_KEY=vapi_xxx`；(2) 部署后 **POST** `https://{YOUR_DOMAIN}/api/vapi/setup-agents`（需登录）→ 返回 6 个 Agent ID；(3) 将返回的 env vars 全部复制到 Railway Variables（`VAPI_AGENT_ERIN`、`VAPI_AGENT_DWIGHT`、`VAPI_AGENT_JIM`、`VAPI_AGENT_ANGELA`、`VAPI_AGENT_OSCAR`、`VAPI_AGENT_ANDY`、`VAPI_ASSISTANT_ID`）；(4) 重新部署 |
| 4 | **Google Business Profile OAuth** ✅ 代码完成 | Reviews 同步、自动回复发布到 Google 均不可用 | 见下方"Google Business Profile 接入步骤" |
| 5 | **Stripe key 截断（Railway 已知 bug）** | v1 不做收款，不阻塞；收款前必修 | 手动在 Railway Variables 粘贴完整 key |

---

## Google Business Profile 接入步骤（Gavin 操作）

### 环境变量（Railway Variables 设置）
- `GOOGLE_CLIENT_ID` — 从 GCP Console 获取
- `GOOGLE_CLIENT_SECRET` — 从 GCP Console 获取
- `GOOGLE_REDIRECT_URI` = `https://{YOUR_DOMAIN}/api/google/callback`（可选，不设则自动派生）

### 操作步骤
1. [console.cloud.google.com](https://console.cloud.google.com) → 创建或选择项目
2. APIs & Services → Library → 启用：
   - **My Business Business Information API**
   - **My Business Reviews API**
3. APIs & Services → Credentials → 创建 OAuth 2.0 Client ID
   - Application type: **Web application**
   - Authorized redirect URIs: `https://{YOUR_DOMAIN}/api/google/callback`
4. 复制 Client ID 和 Client Secret → 设置到 Railway Variables
5. 运行数据库迁移：`railway run npx prisma db execute --file migrations/v4_google_reviews.sql`
6. 重新部署
7. Settings → Integrations → Google Business Profile → **Connect**
8. OAuth 授权后自动跳转 Reviews 页并触发首次同步

### 自动同步（每 4 小时）
- 在 Railway 或 cron-job.org 设置定时任务：
  `POST https://{YOUR_DOMAIN}/api/cron/sync-reviews`
  Header: `x-cron-secret: {CRON_SECRET}`

---

## v4 监控工具部署缺口（2026-06-12）

| # | 缺口 | 影响 | 动作 |
|---|------|------|------|
| 14 | **`SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` 未设置** | 错误不上报 Sentry | Sentry.io → Projects → Create Project → Next.js → 复制 DSN。Railway 设置 `SENTRY_DSN=https://xxx@oXXX.ingest.sentry.io/XXX` 和 `NEXT_PUBLIC_SENTRY_DSN=同值` |
| 15 | **`NEXT_PUBLIC_POSTHOG_KEY` 未设置** | 用户行为不上报 PostHog | PostHog.com → 注册 → Project Settings → API Keys → 复制 `phc_...` 密钥。Railway 设置 `NEXT_PUBLIC_POSTHOG_KEY=phc_...` |
| 16 | **`NEXT_PUBLIC_CLARITY_ID` 未设置** | 会话录制无效 | clarity.microsoft.com → New Project → 复制 Project ID。Railway 设置 `NEXT_PUBLIC_CLARITY_ID=<id>` |

### Vapi 变量确认
- `VAPI_API_KEY` — 见缺口#3，从 [vapi.ai](https://vapi.ai) Dashboard → API Keys 获取
- `VAPI_ASSISTANT_ID` — 见缺口#3，创建 Assistant 后在 Vapi Dashboard → Assistants 页面获取 ID
- `NEXT_PUBLIC_TWILIO_NUMBER` — 见缺口#12，格式：`+1XXXXXXXXXX`（E.164）

---

## 当前绕行状态
- 所有短信降级为纯文字（无 URL），在 Twilio 升级后改 1 行代码开启链接
- 语音 Intake 的 Vapi webhook 已准备好 `/api/intake/webhook`，等账号绑定
- Google OAuth 代码已移植自 StarLoop，等 redirect URI 更新

---

## v1.1 部署后新增缺口（2026-06-10）

| # | 缺口 | 影响 | 动作 |
|---|------|------|------|
| 6 | **GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET 未设置** | Google OAuth 运行时失败 | GCP Console 创建凭证，Railway 设置两个变量 |
| 7 | **STRIPE_WEBHOOK_SECRET 是占位符 `whsec_...`** | Stripe webhook 验签失败，订阅事件不处理 | Stripe Dashboard → Webhooks 获取真实 secret |
| 8 | **CRON_SECRET 未设置** | cron 端点无保护或报错 | Railway 设置 `CRON_SECRET=<随机字符串>` |

---

## v2 Front Office 部署后遗留缺口（2026-06-11）

| # | 缺口 | 影响 | 动作 |
|---|------|------|------|
| 9 | **Stripe Connect 收款未实测** | ss-payments Express 账户 onboarding 未用真实 key 跑通 | Stripe key 补全（缺口#5）后，用测试卡完整跑一遍：onboarding → Payment Link → paid 状态 |
| 10 | **`resend` 包未安装** | 邮件发票发送（Payment Link fallback email）不可用 | `npm install resend` 后在 payments/link/create 和 jobs/[id]/complete 加回邮件代码 |
| 11 | **Price Book 空库时 AI Quote 降级** | 新商家未跑 onboarding 时，AI Quote 直接返回 estimate_visit | 属于预期行为，文案已说明；onboarding 跑完自动有 Price Book |
| 12 | **`NEXT_PUBLIC_TWILIO_NUMBER` env var 未设置** | 注册 Launch 页呼叫转移指引显示 "your Twilio number" | Railway 设置 `NEXT_PUBLIC_TWILIO_NUMBER=+1XXXXXXXXXX` |
| 13 | **Stripe Connect webhook 需要 Connect 事件** | `account.updated` 只有在 Stripe Dashboard 开启 Connect Webhooks 时才能收到 | Stripe Dashboard → Webhooks → 新建 Connect webhook endpoint → `account.updated, payment_intent.succeeded, charge.refunded, charge.dispute.created` |

---

## Stripe Connect 测试结果（2026-06-11）

### 按钮不响应根本原因

**UI 静默失败** + **STRIPE_SECRET_KEY 无效**，双重问题叠加：

1. `/api/payments/connect/start` API route 本身逻辑正确（有 try/catch，正确调用 `stripe.accounts.create` 和 `stripe.accountLinks.create`，正确使用 return_url/refresh_url）
2. 但 `STRIPE_SECRET_KEY` 无效（截断或错误），导致 Stripe 返回 `StripeAuthenticationError`，route 返回 HTTP 500
3. 前端 `startConnect()` 收到非 ok 响应后，**只是 setConnecting(false)，没有显示任何错误信息**，用户看到按钮闪一下后恢复，以为「没反应」

**已修复**：`PaymentsTab` 现在在失败时展示红色错误横幅，明确提示 Stripe key 问题。

### 端到端测试脚本输出

```
=== Stripe Connect 端到端测试 ===

1. 创建测试 Express 账户...
❌ 测试失败: Invalid API Key provided: sk_test_*...YOBh
错误码: undefined
错误类型: StripeAuthenticationError

诊断：STRIPE_SECRET_KEY 无效或权限不足
```

### 结论

| 项目 | 状态 |
|------|------|
| API route 逻辑 | ✅ 正确 |
| UI 错误处理 | ✅ 已修复（PATCH-3-stripe-test）|
| `STRIPE_SECRET_KEY` | ❌ 无效 — **需要 Gavin 操作** |
| Stripe Connect 平台设置 | ⚠️ 无法验证（key 无效时无法测试） |

### Gavin 需要做的事

1. **Railway → Variables → `STRIPE_SECRET_KEY`**：从 Stripe Dashboard (dashboard.stripe.com → API Keys) 复制完整 Secret key（`sk_test_51...` 或 `sk_live_51...`），粘贴时注意不要被截断
2. Railway 重新部署后，再次运行测试脚本确认 key 有效
3. 确认 Stripe Dashboard → Settings → Connect 已开启（才能创建 Express 账户）
4. 如需正式收款：Stripe Dashboard → Webhooks → 添加 Connect webhook（见缺口#13）

---

## PATCH-3 改动文件清单（2026-06-11）

- `lib/resend.ts` — 新增 lazy init 封装（修复缺口#10）
- `lib/verticals/hvac.ts` — systemPromptAddendum 替换为 Dwight 角色
- `lib/verticals/plumbing.ts` — systemPromptAddendum 替换为 Dwight 角色
- `lib/verticals/cleaning.ts` — systemPromptAddendum 替换为 Jim 角色
- `lib/verticals/roofing.ts` — systemPromptAddendum 替换为 Angela 角色
- `lib/verticals/handyman.ts` — systemPromptAddendum 替换为 Jim 角色
- `lib/verticals/electrical.ts` — systemPromptAddendum 替换为 Dwight 角色
- `lib/verticals/index.ts` — 新增 `getVerticalPreset()` 工具函数
- `lib/vapi/erin-assistant-config.json` — Erin Vapi 助手配置模板（新增）
- `lib/vapi/build-assistant-config.ts` — 占位符替换构建器（新增）
- `app/auth/register/page.tsx` — Step 5 呼叫转移说明读取 `NEXT_PUBLIC_TWILIO_NUMBER` 并格式化
- `package.json` — 新增 `resend` 依赖

### PATCH-3 遗留问题

| # | 遗留项 | 影响 | 动作 |
|---|--------|------|------|
| P3-1 | **RESEND_API_KEY 未在 Railway 设置** | 邮件发送运行时失败 | Railway Variables 设置 `RESEND_API_KEY` |
| P3-2 | **NEXT_PUBLIC_TWILIO_NUMBER 格式需为 E.164**（如 `+14165550100`）| 呼叫转移页面显示占位符 | Railway 设置 `NEXT_PUBLIC_TWILIO_NUMBER=+1XXXXXXXXXX` |
| P3-3 | **VAPI_WEBHOOK_SECRET 未设置** | `erin-assistant-config.json` 的 `serverUrlSecret` 占位符需在 Vapi onboarding 时替换 | 注册 Vapi 账号后填入；`buildVapiConfig` 当前不替换此字段，如需动态化需更新 `build-assistant-config.ts` |

---

---

## v3 Vapi 接入步骤（Gavin 需操作）

| 步骤 | 操作 | 说明 |
|------|------|------|
| 1 | 注册 [vapi.ai](https://vapi.ai) 账号 | 获取 API Key |
| 2 | 用 `buildVapiConfig()` 生成 Assistant 配置并在 Vapi Dashboard 创建 Assistant | 见 `lib/vapi/build-assistant-config.ts` |
| 3 | Railway Variables → `VAPI_API_KEY=vapi_...` | Vapi Dashboard → API Keys |
| 4 | Railway Variables → `VAPI_ASSISTANT_ID=<assistant_id>` | Vapi Dashboard → Assistants |
| 5 | Vapi Assistant → Server URL = `https://{YOUR_DOMAIN}/api/vapi/webhook` | 接收通话结果 |
| 6 | 运行数据库迁移：`railway run npx prisma db execute --file migrations/v3_booking_rules.sql` | 添加 bookingRules + vapiAssistantId 字段 |

迁移完成后 Front Office 页面 → Stats bar 显示 **"Live"** 标签，Configure Greeting 按钮可加载/保存 Erin 的真实配置。

---

## v3 改动文件清单

- `prisma/schema.prisma` — 新增 5 个字段：vapiAssistantId, bookingHoursStart/End, bookingBufferMins, bookingWeekendEnabled
- `migrations/v3_booking_rules.sql` — 对应 SQL migration（需手动执行）
- `lib/vapi/client.ts` — Vapi REST API 封装（getAssistant / updateAssistant / listCalls）
- `lib/vapi/build-assistant-config.ts` — 注入 bookingRules 到 Erin systemPrompt
- `app/api/vapi/assistant/route.ts` — GET/PATCH Erin 的 Vapi 配置
- `app/api/vapi/calls/route.ts` — GET 通话记录（Vapi 优先，降级本地 DB）
- `app/api/booking-rules/route.ts` — GET/POST booking rules（保存后同步推送 Vapi）
- `app/dashboard/front-office/page.tsx` — 全面更新：真实通话数据、Configure Greeting 弹窗、Booking Rules 与 DB 同步

---

## v2 改动文件清单（核心）
- `prisma/schema.prisma` — Trade enum, PriceBookItem, Payment, 地址字段
- `migrations/v2_front_office.sql` — 已在生产库执行
- `lib/verticals/` — 6 行业预设包（新增）
- `lib/activity-messages.ts` — Activity 人话化（新增）
- `lib/ai-quote.ts` — Price Book 匹配（重构）
- `app/auth/register/page.tsx` — 5 步 onboarding（重构）
- `app/dashboard/jobs/[id]/page.tsx` — 工单详情页（新增）
- `app/dashboard/settings/page.tsx` — 3 tab：Business / Price Book / Payments
- `app/api/pricebook/` — CRUD + seed（新增）
- `app/api/onboarding/generate/` — AI 生成（新增）
- `app/api/payments/connect/` — Stripe Connect onboarding（新增）
- `app/api/webhooks/stripe/route.ts` — 扩展 Connect 事件处理

---

## v4 Vapi + Google Reviews 改动文件清单（2026-06-12）

### 新增文件
- `lib/vapi/agents-config.ts` — 6 个 Agent 完整 Vapi 配置（Erin/Dwight/Jim/Angela/Oscar/Andy）
- `lib/vapi/agent-ids.ts` — Agent ID 常量（读取 Railway env vars VAPI_AGENT_*）
- `scripts/push-vapi-agents.ts` — 一键推送 6 个 Agent 到 Vapi API，输出 Railway env var 命令
- `app/api/vapi/setup-agents/route.ts` — POST：创建/更新全部 6 个 Agent；GET：返回所有 ID
- `lib/google/client.ts` — getGoogleClient（自动刷新 token）+ discoverAndSaveLocation
- `app/api/google/auth/route.ts` — OAuth 入口（同 /api/google/connect）
- `app/api/reviews/route.ts` — GET Reviews（分页 + 过滤）
- `app/api/reviews/sync/route.ts` — POST：从 Google Business Profile 同步最新评价
- `app/api/cron/sync-reviews/route.ts` — POST：全量 cron 同步（每 4 小时）
- `migrations/v4_google_reviews.sql` — 新增 Review.googleReviewId + GoogleBusinessConnection.lastSyncedAt

### 修改文件
- `lib/vapi/client.ts` — 新增 createAssistant / listAssistants
- `prisma/schema.prisma` — Review 新增 googleReviewId；GoogleBusinessConnection 新增 lastSyncedAt
- `app/api/google/callback/route.ts` — 回调后自动发现 location ID；重定向到 /dashboard/reviews
- `app/api/reviews/[id]/reply/route.ts` — 保存回复后同步 PUT 到 Google API
- `app/api/business/profile/route.ts` — googleConnection select 加入 lastSyncedAt
- `app/dashboard/front-office/page.tsx` — Configure 弹窗显示各 Agent 真实 Vapi ID
- `app/dashboard/settings/page.tsx` — Google 卡片显示"Last synced X min ago" + Sync Now 按钮
- `app/dashboard/reviews/page.tsx` — 连接后自动触发同步；动态"Last synced"；BizData 含 lastSyncedAt

# BLOCKERS — 需要 Gavin 本人处理

| # | 阻塞项 | 影响范围 | 绕行方案 |
|---|-------|---------|---------|
| 1 | **域名 servicestar.app 未绑定 Railway** | 短信链接全为 railway.app 死链，客户侧体验差 | 代码已用 `NEXT_PUBLIC_APP_URL` env var，Gavin 绑域名后改一个变量即可 |
| 2 | **Twilio 试用账号无法发 URL（Error 30044）** | 发票链接、评价请求链接、winback /b/slug 链接全被封 | 代码已做降级处理：发纯文字版，检测到付费后自动加链接；短信内容留`{LINK}`占位符 |
| 3 | **Vapi/Retell 账号未注册** | ss-agents 的语音 Intake 无法完成 end-to-end 测试 | Intake webhook 已实现，准备好集成代码，等 Gavin 授权后 10 分钟完成绑定 |
| 4 | **Google OAuth redirect URI** | Google Business 连接需要在 GCP Console 加新域名的 redirect URI | 集成代码已写，Gavin 进 GCP Console 加 `https://{NEW_DOMAIN}/api/google/callback` |
| 5 | **Stripe key 截断（Railway 已知 bug）** | v1 不做收款，不阻塞；收款前必修 | 手动在 Railway Variables 粘贴完整 key |

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

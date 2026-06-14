# Service Star 交接文档
Updated: 2026-06-14 (PATCH-4: Job State Machine)

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

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

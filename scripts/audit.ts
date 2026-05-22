/**
 * StarLoop Product Audit Script
 * Visits all key pages, screenshots desktop + mobile, sends to Claude for design review.
 * Usage: npx tsx scripts/audit.ts
 */

import { chromium, type Page } from "playwright";
import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: path.join(__dirname, "../.env.local") });

const BASE_URL = "https://starloop-production.up.railway.app";
const MODEL = "claude-opus-4-5";
const SCREENSHOT_DIR = path.join(__dirname, "../audit-screenshots");

const PAGES = [
  { name: "首页 (Homepage)", path: "/en", requiresAuth: false },
  { name: "登录页 (Login)", path: "/en/auth/login", requiresAuth: false },
  { name: "注册页 (Register)", path: "/en/auth/register", requiresAuth: false },
  { name: "Dashboard 主页", path: "/en/dashboard", requiresAuth: true },
  { name: "Dashboard - 评论管理", path: "/en/dashboard/reviews", requiresAuth: true },
  { name: "Dashboard - 客户管理", path: "/en/dashboard/customers", requiresAuth: true },
  { name: "Dashboard - Billing", path: "/en/dashboard/billing", requiresAuth: true },
  { name: "Dashboard - Settings", path: "/en/dashboard/settings", requiresAuth: true },
];

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 375, height: 812 },
];

const AUDIT_PROMPT = `你是顶级SaaS产品设计师，曾深度使用并研究 Linear、Stripe Dashboard、Notion、Vercel、Loom 等顶尖产品。

请对这张产品截图进行专业评审，按以下结构输出：

## 1. 视觉质量评分
- 综合评分：X/10
- 评分依据（2-3句话）

## 2. 信息架构问题
列出具体问题，每条说明"什么信息放在了错误的位置"或"用户找不到什么"。

## 3. 文案质量
- 标题/CTA/说明文字的清晰度
- 具体需要改进的文案（原文 → 建议改法）

## 4. 与顶尖产品的具体差距
对比 Linear / Stripe / Notion，指出1-3个最显著的设计差距（要具体，不要泛泛而谈）。

## 5. 优先级最高的3个修改建议
按影响力排序，每条包含：问题描述 + 具体改法 + 预期效果。`;

async function screenshotToBase64(page: Page, filePath: string): Promise<string> {
  await page.screenshot({ path: filePath, fullPage: true });
  return fs.readFileSync(filePath).toString("base64");
}

async function auditPageWithClaude(
  client: Anthropic,
  pageName: string,
  viewportName: string,
  base64Image: string
): Promise<string> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1500,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/png",
              data: base64Image,
            },
          },
          {
            type: "text",
            text: `页面：${pageName}（${viewportName === "desktop" ? "桌面端 1440px" : "移动端 375px"}）\n\n${AUDIT_PROMPT}`,
          },
        ],
      },
    ],
  });

  return response.content[0].type === "text" ? response.content[0].text : "";
}

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("❌ ANTHROPIC_API_KEY not found in .env.local");
    process.exit(1);
  }

  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const client = new Anthropic({ apiKey });
  const browser = await chromium.launch({ headless: true });

  const reportSections: string[] = [];
  reportSections.push(`# StarLoop 产品设计审查报告`);
  reportSections.push(`\n生成时间：${new Date().toLocaleString("zh-CN")}`);
  reportSections.push(`\n审查模型：${MODEL}`);
  reportSections.push(`\n审查范围：${PAGES.length} 个页面 × 2 个视口（桌面 1440px + 移动 375px）= ${PAGES.length * 2} 张截图`);
  reportSections.push(`\n---\n`);

  let pageIndex = 0;
  for (const pageConfig of PAGES) {
    pageIndex++;
    console.log(`\n[${pageIndex}/${PAGES.length}] 审查页面：${pageConfig.name}`);
    reportSections.push(`## ${pageConfig.name}`);
    reportSections.push(`\nURL: \`${BASE_URL}${pageConfig.path}\``);
    if (pageConfig.requiresAuth) {
      reportSections.push(`\n> ⚠️ 此页面需要登录，截图为未认证时的实际呈现（重定向页或空状态）。`);
    }

    for (const viewport of VIEWPORTS) {
      console.log(`  → ${viewport.name} (${viewport.width}px)`);

      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        userAgent:
          viewport.name === "mobile"
            ? "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1"
            : undefined,
      });
      const page = await context.newPage();

      try {
        await page.goto(`${BASE_URL}${pageConfig.path}`, {
          waitUntil: "networkidle",
          timeout: 20000,
        });
        // Extra wait for animations/fonts
        await page.waitForTimeout(1500);
      } catch {
        console.log(`    ⚠️ 页面加载超时，仍继续截图`);
      }

      const safeName = pageConfig.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "_");
      const screenshotPath = path.join(
        SCREENSHOT_DIR,
        `${safeName}_${viewport.name}.png`
      );

      const base64 = await screenshotToBase64(page, screenshotPath);
      console.log(`    ✓ 截图已保存: ${path.basename(screenshotPath)}`);

      console.log(`    → 发送给 Claude 分析...`);
      const analysis = await auditPageWithClaude(
        client,
        pageConfig.name,
        viewport.name,
        base64
      );
      console.log(`    ✓ 分析完成`);

      reportSections.push(`\n### ${viewport.name === "desktop" ? "桌面端 (1440px)" : "移动端 (375px)"}\n`);
      reportSections.push(analysis);

      await context.close();
    }

    reportSections.push(`\n---\n`);
  }

  await browser.close();

  // Summary section
  reportSections.push(`## 总结与优先级建议`);
  reportSections.push(`\n以上为各页面独立评审结果。建议按以下优先级推进改进：`);
  reportSections.push(`\n1. **公开页面（首页/登录/注册）** — 直接影响转化率，优先级最高`);
  reportSections.push(`\n2. **Dashboard 核心功能页** — 影响留存和日活，次优先`);
  reportSections.push(`\n3. **Billing/Settings** — 影响付费转化和信任感\n`);

  const reportPath = path.join(__dirname, "../audit-report.md");
  fs.writeFileSync(reportPath, reportSections.join("\n"), "utf-8");

  console.log(`\n✅ 审查完成！报告已写入: audit-report.md`);
  console.log(`📁 截图目录: audit-screenshots/`);
  console.log(`📄 报告路径: ${reportPath}`);
}

main().catch((err) => {
  console.error("❌ 脚本报错:", err);
  process.exit(1);
});

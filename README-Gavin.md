# StarLoop UI 升级 Skill 安装指南

> 给 Gavin 的专属说明 — 2026.05.15

---

## 这是什么

Anthropic 官方的 `frontend-design` skill。装了之后，Claude Code 在你 StarLoop 项目里写前端代码时，会自动遵守这套"反 AI 味"的设计原则。

**它解决的核心问题**：默认 Claude Code 写出来的 UI 是这样的——白底、紫色渐变、Inter 字体、Tailwind 默认配色、居中圆角卡片。看一眼就知道是 AI 写的，没记忆点。装了这个 skill 之后，它会被强制做出**有审美方向**的设计。

---

## 第一步：把 skill 装到 StarLoop 项目

打开你的 StarLoop 项目目录，执行：

```bash
cd ~/你的StarLoop项目路径
mkdir -p .claude/skills/frontend-design
```

然后把 `frontend-design/SKILL.md` 这个文件复制到 `.claude/skills/frontend-design/` 里面。

最终目录结构应该是：

```
starloop/
├── .claude/
│   └── skills/
│       └── frontend-design/
│           ├── SKILL.md
│           └── LICENSE.txt
├── app/
├── package.json
└── ...
```

装好之后，**Claude Code 在这个项目里写任何前端代码时会自动读取这个 skill**，不需要你每次提醒。

---

## 第二步：给 StarLoop 定一个审美方向（关键）

Skill 文件里有一段话最重要：

> Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian

翻译：**先选一个极端的审美方向，不要在中间摇摆。**

针对 StarLoop 的目标客户（多伦多华人单店老板，3.8-4.2 星店），我建议你在以下两个方向二选一：

### 方向 A：Editorial / Magazine（杂志感）
- 像《纽约客》《Monocle》那种排版
- 大量留白、衬线字体做标题、无衬线做正文
- 数据呈现像一篇报道，不像 SaaS dashboard
- **适合场景**：让华人老板觉得"这个工具有档次"，而不是又一个微信小程序

### 方向 B：Industrial / Utilitarian（工业实用感）
- 像 Linear、Vercel、Stripe Dashboard
- 深色背景、等宽字体、密集信息
- 数据感强、专业
- **适合场景**：让懂行的老板觉得"这个工具是认真做的"

**我的建议：选 A。** 因为你的差异化是"Claude AI 回复 + 中英双语"，目标客户是受过教育的华人老板，他们对"档次感"的付费意愿比"技术感"高。Linear 风格的工具华人圈不缺，杂志风的 SaaS 几乎没有。

---

## 第三步：调用咒语模板（直接复制给 Claude Code 用）

打开 Claude Code，在 StarLoop 项目里，用这个 prompt 启动 UI 升级：

```
我要把 StarLoop 的整个 UI 重做一遍。

设计方向锁定为 Editorial / Magazine 风格，参考 Monocle、The New Yorker、
Bloomberg Businessweek 的网页排版。

具体要求：
1. 字体：标题用衬线字体（推荐 Fraunces / GT Sectra / Tiempos Headline 这类
   有性格的衬线），正文用一款高品质无衬线（推荐 Söhne / GT America，
   或者免费替代 Geist）。不要用 Inter、不要用 Roboto。
2. 配色：以米色或暖白为底（不是纯白 #FFFFFF），主色用一个深色调
   （深绿、深蓝、酒红任选一个），强调色用单一亮色。不要紫色渐变。
3. 布局：参考杂志版式，可以用非对称网格、大号引言、栏宽变化。
   不要所有卡片都长一样。
4. 微交互：克制但有质感。文字 hover 用下划线动画，按钮 hover
   用底色微妙变化。不要弹跳、不要 confetti、不要花哨过场。
5. 中英双语切换要优雅，不是简单加个按钮。中文用思源宋体或
   霞鹜文楷做衬线，配合英文衬线视觉权重接近。

先不要改代码。请你先做这件事：
读取 .claude/skills/frontend-design/SKILL.md，
然后基于上面方向，给我一个"设计系统提案"，包括：
- 字体组合（具体到字重）
- 完整色板（含 CSS 变量名）
- 3 个核心组件的设计描述（按钮、卡片、表格）
- Landing page 的版式思路

提案我审批后再开始改代码。
```

**这个 prompt 的关键点**：
- 不让它一上来就改代码（之前你应该吃过亏，AI 一通乱改，回不去了）
- 强制它先读 skill
- 强制它先出"设计系统"，你审完再动手
- 把具体字体名都给它（不给它选，它会选 Inter）

---

## 第四步：分阶段重做，不要一次性全推

按这个顺序做，每步审一次：

1. **Landing page**（最重要，决定第一印象）
2. **Review Gate 中间页**（4-5星跳 Google、1-3星私密反馈那一页 —— 这是你的核心差异化，UI 要做得让客户愿意点）
3. **餐厅二维码评价页**（移动端为主，扫码进来的体验）
4. **Dashboard 5 个页面**（最后做，因为只有店主自己看）

为什么这个顺序：**Landing 和 Review Gate 决定你能不能签单，Dashboard 只决定老用户留存。先做能赚钱的部分。**

---

## 第五步：永远不要做的事

1. **不要让 Claude Code 一次性"重做整个 StarLoop UI"**。它会废掉你已有的功能。一次只做一个页面。
2. **不要相信 "AI 味" 的默认审美**。如果它做出来的东西看起来像任何一个 Vercel 模板，让它重做。
3. **不要在 Dashboard 上花太多时间**。Landing page 和 Review Gate 才决定转化。
4. **每次大改前先 `git commit`**。Claude Code 偶尔会把好的东西改坏。

---

## 一个现实提醒

UI 升级**不会**给你带来第一个付费用户。它只能让你在已经接触到的潜在客户面前，转化率从 5% 提到 15%。

如果你现在 **0 个潜在客户在看 StarLoop**，UI 做到苹果官网水平也没用。

所以 UI 升级和**这周走出去签 5 家店**是两件并行的事，不是先后关系。

UI 我帮你装好工具，签客户你自己得出去。

— Claude

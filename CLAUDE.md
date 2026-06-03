# 智谱书院 AI Workspace — CLAUDE.md

## Current Priority

**Stage:** V1 上线 → 6 月学生内部试用准备

产品已完成核心功能开发和视觉精修，已部署到 Vercel 线上运行。
当前阶段目标是：稳定现有功能、补反馈闭环和身份选择、准备 6 月学生试用。

**允许的改动：**
- Bug 修复
- 反馈入口、身份选择等试用必备功能
- System prompt 调优（提升 AI 回答准确性）
- 内容解耦（data.js → tasks.json）
- 文案微调
- 部署配置

**不允许的改动：**
- React / Vue / Svelte 迁移
- 大规模 UI 重构
- 新增前端框架或构建工具
- 飞书 API 集成（属于 V2）
- 数据库或用户登录系统（属于 V2）

---

## Product Definition

**Product Name:** 智谱书院 Academy AI Workspace

**One-line:** 面向智谱书院联培生的 AI Agent 工作台，将散落在飞书知识库中的制度文档转化为结构化、可执行的任务回答。

**This IS:**
- 三栏式 AI Agent Workspace（Sidebar Context + Task Catalog + Assistant Panel）
- Task-first 设计：先选任务，再看结构化回答
- 接入真实 GLM-4 API + 智谱知识库 RAG 的 AI 产品
- 支持自由问答的多轮对话
- 带反馈通道的可试用产品

**This is NOT:**
- 官网或营销页面
- 纯 ChatGPT wrapper
- 完整教务管理系统
- 多角色权限系统（当前只有 student 角色活跃）

**Core Interaction Chain:**
```
Student Context → Task / Question → Structured Answer / Chat → Action → Feedback
```

---

## Tech Stack

- **前端：** HTML / CSS / Vanilla JavaScript（无框架）
- **AI：** 智谱 GLM-4-Plus API（流式 SSE）
- **知识库：** 智谱 BigModel Knowledge Base（11 文件 / 36 切片 / Embedding-3-pro）
- **部署：** Vercel（静态站点 + Serverless Function）
- **API 代理：** `api/chat.js`（Vercel Serverless Function，API Key 存环境变量）

**Do NOT:**
- 转换为 React / Vue / Svelte
- 添加 Vite、Webpack 或任何构建工具
- 添加 TypeScript 或 Tailwind
- 添加 npm 依赖（除非仅用于部署）
- 在前端代码中暴露 API Key

---

## File Map

### ⚠️ 重要：双 HTML 入口同步规则

项目有两个 HTML 文件，必须保持同步：

| 文件 | 角色 |
|------|------|
| `project/智谱书院 AI Portal.html` | **开发入口 / 源文件**（AGENTS.md 定义的 Entry file） |
| `project/index.html` | **部署入口**（Vercel 线上实际使用的文件） |

**规则：以 `智谱书院 AI Portal.html` 为开发源文件。改完后必须同步到 `index.html`。**
两个文件当前是字节级一致的。如果只改了一个，线上和本地会不一致。

### Core files
| File | Purpose |
|------|---------|
| `project/智谱书院 AI Portal.html` | 开发入口（改 HTML 改这个，完成后同步到 index.html） |
| `project/index.html` | 部署入口（Vercel 线上使用，必须与上面保持一致） |
| `project/styles.css` | CSS 变量（颜色、间距、圆角、阴影） |
| `project/workspace.css` | 三栏布局、sidebar 样式（sb- 前缀）、任务卡片标签 |
| `project/panel.css` | 右侧 Answer Panel 样式、五段式结构、追问按钮 |
| `project/chatbot.css` | Chat 对话样式、空闲态、药丸按钮、reasoning 动画、反馈链接 |
| `project/workspace.js` | 核心逻辑：任务点击、回答渲染、标签渲染、追问按钮、sidebar 折叠 |
| `project/chatbot.js` | Chatbot 逻辑：API 调用、流式渲染、reasoning 状态、空闲态、反馈入口 |
| `project/data.js` | 任务内容数据（visitor + student 各 5 个任务，含 tags 字段） |
| `project/icons.js` | SVG 图标定义 |
| `api/chat.js` | Vercel Serverless Function：代理 GLM API 请求，含 system prompt 和知识库检索 |
| `vercel.json` | Vercel 部署配置（outputDirectory: project，serverless function 超时 30s） |

### Secondary files（非必要不修改）
| File | Purpose |
|------|---------|
| `project/tasks.css` | 任务卡片特定样式 |
| `project/hero.css` | 中间区域标题样式 |
| `project/polish.css` | 视觉精修覆盖 |
| `project/refine.css` | 额外精修覆盖 |
| `project/extras.css` | 额外样式微调 |
| `project/themes.css` | 主题变量 |
| `project/footer.css` | 底部样式 |

### Legacy files（不使用）
| File | Purpose |
|------|---------|
| `project/cockpit.css` | 旧版 Hero Orb — 不使用 |
| `project/tweaks.jsx` | React 视觉覆盖 — 非核心 |
| `project/tweaks-panel.jsx` | React 面板覆盖 — 非核心 |
| `project/app.js` | 旧版逻辑 — 已被 workspace.js 取代 |

---

## Page Structure

```
┌─────────────┬──────────────────┬─────────────────────────────────┐
│ Sidebar     │ Task Catalog     │ Assistant Panel                 │
│ ~220px      │ ~360px           │ flex: 1 (primary)               │
│             │                  │                                 │
│ sb-header   │ - Title          │ 空闲态:                          │
│  Brand/Logo │ - Subtitle       │  "有什么可以帮你的？"              │
│             │ - Search input   │  4 个药丸快捷提问                  │
│ sb-content  │ - Task cards ×5  │  反馈入口                        │
│  工作台 nav  │   (with tags)    │                                 │
│  FOCUS      │                  │ 任务态:                          │
│  KNOWLEDGE  │                  │  五段式结构化回答                  │
│  AI CONTEXT │                  │  追问按钮                        │
│             │                  │                                 │
│ sb-footer   │                  │ 对话态:                          │
│  反馈按钮    │                  │  多轮对话 + 流式输出               │
│  用户卡片    │                  │  来源标签 + 追问建议               │
│             │                  │  Reasoning 状态条                │
│             │                  │  反馈链接                        │
└─────────────┴──────────────────┴─────────────────────────────────┘
```

---

## Sidebar 结构（shadcn 风格）

Sidebar 使用 `sb-` 前缀的 class 名，结构参考 shadcn/ui Sidebar 组件层级：

```
aside.ws-sidebar
├── div.sb-header（品牌区，固定顶部）
├── div.sb-content（可滚动区域）
│   ├── div.sb-group（工作台：首页/当前任务/培养路径/模板库）
│   ├── div.sb-group（CURRENT FOCUS，可折叠）
│   ├── div.sb-group（KNOWLEDGE SOURCES，可折叠）
│   └── div.sb-group（ACADEMY AI CONTEXT，可折叠）
├── a.sb-feedback-btn（💬 有话想说 → 飞书收集表）
└── div.sb-footer（用户卡片，固定底部）
```

折叠交互：`sb-group-label.is-collapsible` 点击 toggle `sb-group-body.is-collapsed`，chevron 旋转。

---

## Right Panel: 三种状态

### 空闲态
- `● Academy AI Ready` 状态点
- "有什么可以帮你的？" 标题
- 一句话能力说明
- 4 个药丸形快捷提问按钮（点击调用 `Chatbot.start()`）
- "💬 有些话不方便直接说？匿名告诉书院 →" 反馈链接
- 底部 Composer 输入框（20px 大圆角）

### 任务态（点击预设任务卡片）
- Breadcrumb：Academy AI / 任务标题
- 五段式结构化回答：一句话结论 / 行动清单 / 相关依据 / 可复制模板 / 下一步建议
- Section 间有极淡分割线，stagger reveal 动画
- 底部"💬 就「任务标题」继续追问"按钮

### 对话态（自由提问）
- 用户消息右对齐，AI 消息左对齐
- Reasoning 状态条（三步动画：查阅 → 匹配 → 生成）
- 流式逐字输出，带闪烁光标
- 每条 AI 回答：来源标签 + 复制按钮 + 追问建议 + 反馈链接
- 底部追问输入框

---

## AI 能力

| 能力 | 实现方式 | 状态 |
|------|---------|------|
| 预设任务回答 | data.js 硬编码结构化内容 | ✅ 稳定 |
| 自由问答 | GLM-4-Plus API 流式调用 | ✅ 在线 |
| 知识库检索 | 智谱 BigModel Knowledge Base RAG | ✅ 在线 |
| Reasoning 展示 | 前端模拟三步动画 | ✅ 在线 |
| Context 注入 | 🔜 待做（身份选择 + profile → prompt） |
| 动作闭环 | 🔜 V2（飞书集成） |

---

## Visual Direction

**Style:** 浅色极简工具风（Linear / Raycast / AG-UI 参考）

**CSS tokens（styles.css）：**
- Page background: `#FAFAF7`
- Sidebar: `#F4F5F1`
- Surface: `#FFFFFF`
- Text: `#1F241F` → `#5F685E` → `#8A9288` → `#B6BDB3`
- Accent: `#1F8F5F`（仅用于状态指示：进度、勾选、active）
- Border: `#E6E8E1` / `#DADDD3`

**设计原则：**
- 绿色仅用于状态指示，不做装饰色
- 最少边框，用背景色差异区分区域
- 排版层级靠字号和字重区分，不靠颜色
- 右侧 panel 像文档，不像设置页
- 反馈入口要轻量，不抢主功能注意力

**禁止：**
- 暗色模式
- 紫色、蓝色、亮渐变
- 发光效果、粒子、WebGL
- 毛玻璃效果
- 大型装饰元素

---

## Deployment

**线上地址：** https://zhipu-academy-ai-workspace.vercel.app/

**Vercel 配置：**
- `vercel.json`: `"outputDirectory": "project"`
- Serverless Function: `api/chat.js`（maxDuration: 30s）
- 环境变量: `GLM_API_KEY`（在 Vercel Settings → Environment Variables 中设置）

**部署流程：**
```bash
git add .
git commit -m "描述改动"
git push
# Vercel 自动部署
```

---

## Interaction Checklist

以下交互必须始终正常工作：

- [ ] 点击任务卡片 → 右侧显示五段式回答
- [ ] Active 任务有绿色左边框和浅绿背景
- [ ] 任务卡片下方有标签 pill
- [ ] Answer sections stagger-reveal 动画
- [ ] 行动清单三态区分（done/current/pending）
- [ ] 复制按钮复制模板并显示"已复制"
- [ ] "就这个任务继续追问"按钮 → 切换到 chat 态
- [ ] 下一步建议可点击切换任务
- [ ] 空闲态药丸按钮点击 → 开始 chat 对话
- [ ] Chat 输入框回车 → 发送问题 → Reasoning 动画 → 流式回答
- [ ] AI 回答底部有来源标签、追问按钮、反馈链接
- [ ] Sidebar 分组可折叠/展开
- [ ] "有话想说"按钮跳转飞书收集表
- [ ] "首页"和"当前任务" active 状态切换

---

## 反馈通道

飞书收集表：`https://zhipu-ai.feishu.cn/share/base/form/shrcn5YHxX3J2tvku6AuZVAdyFn`

三个入口位置：
1. Sidebar 底部"💬 有话想说"按钮
2. Chatbot AI 回答底部"这个回答没帮到你？告诉我们 →"
3. 空闲态药丸按钮下方"💬 有些话不方便直接说？匿名告诉书院 →"

---

## After Every Change

报告：
1. 修改了哪些文件
2. data.js 内容是否变化（通常应为 NO，除非改 tags）
3. 是否新增依赖（应为 NO）
4. **是否同步了 `智谱书院 AI Portal.html` 和 `index.html`**
5. 如何在浏览器中验证
6. 剩余问题

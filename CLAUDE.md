# 智谱书院 AI Workspace / Zhipu Academy AI Workspace

## Current Highest Priority

**This week's goal:** Build a clickable, animated, demo-ready AI Native Workspace.

The priority is **NOT**:
- Static UI refinement
- Visual exploration or new design directions
- Rebuilding the project

The priority **IS**:
- Implementing the full interaction chain: **Role → Task → Answer → Action**
- Making the workspace screen-recordable as a demo
- Ensuring all interactions feel complete and responsive

---

## Project Positioning

**Project Name:** 智谱书院 AI Workspace / Zhipu Academy AI Workspace

This is **NOT**:
- A traditional website
- A pure chatbot

This **IS**:
- An AI Native workspace for external visitors and new students
- A task-based structured AI assistant that turns scattered Feishu documents, rules, FAQ, onboarding flows, and training-system information into actionable guidance

---

## Tech Stack

**Current Stack:**
- HTML
- CSS
- Vanilla JavaScript
- React loaded via CDN for `tweaks.jsx` and `tweaks-panel.jsx` (visual theme tweaks only)

**Entry HTML file:**
`project/智谱书院 AI Portal.html`

**Key JS files:**
- `icons.js` — SVG icon definitions
- `data.js` — Task data (visitor/student roles)
- `workspace.js` — Core logic (role switch, task click, answer panel)
- `app.js` — Additional app functionality
- `tweaks.jsx` / `tweaks-panel.jsx` — React-based visual tweaks (non-core)

**Key CSS files:**
- `styles.css` — Global styles
- `workspace.css` — Three-column layout
- `panel.css` — Right panel styles
- `cockpit.css` — **Contains Hero Orb** (`.ws-orb`, `.orb-ring`, `.orb-core`)
- `tasks.css` — Task cards
- `hero.css` — Hero section

**Do NOT:**
- Convert this project to React
- Add Vite
- Add TypeScript
- Add Tailwind
- Add GSAP
- Add three.js or WebGL
- Add a package.json or new build system unless explicitly requested
- Connect real APIs
- Connect Feishu knowledge base yet

---

## Page Structure to Preserve

Keep the current three-column Agent Workspace layout:

```
┌─────────────┬──────────────────────────┬──────────────────┐
│             │                          │                  │
│   Left      │      Center Main         │   Right Panel    │
│   Sidebar   │                          │                  │
│             │  - Hero title            │  - Structured    │
│  - Brand    │  - Ask Academy AI input  │    answer        │
│  - Identity │  - Quick task cards      │  - Action        │
│  - Tasks    │  - Task launcher area    │    checklist     │
│  - Sources  │                          │  - Related       │
│             │                          │    sources       │
│             │                          │  - Copyable      │
│             │                          │    template      │
│             │                          │                  │
└─────────────┴──────────────────────────┴──────────────────┘
```

Do **NOT** rebuild the page into a website, chatbot, or new dashboard.

---

## Demo Interactions Required This Week

### A. Role Switching

Clicking "我想了解书院" or "我是新加入的同学" should:

- Switch active role state
- Update sidebar task list
- Update center task cards
- Update right panel default state or default task
- Use light fade + translateY animation (duration: ~240ms)

### B. Task Selection

Clicking a sidebar task or center task card should:

- Set active task
- Sync sidebar and center active states
- Update the right Answer Panel
- Use light transition, not hard switching

### C. Answer Panel Stagger Reveal

The right panel answer should reveal blocks in order:

1. One-sentence conclusion
2. Action checklist
3. Related sources
4. Copyable template

**Animation specs:**
```css
opacity: 0 → 1
transform: translateY(8px) → 0
duration: 240–360ms
delay: 80–120ms between blocks
```

### D. Ask Academy AI Input

The input should behave like a command input:

- Focus: border highlight + soft box-shadow
- Focus: show suggested question chips
- Chips come from existing tasks
- Clicking a chip triggers the related task
- Hide chips after blur with short delay

### E. Copy Template

The copy button should:

- Copy the current template text
- Show "已复制"
- Restore to "复制" after 1.5 seconds
- Show lightweight toast (bottom-right OR inside right panel)
- **Never** cover the hero title

---

## Allowed Motion

**Allowed:**
- Task card hover: `translateY(-2px)`
- Active card subtle highlight
- Source card hover
- Input focus glow
- Answer panel stagger reveal
- Role switch fade
- Chip hover
- Copy success toast
- Lightweight CSS focus brackets (task cards / source cards / role cards only)

**Forbidden:**
- ShapeBlur WebGL
- PixelTrail
- three.js
- GSAP
- Full TargetCursor
- Custom mouse cursor
- Hiding default cursor
- Particles
- 3D scenes
- Video background
- Strong glow
- Game-like targeting UI
- **Hero Orb / glowing sphere** — Located in `cockpit.css` (`.ws-orb`, `.orb-ring`, `.orb-core`) and HTML lines 88-93

If React Bits style is needed, only implement lightweight CSS/vanilla JS approximations. Do **NOT** import full React Bits components.

---

## UI Refinement Priorities

When refining UI, prioritize:

1. Reduce visual crowding
2. Unify typography system
3. Improve spacing
4. Improve right panel readability
5. Prevent text overflow
6. Prevent source card tag collision
7. Reduce overuse of purple glow
8. Make sidebar feel like navigation, not a document

### Typography Guide

| Element | Size | Font-weight | Line-height |
|---------|------|-------------|-------------|
| Hero title | 48–56px | — | 1.12 |
| Section title | 18px | 600 | — |
| Task card title | 16px | 600 | — |
| Panel title | 22–24px | 600 | — |
| Panel block title | 14px | 600 | — |
| Body text | 13–14px | — | 1.6–1.7 |
| Meta / label | 11–12px | — | — |
| Source tag | 11px | — | — |

### Spacing Guide

- Task card grid gap: `16px`
- Task card padding: `20px 24px`
- Sidebar section gap: `20–24px`
- Panel block gap: `16–20px`
- Hero title to subtitle gap: `14–16px`
- Subtitle to input gap: `24–28px`
- Input to task section gap: `36–40px`

---

## Content Protection Rules

If the user says "do not change content", strictly **DO NOT** change:

- Task titles
- Task descriptions
- Answer Panel content
- Copyable template text
- Source text
- `data.js` content

**Only modify:**
- Classes
- Layout
- CSS
- JS interaction logic
- DOM rendering structure

---

## Preferred Files to Modify

**Prefer modifying:**
- `workspace.js` — role switching, task click, active state, answer panel updates, copy button, input chips
- `workspace.css` — layout, hover, active state, reveal animation, input focus, source cards, toast, spacing
- `styles.css` — global tokens, colors, typography, base styles

**Avoid modifying:**
- `data.js` — unless explicitly asked

---

## Core Logic Locations

**Role switching:** `workspace.js` — `bindIdentity()` function (lines 60-73)

**Task click handling:** `workspace.js` — `openTask()` function (lines 76-82)

**Answer panel rendering:** `workspace.js` — `renderAnswer()` (lines 200-286) and `showEmpty()` (lines 84-198)

**Task data storage:** `data.js` — `window.TASKS` object with visitor (5 tasks) and student (5 tasks) roles

---

## Before Any Change

Before editing, check:

- [ ] Does the page open normally?
- [ ] Does task click work?
- [ ] Does the right panel render correctly?
- [ ] Are there high-risk effects leftovers?
- [ ] Does this task require content changes?

---

## After Every Change

Always report:

1. Files modified
2. Interactions added or fixed
3. Whether any content text was changed
4. Whether any dependency was added
5. How to verify in browser
6. Remaining risks

---

## Current Forbidden Actions

**Do NOT:**
- Explore new visual directions
- Rebuild the page
- Turn it into a website
- Turn it into a pure chatbot
- Convert to React
- Connect API
- Connect Feishu
- Add complex animation libraries
- Add WebGL
- Add full React Bits code
- Add avatars or robot icons
- Let decorative effects overpower product interaction

**Current stage ONLY allows:**
- Clickable interactions
- Product-level micro-interactions
- Typography and spacing refinement
- Demo-ready experience

---

## Skills Usage Rules

### 1. General Principles

- **Do NOT use skills just because they are installed.** Only use a skill when the task explicitly requires it.
- **Always explain WHY a skill is needed** before invoking it.
- **If no suitable skill exists**, execute the task directly according to CLAUDE.md rules—do NOT force a skill call.

### 2. When to Use Skills

Only use skills when the task explicitly involves:

- **UI / Frontend Design:** Web design, interface design, visual hierarchy, component design
- **Accessibility:** A11y audit, screen reader testing, keyboard navigation
- **AI Product Design:** AI-native UX patterns, conversational UI, agent workflows
- **Frontend Debug:** Console errors, JavaScript debugging, performance issues
- **Documentation:** README, API docs, inline code comments

### 3. Preferred Skill Categories

For this project, prioritize these types of skills:

```
✓ UI / frontend design / web design
✓ accessibility audit
✓ AI product / AI-native product design
✓ frontend debug / console debug / JavaScript debug
✓ documentation / README
```

### 4. Forbidden Skills

Do NOT use skills unrelated to this project:

```
✗ Legal / compliance
✗ Offensive security / penetration testing
✗ Advertising / marketing automation
✗ CRM automation
✗ Financial trading / fintech
✗ External system automation (outside this project)
```

### 5. Pre-Invocation Checklist

Before calling any skill, ask:

1. Is this skill directly relevant to the current task?
2. Does the task require specialized capabilities beyond core reasoning?
3. Can I explain why this specific skill is needed?

If the answer to any question is "NO", do NOT use the skill.

# 智谱书院 AI Workspace — AGENT.md

## Current Priority

**Stage:** Demo complete → Deploy + Portfolio packaging

The project has finished visual development. Do NOT:
- Explore new visual directions
- Do major UI redesigns
- Add new features

Only allowed changes:
- Bug fixes
- Minor spacing/alignment tweaks (max 30 min)
- Content text corrections in data.js (only if factually wrong)
- Deployment configuration
- Documentation updates

---

## Product Definition

**Product Name:** 智谱书院 AI Workspace (Zhipu Academy AI Workspace)

**One-line:** A student-facing AI workspace that turns scattered Feishu policy documents into structured, actionable answers.

**This IS:**
- An AI Native workspace for student onboarding
- A task-based structured assistant (not a chatbot)
- A single-role product: student only

**This is NOT:**
- A website or landing page
- A chatbot or conversational UI
- A multi-role product (visitor role exists in data.js but is NOT active in the UI)
- A course platform or LMS
- A dashboard with charts

**Core Interaction Chain:**
```
Student Context → Task → Answer → Action
```
Student enters workspace → selects a task → right panel shows structured AI answer → student follows checklist, checks sources, copies template, sees next steps.

**AI Output Structure (5 sections):**
1. One-sentence summary (一句话结论)
2. Action checklist with progress (行动清单)
3. Source citations with document references (来源依据)
4. Copyable template text (可复制模板)
5. Next step suggestions linking to other tasks (下一步建议)

---

## Tech Stack

- HTML / CSS / Vanilla JavaScript
- No framework, no build system, no bundler
- React loaded via CDN only for `tweaks.jsx` and `tweaks-panel.jsx` (visual theme overlay, non-core)

**Entry file:** `project/智谱书院 AI Portal.html`

**Do NOT:**
- Convert to React / Vue / Svelte
- Add Vite, Webpack, or any bundler
- Add TypeScript or Tailwind
- Add GSAP, three.js, or WebGL
- Add package.json or npm dependencies (unless for deployment only)
- Connect real APIs or Feishu

---

## File Map

### Core files (modify these)
| File | Purpose |
|------|---------|
| `project/styles.css` | CSS variables (colors, spacing, radius, shadows) |
| `project/workspace.css` | Three-column layout, sidebar, task launcher, responsive |
| `project/panel.css` | Right Answer Panel styles |
| `project/workspace.js` | Core logic: task click, answer render, copy, reveal animation |
| `project/data.js` | Task content for both roles (visitor + student) |
| `project/icons.js` | SVG icon definitions |

### Secondary files (avoid modifying unless needed)
| File | Purpose |
|------|---------|
| `project/tasks.css` | Task card specific styles |
| `project/hero.css` | Center area header styles |
| `project/polish.css` | Visual polish overrides |
| `project/refine.css` | Additional refinement overrides |
| `project/extras.css` | Extra style tweaks |
| `project/themes.css` | Theme variables |
| `project/footer.css` | Footer styles |

### Legacy files (do not use, may contain dead code)
| File | Purpose |
|------|---------|
| `project/cockpit.css` | Old Hero Orb / glowing sphere — NOT USED |
| `project/tweaks.jsx` | React visual tweaks overlay — non-core |
| `project/tweaks-panel.jsx` | React panel tweaks — non-core |
| `project/app.js` | Legacy app logic — mostly superseded by workspace.js |

### Assets
| Path | Purpose |
|------|---------|
| `project/assets/zai-dark.svg` | Brand logo (dark version) |
| `project/assets/zai-light.svg` | Brand logo (light version) |
| `project/uploads/` | Screenshot references — do not modify |

---

## Page Structure

```
┌──────────┬─────────────────┬──────────────────────────────┐
│ Sidebar  │ Task Launcher   │ AI Action Panel              │
│ 200px    │ ~360px          │ flex: 1 (primary area)       │
│          │                 │                              │
│ - Brand  │ - Title         │ - Question title             │
│ - Nav    │ - Description   │ - Meta (role, time, sources) │
│   (soon) │ - Search input  │ - § 1 Summary                │
│ - KB     │ - Task list ×5  │ - § 2 Action checklist       │
│   sources│                 │ - § 3 Source citations        │
│ - User   │                 │ - § 4 Copy template          │
│          │                 │ - § 5 Next steps             │
└──────────┴─────────────────┴──────────────────────────────┘
```

**Weight ratio:** 15% / 30% / 55% — right panel is the visual and functional hero.

---

## Visual Direction

**Style:** Light-mode precision tool (Linear / Raycast inspired)

**Current CSS tokens** (in `styles.css`):
- Page background: `#FAFAF7` (warm off-white)
- Sidebar: `#F4F5F1`
- Surface: `#FFFFFF`
- Text: `#1F241F` → `#5F685E` → `#8A9288` → `#B6BDB3`
- Accent: `#1F8F5F` (muted green, status only)
- Border: `#E6E8E1` / `#DADDD3`

**Design principles:**
- Green is status color only (progress, checkmarks, active indicators)
- Minimal borders — use background color difference instead
- Typography hierarchy through size and weight, not color
- Right panel should feel like a document, not a settings page
- Task launcher should feel like a command palette, not a table

**Forbidden:**
- Dark mode / dark backgrounds
- Purple, blue, or bright gradients
- Glowing effects, particles, WebGL
- Glass morphism
- Hero Orb (legacy, in cockpit.css — do not re-enable)
- Game-like UI or targeting elements
- Large decorative elements

---

## Core Logic Reference

**Role state:** `workspace.js` line 6 — `currentRole = "student"` (hardcoded)

**Task rendering:** `renderTaskList()` — generates sidebar task list from `window.TASKS[currentRole]`

**Task click:** `openTask(id)` — sets `currentTaskId`, calls `renderAnswer()`, syncs active states

**Answer rendering:** `renderAnswer()` (lines ~200-286) — builds the 5-section structured output

**Empty/idle state:** `showEmpty()` (lines ~84-198) — shows welcome state when no task selected

**Copy template:** Inside `renderAnswer()` — clipboard API + "已复制" feedback

**Stagger reveal:** Answer sections animate in sequence (80ms base + 120ms stagger)

**Data structure:** `data.js` exports `window.TASKS` with two keys: `visitor` (5 tasks) and `student` (5 tasks). Each task has: `id`, `num`, `title`, `desc`, `tag`, `tagColor`, `time`, `answer` object.

---

## Content Rules

**Do NOT modify** unless explicitly asked:
- Task titles and descriptions in `data.js`
- Answer panel content (summaries, checklists, citations, templates)
- Source document references
- Template text

**Can modify:**
- CSS classes and styles
- HTML structure (if needed for layout)
- JS interaction logic
- DOM rendering approach

---

## Interaction Checklist

These interactions must work at all times:
- [ ] Clicking a sidebar task updates the right panel
- [ ] Active task shows visual indicator (highlight / left border)
- [ ] Answer panel sections stagger-reveal on task switch
- [ ] Checklist items show done/current/pending states
- [ ] Progress bar reflects completion percentage
- [ ] Copy button copies template text and shows "已复制"
- [ ] Source citations show document title, section, and type tag
- [ ] Next step suggestions are clickable and switch to that task
- [ ] Search input has focus state with border highlight
- [ ] Sidebar "soon" items are visible but not interactive

---

## Deployment

**Target:** Vercel (static site)

**Requirements:**
- `vercel.json` in project root with `"outputDirectory": "project"`
- `project/index.html` — copy of `智谱书院 AI Portal.html` (avoids URL encoding issues)
- No build step needed

---

## After Every Change

Report:
1. Which files were modified
2. Whether any data.js content was changed (should be NO)
3. Whether any dependency was added (should be NO)
4. How to verify in browser
5. Any remaining issues

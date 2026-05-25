// ===== Workspace 3-column app logic =====
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  let currentRole = "visitor";
  let currentTaskId = null;

  function tasks() { return window.TASKS[currentRole]; }

  const NEXT_TASK_MAP = {
    v1: ["v2", "v3"], v2: ["v3", "v5"], v3: ["v4", "v5"],
    v4: ["v5", "v1"], v5: ["v2", "v3"],
    s1: ["s2", "s4"], s2: ["s3", "s4"], s3: ["s2", "s5"],
    s4: ["s1", "s5"], s5: ["s1", "s4"]
  };

  function getNextTasks(id) {
    const ids = NEXT_TASK_MAP[id] || [];
    const all = tasks();
    const found = ids.map(nid => all.find(t => t.id === nid)).filter(Boolean);
    return found.length >= 2 ? found : all.slice(0, 2);
  }

  function syncActiveTaskState() {
    $$(".ws-task").forEach(li => {
      const isActive = li.dataset.taskId === currentTaskId;
      li.classList.toggle("is-active", isActive);
      li.setAttribute("aria-current", isActive ? "true" : "false");
    });

    $$(".ws-quick-card").forEach(card => {
      const isActive = card.dataset.taskId === currentTaskId;
      card.classList.toggle("is-active", isActive);
      card.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  }

  // -------- Sidebar task list --------
  function renderTaskList() {
    const list = $("#wsTaskList");
    const t = tasks();
    list.innerHTML = t.map((task, i) => `
      <li
        class="ws-task ${task.id === currentTaskId ? "is-active" : ""}"
        data-task-id="${task.id}"
        role="button"
        tabindex="0"
        aria-current="${task.id === currentTaskId ? "true" : "false"}"
      >
        <span class="num">${task.num}</span>
        <div class="body">
          <p class="t">${task.title}</p>
          <p class="d">${task.desc}</p>
        </div>
        ${i === 0 ? '<span class="badge">起点</span>' : ""}
      </li>
    `).join("");
    list.querySelectorAll(".ws-task").forEach(li => {
      const activate = () => openTask(li.dataset.taskId);
      li.addEventListener("click", activate);
      li.addEventListener("keydown", e => {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        activate();
      });
    });
    $("#wsTaskLabel").textContent =
      currentRole === "student" ? "推荐任务 · 新同学" : "推荐任务 · 外部访客";
    $("#wsTaskCount").textContent = String(t.length).padStart(2, "0");
    $("#crumbRole").textContent = currentRole === "student" ? "新同学" : "外部访客";
  }

  // -------- Main 2x2 quick grid (first 4 tasks) --------
  function renderQuickGrid() {
    const grid = $("#wsQuickGrid");
    const four = tasks().slice(0, 4);
    grid.innerHTML = four.map((t, i) => `
      <button
        class="ws-quick-card ${i === 0 ? "is-start" : ""} ${t.id === currentTaskId ? "is-active" : ""}"
        data-task-id="${t.id}"
        type="button"
        aria-pressed="${t.id === currentTaskId ? "true" : "false"}"
      >
        <div class="qc-head">
          <span class="qc-num">${t.num} / 05</span>
          <span>${t.meta[1]}</span>
        </div>
        <h4 class="qc-title">${t.title}</h4>
        <p class="qc-desc">${t.desc}</p>
        <div class="qc-foot">
          <span class="qc-meta">${t.meta[0]}</span>
          <span class="arr">生成回答 →</span>
        </div>
      </button>
    `).join("");
    grid.querySelectorAll(".ws-quick-card").forEach(c => {
      c.addEventListener("click", () => openTask(c.dataset.taskId));
    });
    $("#wsQuickSub").textContent =
      currentRole === "student" ? "新同学 · 最常打开的 4 个" : "外部访客 · 最常打开的 4 个";
  }

  // -------- Identity switch --------
  function bindIdentity() {
    $$(".ws-id").forEach(btn => {
      btn.addEventListener("click", () => {
        const role = btn.dataset.role;
        if (role === currentRole) return;
        currentRole = role;
        currentTaskId = null;
        $$(".ws-id").forEach(b => b.classList.toggle("active", b === btn));
        renderTaskList();
        renderQuickGrid();
        showEmpty();
      });
    });
  }

  // -------- Answer Panel rendering --------
  function openTask(id) {
    const task = tasks().find(t => t.id === id);
    if (!task) return;
    currentTaskId = id;
    syncActiveTaskState();
    renderAnswer(task);
  }

  function showEmpty() {
    currentTaskId = null;
    syncActiveTaskState();
    $("#crumbTask").textContent = "Academy Assistant";
    const role = currentRole === "student" ? "新同学" : "外部访客";
    const recent = currentRole === "student"
      ? [
          { id: "s1", title: "入院第一周要做什么？", time: "刚刚", tag: "Onboarding" },
          { id: "s3", title: "请假会影响补贴吗？",   time: "12 min", tag: "补贴" },
          { id: "s4", title: "如何和 Mentor 沟通？", time: "1 h",   tag: "Mentor" }
        ]
      : [
          { id: "v1", title: "书院是什么？",          time: "刚刚",  tag: "认知" },
          { id: "v3", title: "培养体系如何设计？",     time: "8 min", tag: "体系" },
          { id: "v5", title: "如何加入或关注后续信息？", time: "32 min", tag: "行动" }
        ];
    const suggest = currentRole === "student"
      ? [
          { id: "s5", title: "查看学员 FAQ · 找谁求助", kind: "FAQ" },
          { id: "s4", title: "生成 Mentor 沟通模板",    kind: "模板" }
        ]
      : [
          { id: "v2", title: "查看人才画像 · 是否适合",  kind: "FAQ" },
          { id: "v4", title: "了解导师与研究方向",      kind: "体系" }
        ];
    const sources = [
      { t: "学员 FAQ", d: "新同学频道置顶", k: "FAQ" },
      { t: "出勤与请假规则", d: "制度文档 §3.2 / §4.1", k: "制度" },
      { t: "Mentor 机制", d: "1:1 议程 + SLA", k: "机制" },
      { t: "培养体系", d: "M1 / M2 / M3 / M4", k: "体系" }
    ];

    $("#panelBody").innerHTML = `
      <div class="asst-panel">
        <header class="asst-head">
          <div class="asst-head-row">
            <div class="asst-title-wrap">
              <span class="asst-eyebrow"><span class="dot"></span>${role} · 当前会话</span>
              <h3 class="asst-title">Academy Assistant</h3>
            </div>
          </div>
          <div class="asst-search">
            <svg viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
            <input type="text" id="asstSearch" placeholder="搜索任务或直接提问…" autocomplete="off" />
            <kbd>⏎</kbd>
          </div>
        </header>

        <section class="asst-section">
          <div class="asst-section-head">
            <h5>Recent Tasks · 最近任务</h5>
            <span class="asst-count">${recent.length}</span>
          </div>
          <ul class="asst-list">
            ${recent.map(r => `
              <li class="asst-row" data-task-id="${r.id}">
                <span class="asst-row-dot"></span>
                <div class="asst-row-body">
                  <p class="asst-row-t">${r.title}</p>
                  <p class="asst-row-d"><span class="asst-tag">${r.tag}</span><span>${r.time} · 已生成结构化回答</span></p>
                </div>
                <span class="asst-row-arr">↗</span>
              </li>
            `).join("")}
          </ul>
        </section>

        <section class="asst-section">
          <div class="asst-section-head">
            <h5>Suggested Next · 建议下一步</h5>
          </div>
          <ul class="asst-chips">
            ${suggest.map(s => `
              <li class="asst-chip" data-task-id="${s.id}">
                <span class="asst-chip-kind">${s.kind}</span>
                <span class="asst-chip-t">${s.title}</span>
                <span class="asst-chip-arr">→</span>
              </li>
            `).join("")}
          </ul>
        </section>

        <section class="asst-section">
          <div class="asst-section-head">
            <h5>Knowledge Sources · 知识来源</h5>
            <span class="asst-count">${sources.length}</span>
          </div>
          <div class="asst-sources">
            ${sources.map(s => `
              <div class="src-card">
                <span class="src-card-kind src-kind-${s.k === "制度" ? "rule" : s.k === "FAQ" ? "faq" : "scheme"}">${s.k}</span>
                <div class="src-card-body">
                  <p class="src-card-t">${s.t}</p>
                  <p class="src-card-d">${s.d}</p>
                </div>
                <span class="src-card-ext">查看 ↗</span>
              </div>
            `).join("")}
          </div>
        </section>
      </div>
    `;
    $$("#panelBody .asst-row, #panelBody .asst-chip").forEach(el => {
      el.addEventListener("click", () => openTask(el.dataset.taskId));
    });
    const asstSearch = document.getElementById("asstSearch");
    asstSearch?.addEventListener("keydown", e => {
      if (e.key !== "Enter") return;
      const q = asstSearch.value.trim();
      if (!q) return;
      const all = tasks();
      const found = all.find(t => q.includes(t.title.slice(0, 3)) || t.title.includes(q)) || all[0];
      openTask(found.id);
    });
  }

  function renderAnswer(task) {
    const role = currentRole === "student" ? "新同学" : "外部访客";
    const numClass = currentRole === "student" ? "teal" : "";
    const { tldr, checklist, sources, template } = task;
    const nextTasks = getNextTasks(task.id);

    $("#crumbTask").textContent = task.title;
    $("#panelBody").innerHTML = `
      <h2 class="panel-q">${task.q}</h2>
      <div class="panel-q-meta">
        <span>${window.Icons.tag} ${role}</span>
        <span>${window.Icons.clock} 阅读约 ${task.meta[0]}</span>
        <span>${window.Icons.doc} 综合 ${sources.length} 份制度文档</span>
      </div>

      <div class="ans-block">
        <h4><span class="num ${numClass}">1</span>一句话结论</h4>
        <div class="tldr"><p>${tldr.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")}</p></div>
      </div>

      <div class="ans-block">
        <h4><span class="num ${numClass}">2</span>行动清单</h4>
        <ol class="checklist">
          ${checklist.map((c, i) => `
            <li>
              <span class="step">${String(i + 1).padStart(2, "0")}</span>
              <div class="body">
                <p class="t">${c.t}</p>
                <p class="d">${c.d}</p>
              </div>
            </li>
          `).join("")}
        </ol>
      </div>

      <div class="ans-block">
        <h4><span class="num ${numClass}">3</span>相关依据</h4>
        <div class="sources sources-cards">
          ${sources.map(s => {
            const kindMap = { rule: "制度", doc: "制度", faq: "FAQ", book: "培养体系" };
            const kindClass = { rule: "rule", doc: "rule", faq: "faq", book: "scheme" };
            const kind = kindMap[s.icon] || "制度";
            const kc = kindClass[s.icon] || "rule";
            return `
              <a href="#" onclick="event.preventDefault()" class="src-card">
                <span class="src-card-kind src-kind-${kc}">${kind}</span>
                <span class="src-card-body">
                  <span class="src-card-t">${s.t}</span>
                  <span class="src-card-d">${s.d}</span>
                </span>
                <span class="src-card-ext">查看来源 ↗</span>
              </a>
            `;
          }).join("")}
        </div>
      </div>

      <div class="ans-block">
        <h4><span class="num ${numClass}">4</span>可复制模板</h4>
        <div class="template">
          <div class="template-head">
            <span class="label">${window.Icons.share}<span class="who">${template.who}</span></span>
            <button class="copy-btn" id="copyBtn">
              ${window.Icons.copy}
              <span>复制</span>
            </button>
          </div>
          <div class="template-body" id="templateBody">${template.body}</div>
        </div>
      </div>

      <div class="ans-block">
        <h4><span class="num ${numClass}">5</span>下一步建议</h4>
        <p class="next-hint">完成当前任务后，建议继续推进：</p>
        <div class="next-step-list">
          ${nextTasks.map(nt => `
            <button class="next-step-card" type="button" data-task-id="${nt.id}">
              <span class="next-step-icon" aria-hidden="true">↗</span>
              <span>${nt.title}</span>
            </button>
          `).join("")}
        </div>
      </div>
    `;
    const blocks = $$(".ans-block", $("#panelBody"));
    blocks.forEach((b, i) => setTimeout(() => b.classList.add("reveal"), 80 + i * 120));

    $$(".next-step-card", $("#panelBody")).forEach(btn => {
      btn.addEventListener("click", () => openTask(btn.dataset.taskId));
    });

    $("#copyBtn")?.addEventListener("click", () => {
      const raw = $("#templateBody").innerText;
      navigator.clipboard?.writeText(raw).catch(() => {});
      const btn = $("#copyBtn");
      btn.classList.add("copied");
      btn.querySelector("span").textContent = "已复制";
      btn.querySelector("svg").outerHTML = window.Icons.check;
      setTimeout(() => {
        btn.classList.remove("copied");
        btn.querySelector("span").textContent = "复制";
        btn.querySelector("svg").outerHTML = window.Icons.copy;
      }, 1500);
    });
  }

  // -------- AI input → match top result --------
  function bindInput() {
    const input = $("#aiInput");
    let i = 0, charIdx = 0, phase = "type";
    function tick() {
      if (document.activeElement === input) {
        input.placeholder = window.PLACEHOLDERS[i];
        setTimeout(tick, 800);
        return;
      }
      const target = window.PLACEHOLDERS[i];
      if (phase === "type") {
        charIdx++;
        input.placeholder = target.slice(0, charIdx);
        if (charIdx >= target.length) { phase = "hold"; setTimeout(tick, 1800); return; }
        setTimeout(tick, 38 + Math.random() * 30);
      } else if (phase === "hold") {
        phase = "erase"; setTimeout(tick, 50);
      } else {
        charIdx -= 2;
        if (charIdx <= 0) { charIdx = 0; i = (i + 1) % window.PLACEHOLDERS.length; phase = "type"; }
        input.placeholder = target.slice(0, Math.max(0, charIdx));
        setTimeout(tick, 18);
      }
    }
    tick();

    input.addEventListener("keydown", e => {
      if (e.key !== "Enter") return;
      const q = input.value.trim();
      if (!q) return;
      // naive match: pick the task whose title best matches
      const all = tasks();
      const found = all.find(t => q.includes(t.title.slice(0, 4))) || all[0];
      openTask(found.id);
      input.value = "";
    });
  }

  function bindKeys() {
    document.addEventListener("keydown", e => {
      if (e.target.tagName === "INPUT") return;
      if (e.key === "1") $$(".ws-id")[0]?.click();
      if (e.key === "2") $$(".ws-id")[1]?.click();
      if (e.key === "Escape") showEmpty();
    });
    $("#panelClear")?.addEventListener("click", showEmpty);
  }

  document.addEventListener("DOMContentLoaded", () => {
    $$("[data-icon]").forEach(el => {
      el.innerHTML = window.Icons[el.dataset.icon] || "";
    });
    renderTaskList();
    renderQuickGrid();
    showEmpty();
    bindIdentity();
    bindInput();
    bindKeys();
  });
})();

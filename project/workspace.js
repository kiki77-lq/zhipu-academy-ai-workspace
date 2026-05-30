// ===== Workspace 3-column app logic =====
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  let currentRole = "student";
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

  function escapeAttr(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
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
    list.innerHTML = t.map((task, i) => {
      const tags = task.tags || [];
      const tagsHTML = tags.length
        ? `<div class="task-tags">${tags.map(tag => `<span class="task-tag">${tag}</span>`).join("")}</div>`
        : "";
      return `
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
          ${tagsHTML}
        </div>
        ${i === 0 ? '<span class="badge">起点</span>' : ""}
      </li>
    `;
    }).join("");
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
      currentRole === "student" ? "推荐任务 · 当前阶段" : "推荐任务 · 外部访客";
    $("#wsTaskCount").textContent = String(t.length).padStart(2, "0");
    $("#crumbRole").textContent = "Academy AI";
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
    $("#crumbTask").textContent = "Assistant";
    window.Chatbot?.show();
  }

  function renderAnswer(task) {
    const role = currentRole === "student" ? "新同学" : "外部访客";
    const numClass = currentRole === "student" ? "teal" : "";
    const { tldr, checklist, sources, template } = task;
    const nextTasks = getNextTasks(task.id);
    const checklistTotal = checklist.length;
    const checklistDone = 0;
    const checklistProgress = 0;

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
        <div class="check-progress" aria-label="行动清单进度">
          <div class="check-progress-meta">
            <span>已完成 ${checklistDone} / ${checklistTotal}</span>
            <span>${checklistProgress}%</span>
          </div>
          <div class="check-progress-bar" aria-hidden="true">
            <span class="check-progress-fill" style="width: ${checklistProgress}%"></span>
          </div>
        </div>
        <ol class="checklist">
          ${checklist.map((c, i) => {
            const title = c.t;
            return `
            <li class="action-step-row" data-step-title="${escapeAttr(title)}">
              <button class="action-checkbox" type="button" aria-pressed="false" aria-label="标记完成：${escapeAttr(title)}">
                <span aria-hidden="true"></span>
              </button>
              <div class="body">
                <p class="t">${c.t}</p>
                <p class="d">${c.d}</p>
              </div>
              <button class="action-followup" type="button" data-step-title="${escapeAttr(title)}">追问</button>
            </li>`;
          }).join("")}
        </ol>
      </div>

      <div class="ans-block">
        <h4><span class="num ${numClass}">3</span>相关依据</h4>
        <div class="sources sources-cards">
          ${sources.map(s => {
            const typeMap   = { doc: "制度依据", rule: "管理规定", faq: "FAQ", book: "培养体系" };
            const actionMap = { doc: "查看原文", rule: "查看规则", faq: "引用依据", book: "查看章节" };
            const noteMap   = { doc: "制度文档引用", rule: "规章执行依据", faq: "FAQ 解答参考", book: "体系说明参考" };
            const kindClass = { doc: "rule", rule: "rule", faq: "faq", book: "scheme" };
            const kind   = typeMap[s.icon]   || "知识库";
            const action = actionMap[s.icon] || "查看原文";
            const note   = noteMap[s.icon]   || "相关制度片段";
            const kc     = kindClass[s.icon] || "rule";
            const path   = s.d || "飞书知识库 / 智谱书院";
            const title  = s.t || "制度文档";
            return `
              <a href="#" onclick="event.preventDefault()" class="src-card src-cite">
                <div class="src-card-body">
                  <div class="src-cite-top">
                    <span class="src-card-kind src-kind-${kc}">${kind}</span>
                    <p class="src-card-t">${title}</p>
                  </div>
                  <p class="src-cite-meta">
                    <span class="src-cite-path">${path}</span>
                    <span class="src-cite-sep" aria-hidden="true">·</span>
                    <span class="src-cite-note">${note}</span>
                  </p>
                </div>
                <span class="src-card-action">${action} ↗</span>
              </a>
            `;
          }).join("")}
        </div>
      </div>

      <div class="ans-block">
        <h4><span class="num ${numClass}">4</span>可复制模板</h4>
        <div class="template template-block">
          <div class="template-head template-block-head">
            <span class="label template-block-label">${window.Icons.share}<span>可复制模板</span><span class="who">${template.who}</span></span>
            <button class="copy-btn template-block-copy" id="copyBtn" type="button">
              ${window.Icons.copy}
              <span>复制</span>
            </button>
          </div>
          <div class="template-body template-block-content" id="templateBody">${template.body}</div>
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

      <div class="panel-followup-entry">
        <button class="panel-followup-btn" type="button" data-task-title="${task.title}">
          💬 就「${task.title}」继续追问
        </button>
      </div>
    `;
    const blocks = $$(".ans-block", $("#panelBody"));
    blocks.forEach((b, i) => setTimeout(() => b.classList.add("reveal"), 80 + i * 120));

    $$(".next-step-card", $("#panelBody")).forEach(btn => {
      btn.addEventListener("click", () => openTask(btn.dataset.taskId));
    });

    const refreshChecklistProgress = () => {
      const rows = $$(".action-step-row", $("#panelBody"));
      const done = rows.filter(row => row.classList.contains("is-completed")).length;
      const total = rows.length;
      const progress = total > 0 ? Math.round((done / total) * 100) : 0;
      const meta = $(".check-progress-meta", $("#panelBody"));
      const fill = $(".check-progress-fill", $("#panelBody"));
      if (meta) {
        meta.innerHTML = `<span>已完成 ${done} / ${total}</span><span>${progress}%</span>`;
      }
      if (fill) fill.style.width = `${progress}%`;
    };

    $$(".action-step-row", $("#panelBody")).forEach(row => {
      const checkbox = $(".action-checkbox", row);
      checkbox?.addEventListener("click", event => {
        event.stopPropagation();
        const completed = !row.classList.contains("is-completed");
        row.classList.toggle("is-completed", completed);
        checkbox.setAttribute("aria-pressed", completed ? "true" : "false");
        refreshChecklistProgress();
      });
    });

    $$(".action-followup", $("#panelBody")).forEach(btn => {
      btn.addEventListener("click", event => {
        event.stopPropagation();
        const title = btn.dataset.stepTitle;
        if (!title || !window.Chatbot?.start) return;
        window.Chatbot.start(`关于「${title}」，我具体应该怎么做？`);
      });
    });

    $("#panelBody .panel-followup-btn")?.addEventListener("click", () => {
      const title = $("#panelBody .panel-followup-btn").dataset.taskTitle;
      if (!title || !window.Chatbot?.start) return;
      currentTaskId = null;
      syncActiveTaskState();
      window.Chatbot.start(`关于「${title}」，我想进一步了解...`);
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
      }, 1200);
    });
  }

  // -------- AI input → match top result --------
  function bindInput() {
    const input = $("#aiInput");
    if (!input) {
      console.warn("[Workspace] #aiInput not found");
      return;
    }
    input.placeholder = "搜索任务…";

    function handleAskInput() {
      const q = input.value.trim();
      console.log("[Workspace] input submit:", q);
      if (!q) return;

      const all = tasks();
      const found = all.find(t => q.includes(t.title.slice(0, 4)));

      if (found) {
        openTask(found.id);
      } else if (window.Chatbot?.start) {
        console.log("[Workspace] fallback to chatbot:", q);
        currentTaskId = null;
        syncActiveTaskState();
        window.Chatbot.start(q);
      } else {
        console.warn("[Workspace] window.Chatbot undefined");
      }

      input.value = "";
    }

    input.addEventListener("keydown", e => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      handleAskInput();
    });

    const sendBtn = $(".ws-cmd-send");
    if (sendBtn) {
      sendBtn.addEventListener("click", handleAskInput);
    }
  }

  function bindKeys() {
    document.addEventListener("keydown", e => {
      if (e.target.tagName === "INPUT") return;
      if (e.key === "1") $$(".ws-id")[0]?.click();
      if (e.key === "2") $$(".ws-id")[1]?.click();
      if (e.key === "Escape") showEmpty();
    });
    $("#panelClear")?.addEventListener("click", () => {
      if (window.Chatbot?.clear) window.Chatbot.clear();
      showEmpty();
    });
  }

  function bindSidebar() {
    $$(".sb-group-label.is-collapsible").forEach(btn => {
      btn.addEventListener("click", () => {
        const key = btn.dataset.toggle;
        const body = document.querySelector(`[data-body="${key}"]`);
        if (!body) return;
        btn.classList.toggle("is-collapsed");
        body.classList.toggle("is-collapsed");
      });
    });

    const homeNav = document.querySelector('.sb-menu-item[data-action="home"]');
    const taskNav = document.querySelector('.sb-menu-item[data-action="scroll-to-tasks"]');
    const mainCol = document.querySelector(".ws-main");

    const setActive = target => {
      $$(".sb-menu-item.is-active").forEach(el => el.classList.remove("is-active"));
      target.classList.add("is-active");
    };

    if (homeNav) {
      homeNav.addEventListener("click", e => {
        e.preventDefault();
        setActive(homeNav);
        mainCol?.scrollTo({ top: 0, behavior: "smooth" });
      });
    }

    if (taskNav) {
      taskNav.addEventListener("click", e => {
        e.preventDefault();
        setActive(taskNav);
        const section = document.querySelector(".ws-launcher") || document.querySelector("#wsTaskList");
        section?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

    const focusActions = {
      "prework-week": { question: "先修第三周我应该重点做什么？" },
      mentor: { title: "如何和 Mentor 沟通？", question: "如何和 Mentor 沟通？" },
      "prework-task": { title: "入院第一周要做什么？", question: "入院第一周要做什么？" },
      attendance: { title: "出勤和打卡怎么处理？", question: "出勤和打卡怎么处理？" }
    };

    const askAssistant = question => {
      if (!question || !window.Chatbot?.start) return;
      currentTaskId = null;
      syncActiveTaskState();
      window.Chatbot.start(question);
    };

    $$("[data-focus-action]").forEach(item => {
      const activate = () => {
        const config = focusActions[item.dataset.focusAction];
        if (!config) return;

        item.classList.add("is-triggered");
        setTimeout(() => item.classList.remove("is-triggered"), 700);

        if (config.title) {
          const matchedTask = tasks().find(task => task.title === config.title);
          if (matchedTask) {
            openTask(matchedTask.id);
            return;
          }
        }

        askAssistant(config.question);
      };

      item.addEventListener("click", activate);
      item.addEventListener("keydown", e => {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        activate();
      });
    });
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
    bindSidebar();
  });
})();

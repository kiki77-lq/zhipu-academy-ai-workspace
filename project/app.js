// ===== App logic for Zhipu Academy AI Portal =====
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  let currentRole = "visitor";
  let currentTask = null;

  // ---------- Render task cards ----------
  function renderTasks(role, animate = true) {
    const grid = $("#taskGrid");
    const tasks = window.TASKS[role];
    grid.classList.toggle("is-student", role === "student");

    if (animate) {
      grid.classList.add("is-leaving");
      setTimeout(() => {
        grid.classList.remove("is-leaving");
        grid.innerHTML = tasks.map(taskCardHtml).join("");
        bindTaskCards();
        // Identity switch: re-stagger immediately (already in viewport)
        revealCardsStaggered($$(".task-card", grid));
      }, 200);
    } else {
      grid.innerHTML = tasks.map(taskCardHtml).join("");
      bindTaskCards();
      observeReveal();
    }

    const pill = $("#rolePill");
    pill.classList.toggle("is-student", role === "student");
    pill.querySelector(".role-label").textContent =
      role === "student" ? "新同学视角" : "外部访客视角";

    $("#taskHeading").textContent =
      role === "student" ? "入院后高频任务" : "建立认知的高频任务";
    $("#taskSubtitle").textContent =
      role === "student"
        ? "AI 已根据制度文档为你结构化整理，点击任意卡片获取行动清单。"
        : "AI 已为你梳理外部访客最常关心的 5 个问题，点击查看结构化回答。";
  }

  function taskCardHtml(t) {
    const studentClass = currentRole === "student" ? "is-student" : "";
    const iconKey = currentRole === "student" ? "student" : "visitor";
    const isStart = t.num === "01";
    return `
      <button class="task-card ${studentClass} ${isStart ? "is-start" : ""}" data-task-id="${t.id}">
        <span class="corner tl"></span><span class="corner tr"></span>
        <span class="corner bl"></span><span class="corner br"></span>
        ${isStart ? '<span class="start-badge">★ 推荐起点</span>' : ""}
        <div class="head">
          <span class="num">${t.num} / 05</span>
          <span class="ico">${window.Icons[iconKey]}</span>
        </div>
        <h3>${t.title}</h3>
        <p class="task-desc">${t.desc}</p>
        <div class="foot">
          <div class="meta">
            <span>${window.Icons.clock} ${t.meta[0]}</span>
            <span>${window.Icons.tag} ${t.meta[1]}</span>
          </div>
          <span class="arr">${window.Icons.arrow}</span>
        </div>
      </button>
    `;
  }

  function bindTaskCards() {
    $$(".task-card").forEach(c => {
      c.classList.add("reveal-card");
      c.addEventListener("click", () => {
        const id = c.dataset.taskId;
        const task = window.TASKS[currentRole].find(t => t.id === id);
        openPanel(task);
      });
    });
  }

  // ---------- Stagger reveal helpers ----------
  function revealCardsStaggered(cards) {
    cards.forEach((card, i) => {
      card.classList.remove("is-visible");
      setTimeout(() => card.classList.add("is-visible"), 60 + i * 80);
    });
  }

  let _revealObserver = null;
  function observeReveal() {
    const grid = $("#taskGrid");
    if (!grid) return;
    if (_revealObserver) _revealObserver.disconnect();
    _revealObserver = new IntersectionObserver((entries, obs) => {
      const visible = entries.filter(e => e.isIntersecting).map(e => e.target);
      if (visible.length === 0) return;
      // Order by DOM position so stagger is left-to-right top-to-bottom
      const all = $$(".task-card", grid);
      const ordered = all.filter(c => visible.includes(c));
      revealCardsStaggered(ordered);
      ordered.forEach(c => obs.unobserve(c));
    }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
    $$(".task-card", grid).forEach(c => _revealObserver.observe(c));
  }

  // ---------- Identity selector ----------
  function bindIdentity() {
    $$(".id-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const role = btn.dataset.role;
        if (role === currentRole) return;
        currentRole = role;
        $$(".id-btn").forEach(b => b.classList.toggle("active", b === btn));
        renderTasks(role, true);
      });
    });
  }

  // ---------- Placeholder rotation ----------
  function bindPlaceholderRotator() {
    const input = $("#aiInput");
    let i = 0;
    let typed = "";
    let phase = "type";
    let charIdx = 0;
    const target = () => window.PLACEHOLDERS[i];
    function tick() {
      if (document.activeElement === input) {
        // pause animation while focused
        input.placeholder = target();
        setTimeout(tick, 800);
        return;
      }
      if (phase === "type") {
        charIdx++;
        typed = target().slice(0, charIdx);
        input.placeholder = typed;
        if (charIdx >= target().length) {
          phase = "hold";
          setTimeout(tick, 1800);
          return;
        }
        setTimeout(tick, 38 + Math.random() * 30);
      } else if (phase === "hold") {
        phase = "erase";
        setTimeout(tick, 50);
      } else if (phase === "erase") {
        charIdx -= 2;
        if (charIdx <= 0) {
          charIdx = 0;
          i = (i + 1) % window.PLACEHOLDERS.length;
          phase = "type";
        }
        typed = target().slice(0, charIdx);
        input.placeholder = typed;
        setTimeout(tick, 18);
      }
    }
    tick();
  }

  // ---------- Answer Panel ----------
  function openPanel(task) {
    currentTask = task;
    const panel = $("#panel");
    const scrim = $("#scrim");
    renderPanel(task);
    requestAnimationFrame(() => {
      panel.classList.add("open");
      scrim.classList.add("open");
      // Stagger ans-blocks after the panel begins sliding in
      const blocks = $$(".ans-block", panel);
      blocks.forEach(b => b.classList.remove("reveal"));
      blocks.forEach((b, i) => {
        setTimeout(() => b.classList.add("reveal"), 220 + i * 120);
      });
    });
  }
  function closePanel() {
    $("#panel").classList.remove("open");
    $("#scrim").classList.remove("open");
  }

  function renderPanel(task) {
    const role = currentRole === "student" ? "新同学" : "外部访客";
    const numClass = currentRole === "student" ? "teal" : "";

    const tldr = task.tldr;
    const checklist = task.checklist;
    const sources = task.sources;
    const template = task.template;

    $("#panelBody").innerHTML = `
      <div class="crumb-mini" style="display:none"></div>
      <h2 class="panel-q">${task.q}</h2>
      <div class="panel-q-meta">
        <span>${window.Icons.tag} ${role} · ${task.meta[1]}</span>
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
        <div class="sources">
          ${sources.map(s => `
            <a href="#" onclick="event.preventDefault()">
              <span class="src-icon">${window.Icons[s.icon] || window.Icons.doc}</span>
              <span class="src-meta">
                <div class="t">${s.t}</div>
                <div class="d">${s.d}</div>
              </span>
              <span class="ext">${window.Icons.ext}</span>
            </a>
          `).join("")}
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
    `;

    $("#crumbTask").textContent = task.title;
    $("#crumbRole").textContent = role;

    // bind copy
    $("#copyBtn").addEventListener("click", () => {
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
      }, 1800);
    });
  }

  // ---------- Wire panel close ----------
  function bindPanel() {
    $("#scrim").addEventListener("click", closePanel);
    $("#panelClose").addEventListener("click", closePanel);
    document.addEventListener("keydown", e => {
      if (e.key === "Escape") closePanel();
    });
  }

  // ---------- AI input quick chips ----------
  function bindChips() {
    $$("[data-target]").forEach(c => {
      // skip the task-card buttons themselves
      if (c.classList.contains("task-card")) return;
      c.addEventListener("click", () => {
        const id = c.dataset.target;
        const all = [...window.TASKS.visitor, ...window.TASKS.student];
        const task = all.find(t => t.id === id);
        if (!task) return;
        const role = window.TASKS.student.includes(task) ? "student" : "visitor";
        if (role !== currentRole) {
          currentRole = role;
          $$(".id-btn").forEach(b =>
            b.classList.toggle("active", b.dataset.role === role)
          );
          renderTasks(role, false);
        }
        openPanel(task);
      });
    });
  }

  // ---------- Init ----------
  document.addEventListener("DOMContentLoaded", () => {
    // inject all SVG icon refs
    $$("[data-icon]").forEach(el => {
      el.innerHTML = window.Icons[el.dataset.icon] || "";
    });
    renderTasks(currentRole, false);
    bindIdentity();
    bindPanel();
    bindPlaceholderRotator();
    bindChips();
  });
})();

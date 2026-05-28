// ===== Academy AI Chatbot — GLM-4 streaming chat =====
// This module handles the "Chat state" of the right Answer Panel.
// It does NOT touch the existing Task state or Idle state.

window.Chatbot = (function () {
  console.log('[Chatbot] loaded');

  // ---- State ----
  const HISTORY_KEY = 'academy-ai-conversation-history';
  const MAX_HISTORY_MESSAGES = 10;
  let conversationHistory = loadHistory(); // persisted {role: 'user'|'assistant', content: string}
  let messages = conversationHistory.slice(); // current panel render state
  let isStreaming = false;
  let abortController = null;

  // ---- Reasoning animation state ----
  const REASONING_STEPS = [
    '🔍 正在查阅书院资料...',
    '📄 匹配相关制度文档...',
    '✅ 生成回答中...'
  ];
  let reasoningStep = -1; // -1 = not active; 0/1/2 = current step index
  let reasoningTimers = [];

  // ---- Follow-up placeholder hints (prefix added at render time) ----
  const PLACEHOLDER_HINTS = [
    '先修阶段都学什么？',
    '补贴什么时候发？',
    '如何约 Mentor 做 1:1？',
    '请假需要走什么流程？',
    '考核标准是什么？',
    '忘记打卡怎么办？',
  ];

  function randomPlaceholder() {
    return PLACEHOLDER_HINTS[Math.floor(Math.random() * PLACEHOLDER_HINTS.length)];
  }

  // ---- Generate contextual follow-up suggestions from AI response ----
  function generateFollowUps(content) {
    if (!content || content.length < 40) return [];
    const rules = [
      { keywords: ['补贴', '津贴', '薪资', '工资'], suggestions: ['补贴什么时候发？', '请假怎么扣补贴？'] },
      { keywords: ['请假', '病假', '事假'], suggestions: ['请假需要什么材料？', '请假会影响考核吗？'] },
      { keywords: ['打卡', '出勤', '考勤'], suggestions: ['忘记打卡怎么办？', '远程办公怎么算出勤？'] },
      { keywords: ['mentor', '导师', '指导'], suggestions: ['Mentor 多久联系一次？', '可以换 Mentor 吗？'] },
      { keywords: ['课程', '培养', '先修', '模块'], suggestions: ['课程考核标准是什么？', '先修阶段多长时间？'] },
      { keywords: ['转组', '退出', '终止'], suggestions: ['转组流程需要多久？', '退出后还能回来吗？'] },
      { keywords: ['入职', '入院', '第一周', '报到'], suggestions: ['入职需要带什么材料？', '第一天去哪里报到？'] },
    ];
    const lc = content.toLowerCase();
    for (const rule of rules) {
      if (rule.keywords.some(k => lc.includes(k))) return rule.suggestions;
    }
    return ['入院第一周要做什么？', '书院的培养体系是什么？'];
  }

  // ---- DOM refs ----
  const $ = (s, r = document) => r.querySelector(s);
  const panelBody = () => $('#panelBody');

  function normalizeMessages(items) {
    if (!Array.isArray(items)) return [];
    return items
      .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .map(m => ({ role: m.role, content: m.content.trim() }))
      .filter(m => m.content);
  }

  function loadHistory() {
    try {
      return normalizeMessages(JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'));
    } catch (e) {
      console.warn('[Chatbot] failed to load history:', e);
      return [];
    }
  }

  function saveHistory() {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(conversationHistory));
    } catch (e) {
      console.warn('[Chatbot] failed to save history:', e);
    }
  }

  function appendHistory(role, content) {
    const clean = typeof content === 'string' ? content.trim() : '';
    if (!clean) return;
    conversationHistory.push({ role, content: clean });
    saveHistory();
  }

  function recentHistory() {
    return normalizeMessages(conversationHistory).slice(-MAX_HISTORY_MESSAGES);
  }

  // ---- Markdown-lite: convert **bold**, `code`, and newlines ----
  function md(text) {
    return text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }

  // ---- Update reasoning step classes without full re-render ----
  function updateReasoning() {
    const container = document.querySelector('.chat-reasoning');
    if (!container) return;
    container.querySelectorAll('.chat-reasoning-step').forEach((el, i) => {
      el.className = 'chat-reasoning-step';
      if (i < reasoningStep) el.classList.add('is-done');
      else if (i === reasoningStep) el.classList.add('is-active');
    });
  }

  // ---- Render the full chat UI into the panel ----
  function render() {
    const pb = panelBody();
    if (!pb) return;

    // Welcome state — no messages yet
    if (messages.length === 0) {
      pb.innerHTML = `
        <div class="chat-container">
          <div class="chat-messages" id="chatMessages">
            <div class="chat-welcome">
              <div class="chat-welcome-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
                </svg>
              </div>
              <div class="chat-welcome-title">Hi，我是书院 AI 助手</div>
              <div class="chat-welcome-desc">我可以帮你查询入院、请假、补贴、Mentor 沟通等问题</div>
              <div class="chat-suggestions">
                <button class="chat-suggestion-btn" data-question="请假会影响补贴吗？">请假会影响补贴吗？</button>
                <button class="chat-suggestion-btn" data-question="入院第一周要做什么？">入院第一周该做什么？</button>
                <button class="chat-suggestion-btn" data-question="如何和 Mentor 沟通？">怎么和 Mentor 沟通？</button>
                <button class="chat-suggestion-btn" data-question="出勤打卡规则是什么？">出勤打卡规则是什么？</button>
              </div>
            </div>
          </div>
        </div>`;
      pb.querySelectorAll('.chat-suggestion-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const q = btn.dataset.question;
          if (q && !isStreaming) send(q);
        });
      });
      return;
    }

    const msgsHTML = messages.map((m, i) => {
      const isUser = m.role === 'user';
      const isLast = i === messages.length - 1;

      // Don't render the empty assistant placeholder — reasoning card covers this
      if (!isUser && isStreaming && isLast && !m.content) return '';

      const bubbleContent = isUser
        ? md(m.content)
        : md(m.content) + (isStreaming && isLast ? '<span class="chat-cursor"></span>' : '');

      let actionsHTML = '';
      if (!isUser && m.content && !(isStreaming && isLast)) {
        const followUps = generateFollowUps(m.content);
        actionsHTML = `
          <div class="chat-response-footer">
            <div class="chat-response-meta">
              <span class="chat-source-tag">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                来源：书院知识库
              </span>
              <button class="chat-action-btn" data-copy-idx="${i}" title="复制">
                <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                <span>复制</span>
              </button>
            </div>
            ${followUps.length > 0 ? `
              <div class="chat-followups">
                ${followUps.map(q => `<button class="chat-followup-btn" data-question="${q}">${q}</button>`).join('')}
              </div>` : ''}
          </div>`;
      }

      return `
        <div class="chat-msg ${isUser ? 'is-user' : 'is-ai'}">
          <span class="chat-msg-label">${isUser ? '你' : 'Academy AI'}</span>
          <div class="chat-bubble">${bubbleContent}</div>
          ${actionsHTML}
        </div>`;
    }).join('');

    // Reasoning card (standalone — shown when streaming hasn't produced content yet)
    const lastMsg = messages[messages.length - 1];
    const showTyping = isStreaming && lastMsg && lastMsg.role === 'assistant' && !lastMsg.content;
    const typingHTML = showTyping ? `
      <div class="chat-reasoning">
        ${REASONING_STEPS.map(s => `<div class="chat-reasoning-step">${s}</div>`).join('')}
      </div>` : '';

    pb.innerHTML = `
      <div class="chat-container">
        <div class="chat-messages" id="chatMessages">
          ${msgsHTML}
          ${typingHTML}
        </div>
        <div class="chat-input-bar">
          <input type="text" id="chatFollowUp" placeholder="试试问：${randomPlaceholder()}" ${isStreaming ? 'disabled' : ''} autocomplete="off" />
          <button id="chatSendBtn" ${isStreaming ? 'disabled' : ''} aria-label="发送">
            <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </button>
        </div>
      </div>`;

    // Restore reasoning step classes after re-render
    if (reasoningStep >= 0) updateReasoning();

    // Scroll to bottom
    const msgBox = $('#chatMessages');
    if (msgBox) msgBox.scrollTop = msgBox.scrollHeight;

    // Bind follow-up input
    const input = $('#chatFollowUp');
    const sendBtn = $('#chatSendBtn');
    if (input) {
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          const q = input.value.trim();
          if (q && !isStreaming) send(q);
        }
      });
      if (!isStreaming) setTimeout(() => input.focus(), 50);
    }
    if (sendBtn) {
      sendBtn.addEventListener('click', () => {
        const q = input?.value.trim();
        if (q && !isStreaming) send(q);
      });
    }

    // Bind copy buttons
    pb.querySelectorAll('[data-copy-idx]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.copyIdx);
        const text = messages[idx]?.content;
        if (!text) return;
        navigator.clipboard?.writeText(text).catch(() => {});
        btn.classList.add('is-copied');
        btn.querySelector('span').textContent = '已复制';
        setTimeout(() => {
          btn.classList.remove('is-copied');
          btn.querySelector('span').textContent = '复制';
        }, 1500);
      });
    });

    // Bind follow-up suggestion buttons
    pb.querySelectorAll('.chat-followup-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const q = btn.dataset.question;
        if (q && !isStreaming) send(q);
      });
    });
  }

  // ---- Update only the last AI bubble (for streaming perf) ----
  function updateLastBubble(content) {
    const allAI = document.querySelectorAll('.chat-msg.is-ai .chat-bubble');
    const last = allAI[allAI.length - 1];
    if (last) {
      last.innerHTML = md(content) + '<span class="chat-cursor"></span>';
      const msgBox = $('#chatMessages');
      if (msgBox) msgBox.scrollTop = msgBox.scrollHeight;
    }
  }

  // ---- Send a message and stream the response ----
  async function send(userText) {
    if (isStreaming) return;

    // Update breadcrumb
    const crumbTask = $('#crumbTask');
    if (crumbTask) crumbTask.textContent = 'Ask Academy AI';

    // Add user message
    messages.push({ role: 'user', content: userText });
    appendHistory('user', userText);

    // Add empty assistant message (will be filled by stream)
    messages.push({ role: 'assistant', content: '' });

    isStreaming = true;
    render(); // Show user bubble + reasoning placeholder

    // Start reasoning animation
    reasoningTimers.forEach(t => clearTimeout(t));
    reasoningTimers = [];
    reasoningStep = 0;
    updateReasoning();
    reasoningTimers.push(setTimeout(() => { if (reasoningStep >= 0) { reasoningStep = 1; updateReasoning(); } }, 800));
    reasoningTimers.push(setTimeout(() => { if (reasoningStep >= 0) { reasoningStep = 2; updateReasoning(); } }, 1600));

    abortController = new AbortController();

    try {
      console.log('[Chatbot] fetch /api/chat');
      let completed = false;
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: recentHistory()
        }),
        signal: abortController.signal
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      // Read SSE stream
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let firstChunk = true;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;

          const data = trimmed.slice(5).trim();
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              const lastMsg = messages[messages.length - 1];
              lastMsg.content += parsed.content;

              // First chunk: clear reasoning animation, do full render
              if (firstChunk) {
                firstChunk = false;
                reasoningTimers.forEach(t => clearTimeout(t));
                reasoningTimers = [];
                reasoningStep = -1;
                render();
              } else {
                // Subsequent chunks: only update last bubble for performance
                updateLastBubble(lastMsg.content);
              }
            }
          } catch (e) {
            // Skip malformed chunks
          }
        }
      }
      completed = true;

      const lastMsg = messages[messages.length - 1];
      if (completed && lastMsg?.role === 'assistant' && lastMsg.content) {
        appendHistory('assistant', lastMsg.content);
      }
    } catch (err) {
      // Always clean up reasoning animation on any error or abort
      reasoningStep = -1;
      reasoningTimers.forEach(t => clearTimeout(t));
      reasoningTimers = [];

      if (err.name === 'AbortError') {
        // User cancelled — remove the pending empty assistant message
        const lastMsg = messages[messages.length - 1];
        if (lastMsg?.role === 'assistant' && !lastMsg.content) messages.pop();
      } else {
        console.error('Chat error:', err);
        const lastMsg = messages[messages.length - 1];
        if (!lastMsg.content) {
          messages.pop();
          messages.push({
            role: 'assistant',
            content: '⚠️ 网络异常，请稍后重试。如果持续出现问题，请联系班级助理刘祺。'
          });
        }
      }
    }

    isStreaming = false;
    abortController = null;
    render(); // Final render with copy buttons, remove cursor
  }

  // ---- Public API ----
  return {
    // Render the chat panel (shows welcome state if no messages)
    show() {
      render();
    },

    // Start a new chat with an initial question
    start(question) {
      console.log('[Chatbot] start called:', question);
      messages = conversationHistory.slice();
      isStreaming = false;
      if (abortController) {
        abortController.abort();
        abortController = null;
      }
      send(question);
    },

    // Check if chatbot is active
    isActive() {
      return messages.length > 0;
    },

    // Clear chat state
    clear() {
      messages = [];
      isStreaming = false;
      if (abortController) {
        abortController.abort();
        abortController = null;
      }
    },

    clearHistory() {
      conversationHistory = [];
      messages = [];
      isStreaming = false;
      if (abortController) {
        abortController.abort();
        abortController = null;
      }
      try {
        localStorage.removeItem(HISTORY_KEY);
      } catch (e) {
        console.warn('[Chatbot] failed to clear history:', e);
      }
    }
  };
})();

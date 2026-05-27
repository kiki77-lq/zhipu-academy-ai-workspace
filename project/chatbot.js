// ===== Academy AI Chatbot — GLM-4 streaming chat =====
// This module handles the "Chat state" of the right Answer Panel.
// It does NOT touch the existing Task state or Idle state.

window.Chatbot = (function () {
  console.log('[Chatbot] loaded');

  // ---- State ----
  let messages = []; // {role: 'user'|'assistant', content: string}
  let isStreaming = false;
  let abortController = null;

  // ---- DOM refs ----
  const $ = (s, r = document) => r.querySelector(s);
  const panelBody = () => $('#panelBody');

  // ---- Markdown-lite: convert **bold**, `code`, and newlines ----
  function md(text) {
    return text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }

  // ---- Render the full chat UI into the panel ----
  function render() {
    const pb = panelBody();
    if (!pb) return;

    const msgsHTML = messages.map((m, i) => {
      const isUser = m.role === 'user';
      const isLast = i === messages.length - 1;
      const bubbleContent = isUser ? md(m.content) : md(m.content) + (!isUser && isStreaming && isLast ? '<span class="chat-cursor"></span>' : '');

      let actionsHTML = '';
      if (!isUser && m.content && !(isStreaming && isLast)) {
        actionsHTML = `
          <div class="chat-actions">
            <button class="chat-action-btn" data-copy-idx="${i}" title="复制">
              <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
              <span>复制</span>
            </button>
          </div>`;
      }

      return `
        <div class="chat-msg ${isUser ? 'is-user' : 'is-ai'}">
          <span class="chat-msg-label">${isUser ? '你' : 'Academy AI'}</span>
          <div class="chat-bubble">${bubbleContent}</div>
          ${actionsHTML}
        </div>`;
    }).join('');

    // Typing indicator (shown when streaming hasn't produced content yet)
    const lastMsg = messages[messages.length - 1];
    const showTyping = isStreaming && lastMsg && lastMsg.role === 'assistant' && !lastMsg.content;
    const typingHTML = showTyping ? `
      <div class="chat-msg is-ai">
        <span class="chat-msg-label">Academy AI</span>
        <div class="chat-typing">
          <div class="chat-typing-dots"><span></span><span></span><span></span></div>
          <span>思考中</span>
        </div>
      </div>` : '';

    pb.innerHTML = `
      <div class="chat-container">
        <div class="chat-messages" id="chatMessages">
          ${msgsHTML}
          ${typingHTML}
        </div>
        <div class="chat-input-bar">
          <input type="text" id="chatFollowUp" placeholder="继续追问..." ${isStreaming ? 'disabled' : ''} autocomplete="off" />
          <button id="chatSendBtn" ${isStreaming ? 'disabled' : ''} aria-label="发送">
            <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </button>
        </div>
      </div>`;

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
      // Auto-focus follow-up input (only if not streaming)
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

    // Add empty assistant message (will be filled by stream)
    messages.push({ role: 'assistant', content: '' });

    isStreaming = true;
    render(); // Show user bubble + typing indicator

    abortController = new AbortController();

    try {
      console.log('[Chatbot] fetch /api/chat');
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages
            .filter(m => m.content) // Skip the empty assistant placeholder
            .map(m => ({ role: m.role, content: m.content }))
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

              // First chunk: do full render to remove typing indicator
              if (firstChunk) {
                firstChunk = false;
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
    } catch (err) {
      if (err.name === 'AbortError') {
        // User cancelled, do nothing
      } else {
        console.error('Chat error:', err);
        // Replace empty assistant message with error
        const lastMsg = messages[messages.length - 1];
        if (!lastMsg.content) {
          messages.pop(); // Remove empty assistant msg
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
    // Start a new chat with an initial question
    start(question) {
      console.log('[Chatbot] start called:', question);
      messages = [];
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
    }
  };
})();

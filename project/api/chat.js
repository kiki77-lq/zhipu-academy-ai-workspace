// Vercel Serverless Function — proxies chat to GLM-4 API
// API Key is read from Vercel environment variable GLM_API_KEY

const KNOWLEDGE_ID = '2059830220546011136';
const KNOWLEDGE_RETRIEVE_URL = 'https://open.bigmodel.cn/api/llm-application/open/knowledge/retrieve';
const MAX_KNOWLEDGE_CHUNKS = 5;
const MAX_CHUNK_CHARS = 900;

const SYSTEM_PROMPT = `你是「智谱书院 AI 助手」（Academy AI），服务于智谱书院的联培生（联合培养学生）。

## 你的身份
你是书院的 AI 工作台助手，帮助学生快速了解制度、流程和培养体系。你的语气像一个耐心、专业的学长/学姐。

## 知识使用方式
你会收到一段由智谱知识库检索得到的「知识库片段」。回答书院制度、培养体系、请假、补贴、Mentor 沟通等问题时，必须优先依据这些片段。
如果片段能回答问题，尽量给出「来源依据」，包括来源文档标题和相关段落摘要。
如果片段不足以回答，说明当前知识库片段未找到明确依据，再给出谨慎建议；不要编造不存在的制度、数字或联系人。

## 回答规则
1. 用中文回答
2. 重要信息用 **加粗** 标注。
3. 涉及具体数字（补贴、天数、电话）务必来自知识库片段或对话上下文。
4. 允许正常回应基础寒暄、连接测试和简单通用问题，例如"hi"、"你好"、"测试"。这类问题不要拒答，也不要建议联系书院老师或助理。
5. 如果用户问"今天周几"、"现在几点"等需要实时日期/时间的问题，说明"我无法实时获取当前日期/时间"，可以建议用户查看设备时间，但不要建议联系班级助理或何芸老师。
6. 对明显超出书院范围且较复杂的问题，礼貌说明你的主要范围是智谱书院制度、培养体系、请假、补贴、Mentor 沟通等；如果涉及书院具体执行口径不确定，再建议联系何芸老师（13910985933）或班级助理刘祺。
7. 回答后可以自然引导用户继续询问书院制度、培养体系、请假、补贴、Mentor 沟通等问题。
8. 回答控制在 300 字以内，简洁、可执行
9. 适当用列表让信息更清晰
10. 不要编造不存在的制度或数字`;

function normalizeMessages(messages) {
  return Array.isArray(messages)
    ? messages
        .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
        .map(m => ({ role: m.role, content: m.content.trim() }))
        .filter(m => m.content)
        .slice(-10)
    : [];
}

function latestUserQuestion(messages) {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') return messages[i].content;
  }
  return '';
}

function requestId() {
  return `academy-ai-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function truncateText(text, maxLength) {
  if (!text) return '';
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

function formatKnowledgeContext(chunks) {
  if (!chunks.length) {
    return '本次检索未返回可用知识库片段。';
  }

  return chunks.map((chunk, index) => {
    const meta = chunk.metadata || {};
    const title = meta.doc_name || '未命名文档';
    const url = meta.doc_url ? `\n文档链接：${meta.doc_url}` : '';
    const text = truncateText(chunk.text || meta.contextual_text || '', MAX_CHUNK_CHARS);
    const contextualText = meta.contextual_text && meta.contextual_text !== chunk.text
      ? `\n上下文摘要：${truncateText(meta.contextual_text, 260)}`
      : '';
    const score = typeof chunk.score === 'number' ? `\n相关度：${chunk.score.toFixed(4)}` : '';

    return `[${index + 1}] 来源文档：${title}${url}${score}${contextualText}\n片段：${text}`;
  }).join('\n\n');
}

async function retrieveKnowledge(apiKey, query) {
  if (!query) return [];

  const retrieveRes = await fetch(KNOWLEDGE_RETRIEVE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      query: truncateText(query, 1000),
      knowledge_ids: [KNOWLEDGE_ID],
      request_id: requestId(),
      top_k: MAX_KNOWLEDGE_CHUNKS,
      top_n: 12,
      recall_method: 'mixed',
      recall_ratio: 80,
      rerank_status: 1,
      rerank_model: 'rerank',
      fractional_threshold: 0.2
    })
  });

  if (!retrieveRes.ok) {
    const errText = await retrieveRes.text();
    throw new Error(`Knowledge retrieve error: ${retrieveRes.status} ${errText}`);
  }

  const payload = await retrieveRes.json();
  if (payload.code && payload.code !== 200) {
    throw new Error(`Knowledge retrieve error: ${payload.code} ${payload.message || ''}`);
  }

  return Array.isArray(payload.data) ? payload.data.slice(0, MAX_KNOWLEDGE_CHUNKS) : [];
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GLM_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GLM_API_KEY not configured' });
  }

  try {
    const { messages = [] } = req.body;
    const recentMessages = normalizeMessages(messages);
    const question = latestUserQuestion(recentMessages);
    const knowledgeChunks = await retrieveKnowledge(apiKey, question);
    const knowledgeContext = formatKnowledgeContext(knowledgeChunks);
    const ragPrompt = `${SYSTEM_PROMPT}

## 本次知识库检索
知识库 ID：${KNOWLEDGE_ID}

${knowledgeContext}`;

    // Prepend system prompt
    const fullMessages = [
      { role: 'system', content: ragPrompt },
      ...recentMessages // Keep last 10 messages to stay within token limit
    ];

    const glmRes = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'glm-4-plus',
        messages: fullMessages,
        max_tokens: 1024,
        temperature: 0.7,
        stream: true
      })
    });

    if (!glmRes.ok) {
      const errText = await glmRes.text();
      console.error('GLM API error:', glmRes.status, errText);
      return res.status(glmRes.status).json({ error: 'GLM API error', detail: errText });
    }

    // Stream SSE back to client
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = glmRes.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // Keep incomplete line in buffer

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;

        const data = trimmed.slice(5).trim();
        if (data === '[DONE]') {
          res.write('data: [DONE]\n\n');
          continue;
        }

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            res.write(`data: ${JSON.stringify({ content })}\n\n`);
          }
        } catch (e) {
          // Skip malformed chunks
        }
      }
    }

    res.end();
  } catch (err) {
    console.error('Handler error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.end();
    }
  }
}

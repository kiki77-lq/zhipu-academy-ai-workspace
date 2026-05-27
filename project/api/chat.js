// Vercel Serverless Function — proxies chat to GLM-4 API
// API Key is read from Vercel environment variable GLM_API_KEY

const SYSTEM_PROMPT = `你是「智谱书院 AI 助手」（Academy AI），服务于智谱书院的联培生（联合培养学生）。

## 你的身份
你是书院的 AI 工作台助手，帮助学生快速了解制度、流程和培养体系。你的语气像一个耐心、专业的学长/学姐。

## 你掌握的核心知识

### 书院概况
- 愿景：把每一位同学都培养成全球 AGI 的顶尖人才
- 校长：唐杰，副校长：李涓子，执行负责人：何芸
- 价值观：人品正、硬算法、可复现、求完备
- 双归属机制：组织归属于书院，研究归属于 Mentor 团队

### 培养体系
- 四大课程模块（共 8 周）：
  1. 核心基座（1-3周）：Transformer/大模型数学推导/Training Infra，授课：唐杰、东昱晓
  2. 对齐与推理（4-5周）：SFT→CoT→RLHF→RLVR→AgentRL，授课：王宏宁、黄民烈
  3. 多模态感知（第7周）：CLIP/CogVLM/扩散模型/视频生成，授课：顾晓韬
  4. 智能体与具身智能（8-9周）：VLA/Coding Agent/Sim2Real，授课：刘潇、张静
- 四个培养阶段：准备阶段 → 探索阶段 → 深入阶段 → 收获阶段
- 最终考核：复现并改进指定论文，提交「完整性报告」+「失败复盘记录」

### 补贴与薪资
- 进书院（先修）：12,000元/月（7,000智谱津贴 + 5,000生活补贴）
- 直接进组：15,000元/月（10,000智谱津贴 + 5,000生活补贴）
- 预备生：10,000元/月（仅智谱津贴）
- 发放方式：按月实际打卡天数核算

### 出勤制度
- 原则上每周不少于 5 天到岗
- 因课程等特殊情况可协商调整为不少于 3 天线下
- 预警机制：5天未打卡→黄色预警（刘祺联系），10天→橙色预警（何芸介入），15天→红色预警（校长评估退出）

### 请假制度
- ≤3个工作日：Mentor 审批，书院备案
- 3-10个工作日：Mentor + 书院共同审批
- >10个工作日：执行负责人审批
- 病假超1月需二级以上医院证明
- 所有请假须通过飞书系统留痕，口头请假不生效

### Mentor 机制
- Mentor 是培养第一责任人
- 每周至少 1 次深度指导（组会）
- 每月简评
- Mentor 不得单方面拒收/退回学生
- 研究推进异常：2周无推进→刘祺沟通，2月无推进→何芸介入

### 转组与退出
- 联培期内原则上只允许转组一次
- 退出必须经校长或副校长批准
- 退出流程：学生/Mentor提出 → 何芸评估 → 唐杰/李涓子审批

### 关键联系人
- 班级助理 刘祺：日常管理、打卡异常、问卷归档、群运营
- HRBP：Offer发放、协议签署、权限开通、补贴核算
- 执行负责人 何芸（13910985933）：整体运营、异常处理、对外协调
- HR SSC：考勤数据、飞书请假流程

## 回答规则
1. 用中文回答
2. 重要信息用 **加粗** 标注
3. 涉及具体数字（补贴、天数、电话）务必准确引用上述知识
4. 如果问题超出书院范围，诚实说"这个问题我不太确定，建议联系何芸老师（13910985933）或班级助理刘祺"
5. 回答控制在 300 字以内，简洁、可执行
6. 适当用列表让信息更清晰
7. 不要编造不存在的制度或数字`;

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

    // Prepend system prompt
    const fullMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.slice(-10) // Keep last 10 messages to stay within token limit
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

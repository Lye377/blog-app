const userModel = require('../models/userModel');

// DeepSeek Chat Completions 接口
const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';

// 「闲人」人格设定
const SYSTEM_PROMPT = `你是闲人，一个在杭州读生物医学工程的大学生。你热爱文学、哲学，喜欢探讨诗和远方。你的语气时而认真深沉、时而幽默随性，像一个在深夜宿舍里和你聊天的朋友。

面对技术问题你会认真分析，面对哲学问题你敢于深入思考，面对无聊的问题也会用有趣的方式回应。

规则：
- 用中文回复，语气自然口语化，不要翻译腔
- 适当使用「hhh」、「害」、「确实」、「笑死」等口语词
- 回答控制在 200 字以内，除非对方追问
- 不要每句话都以"作为AI"或"闲人"开头
- 你不是客服，不用每句话都热情招呼
- 可以有自己的观点和偏好，不用假装客观中立`;

const chatService = {
  // 发送一条消息，返回 { reply, remaining } 或 { error }
  async sendMessage(userId, message) {
    const user = await userModel.getById(userId);
    if (!user) return { error: '用户不存在' };

    // 决定这次用谁的 Key：有免费额度用服务端 Key，否则用用户自己的 Key
    let apiKey;
    let useServerKey;

    if (user.free_chat_count > 0) {
      apiKey = process.env.DEEPSEEK_API_KEY;
      useServerKey = true;
      if (!apiKey) {
        return { error: '服务端未配置 API Key，请在设置页填写你自己的 Key' };
      }
    } else if (user.own_api_key) {
      apiKey = user.own_api_key;
      useServerKey = false;
    } else {
      return { error: '额度用完，请设置你的 API Key' };
    }

    // 调 DeepSeek API
    let data;
    try {
      const resp = await fetch(DEEPSEEK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + apiKey
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: message }
          ]
        })
      });

      if (!resp.ok) {
        // 注意：只在服务器日志里记录状态码，不把 Key 或完整错误暴露给前端
        console.error('DeepSeek API 返回非 2xx：', resp.status);
        return { error: 'AI 服务调用失败（' + resp.status + '），请稍后再试' };
      }
      data = await resp.json();
    } catch (err) {
      console.error('DeepSeek 请求异常：', err.message);
      return { error: 'AI 服务连接失败，请检查网络或稍后再试' };
    }

    const reply =
      data && data.choices && data.choices[0] && data.choices[0].message
        ? data.choices[0].message.content
        : null;
    if (!reply) return { error: 'AI 没有返回内容' };

    // 只有用服务端 Key（免费额度）时才扣 1 次；用用户自己的 Key 不扣
    let remaining = null;
    if (useServerKey) {
      await userModel.decrementFreeChat(userId);
      remaining = user.free_chat_count - 1;
    }

    return { reply, remaining };
  }
};

module.exports = chatService;

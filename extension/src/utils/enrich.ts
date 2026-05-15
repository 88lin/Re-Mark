import { generateSignature } from './crypto';

type EnrichResponse = {
  success?: boolean;
  processed?: number;
  remaining?: number;
  completed?: boolean;
  batches?: number;
  timedOut?: boolean;
  failedCount?: number;
};

interface AiConfig {
  aiApiKey: string;
  aiApiUrl: string;
  aiModel: string;
  jinaApiKey: string;
}

export async function runEnrichStep(
  webUrl: string,
  apiSecret: string,
  aiConfig: AiConfig,
  resetFailed = false
): Promise<EnrichResponse> {
  const timestamp = Date.now().toString();
  const nonce = crypto.randomUUID();
  const payload = JSON.stringify({
    ...aiConfig,
    resetFailed
  });
  const signature = await generateSignature(payload, apiSecret);

  const response = await fetch(`${webUrl}/api/enrich`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-signature': signature,
      'x-timestamp': timestamp,
      'x-nonce': nonce
    },
    body: payload
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return (await response.json()) as EnrichResponse;
}

export async function testAiConnection(aiConfig: AiConfig): Promise<{ success: boolean; message: string }> {
  if (!aiConfig.aiApiKey || !aiConfig.aiApiUrl || !aiConfig.aiModel) {
    return { success: false, message: '请先填写 AI API Key、URL 和模型名称' };
  }

  try {
    const response = await fetch(aiConfig.aiApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${aiConfig.aiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: aiConfig.aiModel,
        messages: [{ role: 'user', content: '你好，请用一句话介绍你自己。' }],
        max_tokens: 50
      }),
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      return { success: false, message: `API 返回错误 ${response.status}: ${text.slice(0, 200)}` };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? '';
    return { success: true, message: `连接成功！模型回复: ${content.slice(0, 100)}` };
  } catch (err) {
    if (err instanceof Error && err.name === 'TimeoutError') {
      return { success: false, message: '连接超时，请检查 API URL 是否正确' };
    }
    return { success: false, message: err instanceof Error ? err.message : '未知错误' };
  }
}

import type { TarotAiProvider, TarotAiRequest } from './types';

type TarotAiProviderErrorCode =
  | 'missing_api_key'
  | 'timeout'
  | 'http_error'
  | 'invalid_response'
  | 'empty_response'
  | 'network_error';

type NayutoResponsesBody = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      text?: string;
    }>;
  }>;
};

type NayutoTarotProviderOptions = {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  timeoutMs?: number;
};

const defaultBaseUrl = 'https://api.nayutoai.online/v1';
const defaultModel = 'gpt-5.4-mini';

export class TarotAiProviderError extends Error {
  constructor(public readonly code: TarotAiProviderErrorCode) {
    super(code);
  }
}

export function createDefaultTarotAiProvider() {
  return createNayutoTarotProvider({
    apiKey: process.env.AI_API_KEY,
    baseUrl: process.env.AI_BASE_URL,
    model: process.env.AI_MODEL,
  });
}

export function createNayutoTarotProvider({
  apiKey,
  baseUrl = defaultBaseUrl,
  model = defaultModel,
  timeoutMs = 20_000,
}: NayutoTarotProviderOptions): TarotAiProvider {
  return {
    async generateReading(request) {
      if (!apiKey) {
        throw new TarotAiProviderError('missing_api_key');
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(`${baseUrl.replace(/\/$/, '')}/responses`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            input: buildPrompt(request),
            reasoning: { effort: 'medium' },
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new TarotAiProviderError('http_error');
        }

        const body = (await response.json()) as NayutoResponsesBody;
        const text = extractResponseText(body);

        if (!text) {
          throw new TarotAiProviderError('empty_response');
        }

        return text;
      } catch (error) {
        if (error instanceof TarotAiProviderError) {
          throw error;
        }

        if (error instanceof Error && error.name === 'AbortError') {
          throw new TarotAiProviderError('timeout');
        }

        throw new TarotAiProviderError('network_error');
      } finally {
        clearTimeout(timeout);
      }
    },

    async streamReading(request) {
      if (!apiKey) {
        throw new TarotAiProviderError('missing_api_key');
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(`${baseUrl.replace(/\/$/, '')}/responses`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            input: buildPrompt(request),
            reasoning: { effort: 'medium' },
            stream: true,
          }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          throw new TarotAiProviderError('http_error');
        }

        return response.body;
      } catch (error) {
        if (error instanceof TarotAiProviderError) {
          throw error;
        }

        if (error instanceof Error && error.name === 'AbortError') {
          throw new TarotAiProviderError('timeout');
        }

        throw new TarotAiProviderError('network_error');
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}

function buildPrompt({ spreadTitle, question, cards }: TarotAiRequest) {
  const cardLines = cards
    .map((card) => `- ${card.positionLabel}：「${card.romanIndex}」${card.cardNameCn}（${card.orientation === 'upright' ? '正位' : '逆位'}）`)
    .join('\n');

  return [
    '你是北斗镇寺庙里的温柔占卜师。请用中文回答。',
    '这是一次性的单轮解读，用户不会再向你发送下一条消息。你必须在这一条里把解读完整说完。',
    '绝对不要邀请用户继续讨论、继续提问、继续告诉你情况、之后再来找你，也不要使用“如果你愿意”“如果你还想”“如果你需要”“欢迎再来”“我们可以继续聊”等措辞。',
    '不要提出反问，不要给出继续互动的邀请，不要把结尾写成开放式对话。最后一句必须是收束性的落点。',
    '不要声称确定未来，不要提供医疗、法律或金融等专业结论。',
    `牌阵：${spreadTitle}`,
    `问题：${question}`,
    `抽到的牌：\n${cardLines}`,
    '输出必须使用 Markdown，并严格遵守以下结构，标题名称不得修改：',
    '## 问题回响',
    '用 2 到 3 句话回应用户此刻的处境，不要寒暄，不要空话。',
    '## 逐牌解读',
    '按抽牌顺序逐张解读。每张牌都要单独成段，并且每段第一行必须写成：位置：「罗马数字」牌名 正/逆位。随后再写 2 到 3 句解释。',
    '## 总结启示',
    '用 2 到 4 句话收束，给出凝练、具体、不过度命令式的提醒。最后一句必须封口，不得邀请继续交流。',
    '不要输出额外章节、附言、尾注、备注。',
  ].join('\n\n');
}

function extractResponseText(body: NayutoResponsesBody) {
  const outputText = body.output_text?.trim();

  if (outputText) {
    return outputText;
  }

  const nestedText = body.output
    ?.flatMap((item) => item.content ?? [])
    .map((content) => content.text)
    .filter((text): text is string => Boolean(text?.trim()))
    .join('\n')
    .trim();

  return nestedText ?? '';
}

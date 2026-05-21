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
  };
}

function buildPrompt({ question, cards }: TarotAiRequest) {
  const cardLines = cards
    .map((card) => `- ${card.position}：${card.name}（${card.orientation === 'upright' ? '正位' : '逆位'}），关键词：${card.meaning}`)
    .join('\n');

  return [
    '你是北斗镇寺庙里的温柔占卜师。请用中文回答。',
    '基于三张塔罗牌给出一段克制、诗意但实用的解读。不要声称确定未来，不要提供医疗、法律或金融等专业结论。',
    '输出使用 Markdown，包含：整体氛围、三张牌解读、给提问者的一点建议。',
    `问题：${question}`,
    `抽到的牌：\n${cardLines}`,
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

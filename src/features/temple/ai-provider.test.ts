import { afterEach, describe, expect, it, vi } from 'vitest';
import { createNayutoTarotProvider, TarotAiProviderError } from './ai-provider';
import type { TempleDrawnCardView } from './types';

const cards: TempleDrawnCardView[] = [
  {
    positionKey: 'past',
    positionLabel: '过去',
    revealOrder: 0,
    cardKey: 'the-star',
    cardNameCn: '星星',
    romanIndex: 'XVII',
    orientation: 'upright',
    imagePath: '/tarot/the-star.png',
  },
  {
    positionKey: 'present',
    positionLabel: '现在',
    revealOrder: 1,
    cardKey: 'the-moon',
    cardNameCn: '月亮',
    romanIndex: 'XVIII',
    orientation: 'reversed',
    imagePath: '/tarot/the-moon.png',
  },
  {
    positionKey: 'future',
    positionLabel: '未来',
    revealOrder: 2,
    cardKey: 'the-sun',
    cardNameCn: '太阳',
    romanIndex: 'XIX',
    orientation: 'upright',
    imagePath: '/tarot/the-sun.png',
  },
];

const request = {
  spreadSlug: 'classic-triangle' as const,
  spreadTitle: '三牌 · 经典圣三角',
  question: '我该如何面对明天？',
  cards,
};

describe('createNayutoTarotProvider', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('posts to NayutoAI responses endpoint with configured model', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ output_text: '星光会照亮你。' }), { status: 200 }),
    );
    const provider = createNayutoTarotProvider({ apiKey: 'test-key', timeoutMs: 1000 });

    await expect(provider.generateReading(request)).resolves.toBe('星光会照亮你。');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.nayutoai.online/v1/responses',
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: 'Bearer test-key',
          'Content-Type': 'application/json',
        },
      }),
    );
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toMatchObject({ model: 'gpt-5.4-mini' });
  });

  it('requests stream mode for streaming interpretation', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('data: [DONE]\n\n', { status: 200 }));
    const provider = createNayutoTarotProvider({ apiKey: 'test-key', timeoutMs: 1000 });

    const stream = await provider.streamReading?.(request);

    expect(stream).toBeInstanceOf(ReadableStream);
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toMatchObject({
      model: 'gpt-5.4-mini',
      stream: true,
    });
  });

  it('parses nested response text', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ output: [{ content: [{ text: '请慢慢来。' }] }] }), { status: 200 }),
    );
    const provider = createNayutoTarotProvider({ apiKey: 'test-key', timeoutMs: 1000 });

    await expect(provider.generateReading(request)).resolves.toBe('请慢慢来。');
  });

  it('throws typed error for missing api key without exposing secrets', async () => {
    const provider = createNayutoTarotProvider({ apiKey: '', timeoutMs: 1000 });

    await expect(provider.generateReading(request)).rejects.toMatchObject({ code: 'missing_api_key' });
    await expect(provider.generateReading(request)).rejects.not.toThrow('test-key');
  });

  it('throws typed error for non-2xx responses', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('bad', { status: 500 }));
    const provider = createNayutoTarotProvider({ apiKey: 'test-key', timeoutMs: 1000 });

    await expect(provider.generateReading(request)).rejects.toMatchObject({ code: 'http_error' });
  });

  it('throws typed error for empty responses', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ output_text: '' }), { status: 200 }));
    const provider = createNayutoTarotProvider({ apiKey: 'test-key', timeoutMs: 1000 });

    await expect(provider.generateReading(request)).rejects.toMatchObject({ code: 'empty_response' });
  });

  it('throws typed error for network failures', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'));
    const provider = createNayutoTarotProvider({ apiKey: 'test-key', timeoutMs: 1000 });

    await expect(provider.generateReading(request)).rejects.toMatchObject({ code: 'network_error' });
  });

  it('marks provider errors as safe typed errors', () => {
    expect(new TarotAiProviderError('http_error')).toBeInstanceOf(Error);
  });
});

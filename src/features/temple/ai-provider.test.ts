import { afterEach, describe, expect, it, vi } from 'vitest';
import { createNayutoTarotProvider, TarotAiProviderError } from './ai-provider';
import type { TarotDrawnCard } from './types';

const cards: TarotDrawnCard[] = [
  { name: '星星', arcana: 'major', orientation: 'upright', position: '过去', meaning: '希望' },
  { name: '月亮', arcana: 'major', orientation: 'reversed', position: '现在', meaning: '迷雾' },
  { name: '太阳', arcana: 'major', orientation: 'upright', position: '可能的方向', meaning: '明朗' },
];

const request = { question: '我该如何面对明天？', cards };

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
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toMatchObject({ model: 'openai/gpt-5.4-mini' });
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

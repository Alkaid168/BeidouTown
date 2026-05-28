import { NextResponse } from 'next/server';
import { createDefaultTarotAiProvider, TarotAiProviderError } from '@/features/temple/ai-provider';
import type { PreparedTarotReading } from '@/features/temple/types';

const encoder = new TextEncoder();

export async function POST(request: Request) {
  let prepared: PreparedTarotReading;

  try {
    prepared = (await request.json()) as PreparedTarotReading;
  } catch {
    return NextResponse.json({ error: '请求格式不正确。' }, { status: 400 });
  }

  if (!prepared?.spreadSlug || !prepared?.spreadTitle || !prepared?.question || !Array.isArray(prepared.cards)) {
    return NextResponse.json({ error: '缺少必要的占卜信息。' }, { status: 400 });
  }

  const provider = createDefaultTarotAiProvider();

  try {
    const upstream = await provider.streamReading?.({
      spreadSlug: prepared.spreadSlug,
      spreadTitle: prepared.spreadTitle,
      question: prepared.question,
      cards: prepared.cards,
    });

    if (!upstream) {
      return NextResponse.json({ error: '今晚雾太重，请稍后再来。' }, { status: 500 });
    }

    const reader = upstream.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    const stream = new ReadableStream<Uint8Array>({
      async pull(controller) {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            controller.close();
            return;
          }

          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split('\n\n');
          buffer = events.pop() ?? '';

          for (const event of events) {
            const lines = event.split('\n').filter((line) => line.startsWith('data:'));

            for (const line of lines) {
              const payload = line.slice(5).trim();

              if (!payload || payload === '[DONE]') {
                continue;
              }

              try {
                const parsed = JSON.parse(payload) as {
                  type?: string;
                  delta?: string;
                  output_text?: string;
                  item?: { content?: Array<{ text?: string }> };
                };

                const text =
                  parsed.delta ??
                  parsed.output_text ??
                  parsed.item?.content?.map((content) => content.text ?? '').join('') ??
                  '';

                if (text) {
                  controller.enqueue(encoder.encode(text));
                }
              } catch {
                continue;
              }
            }
          }
        }
      },
      cancel() {
        reader.cancel().catch(() => undefined);
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
      },
    });
  } catch (error) {
    const message = error instanceof TarotAiProviderError ? '今晚雾太重，请稍后再来。' : '今晚雾太重，请稍后再来。';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

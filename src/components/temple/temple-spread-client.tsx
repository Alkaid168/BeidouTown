'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, useTransition } from 'react';
import type { PrepareTempleReadingResult, PreparedTarotReading, TempleActionResult, TarotReadingView } from '@/features/temple/types';
import type { TempleSpreadDefinition } from '@/features/temple/spreads';
import { TempleCard } from './temple-card';
import { TempleInterpretation } from './temple-interpretation';
import { TempleSpreadLayout } from './temple-spread-layout';

type TemplePhase = 'idle' | 'drawing' | 'revealing' | 'interpreting' | 'complete';

export function TempleSpreadClient({
  spread,
  resident,
  initialReading,
  initialPreparedReading,
  prepareReading,
  finalizeReading,
}: {
  spread: TempleSpreadDefinition;
  resident: { id: string; name?: string | null; role: string } | null;
  initialReading?: TarotReadingView;
  initialPreparedReading?: PreparedTarotReading;
  prepareReading?: (formData: FormData) => Promise<PrepareTempleReadingResult>;
  finalizeReading?: (prepared: PreparedTarotReading) => Promise<TempleActionResult>;
}) {
  const [question, setQuestion] = useState(initialReading?.question ?? initialPreparedReading?.question ?? '');
  const [notice, setNotice] = useState<string | null>(null);
  const [preparedReading, setPreparedReading] = useState<PreparedTarotReading | null>(
    initialPreparedReading ??
      (initialReading
        ? {
            spreadSlug: initialReading.spreadSlug,
            spreadTitle: initialReading.spreadTitle,
            question: initialReading.question,
            cards: initialReading.cards,
          }
        : null),
  );
  const [finalReading, setFinalReading] = useState<TarotReadingView | null>(initialReading ?? null);
  const [streamingContent, setStreamingContent] = useState(initialReading?.reading ?? '');
  const [revealedCount, setRevealedCount] = useState(initialReading?.cards.length ?? 0);
  const [phase, setPhase] = useState<TemplePhase>(initialReading ? 'complete' : initialPreparedReading ? 'revealing' : 'idle');
  const [isPending, startTransition] = useTransition();

  const cards = useMemo(() => {
    return (preparedReading?.cards ?? []).map((card) => {
      const position = spread.positions.find((item) => item.key === card.positionKey);
      return {
        ...card,
        slot: position?.slot ?? 'center',
      };
    });
  }, [preparedReading?.cards, spread.positions]);

  useEffect(() => {
    if (phase !== 'interpreting' || !preparedReading || !finalizeReading) {
      return;
    }

    let cancelled = false;

    startTransition(async () => {
      setNotice(null);
      setStreamingContent('');

      try {
        const response = await fetch('/api/temple/interpretation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(preparedReading),
        });

        if (!response.ok || !response.body) {
          const body = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error ?? '今晚雾太重，请稍后再来。');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }

          accumulated += decoder.decode(value, { stream: true });
          if (!cancelled) {
            setStreamingContent(accumulated);
          }
        }

        if (cancelled) {
          return;
        }

        const result = await finalizeReading(preparedReading);
        if (!result.ok) {
          setNotice(result.error);
          setPhase('revealing');
          return;
        }

        setNotice(null);
        setFinalReading(result.reading);
        setStreamingContent(result.reading.reading);
        setQuestion(result.reading.question);
        setPreparedReading({
          spreadSlug: result.reading.spreadSlug,
          spreadTitle: result.reading.spreadTitle,
          question: result.reading.question,
          cards: result.reading.cards,
        });
        setPhase('complete');
      } catch (error) {
        if (cancelled) {
          return;
        }

        setNotice(error instanceof Error ? error.message : '今晚雾太重，请稍后再来。');
        setStreamingContent('');
        setPhase('revealing');
      }
    });

    return () => {
      cancelled = true;
    };
  }, [finalizeReading, phase, preparedReading, startTransition]);

  function handleReveal(index: number) {
    if (index !== revealedCount || phase !== 'revealing') {
      return;
    }

    const nextCount = revealedCount + 1;
    setRevealedCount(nextCount);

    if (cards.length > 0 && nextCount === cards.length) {
      setPhase('interpreting');
    }
  }

  function submitQuestion(formData: FormData) {
    if (!prepareReading) {
      return;
    }

    setPhase('drawing');
    startTransition(async () => {
      const result = await prepareReading(formData);
      if (!result.ok) {
        setNotice(result.error);
        setPhase('idle');
        return;
      }

      setNotice(null);
      setPreparedReading(result.prepared);
      setFinalReading(null);
      setStreamingContent('');
      setQuestion(result.prepared.question);
      setRevealedCount(0);
      setPhase('revealing');
    });
  }

  return (
    <div className="fixed inset-0 flex min-h-screen w-screen flex-col overflow-hidden px-4 py-6 sm:px-6 lg:px-10">
      <div className="mb-5 flex shrink-0 items-start justify-between gap-4 border-b border-white/10 pb-5 pointer-events-none">
        <div className="pointer-events-auto">
          <p className="text-xs tracking-[0.55em] text-amber-100/70">ORACLE RITUAL</p>
          <h1 className="mt-2 font-serif text-4xl font-semibold tracking-[0.18em] text-stone-50">{spread.title}</h1>
        </div>
        <div className="pointer-events-auto flex gap-5 text-right">
          <Link className="border-0 bg-transparent px-1 py-1 text-sm tracking-[0.45em] text-stone-100/58 transition duration-500 hover:text-white hover:drop-shadow-[0_0_14px_rgba(255,214,245,0.85)]" href="/temple">
            回到寺庙
          </Link>
        </div>
      </div>

      <div className="relative min-h-0 flex-1 overflow-y-auto rounded-[0.35rem] border border-[rgba(232,188,128,0.20)] bg-[linear-gradient(175deg,rgba(30,20,13,0.68),rgba(14,10,7,0.78))] px-6 py-6 shadow-[inset_0_1px_0_rgba(255,244,226,0.06),0_24px_56px_rgba(0,0,0,0.34)] backdrop-blur-[2px]">
        {resident ? (
          <>
            {!preparedReading ? (
              <form action={submitQuestion} className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-5">
                <input name="spreadSlug" type="hidden" value={spread.slug} />
                <textarea
                  className="min-h-40 w-full rounded-[0.35rem] border border-[rgba(232,188,128,0.24)] bg-[rgba(18,13,10,0.72)] px-5 py-4 text-center text-lg text-stone-100 outline-none placeholder:text-stone-300/38 focus:border-[rgba(255,214,156,0.46)]"
                  maxLength={300}
                  name="question"
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder="输入你的问题……"
                  required
                  value={question}
                />
                {notice ? <p className="rounded-xl border border-red-300/30 bg-red-950/40 p-3 text-sm text-red-100">{notice}</p> : null}
                <button className="group flex items-center justify-center rounded-[0.25rem] border border-[rgba(232,188,128,0.24)] bg-[rgba(255,244,226,0.10)] px-5 py-3 text-sm tracking-[0.28em] text-amber-50 transition duration-300 hover:border-[rgba(180,220,255,0.56)] hover:bg-[rgba(180,220,255,0.18)] hover:shadow-[0_0_30px_rgba(170,210,245,0.24)] disabled:opacity-30" disabled={isPending} type="submit">
                  {phase === 'drawing' ? '抽牌中…' : '开始占卜'}
                </button>
              </form>
            ) : (
              <>
                <TempleSpreadLayout
                  spreadSlug={spread.slug}
                  cards={cards.map((card, index) => ({
                    positionKey: card.positionKey,
                    positionLabel: card.positionLabel,
                    slot: card.slot,
                    content: (
                      <TempleCard
                        active={phase === 'revealing' && index === revealedCount}
                        cardNameCn={card.cardNameCn}
                        disabled={phase !== 'revealing' || index !== revealedCount}
                        imagePath={card.imagePath}
                        onReveal={() => handleReveal(index)}
                        orientation={card.orientation}
                        positionLabel={card.positionLabel}
                        revealed={index < revealedCount}
                        romanIndex={card.romanIndex}
                      />
                    ),
                  }))}
                />
                {notice ? <p className="mx-auto mt-6 max-w-2xl rounded-xl border border-red-300/30 bg-red-950/40 p-3 text-sm text-red-100">{notice}</p> : null}
                {phase === 'interpreting' ? <TempleInterpretation content={streamingContent} streaming /> : null}
                {phase === 'complete' && (finalReading || streamingContent) ? <TempleInterpretation content={finalReading?.reading ?? streamingContent} /> : null}
              </>
            )}
          </>
        ) : (
          <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 text-center">
            <p className="text-lg text-stone-100">寺庙需要居民身份。</p>
            <div className="flex gap-4">
              <Link className="border-0 bg-transparent px-1 py-1 text-sm tracking-[0.45em] text-stone-100/58 transition duration-500 hover:text-white" href="/login">登录</Link>
              <Link className="border-0 bg-transparent px-1 py-1 text-sm tracking-[0.45em] text-stone-100/58 transition duration-500 hover:text-white" href="/register">成为居民</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

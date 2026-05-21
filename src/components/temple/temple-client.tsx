'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { MarkdownMessage } from '@/components/tavern/markdown-message';
import type { CurrentResident } from '@/features/residents/session';
import { createTarotReadingAction } from '@/features/temple/actions';
import type { TarotReadingView, TempleActionResult } from '@/features/temple/types';

export function TempleClient({
  history,
  resident,
}: {
  history: TarotReadingView[];
  resident: CurrentResident | null;
}) {
  const router = useRouter();
  const [question, setQuestion] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [latestReading, setLatestReading] = useState<TarotReadingView | null>(null);
  const [isPending, startTransition] = useTransition();

  function runAction(action: () => Promise<TempleActionResult>) {
    startTransition(async () => {
      const result = await action();

      if (!result.ok) {
        setNotice(result.error);
        return;
      }

      setNotice(null);
      setLatestReading(result.reading);
      setQuestion('');
      router.refresh();
    });
  }

  const readings = latestReading ? [latestReading, ...history.filter((reading) => reading.id !== latestReading.id)] : history;

  return (
    <div className="grid min-h-[70vh] gap-6 lg:grid-cols-[1fr_22rem]">
      <section className="rounded-[2rem] border border-amber-100/15 bg-stone-100/[0.06] p-5 shadow-2xl shadow-indigo-950/40 backdrop-blur">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <p className="text-sm tracking-[0.35em] text-amber-200/80">TEMPLE</p>
            <h1 className="mt-2 text-4xl font-semibold text-stone-50">寺庙</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-400">抽取三张牌，让星光给出一段温柔的解读。占卜记录只对你自己可见。</p>
          </div>
          <Link className="rounded-full border border-stone-400/30 px-4 py-2 text-sm text-stone-200 transition hover:border-amber-200/60 hover:text-amber-100" href="/">
            回到镇口
          </Link>
        </div>

        <div className="mt-5 space-y-5">
          {readings.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-amber-100/20 p-8 text-center text-stone-400">寺庙的香还没有点燃。</p>
          ) : null}
          {readings.map((reading) => (
            <article className="rounded-2xl border border-white/10 bg-black/20 p-4" key={reading.id}>
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs tracking-[0.25em] text-amber-200/70">PRIVATE READING</p>
                  <h2 className="mt-2 text-lg font-medium text-stone-100">{reading.question}</h2>
                </div>
                <time className="shrink-0 text-sm text-stone-500">{new Date(reading.createdAt).toLocaleString('zh-CN')}</time>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {reading.cards.map((card) => (
                  <div className="rounded-2xl border border-amber-100/10 bg-stone-950/50 p-3" key={`${reading.id}-${card.position}`}>
                    <p className="text-xs text-stone-500">{card.position}</p>
                    <p className="mt-1 text-lg font-medium text-amber-100">{card.name}</p>
                    <p className="mt-1 text-xs text-stone-400">{card.orientation === 'upright' ? '正位' : '逆位'} · {card.meaning}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-stone-200">
                <MarkdownMessage content={reading.reading} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <aside className="rounded-[2rem] border border-amber-100/15 bg-stone-100/[0.06] p-5 shadow-2xl shadow-indigo-950/30 backdrop-blur">
        {resident ? (
          <form
            action={(formData) => {
              runAction(() => createTarotReadingAction(formData));
            }}
            className="space-y-4"
          >
            <div>
              <p className="text-sm text-amber-100">向星光提问</p>
              <p className="mt-1 text-xs leading-5 text-stone-500">最多 300 字。AI 解读仅供自我整理和娱乐参考。</p>
            </div>
            <textarea
              className="min-h-40 w-full rounded-2xl border border-stone-500/30 bg-black/30 px-4 py-3 text-stone-50 outline-none focus:border-amber-200/70"
              maxLength={300}
              name="question"
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="今晚想问什么？"
              required
              value={question}
            />
            {notice ? <p className="rounded-xl border border-red-300/30 bg-red-950/40 p-3 text-sm text-red-100">{notice}</p> : null}
            <button className="w-full rounded-xl bg-amber-200 px-4 py-3 font-medium text-slate-950 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60" disabled={isPending} type="submit">
              {isPending ? '洗牌中...' : '抽取星牌'}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <p className="text-lg font-medium text-stone-100">寺庙需要居民身份。</p>
            <p className="text-sm leading-6 text-stone-400">占卜记录只对本人可见，所以需要先登录。</p>
            <div className="grid gap-3">
              <Link className="block rounded-xl bg-amber-200 px-4 py-3 text-center font-medium text-slate-950 transition hover:bg-amber-100" href="/login">
                登录后占卜
              </Link>
              <Link className="block rounded-xl border border-stone-400/30 px-4 py-3 text-center font-medium text-stone-100 transition hover:border-amber-200/60 hover:text-amber-100" href="/register">
                成为居民
              </Link>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import type { CurrentResident } from '@/features/residents/session';
import { moderateTavernMessageAction, sendTavernMessageAction, withdrawTavernMessageAction } from '@/features/tavern/actions';
import type { TavernActionResult, TavernMessageView } from '@/features/tavern/types';
import { MarkdownMessage } from './markdown-message';

export function TavernClient({
  initialMessages,
  resident,
}: {
  initialMessages: TavernMessageView[];
  resident: CurrentResident | null;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [content, setContent] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const latestCreatedAt = useMemo(() => messages.at(-1)?.createdAt, [messages]);

  useEffect(() => {
    const interval = window.setInterval(async () => {
      const query = latestCreatedAt ? `?after=${encodeURIComponent(latestCreatedAt)}` : '';
      const response = await fetch(`/api/tavern/messages${query}`);

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as { messages: TavernMessageView[] };

      if (data.messages.length > 0) {
        setMessages((current) => {
          const existingIds = new Set(current.map((message) => message.id));
          const nextMessages = data.messages.filter((message) => !existingIds.has(message.id));
          return [...current, ...nextMessages];
        });
      }
    }, 3000);

    return () => window.clearInterval(interval);
  }, [latestCreatedAt]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  function runAction(action: () => Promise<TavernActionResult>) {
    startTransition(async () => {
      const result = await action();

      if (!result.ok) {
        setNotice(result.error);
        return;
      }

      setNotice(null);
      await refreshMessages();
    });
  }

  async function refreshMessages() {
    const response = await fetch('/api/tavern/messages');

    if (!response.ok) {
      return;
    }

    const data = (await response.json()) as { messages: TavernMessageView[] };
    setMessages(data.messages);
  }

  return (
    <div className="grid min-h-[70vh] gap-6 lg:grid-cols-[1fr_22rem]">
      <section className="rounded-[2rem] border border-amber-100/15 bg-stone-100/[0.06] p-5 shadow-2xl shadow-indigo-950/40 backdrop-blur">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <p className="text-sm tracking-[0.35em] text-amber-200/80">TAVERN</p>
            <h1 className="mt-2 text-4xl font-semibold text-stone-50">小酒馆</h1>
          </div>
          <Link className="rounded-full border border-stone-400/30 px-4 py-2 text-sm text-stone-200 transition hover:border-amber-200/60 hover:text-amber-100" href="/">
            回到镇口
          </Link>
        </div>

        <div className="mt-5 max-h-[58vh] space-y-4 overflow-y-auto pr-2">
          {messages.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-amber-100/20 p-8 text-center text-stone-400">今晚的小酒馆还很安静。</p>
          ) : null}
          {messages.map((message) => (
            <article className="rounded-2xl border border-white/10 bg-black/20 p-4" key={message.id}>
              <div className="mb-3 flex items-center justify-between gap-3 text-sm text-stone-400">
                <span className="text-stone-200">{message.author.nickname}</span>
                <time>{new Date(message.createdAt).toLocaleString('zh-CN')}</time>
              </div>
              {message.isDeleted ? (
                <p className="italic text-stone-500">这条消息已经离开了酒馆。</p>
              ) : (
                <div className="prose prose-invert max-w-none text-stone-200">
                  <MarkdownMessage content={message.content} />
                </div>
              )}
              {!message.isDeleted && (message.canWithdraw || message.canModerate) ? (
                <div className="mt-4 flex gap-2">
                  {message.canWithdraw ? (
                    <button
                      className="text-xs text-stone-400 underline underline-offset-4 hover:text-amber-100"
                      disabled={isPending}
                      onClick={() => {
                        const formData = new FormData();
                        formData.set('messageId', message.id);
                        runAction(() => withdrawTavernMessageAction(formData));
                      }}
                      type="button"
                    >
                      撤回
                    </button>
                  ) : null}
                  {message.canModerate ? (
                    <button
                      className="text-xs text-red-200 underline underline-offset-4 hover:text-red-100"
                      disabled={isPending}
                      onClick={() => {
                        const formData = new FormData();
                        formData.set('messageId', message.id);
                        runAction(() => moderateTavernMessageAction(formData));
                      }}
                      type="button"
                    >
                      管理删除
                    </button>
                  ) : null}
                </div>
              ) : null}
            </article>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </section>

      <aside className="rounded-[2rem] border border-amber-100/15 bg-stone-100/[0.06] p-5 shadow-2xl shadow-indigo-950/30 backdrop-blur">
        {resident ? (
          <form
            action={(formData) => {
              runAction(async () => {
                const result = await sendTavernMessageAction(formData);

                if (result.ok) {
                  setContent('');
                }

                return result;
              });
            }}
            className="space-y-4"
          >
            <div>
              <p className="text-sm text-amber-100">以 {resident.name ?? '居民'} 的身份发言</p>
              <p className="mt-1 text-xs text-stone-500">最多 500 字，每 10 秒一条。支持安全 Markdown。</p>
            </div>
            <textarea
              className="min-h-40 w-full rounded-2xl border border-stone-500/30 bg-black/30 px-4 py-3 text-stone-50 outline-none focus:border-amber-200/70"
              maxLength={500}
              name="content"
              onChange={(event) => setContent(event.target.value)}
              placeholder="今晚想说点什么？"
              required
              value={content}
            />
            {notice ? <p className="rounded-xl border border-red-300/30 bg-red-950/40 p-3 text-sm text-red-100">{notice}</p> : null}
            <button className="w-full rounded-xl bg-amber-200 px-4 py-3 font-medium text-slate-950 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60" disabled={isPending} type="submit">
              送到吧台
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <p className="text-lg font-medium text-stone-100">游客可以旁听。</p>
            <p className="text-sm leading-6 text-stone-400">想在小酒馆发言，需要先成为北斗镇居民。</p>
            <Link className="block rounded-xl bg-amber-200 px-4 py-3 text-center font-medium text-slate-950 transition hover:bg-amber-100" href="/login">
              登录后发言
            </Link>
          </div>
        )}
      </aside>
    </div>
  );
}

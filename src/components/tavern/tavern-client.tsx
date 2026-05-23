'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import type { CurrentResident } from '@/features/residents/session';
import { sendTavernMessageAction, withdrawTavernMessageAction } from '@/features/tavern/actions';
import type { TavernActionResult, TavernMessageView } from '@/features/tavern/types';
import { TavernContextMenu } from './tavern-context-menu';
import { TavernMessageItem } from './tavern-message-item';

const composerFont = '"ZCOOL XiaoWei", "LXGW WenKai", "KaiTi", "STKaiti", "Segoe UI", sans-serif';

type OpenMenuState = {
  message: TavernMessageView;
  x: number;
  y: number;
} | null;

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
  const [isLongText, setIsLongText] = useState(false);
  const [openMenu, setOpenMenu] = useState<OpenMenuState>(null);
  const messagesScrollRef = useRef<HTMLDivElement | null>(null);
  const composerInputRef = useRef<HTMLTextAreaElement | null>(null);
  const composerOverlayInputRef = useRef<HTMLTextAreaElement | null>(null);

  const latestCreatedAt = useMemo(() => messages.at(-1)?.createdAt, [messages]);

  useEffect(() => {
    const interval = window.setInterval(async () => {
      const query = latestCreatedAt ? `?after=${encodeURIComponent(latestCreatedAt)}` : '';
      const response = await fetch(`/api/tavern/messages${query}`);
      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as { messages: TavernMessageView[] };
      if (data.messages.length === 0) {
        return;
      }

      setMessages((current) => {
        const existingIds = new Set(current.map((message) => message.id));
        const nextMessages = data.messages.filter((message) => !existingIds.has(message.id));
        return [...current, ...nextMessages];
      });
    }, 3000);

    return () => window.clearInterval(interval);
  }, [latestCreatedAt]);

  useEffect(() => {
    if (!messagesScrollRef.current) {
      return;
    }

    if (typeof messagesScrollRef.current.scrollTo === 'function') {
      messagesScrollRef.current.scrollTo({ top: messagesScrollRef.current.scrollHeight, behavior: 'smooth' });
      return;
    }

    messagesScrollRef.current.scrollTop = messagesScrollRef.current.scrollHeight;
  }, [messages.length]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpenMenu(null);
      }
    }

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, []);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timeoutId = window.setTimeout(() => setNotice(null), 2200);
    return () => window.clearTimeout(timeoutId);
  }, [notice]);

  function runAction(action: () => Promise<TavernActionResult>) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setNotice(result.error);
        return;
      }

      setNotice(null);
      setOpenMenu(null);
      const refreshed = await refreshMessages();
      if (refreshed) {
        requestAnimationFrame(scrollToLatestMessage);
      }
    });
  }

  function scrollToLatestMessage() {
    if (!messagesScrollRef.current) {
      return;
    }

    if (typeof messagesScrollRef.current.scrollTo === 'function') {
      messagesScrollRef.current.scrollTo({ top: messagesScrollRef.current.scrollHeight, behavior: 'smooth' });
      return;
    }

    messagesScrollRef.current.scrollTop = messagesScrollRef.current.scrollHeight;
  }

  function submitComposer() {
    composerInputRef.current?.form?.requestSubmit();
  }

  async function refreshMessages() {
    const response = await fetch('/api/tavern/messages');
    if (!response.ok) {
      return false;
    }

    const data = (await response.json()) as { messages: TavernMessageView[] };
    setMessages(data.messages);
    return true;
  }


  return (
    <div className="fixed inset-0 flex min-h-screen w-screen flex-col overflow-hidden animate-[page-float-in_900ms_ease-out_both] px-4 py-6 sm:px-6 lg:px-10" data-testid="tavern-shell" onClick={() => setOpenMenu(null)}>
      <div className="mb-5 flex shrink-0 items-start justify-between gap-4 border-b border-white/10 pb-5 relative z-[80] pointer-events-none">
        <div className="pointer-events-auto">
          <p className="text-xs tracking-[0.55em] text-amber-100/70">TAVERN</p>
          <h1 className="mt-2 font-serif text-4xl font-semibold tracking-[0.18em] text-stone-50">小酒馆</h1>
        </div>
        <Link className="pointer-events-auto relative z-[90] border-0 bg-transparent px-1 py-1 text-sm tracking-[0.45em] text-stone-100/58 transition duration-500 hover:text-white hover:drop-shadow-[0_0_14px_rgba(255,214,245,0.85)]" href="/">
          回到镇口
        </Link>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden rounded-[0.35rem] border border-[rgba(232,188,128,0.20)] bg-[linear-gradient(175deg,rgba(30,20,13,0.68),rgba(14,10,7,0.78))] shadow-[inset_0_1px_0_rgba(255,244,226,0.06),0_24px_56px_rgba(0,0,0,0.34)] backdrop-blur-[2px]">
        <div className="absolute inset-x-0 top-0 z-10 h-20 bg-[linear-gradient(180deg,rgba(10,8,6,0.55),transparent)] pointer-events-none" />

        <div className="relative h-full overflow-y-auto px-6 pt-5" data-testid="tavern-messages-scroll" onScrollCapture={() => setOpenMenu(null)} ref={messagesScrollRef}>
          <div className="space-y-6 pb-40">
            {messages.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-[rgba(200,155,100,0.14)] bg-[rgba(36,24,17,0.22)] p-10 text-center text-sm tracking-[0.24em] text-amber-50/52 shadow-[inset_0_1px_0_rgba(255,244,226,0.02)]">今晚的小酒馆还很安静。</p>
            ) : null}

            {messages.map((message) => (
              <TavernMessageItem key={message.id} message={message} onContextMenu={(nextMessage, x, y) => setOpenMenu({ message: nextMessage, x, y })} />
            ))}
          </div>
        </div>

        <div className="pointer-events-none absolute right-6 top-6 z-30 flex flex-col items-end gap-2">
          {notice ? (
            <div className="animate-[tavern-composer-rise_220ms_ease-out_both] rounded-2xl border border-[rgba(200,155,100,0.18)] bg-[linear-gradient(175deg,rgba(44,32,22,0.90),rgba(22,16,12,0.94))] px-4 py-3 text-sm text-amber-50 shadow-[0_10px_28px_rgba(0,0,0,0.30)] backdrop-blur-md">
              先喝口茶，稍后再说。
            </div>
          ) : null}
        </div>

        <div className="absolute inset-x-0 bottom-0 z-20 border-t border-[rgba(232,188,128,0.24)] bg-[linear-gradient(175deg,rgba(64,44,30,0.90),rgba(26,18,13,0.96))] px-6 pb-5 pt-4 shadow-[0_-16px_40px_rgba(0,0,0,0.36),inset_0_1px_0_rgba(255,244,226,0.06)] backdrop-blur-lg" data-testid="tavern-composer">
          {resident ? (
            <form
              action={(formData) => {
                runAction(async () => {
                  const result = await sendTavernMessageAction(formData);
                  if (result.ok) {
                    setContent('');
                    setIsLongText(false);
                  }
                  return result;
                });
              }}
            >
              <div className="relative">
                <div
                  className={`absolute inset-x-0 bottom-full mb-3 origin-bottom rounded-[0.35rem] border border-[rgba(232,188,128,0.22)] bg-[linear-gradient(175deg,rgba(70,48,31,0.90),rgba(30,21,15,0.96))] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,244,226,0.08),0_-18px_42px_rgba(0,0,0,0.36)] backdrop-blur-xl transition duration-500 ${isLongText ? 'visible translate-y-0 opacity-100' : 'invisible translate-y-4 opacity-0'}`}
                  data-state={isLongText ? 'open' : 'closed'}
                  data-testid="tavern-composer-overlay"
                >
                  <textarea
                    className="h-[50vh] w-full resize-none bg-transparent text-amber-50 outline-none placeholder:text-amber-50/38"
                    maxLength={500}
                    name="content"
                    onChange={(event) => setContent(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && event.ctrlKey) {
                        event.preventDefault();
                        const nextValue = `${content}\n`;
                        setContent(nextValue);
                        return;
                      }

                      if (event.key === 'Enter' && !event.ctrlKey) {
                        event.preventDefault();
                        submitComposer();
                      }
                    }}
                    placeholder="说点什么..."
                    ref={composerOverlayInputRef}
                    style={{ fontFamily: composerFont }}
                    value={content}
                  />
                </div>

                <div className="flex items-end gap-3 rounded-[0.35rem] border border-[rgba(232,188,128,0.24)] bg-[linear-gradient(175deg,rgba(74,50,33,0.46),rgba(36,25,17,0.70))] px-3 py-3 shadow-[inset_0_1px_0_rgba(255,244,226,0.08),inset_0_-1px_0_rgba(0,0,0,0.28),0_8px_22px_rgba(0,0,0,0.28)] backdrop-blur-md">
                  <button
                    aria-label={isLongText ? '收起' : '展开长文本'}
                    className="group flex shrink-0 items-center justify-center rounded-[0.25rem] border border-[rgba(232,188,128,0.22)] bg-[rgba(255,244,226,0.08)] p-3 transition duration-300 hover:border-[rgba(255,214,156,0.46)] hover:bg-[rgba(255,224,176,0.16)] hover:shadow-[0_0_26px_rgba(232,188,128,0.22)]"
                    onClick={() => setIsLongText((value) => !value)}
                    type="button"
                  >
                    <svg aria-hidden="true" className="size-5 text-stone-300 transition group-hover:text-cyan-100" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
                      {isLongText ? (
                        <>
                          <path d="M8 7l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M8 13l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                        </>
                      ) : (
                        <>
                          <path d="M8 11l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M8 17l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
                        </>
                      )}
                    </svg>
                  </button>

                  <textarea
                    className={`w-full resize-none bg-transparent px-2 py-2 text-amber-50 outline-none placeholder:text-amber-50/38 ${isLongText ? 'opacity-0' : 'min-h-[3rem]'}`}
                    maxLength={500}
                    name="content"
                    onChange={(event) => setContent(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && event.ctrlKey) {
                        event.preventDefault();
                        const nextValue = `${content}\n`;
                        setContent(nextValue);
                        return;
                      }

                      if (event.key === 'Enter' && !event.ctrlKey) {
                        event.preventDefault();
                        submitComposer();
                      }
                    }}
                    placeholder="说点什么..."
                    ref={composerInputRef}
                    rows={1}
                    style={{ fontFamily: composerFont }}
                    value={content}
                  />

                  <button
                    aria-label="发送"
                    className="group flex shrink-0 items-center justify-center rounded-[0.25rem] border border-[rgba(232,188,128,0.24)] bg-[rgba(255,244,226,0.10)] p-3 transition duration-300 hover:border-[rgba(180,220,255,0.56)] hover:bg-[rgba(180,220,255,0.18)] hover:shadow-[0_0_30px_rgba(170,210,245,0.24)] disabled:opacity-30"
                    disabled={isPending}
                    type="submit"
                  >
                    <svg aria-hidden="true" className="size-5 text-stone-300 transition group-hover:text-cyan-100" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
                      <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>

            </form>
          ) : (
            <div className="flex flex-col items-center gap-4 py-4">
              <p className="text-sm tracking-[0.28em] text-stone-300">游客可以旁听。</p>
              <Link className="border-0 bg-transparent px-1 py-1 text-sm tracking-[0.45em] text-stone-100/58 transition duration-500 hover:text-white hover:drop-shadow-[0_0_14px_rgba(255,214,245,0.85)]" href="/login">
                登录后发言
              </Link>
            </div>
          )}
        </div>
      </div>

      {openMenu?.message.canWithdraw ? (
        <TavernContextMenu
          actions={[
            {
              key: 'withdraw',
              label: '撤回',
              tone: 'danger',
              onSelect: () => {
                const formData = new FormData();
                formData.set('messageId', openMenu.message.id);
                runAction(() => withdrawTavernMessageAction(formData));
              },
            },
          ]}
          x={openMenu.x}
          y={openMenu.y}
        />
      ) : null}
    </div>
  );
}

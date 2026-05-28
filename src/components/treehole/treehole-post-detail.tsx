'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useTransition } from 'react';
import { MarkdownMessage } from '@/components/tavern/markdown-message';
import { TavernContextMenu } from '@/components/tavern/tavern-context-menu';
import type { CurrentResident } from '@/features/residents/session';
import { publishTreeholeReplyAction, withdrawTreeholePostAction } from '@/features/treehole/actions';
import type { TreeholeActionResult, TreeholePostView, TreeholeReplyView } from '@/features/treehole/types';

const contentFont = '"ZCOOL XiaoWei", "LXGW WenKai", "KaiTi", "STKaiti", "Segoe UI", sans-serif';

type OpenMenuState = {
  x: number;
  y: number;
} | null;

function formatReplyTime(createdAt: string) {
  return new Date(createdAt).toLocaleString('zh-CN');
}

export function TreeholePostDetail({
  post,
  replies,
  resident,
}: {
  post: TreeholePostView;
  replies: TreeholeReplyView[];
  resident: CurrentResident | null;
}) {
  const [content, setContent] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [openMenu, setOpenMenu] = useState<OpenMenuState>(null);
  const commentInputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpenMenu(null);
      }
    }

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, []);

  function runAction(action: () => Promise<TreeholeActionResult>, onSuccess?: () => void) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setNotice(result.error);
        return;
      }

      setNotice('已经寄出回信。');
      setOpenMenu(null);
      onSuccess?.();
    });
  }

  return (
    <div className="relative" onClick={() => setOpenMenu(null)}>
      <div className="border-b border-white/10 pb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs tracking-[0.22em] text-amber-100/72">{post.authorLabel}</p>
                <h3 className="mt-3 text-4xl font-semibold text-amber-50" style={{ fontFamily: contentFont }}>{post.title}</h3>
              </div>
              <p className="shrink-0 text-sm text-stone-400">{formatReplyTime(post.createdAt)}</p>
            </div>
            <div className="mt-6 text-stone-100">
              {post.isDeleted ? <p className="italic text-stone-500">这封信已经被收回或移走。</p> : <MarkdownMessage content={post.content} />}
            </div>
          </div>

          <button
            aria-label="更多操作"
            className="shrink-0 border-0 bg-transparent px-2 py-1 text-2xl leading-none text-stone-300 transition hover:text-white"
            onClick={(event) => {
              event.stopPropagation();
              const rect = event.currentTarget.getBoundingClientRect();
              setOpenMenu({ x: Math.max(24, rect.right - 136), y: rect.bottom + 8 });
            }}
            type="button"
          >
            ···
          </button>
        </div>
      </div>

      <div className="mt-6">
        {resident ? (
          <form
            action={(formData) => {
              runAction(() => publishTreeholeReplyAction(formData), () => setContent(''));
            }}
          >
            <input name="postId" type="hidden" value={post.id} />
            <div className="flex items-end gap-3 border border-[rgba(232,188,128,0.24)] bg-[linear-gradient(175deg,rgba(64,44,30,0.90),rgba(26,18,13,0.96))] px-4 py-4 shadow-[0_-16px_40px_rgba(0,0,0,0.20),inset_0_1px_0_rgba(255,244,226,0.06)] backdrop-blur-lg">
              <textarea
                className="min-h-[3.5rem] w-full resize-none bg-transparent px-2 py-2 text-amber-50 outline-none placeholder:text-amber-50/38"
                maxLength={500}
                name="content"
                onChange={(event) => setContent(event.target.value)}
                placeholder="说点什么……"
                ref={commentInputRef}
                rows={2}
                style={{ fontFamily: contentFont }}
                value={content}
              />
              <button
                aria-label="发送"
                className="group flex shrink-0 items-center justify-center rounded-[0.25rem] border border-[rgba(232,188,128,0.24)] bg-[rgba(255,244,226,0.10)] p-3 transition duration-300 hover:border-[rgba(180,220,255,0.56)] hover:bg-[rgba(180,220,255,0.18)] hover:shadow-[0_0_30px_rgba(170,210,245,0.24)] disabled:opacity-30"
                disabled={isPending || post.isDeleted}
                type="submit"
              >
                <svg aria-hidden="true" className="size-5 text-stone-300 transition group-hover:text-cyan-100" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </form>
        ) : (
          <div className="flex items-center justify-between gap-4 border border-[rgba(232,188,128,0.24)] bg-[linear-gradient(175deg,rgba(64,44,30,0.90),rgba(26,18,13,0.96))] px-4 py-4 shadow-[0_-16px_40px_rgba(0,0,0,0.20),inset_0_1px_0_rgba(255,244,226,0.06)] backdrop-blur-lg">
            <p className="text-sm text-stone-300" style={{ fontFamily: contentFont }}>登录后才能评论。</p>
            <div className="flex gap-3">
              <Link className="border-0 bg-transparent px-1 py-1 text-sm tracking-[0.45em] text-stone-100/58 transition duration-500 hover:text-white hover:drop-shadow-[0_0_14px_rgba(255,214,245,0.85)]" href="/login">
                登录
              </Link>
              <Link className="border-0 bg-transparent px-1 py-1 text-sm tracking-[0.45em] text-stone-100/58 transition duration-500 hover:text-white hover:drop-shadow-[0_0_14px_rgba(255,214,245,0.85)]" href="/register">
                成为居民
              </Link>
            </div>
          </div>
        )}
        {notice ? <p className="mt-3 rounded-xl border border-red-300/30 bg-red-950/40 p-3 text-sm text-red-100">{notice}</p> : null}
      </div>

      <div className="mt-6 space-y-5">
        {replies.length === 0 ? <p className="rounded-2xl border border-dashed border-[rgba(200,155,100,0.14)] bg-[rgba(36,24,17,0.22)] p-10 text-center text-sm tracking-[0.24em] text-amber-50/52 shadow-[inset_0_1px_0_rgba(255,244,226,0.02)]">暂时还没有评论。</p> : null}
        {replies.map((reply) => (
          <article className="flex gap-4" key={reply.id}>
            <div className="mt-1 flex size-12 shrink-0 items-center justify-center rounded-[0.25rem] border border-[rgba(179,162,94,0.25)] bg-[linear-gradient(180deg,rgba(77,84,41,0.85),rgba(47,54,24,0.88))] text-xl font-semibold text-stone-100 shadow-[0_6px_18px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.08)]">
              A
            </div>
            <div className="min-w-0 max-w-[min(50rem,100%)]">
              <div className="rounded-full border border-amber-200/12 bg-[rgba(28,20,15,0.74)] px-3 py-1 text-[11px] tracking-[0.14em] text-amber-50/90 shadow-[0_10px_24px_rgba(0,0,0,0.22)] backdrop-blur-md whitespace-nowrap w-fit">
                <span>{reply.authorLabel}</span>
                <span className="mx-2 text-amber-200/35">·</span>
                <span>{formatReplyTime(reply.createdAt)}</span>
              </div>
              <article className="relative mt-3 overflow-hidden rounded-[0.25rem] border border-[rgba(232,188,128,0.26)] bg-[linear-gradient(172deg,rgba(108,76,50,0.34)_0%,rgba(66,46,33,0.30)_38%,rgba(34,24,18,0.54)_100%)] px-4 py-3 text-[15px] leading-7 text-stone-100 shadow-[0_12px_28px_rgba(0,0,0,0.28),0_3px_8px_rgba(0,0,0,0.20),inset_0_1px_0_rgba(255,238,210,0.10)] backdrop-blur-md">
                <span className="absolute left-[-10px] top-6 h-0 w-0 border-y-[9px] border-r-[10px] border-y-transparent border-r-[rgba(149,109,73,0.65)]" />
                <MarkdownMessage content={reply.content} />
              </article>
            </div>
          </article>
        ))}
      </div>

      {openMenu ? (
        <TavernContextMenu
          actions={[
            ...(post.canWithdraw
              ? [
                  {
                    key: 'delete',
                    label: '删除',
                    tone: 'danger' as const,
                    onSelect: () => {
                      const formData = new FormData();
                      formData.set('postId', post.id);
                      runAction(() => withdrawTreeholePostAction(formData));
                    },
                  },
                ]
              : []),
            {
              key: 'report',
              label: '举报',
              onSelect: () => {
                setOpenMenu(null);
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

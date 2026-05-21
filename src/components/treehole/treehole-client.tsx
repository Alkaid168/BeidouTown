'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { MarkdownMessage } from '@/components/tavern/markdown-message';
import type { CurrentResident } from '@/features/residents/session';
import { moderateTreeholePostAction, publishTreeholePostAction, withdrawTreeholePostAction } from '@/features/treehole/actions';
import type { TreeholeActionResult, TreeholePostView } from '@/features/treehole/types';

export function TreeholeClient({
  initialPosts,
  resident,
}: {
  initialPosts: TreeholePostView[];
  resident: CurrentResident | null;
}) {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function runAction(action: () => Promise<TreeholeActionResult>, onSuccess?: () => void) {
    startTransition(async () => {
      const result = await action();

      if (!result.ok) {
        setNotice(result.error);
        return;
      }

      setNotice(null);
      onSuccess?.();
      router.refresh();
    });
  }

  return (
    <div className="grid min-h-[70vh] gap-6 lg:grid-cols-[1fr_22rem]">
      <section className="rounded-[2rem] border border-amber-100/15 bg-stone-100/[0.06] p-5 shadow-2xl shadow-indigo-950/40 backdrop-blur">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <p className="text-sm tracking-[0.35em] text-amber-200/80">TREEHOLE POST</p>
            <h1 className="mt-2 text-4xl font-semibold text-stone-50">树洞邮局</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-400">把不便署名的话投进夜色里。默认匿名，但镇务管理仍会保留必要记录。</p>
          </div>
          <Link className="rounded-full border border-stone-400/30 px-4 py-2 text-sm text-stone-200 transition hover:border-amber-200/60 hover:text-amber-100" href="/">
            回到镇口
          </Link>
        </div>

        <div className="mt-5 space-y-4">
          {initialPosts.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-amber-100/20 p-8 text-center text-stone-400">邮局里还没有信。</p>
          ) : null}
          {initialPosts.map((post) => (
            <article className="rounded-2xl border border-white/10 bg-black/20 p-4" key={post.id}>
              <div className="mb-3 flex items-center justify-between gap-3 text-sm text-stone-400">
                <span className="text-stone-200">{post.authorLabel}</span>
                <time>{new Date(post.createdAt).toLocaleString('zh-CN')}</time>
              </div>
              {post.isDeleted ? (
                <p className="italic text-stone-500">这封信已经被收回或移走。</p>
              ) : (
                <div className="text-stone-200">
                  <MarkdownMessage content={post.content} />
                </div>
              )}
              {!post.isDeleted && (post.canWithdraw || post.canModerate) ? (
                <div className="mt-4 flex gap-2">
                  {post.canWithdraw ? (
                    <button
                      className="text-xs text-stone-400 underline underline-offset-4 hover:text-amber-100"
                      disabled={isPending}
                      onClick={() => {
                        const formData = new FormData();
                        formData.set('postId', post.id);
                        runAction(() => withdrawTreeholePostAction(formData));
                      }}
                      type="button"
                    >
                      收回
                    </button>
                  ) : null}
                  {post.canModerate ? (
                    <button
                      className="text-xs text-red-200 underline underline-offset-4 hover:text-red-100"
                      disabled={isPending}
                      onClick={() => {
                        const formData = new FormData();
                        formData.set('postId', post.id);
                        runAction(() => moderateTreeholePostAction(formData));
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
        </div>
      </section>

      <aside className="rounded-[2rem] border border-amber-100/15 bg-stone-100/[0.06] p-5 shadow-2xl shadow-indigo-950/30 backdrop-blur">
        {resident ? (
          <form
            action={(formData) => {
              runAction(() => publishTreeholePostAction(formData), () => setContent(''));
            }}
            className="space-y-4"
          >
            <div>
              <p className="text-sm text-amber-100">匿名投递</p>
              <p className="mt-1 text-xs leading-5 text-stone-500">最多 1000 字。支持安全 Markdown。公开页面不会显示你的昵称。</p>
            </div>
            <textarea
              className="min-h-56 w-full rounded-2xl border border-stone-500/30 bg-black/30 px-4 py-3 text-stone-50 outline-none focus:border-amber-200/70"
              maxLength={1000}
              name="content"
              onChange={(event) => setContent(event.target.value)}
              placeholder="把这封信交给夜色。"
              required
              value={content}
            />
            {notice ? <p className="rounded-xl border border-red-300/30 bg-red-950/40 p-3 text-sm text-red-100">{notice}</p> : null}
            <button className="w-full rounded-xl bg-amber-200 px-4 py-3 font-medium text-slate-950 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60" disabled={isPending} type="submit">
              投进树洞
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <p className="text-lg font-medium text-stone-100">游客可以读信。</p>
            <p className="text-sm leading-6 text-stone-400">想投递自己的树洞信，需要先成为北斗镇居民。</p>
            <div className="grid gap-3">
              <Link className="block rounded-xl bg-amber-200 px-4 py-3 text-center font-medium text-slate-950 transition hover:bg-amber-100" href="/login">
                登录后投递
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

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { withdrawTreeholePostAction } from '@/features/treehole/actions';
import type { TreeholeActionResult, TreeholePostView } from '@/features/treehole/types';

const contentFont = '"ZCOOL XiaoWei", "LXGW WenKai", "KaiTi", "STKaiti", "Segoe UI", sans-serif';

export function TreeholeMyPosts({ posts }: { posts: TreeholePostView[] }) {
  const router = useRouter();
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function runAction(action: () => Promise<TreeholeActionResult>) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setNotice(result.error);
        return;
      }

      setNotice(null);
      router.refresh();
    });
  }

  if (posts.length === 0) {
    return <p className="rounded-2xl border border-dashed border-[rgba(200,155,100,0.14)] bg-[rgba(36,24,17,0.22)] p-10 text-center text-sm tracking-[0.24em] text-amber-50/52 shadow-[inset_0_1px_0_rgba(255,244,226,0.02)]">你还没有投出过任何信件。</p>;
  }

  return (
    <div className="space-y-5">
      {notice ? <p className="rounded-xl border border-red-300/30 bg-red-950/40 p-3 text-sm text-red-100">{notice}</p> : null}
      {posts.map((post) => (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_8rem]" key={post.id}>
          <article className="rounded-[0.35rem] border border-[rgba(232,188,128,0.18)] bg-[linear-gradient(175deg,rgba(40,28,20,0.68),rgba(18,13,10,0.82))] p-5 shadow-[inset_0_1px_0_rgba(255,244,226,0.04),0_16px_40px_rgba(0,0,0,0.28)]">
            <div className="flex items-start justify-between gap-4 text-sm text-stone-400">
              <span className="text-amber-100/82">{post.authorLabel}</span>
              <time>{new Date(post.createdAt).toLocaleString('zh-CN')}</time>
            </div>
            <Link className="block" href={`/treehole/${post.id}`}>
              <h2 className="mt-4 text-4xl font-semibold text-amber-50" style={{ fontFamily: contentFont }}>{post.title}</h2>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-stone-100/84" style={{ fontFamily: contentFont }}>{post.preview || '这封信还没留下可见的字句。'}</p>
            </Link>
            <div className="mt-5 flex items-center justify-between text-xs tracking-[0.22em] text-stone-400/80">
              <span>{post.replyCount} 封回信</span>
            </div>
          </article>
          <div className="flex items-center justify-center">
            {post.canWithdraw && !post.isDeleted ? (
              <button
                className="border-0 bg-transparent px-1 py-1 text-sm tracking-[0.45em] text-stone-100/58 transition duration-500 hover:text-white hover:drop-shadow-[0_0_14px_rgba(255,214,245,0.85)] disabled:opacity-60"
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
          </div>
        </div>
      ))}
    </div>
  );
}

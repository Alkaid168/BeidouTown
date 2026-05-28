'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import type { CurrentResident } from '@/features/residents/session';
import { publishTreeholePostAction } from '@/features/treehole/actions';
import type { TreeholeActionResult } from '@/features/treehole/types';

const contentFont = '"ZCOOL XiaoWei", "LXGW WenKai", "KaiTi", "STKaiti", "Segoe UI", sans-serif';

export function TreeholeComposeForm({ resident }: { resident: CurrentResident | null }) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
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
      setTitle('');
      setContent('');
      router.push('/treehole');
      router.refresh();
    });
  }

  if (!resident) {
    return (
      <div className="py-10 text-center">
        <p className="text-2xl text-stone-100" style={{ fontFamily: contentFont }}>要先成为居民，才能把信投进树洞。</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link className="border-0 bg-transparent px-1 py-3 text-sm tracking-[0.45em] text-stone-100/58 transition duration-500 hover:text-white hover:drop-shadow-[0_0_14px_rgba(255,214,245,0.85)]" href="/login">
            登录后写信
          </Link>
          <Link className="border-0 bg-transparent px-1 py-3 text-sm tracking-[0.45em] text-stone-100/58 transition duration-500 hover:text-white hover:drop-shadow-[0_0_14px_rgba(255,214,245,0.85)]" href="/register">
            成为居民
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      action={(formData) => {
        runAction(() => publishTreeholePostAction(formData));
      }}
      className="space-y-5"
    >
      <label className="block space-y-2">
        <span className="text-sm text-stone-200" style={{ fontFamily: contentFont }}>标题</span>
        <input
          className="w-full rounded-[0.25rem] border border-[rgba(232,188,128,0.22)] bg-[rgba(255,244,226,0.06)] px-4 py-3 text-amber-50 outline-none placeholder:text-amber-50/35 focus:border-[rgba(255,214,156,0.46)]"
          maxLength={40}
          name="title"
          onChange={(event) => setTitle(event.target.value)}
          placeholder="无题"
          style={{ fontFamily: contentFont }}
          value={title}
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm text-stone-200" style={{ fontFamily: contentFont }}>正文</span>
        <textarea
          className="min-h-[26rem] w-full rounded-[0.25rem] border border-[rgba(232,188,128,0.22)] bg-[rgba(255,244,226,0.06)] px-4 py-3 text-amber-50 outline-none placeholder:text-amber-50/35 focus:border-[rgba(255,214,156,0.46)]"
          maxLength={1000}
          name="content"
          onChange={(event) => setContent(event.target.value)}
          placeholder="今天写点什么……"
          required
          style={{ fontFamily: contentFont }}
          value={content}
        />
      </label>
      {notice ? <p className="rounded-xl border border-red-300/30 bg-red-950/40 p-3 text-sm text-red-100">{notice}</p> : null}
      <div className="flex justify-end">
        <button className="border-0 bg-transparent px-1 py-1 text-sm tracking-[0.45em] text-stone-100/58 transition duration-500 hover:text-white hover:drop-shadow-[0_0_14px_rgba(255,214,245,0.85)] disabled:opacity-60" disabled={isPending} type="submit">
          {isPending ? '投递中...' : '投进树洞'}
        </button>
      </div>
    </form>
  );
}

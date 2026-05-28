'use client';

import Link from 'next/link';
import type { TreeholePostView } from '@/features/treehole/types';
import { TreeholePostGrid } from './treehole-post-grid';

export function TreeholeHomeClient({ posts }: { posts: TreeholePostView[] }) {
  return (
    <div className="fixed inset-0 flex min-h-screen w-screen flex-col overflow-hidden animate-[page-float-in_900ms_ease-out_both] px-4 py-6 sm:px-6 lg:px-10" data-testid="treehole-home-shell">
      <div className="mb-5 flex shrink-0 items-start justify-between gap-4 border-b border-white/10 pb-5 relative z-[80] pointer-events-none">
        <div className="pointer-events-auto">
          <p className="text-xs tracking-[0.55em] text-amber-100/70">TREEHOLE POST OFFICE</p>
          <h1 className="mt-2 font-serif text-4xl font-semibold tracking-[0.18em] text-stone-50">树洞邮局</h1>
        </div>
        <div className="flex flex-wrap items-start justify-end gap-5 text-right pointer-events-auto">
          <Link className="border-0 bg-transparent px-1 py-1 text-sm tracking-[0.45em] text-stone-100/58 transition duration-500 hover:text-white hover:drop-shadow-[0_0_14px_rgba(255,214,245,0.85)]" href="/treehole/mine">
            管理我的信件
          </Link>
          <Link className="border-0 bg-transparent px-1 py-1 text-sm tracking-[0.45em] text-stone-100/58 transition duration-500 hover:text-white hover:drop-shadow-[0_0_14px_rgba(255,214,245,0.85)]" href="/treehole/messages">
            消息
          </Link>
          <Link className="border-0 bg-transparent px-1 py-1 text-sm tracking-[0.45em] text-lime-200/78 transition duration-500 hover:text-lime-100 hover:drop-shadow-[0_0_14px_rgba(204,255,153,0.65)]" href="/treehole/compose">
            发布
          </Link>
          <Link className="border-0 bg-transparent px-1 py-1 text-sm tracking-[0.45em] text-stone-100/58 transition duration-500 hover:text-white hover:drop-shadow-[0_0_14px_rgba(255,214,245,0.85)]" href="/">
            回到镇口
          </Link>
        </div>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden rounded-[0.35rem] border border-[rgba(232,188,128,0.20)] bg-[linear-gradient(175deg,rgba(30,20,13,0.68),rgba(14,10,7,0.78))] shadow-[inset_0_1px_0_rgba(255,244,226,0.06),0_24px_56px_rgba(0,0,0,0.34)] backdrop-blur-[2px]">
        <div className="absolute inset-x-0 top-0 z-10 h-20 bg-[linear-gradient(180deg,rgba(10,8,6,0.55),transparent)] pointer-events-none" />
        <div className="relative h-full overflow-y-auto px-6 py-5 sm:px-6 sm:py-6">
          <TreeholePostGrid posts={posts} />
        </div>
      </div>
    </div>
  );
}

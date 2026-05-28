import Link from 'next/link';
import type { TreeholePostView } from '@/features/treehole/types';

const titleFont = '"ZCOOL XiaoWei", "LXGW WenKai", "KaiTi", "STKaiti", "Segoe UI", sans-serif';

export function TreeholePostCard({ post, showActions = false }: { post: TreeholePostView; showActions?: boolean }) {
  return (
    <article className="group w-full min-w-0 h-full rounded-[0.35rem] border border-[rgba(232,188,128,0.18)] bg-[linear-gradient(175deg,rgba(40,28,20,0.68),rgba(18,13,10,0.82))] p-5 shadow-[inset_0_1px_0_rgba(255,244,226,0.04),0_16px_40px_rgba(0,0,0,0.28)] transition duration-500 hover:border-[rgba(255,214,156,0.36)] hover:bg-[linear-gradient(175deg,rgba(52,36,24,0.74),rgba(24,17,12,0.90))] hover:shadow-[inset_0_1px_0_rgba(255,244,226,0.06),0_24px_48px_rgba(0,0,0,0.34)]">
      <div className="mb-4 flex items-start justify-between gap-4 text-xs tracking-[0.16em] text-stone-400/85">
        <span className="text-amber-100/82">{post.authorLabel}</span>
        <time>{new Date(post.createdAt).toLocaleString('zh-CN')}</time>
      </div>
      <Link className="block w-full min-w-0" href={`/treehole/${post.id}`}>
        <h2 className="line-clamp-2 text-3xl font-semibold tracking-[0.08em] text-amber-50 transition duration-300 group-hover:text-amber-100" style={{ fontFamily: titleFont }}>{post.title}</h2>
        <p className="mt-4 line-clamp-4 whitespace-pre-wrap text-sm leading-7 text-stone-100/84" style={{ fontFamily: titleFont }}>{post.isDeleted ? '这封信已经被收回或移走。' : post.preview || '这封信还没留下可见的字句。'}</p>
      </Link>
      <div className="mt-5 flex items-center justify-between text-xs tracking-[0.22em] text-stone-400/80">
        <span>{post.replyCount} 封回信</span>
        {showActions && post.canWithdraw ? <span className="text-amber-100/75">可管理</span> : null}
      </div>
    </article>
  );
}

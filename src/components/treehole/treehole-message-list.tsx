import Link from 'next/link';
import type { TreeholeMessageView } from '@/features/treehole/types';

const contentFont = '"ZCOOL XiaoWei", "LXGW WenKai", "KaiTi", "STKaiti", "Segoe UI", sans-serif';

export function TreeholeMessageList({ messages }: { messages: TreeholeMessageView[] }) {
  if (messages.length === 0) {
    return <p className="rounded-2xl border border-dashed border-[rgba(200,155,100,0.14)] bg-[rgba(36,24,17,0.22)] p-10 text-center text-sm tracking-[0.24em] text-amber-50/52 shadow-[inset_0_1px_0_rgba(255,244,226,0.02)]">暂时还没有新的回信提醒。</p>;
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <article className="rounded-[0.35rem] border border-[rgba(232,188,128,0.18)] bg-[linear-gradient(175deg,rgba(40,28,20,0.68),rgba(18,13,10,0.82))] p-5 shadow-[inset_0_1px_0_rgba(255,244,226,0.04),0_16px_40px_rgba(0,0,0,0.28)]" key={message.id}>
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-stone-400">
            <span className="text-amber-100/80" style={{ fontFamily: contentFont }}>{message.authorLabel}</span>
            <time>{new Date(message.createdAt).toLocaleString('zh-CN')}</time>
          </div>
          <p className="mt-3 text-sm tracking-[0.2em] text-amber-100/70" style={{ fontFamily: contentFont }}>回复了你的信：《{message.postTitle}》</p>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-stone-100/88" style={{ fontFamily: contentFont }}>{message.content}</p>
          <Link className="mt-4 inline-block text-sm tracking-[0.26em] text-amber-100 transition hover:text-amber-50 hover:drop-shadow-[0_0_12px_rgba(255,214,156,0.45)]" href={`/treehole/${message.postId}`}>
            去看这封信
          </Link>
        </article>
      ))}
    </div>
  );
}

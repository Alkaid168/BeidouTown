import Link from 'next/link';
import { TreeholeMessageList } from '@/components/treehole/treehole-message-list';
import { TreeholeShell } from '@/components/treehole/treehole-shell';
import { getCurrentResident } from '@/features/residents/session';
import { listResidentTreeholeMessages } from '@/features/treehole/posts';

export default async function TreeholeMessagesPage() {
  const resident = await getCurrentResident();
  const messages = await listResidentTreeholeMessages(resident);

  return (
    <TreeholeShell
      backgroundImage="/treehole-background.jpg"
      description="这里会提醒你：有人读到了你的信，并留下了一封匿名回信。"
      eyebrow="LETTER NOTICES"
      title="消息"
    >
      {resident ? (
        <TreeholeMessageList messages={messages} />
      ) : (
        <div className="rounded-[1.6rem] border border-white/10 bg-[rgba(10,12,26,0.62)] p-10 text-center shadow-[0_18px_48px_rgba(0,0,0,0.24)]">
          <p className="text-lg text-stone-100">消息页只对居民开放。</p>
          <p className="mt-3 text-sm leading-6 text-stone-300/75">登录之后，你才会看到别人回复了你哪一封信。</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link className="rounded-full bg-amber-200 px-5 py-3 text-sm font-medium text-slate-950 transition hover:bg-amber-100" href="/login">
              登录后查看
            </Link>
            <Link className="rounded-full border border-stone-400/30 px-5 py-3 text-sm text-stone-100 transition hover:border-amber-200/60 hover:text-amber-100" href="/register">
              成为居民
            </Link>
          </div>
        </div>
      )}
    </TreeholeShell>
  );
}

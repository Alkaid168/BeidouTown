import type { TavernMessageView } from '@/features/tavern/types';
import { MarkdownMessage } from './markdown-message';
import { TavernAvatar } from './tavern-avatar';

function formatMessageTime(createdAt: string) {
  const date = new Date(createdAt);
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, '0');
  const day = `${date.getUTCDate()}`.padStart(2, '0');
  const hour = `${date.getUTCHours()}`.padStart(2, '0');
  const minute = `${date.getUTCMinutes()}`.padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

export function TavernMessageItem({
  message,
  onContextMenu,
}: {
  message: TavernMessageView;
  onContextMenu: (message: TavernMessageView, x: number, y: number) => void;
}) {
  return (
    <div className="group relative flex items-start gap-3">
      <TavernAvatar avatarUrl={message.author.avatarUrl} nickname={message.author.nickname} />
      <div className="relative min-w-0 max-w-[min(44rem,calc(100%-4rem))] pl-1">
        <div className="pointer-events-none absolute left-0 top-0 z-10 -translate-y-[calc(100%+0.45rem)] opacity-0 transition duration-200 group-hover:opacity-100" data-testid={`message-meta-${message.id}`}>
          <div className="rounded-full border border-amber-200/12 bg-[rgba(28,20,15,0.74)] px-3 py-1 text-[11px] tracking-[0.14em] text-amber-50/90 shadow-[0_10px_24px_rgba(0,0,0,0.22)] backdrop-blur-md whitespace-nowrap">
            <span>{message.author.nickname}</span>
            <span className="mx-2 text-amber-200/35">·</span>
            <span>{formatMessageTime(message.createdAt)}</span>
          </div>
        </div>
        <article
          className="relative overflow-hidden rounded-[0.25rem] border border-[rgba(232,188,128,0.26)] bg-[linear-gradient(172deg,rgba(108,76,50,0.34)_0%,rgba(66,46,33,0.30)_38%,rgba(34,24,18,0.54)_100%)] px-4 py-3 text-[15px] leading-7 text-stone-100 shadow-[0_12px_28px_rgba(0,0,0,0.28),0_3px_8px_rgba(0,0,0,0.20),inset_0_1px_0_rgba(255,238,210,0.10)] backdrop-blur-md transition-[border-color,background-color,box-shadow,transform] duration-300 group-hover:-translate-y-[1px] group-hover:border-[rgba(255,214,156,0.44)] group-hover:bg-[linear-gradient(172deg,rgba(136,94,61,0.44)_0%,rgba(82,56,38,0.38)_38%,rgba(42,29,21,0.64)_100%)] group-hover:shadow-[0_20px_36px_rgba(0,0,0,0.34),0_6px_14px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,238,210,0.14)]"
          onContextMenu={(event) => {
            event.preventDefault();
            onContextMenu(message, event.clientX, event.clientY);
          }}
        >
          <span className="pointer-events-none absolute inset-y-0 left-0 w-px bg-amber-100/10 opacity-0 transition duration-300 group-hover:opacity-100" />
          <span className="absolute left-[-10px] top-6 h-0 w-0 border-y-[9px] border-r-[10px] border-y-transparent border-r-[rgba(149,109,73,0.65)] transition duration-300 group-hover:border-r-[rgba(181,140,100,0.8)]" />
          {message.isDeleted ? (
            <p className="text-sm text-stone-300/62">这条消息已经离开了酒馆。</p>
          ) : (
            <MarkdownMessage content={message.content} />
          )}
        </article>
      </div>
    </div>
  );
}

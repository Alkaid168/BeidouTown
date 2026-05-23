# Tavern Visual Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the tavern page into a warm candlelit tavern aesthetic by polishing message bubbles, avatar colors, hover metadata, composer surfaces, and toast styling without changing the core interaction model.

**Architecture:** Keep the current tavern interaction and data flow untouched, and confine the work to presentational components plus a small amount of shared animation/styling. Split the changes into two visual layers: message system polish first, then composer/toast polish second, with behavior regression tests guarding against accidental interaction drift.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS, Vitest, Testing Library, react-markdown

---

## File map

- **Modify:** `src/components/tavern/tavern-avatar.tsx` — constrain stable avatar colors into a warm tavern palette and refine avatar proportions.
- **Modify:** `src/components/tavern/tavern-message-item.tsx` — warm up bubble materials, hover metadata chip, deleted message tone, and subtle hover sheen.
- **Modify:** `src/components/tavern/markdown-message.tsx` — adjust warm text/link/code colors so formatted content matches the tavern palette.
- **Modify:** `src/components/tavern/tavern-client.tsx` — reskin composer shell, long-text board, buttons, toast, and any layout-facing presentation details without changing interaction semantics.
- **Modify:** `src/app/globals.css` — add or tune tavern-specific visual animations only if utilities become too noisy.
- **Modify:** `src/components/tavern/tavern-client.test.tsx` — keep behavior coverage while adding a few visual-structure assertions that are stable and non-brittle.

---

### Task 1: Warm up avatar palette and message bubble materials

**Files:**
- Modify: `src/components/tavern/tavern-avatar.tsx`
- Modify: `src/components/tavern/tavern-message-item.tsx`
- Test: `src/components/tavern/tavern-client.test.tsx`

- [ ] **Step 1: Write the failing tests**

Update `src/components/tavern/tavern-client.test.tsx` by changing the avatar test and adding a deleted-bubble style assertion:

```tsx
it('renders a stable square avatar with the nickname initial and warm tavern sizing', () => {
  mockFetch();
  render(
    <TavernClient
      initialMessages={[
        {
          id: 'msg-1',
          content: '今晚有风。',
          createdAt: '2026-05-21T20:00:00.000Z',
          isDeleted: false,
          deleteReason: null,
          canWithdraw: false,
          canModerate: false,
          author: { id: 'a1', nickname: '默弥', avatarUrl: null, role: 'resident' },
        },
      ]}
      resident={null}
    />,
  );

  const avatar = screen.getByLabelText('默弥 的头像');
  expect(avatar).toHaveTextContent('默');
  expect(avatar).toHaveClass('aspect-square');
  expect(avatar).toHaveClass('size-12');
  expect(avatar).toHaveClass('text-xl');
});

it('renders deleted messages with the subdued tavern bubble treatment', () => {
  mockFetch();
  render(
    <TavernClient
      initialMessages={[
        {
          id: 'msg-1',
          content: '原内容',
          createdAt: '2026-05-21T20:00:00.000Z',
          isDeleted: true,
          deleteReason: 'withdrawn',
          canWithdraw: false,
          canModerate: false,
          author: { id: 'a1', nickname: '旅人甲', avatarUrl: null, role: 'resident' },
        },
      ]}
      resident={null}
    />,
  );

  expect(screen.getByText('这条消息已经离开了酒馆。')).toHaveClass('text-sm');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
corepack pnpm vitest run src/components/tavern/tavern-client.test.tsx
```

Expected: FAIL because the current avatar and deleted-bubble styling will not yet match the new warm tavern assertions.

- [ ] **Step 3: Write minimal implementation**

Replace `src/components/tavern/tavern-avatar.tsx` with:

```tsx
const avatarPalette = [
  { background: 'rgba(84, 58, 39, 0.72)', border: 'rgba(178, 135, 88, 0.62)' },
  { background: 'rgba(66, 79, 47, 0.72)', border: 'rgba(151, 176, 110, 0.56)' },
  { background: 'rgba(88, 46, 42, 0.72)', border: 'rgba(189, 117, 98, 0.56)' },
  { background: 'rgba(78, 60, 92, 0.72)', border: 'rgba(162, 139, 186, 0.56)' },
  { background: 'rgba(95, 71, 44, 0.72)', border: 'rgba(201, 160, 92, 0.6)' },
];

function getAvatarToken(nickname: string) {
  const trimmed = nickname.trim();
  const first = trimmed[0] ?? '?';
  let hash = 0;

  for (const char of trimmed) {
    hash = (hash * 33 + char.charCodeAt(0)) % avatarPalette.length;
  }

  const palette = avatarPalette[hash];

  return {
    initial: first.toUpperCase(),
    background: palette.background,
    border: palette.border,
  };
}

export function TavernAvatar({ nickname }: { nickname: string }) {
  const token = getAvatarToken(nickname);

  return (
    <div
      aria-label={`${nickname} 的头像`}
      className="aspect-square size-12 shrink-0 border text-center text-xl font-semibold text-white/92 shadow-[0_0_18px_rgba(0,0,0,0.18)]"
      style={{ backgroundColor: token.background, borderColor: token.border }}
    >
      <span className="flex h-full items-center justify-center">{token.initial}</span>
    </div>
  );
}
```

Then replace `src/components/tavern/tavern-message-item.tsx` with:

```tsx
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
      <TavernAvatar nickname={message.author.nickname} />
      <div className="relative min-w-0 max-w-[min(44rem,calc(100%-4rem))] pl-1">
        <div className="pointer-events-none absolute left-0 top-0 z-10 -translate-y-[calc(100%+0.45rem)] opacity-0 transition duration-200 group-hover:opacity-100" data-testid={`message-meta-${message.id}`}>
          <div className="rounded-full border border-amber-200/12 bg-[rgba(28,20,15,0.74)] px-3 py-1 text-[11px] tracking-[0.14em] text-amber-50/90 shadow-[0_10px_24px_rgba(0,0,0,0.22)] backdrop-blur-md">
            <span>{message.author.nickname}</span>
            <span className="mx-2 text-amber-200/35">·</span>
            <span>{formatMessageTime(message.createdAt)}</span>
          </div>
        </div>
        <article
          className="relative overflow-hidden rounded-[0.35rem] border border-[rgba(212,170,118,0.16)] bg-[linear-gradient(180deg,rgba(72,51,35,0.22),rgba(38,28,22,0.28))] px-4 py-3 text-[15px] leading-7 text-stone-100 shadow-[0_12px_28px_rgba(0,0,0,0.18)] backdrop-blur-md transition-[border-color,background-color,box-shadow] duration-300 group-hover:border-[rgba(232,193,145,0.26)] group-hover:bg-[linear-gradient(180deg,rgba(96,67,45,0.24),rgba(49,35,25,0.34))] group-hover:shadow-[0_16px_32px_rgba(0,0,0,0.20)]"
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
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
corepack pnpm vitest run src/components/tavern/tavern-client.test.tsx
```

Expected: PASS for the updated avatar and deleted-bubble assertions, with all prior tavern behavior tests still green.

- [ ] **Step 5: Commit**

```bash
git add src/components/tavern/tavern-avatar.tsx src/components/tavern/tavern-message-item.tsx src/components/tavern/tavern-client.test.tsx
git commit -m "feat: warm tavern message surfaces"
```

---

### Task 2: Warm up markdown rendering inside tavern bubbles

**Files:**
- Modify: `src/components/tavern/markdown-message.tsx`
- Test: `src/components/tavern/markdown-message.test.tsx`

- [ ] **Step 1: Write the failing test**

Add this test to `src/components/tavern/markdown-message.test.tsx`:

```tsx
it('renders tavern markdown with the warm palette classes', () => {
  render(<MarkdownMessage content={'[链接](https://example.com)\n\n`code`\n\n> 引文'} />);

  expect(screen.getByRole('link', { name: '链接' })).toHaveClass('text-amber-100');
  expect(screen.getByText('code')).toHaveClass('bg-[rgba(24,16,12,0.78)]');
  expect(screen.getByText('引文').closest('blockquote')).toHaveClass('border-l-2');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
corepack pnpm vitest run src/components/tavern/markdown-message.test.tsx
```

Expected: FAIL because the current classes are still from the older cooler palette.

- [ ] **Step 3: Write minimal implementation**

Update `src/components/tavern/markdown-message.tsx` to use the warm tavern palette:

```tsx
import ReactMarkdown from 'react-markdown';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';

const safeSchema = {
  ...defaultSchema,
  tagNames: defaultSchema.tagNames?.filter((tag) => tag !== 'img'),
};

const codeFont = 'Consolas, monospace';

export function MarkdownMessage({ content }: { content: string }) {
  return (
    <ReactMarkdown
      allowedElements={[
        'a',
        'blockquote',
        'br',
        'code',
        'del',
        'em',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'li',
        'ol',
        'p',
        'pre',
        'strong',
        'ul',
      ]}
      components={{
        a({ children, href }) {
          return (
            <a className="text-amber-100 underline decoration-amber-200/35 underline-offset-4" href={href} rel="noreferrer" target="_blank">
              {children}
            </a>
          );
        },
        blockquote({ children }) {
          return <blockquote className="my-3 border-l-2 border-amber-200/30 pl-4 text-stone-200/88">{children}</blockquote>;
        },
        code({ children }) {
          return (
            <code className="rounded-md bg-[rgba(24,16,12,0.78)] px-1.5 py-0.5 text-amber-50" style={{ fontFamily: codeFont }}>
              {children}
            </code>
          );
        },
        del({ children }) {
          return <del className="text-stone-400/80 decoration-stone-400/70">{children}</del>;
        },
        em({ children }) {
          return <em className="italic text-stone-100/92">{children}</em>;
        },
        h1({ children }) {
          return <h1 className="mb-3 mt-4 text-2xl font-semibold text-amber-50 first:mt-0">{children}</h1>;
        },
        h2({ children }) {
          return <h2 className="mb-3 mt-4 text-xl font-semibold text-amber-50 first:mt-0">{children}</h2>;
        },
        h3({ children }) {
          return <h3 className="mb-2 mt-3 text-lg font-semibold text-amber-50 first:mt-0">{children}</h3>;
        },
        h4({ children }) {
          return <h4 className="mb-2 mt-3 font-semibold text-amber-50 first:mt-0">{children}</h4>;
        },
        h5({ children }) {
          return <h5 className="mb-2 mt-3 text-sm font-semibold text-amber-50 first:mt-0">{children}</h5>;
        },
        h6({ children }) {
          return <h6 className="mb-2 mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-amber-100/90 first:mt-0">{children}</h6>;
        },
        li({ children }) {
          return <li className="my-1 pl-1 marker:text-amber-200/65">{children}</li>;
        },
        ol({ children }) {
          return <ol className="my-3 list-decimal space-y-1 pl-6">{children}</ol>;
        },
        p({ children }) {
          return <p className="mb-3 last:mb-0 text-stone-100/92">{children}</p>;
        },
        pre({ children }) {
          return (
            <pre className="my-3 overflow-x-auto rounded-xl bg-[rgba(19,13,10,0.88)] p-4 text-sm text-amber-50" style={{ fontFamily: codeFont }}>
              {children}
            </pre>
          );
        },
        strong({ children }) {
          return <strong className="font-semibold text-amber-50">{children}</strong>;
        },
        ul({ children }) {
          return <ul className="my-3 list-disc space-y-1 pl-6">{children}</ul>;
        },
      }}
      rehypePlugins={[[rehypeSanitize, safeSchema]]}
      remarkPlugins={[remarkGfm]}
      skipHtml
    >
      {content}
    </ReactMarkdown>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
corepack pnpm vitest run src/components/tavern/markdown-message.test.tsx
```

Expected: PASS with the new warm tavern classes.

- [ ] **Step 5: Commit**

```bash
git add src/components/tavern/markdown-message.tsx src/components/tavern/markdown-message.test.tsx
git commit -m "feat: warm tavern markdown palette"
```

---

### Task 3: Reskin the composer, expanded writing board, and toast

**Files:**
- Modify: `src/components/tavern/tavern-client.tsx`
- Modify: `src/app/globals.css`
- Test: `src/components/tavern/tavern-client.test.tsx`

- [ ] **Step 1: Write the failing test**

Add these assertions to `src/components/tavern/tavern-client.test.tsx`:

```tsx
it('renders the composer as a tavern writing tray with a toast notice', async () => {
  const user = userEvent.setup();
  mockFetch();
  const { sendTavernMessageAction } = await import('@/features/tavern/actions');
  vi.mocked(sendTavernMessageAction).mockResolvedValue({ ok: false, error: '请稍后再试' });

  render(<TavernClient initialMessages={[]} resident={{ id: 'r1', name: '阿北', role: 'resident' }} />);

  expect(screen.getByTestId('tavern-composer')).toHaveClass('backdrop-blur-md');
  expect(screen.getByTestId('tavern-composer')).toHaveClass('border-t');

  await user.type(screen.getAllByPlaceholderText('说点什么...')[1], '测试');
  await user.click(screen.getByRole('button', { name: '发送' }));

  expect(screen.getByText('先喝口茶，稍后再说。')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
corepack pnpm vitest run src/components/tavern/tavern-client.test.tsx
```

Expected: FAIL because the composer and toast will not yet reflect the full warm tavern polish.

- [ ] **Step 3: Write minimal implementation**

In `src/components/tavern/tavern-client.tsx`, refine only the presentational classes for the toast and composer surfaces. Apply these class changes exactly:

1. Toast container:

```tsx
<div className="animate-[tavern-composer-rise_220ms_ease-out_both] rounded-xl border border-amber-200/22 bg-[linear-gradient(180deg,rgba(40,28,18,0.92),rgba(24,18,13,0.94))] px-4 py-3 text-sm text-amber-50 shadow-[0_12px_30px_rgba(0,0,0,0.28)] backdrop-blur-md">
  先喝口茶，稍后再说。
</div>
```

2. Expanded writing board:

```tsx
<div
  className={`absolute inset-x-0 bottom-full mb-3 origin-bottom border border-amber-200/12 bg-[linear-gradient(180deg,rgba(52,37,26,0.88),rgba(21,16,12,0.96))] px-4 py-4 shadow-[0_-18px_42px_rgba(0,0,0,0.26)] backdrop-blur-xl transition duration-500 ${isLongText ? 'visible translate-y-0 opacity-100' : 'invisible translate-y-4 opacity-0'}`}
  data-state={isLongText ? 'open' : 'closed'}
  data-testid="tavern-composer-overlay"
>
```

3. Main composer tray:

```tsx
<div className="flex items-end gap-3 border border-amber-200/10 bg-[linear-gradient(180deg,rgba(34,25,19,0.78),rgba(17,13,10,0.92))] px-3 py-3 shadow-[0_0_30px_rgba(0,0,0,0.18)] backdrop-blur-md">
```

4. Toggle/send buttons:

```tsx
className="group flex shrink-0 items-center justify-center rounded-xl border border-amber-200/10 bg-[rgba(255,244,226,0.04)] p-3 transition duration-300 hover:border-amber-200/28 hover:bg-[rgba(255,244,226,0.08)]"
```

5. Main textarea and expanded textarea colors:

```tsx
className="h-[50vh] w-full resize-none bg-transparent text-amber-50 outline-none placeholder:text-amber-50/38"
```

```tsx
className={`w-full resize-none bg-transparent px-2 py-2 text-amber-50 outline-none placeholder:text-amber-50/38 ${isLongText ? 'opacity-0' : 'min-h-[3rem]'}`}
```

Then add this animation to `src/app/globals.css` only if not already present in the same form:

```css
@keyframes tavern-candle-flicker {
  0%, 100% {
    opacity: 1;
    filter: brightness(1);
  }

  50% {
    opacity: 0.94;
    filter: brightness(1.06);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
corepack pnpm vitest run src/components/tavern/tavern-client.test.tsx
```

Expected: PASS with existing behavior intact and the composer/toast assertions green.

- [ ] **Step 5: Commit**

```bash
git add src/components/tavern/tavern-client.tsx src/app/globals.css src/components/tavern/tavern-client.test.tsx
git commit -m "feat: polish tavern composer surfaces"
```

---

### Task 4: Run regression verification for the visual polish pass

**Files:**
- Modify: none, unless verification reveals a regression
- Test: existing suite only

- [ ] **Step 1: Run the tavern component tests**

Run:

```bash
corepack pnpm vitest run src/components/tavern/tavern-client.test.tsx src/components/tavern/markdown-message.test.tsx
```

Expected: PASS for all tavern behavior and styling-structure tests.

- [ ] **Step 2: Run the full test suite**

Run:

```bash
corepack pnpm test
```

Expected: PASS with zero failing tests.

- [ ] **Step 3: Run lint**

Run:

```bash
corepack pnpm lint
```

Expected: PASS with zero errors.

- [ ] **Step 4: Run production build**

Run:

```bash
corepack pnpm build
```

Expected: PASS with successful Next.js build.

- [ ] **Step 5: Run manual visual verification**

Run:

```bash
corepack pnpm dev
```

Then verify manually on `/tavern`:

1. The page reads warmer and more tavern-like overall.
2. Message bubbles feel like candlelit paper notes rather than generic glass panels.
3. Avatar colors look like they come from one warm palette.
4. Hover metadata looks lighter and more refined, without moving the bubble.
5. The composer and expanded writing board feel like one writing station.
6. The toast looks like a tavern notice card rather than a system alert.
7. Sending, Enter/Ctrl+Enter, right-click menu, auto-scroll, and login links still work.

- [ ] **Step 6: Commit**

```bash
git add src/components/tavern/tavern-avatar.tsx src/components/tavern/tavern-message-item.tsx src/components/tavern/markdown-message.tsx src/components/tavern/tavern-client.tsx src/components/tavern/tavern-client.test.tsx src/components/tavern/markdown-message.test.tsx src/app/globals.css
git commit -m "feat: refine tavern visual polish"
```

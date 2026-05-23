# Tavern Chatroom Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the tavern page into a background-rich chat UI with independently scrolling messages, upward-expanding long-text composer, avatar-and-bubble message cards, right-click withdraw menu, and fix the homepage constellation hydration mismatch.

**Architecture:** Keep the existing tavern polling and server actions intact, but split the UI into focused presentational units: a tavern shell, a message item renderer, and a context menu. Fix the homepage hydration issue by giving SSR and hydration the same initial aspect ratio, then updating to the real viewport only after mount.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS, Vitest, Testing Library

---

## File map

- **Create:** `src/components/tavern/tavern-avatar.tsx` — stable square avatar with nickname initial and deterministic color token.
- **Create:** `src/components/tavern/tavern-context-menu.tsx` — small extensible right-click menu component.
- **Create:** `src/components/tavern/tavern-message-item.tsx` — single message bubble, hover meta, deleted state, context-menu trigger.
- **Modify:** `src/components/tavern/tavern-client.tsx` — restructure page into fixed shell + scroll region + upward overlay composer.
- **Modify:** `src/components/tavern/tavern-client.test.tsx` — rewrite around new layout and interactions.
- **Modify:** `src/app/tavern/page.tsx` — add layered background image treatment and shell container.
- **Modify:** `src/app/globals.css` — add any missing chat bubble / composer animations not expressible cleanly with utilities.
- **Modify:** `src/components/home/home-client.tsx` — remove SSR/CSR aspect-ratio mismatch.
- **Modify:** `src/components/home/home-client.test.tsx` — add regression test for stable initial layout path.
- **Create/Copy:** `public/tavern-background.jpeg` — copy from `F:\CODES\北斗镇\聊天酒馆背景图.jpeg`.

---

### Task 1: Fix homepage hydration mismatch

**Files:**
- Modify: `src/components/home/home-client.tsx`
- Test: `src/components/home/home-client.test.tsx`

- [ ] **Step 1: Write the failing test**

Add this test to `src/components/home/home-client.test.tsx`:

```tsx
it('renders the resident constellation from a stable initial layout before mount updates viewport data', () => {
  render(<HomeClient resident={{ id: 'resident-1', name: '阿北', role: 'resident' }} />);

  const constellation = screen.getByLabelText('缓缓旋转的北斗七星导航');
  const line = screen.getByTestId('constellation-line');
  const tavernStar = screen.getByRole('link', { name: /天枢 聊天酒馆/ });

  expect(constellation).toBeInTheDocument();
  expect(line).toHaveAttribute('points');
  expect(tavernStar).toHaveStyle({ left: '21.661%', top: '27.097%' });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
corepack pnpm vitest run src/components/home/home-client.test.tsx
```

Expected: FAIL because the first render uses `window.innerWidth / window.innerHeight` in the render path, so the test sees client-driven coordinates instead of the stable default layout.

- [ ] **Step 3: Write minimal implementation**

Update `src/components/home/home-client.tsx` so the render path always starts from a stable default ratio, then switches after mount:

```tsx
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties, MouseEvent } from 'react';
import { logoutResidentAction } from '@/features/residents/actions';
import type { CurrentResident } from '@/features/residents/session';
import { getAdaptiveStarLayout, getStarFrame } from './star-layout';
import type { AdaptiveStar } from './star-layout';

const DEFAULT_HOME_ASPECT_RATIO = 16 / 9;

type StarDestination = AdaptiveStar;

function getViewportAspectRatio() {
  return window.innerWidth / window.innerHeight;
}

function ResidentConstellation({ resident }: { resident: CurrentResident }) {
  const [hoveredStar, setHoveredStar] = useState<StarDestination | null>(null);
  const [labelPosition, setLabelPosition] = useState({ x: 0, y: 0 });
  const [driftProgress, setDriftProgress] = useState(0);
  const [aspectRatio, setAspectRatio] = useState(DEFAULT_HOME_ASPECT_RATIO);

  const layout = useMemo(() => getAdaptiveStarLayout(aspectRatio), [aspectRatio]);
  const frame = useMemo(() => getStarFrame(layout.stars, driftProgress), [layout.stars, driftProgress]);
  const stars = frame.stars;
  const starLinePoints = frame.linePoints;

  useEffect(() => {
    setAspectRatio(getViewportAspectRatio());

    function handleResize() {
      setAspectRatio(getViewportAspectRatio());
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let frameId = 0;
    const startedAt = performance.now();

    function tick(now: number) {
      setDriftProgress(((now - startedAt) % 18_000) / 18_000);
      frameId = requestAnimationFrame(tick);
    }

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, []);

  // keep the rest of the component body unchanged
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
corepack pnpm vitest run src/components/home/home-client.test.tsx
```

Expected: PASS. The existing home tests and the new stable-layout regression test all pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/home/home-client.tsx src/components/home/home-client.test.tsx
git commit -m "fix: stabilize home constellation hydration"
```

---

### Task 2: Add tavern background asset and shell styling

**Files:**
- Create: `public/tavern-background.jpeg`
- Modify: `src/app/tavern/page.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Write the failing test**

Add this test to `src/components/tavern/tavern-client.test.tsx`:

```tsx
it('renders the chat page inside a dedicated scroll shell instead of a full-page flow', () => {
  mockFetch();
  render(<TavernClient initialMessages={[]} resident={{ id: 'r1', name: '阿北', role: 'resident' }} />);

  expect(screen.getByTestId('tavern-shell')).toBeInTheDocument();
  expect(screen.getByTestId('tavern-messages-scroll')).toHaveClass('overflow-y-auto');
  expect(screen.getByTestId('tavern-composer')).toHaveClass('sticky');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
corepack pnpm vitest run src/components/tavern/tavern-client.test.tsx
```

Expected: FAIL because the current markup does not expose the dedicated shell and message-scroll test IDs.

- [ ] **Step 3: Write minimal implementation**

Copy the image into `public/tavern-background.jpeg`, then replace `src/app/tavern/page.tsx` with:

```tsx
import { TavernClient } from '@/components/tavern/tavern-client';
import { getCurrentResident } from '@/features/residents/session';
import { listRecentTavernMessages } from '@/features/tavern/messages';

export default async function TavernPage() {
  const resident = await getCurrentResident();
  const messages = await listRecentTavernMessages(resident);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05060d] text-stone-100">
      <div className="absolute inset-0 bg-[url('/tavern-background.jpeg')] bg-cover bg-center opacity-70" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_24%,rgba(119,167,255,0.14),transparent_30%),linear-gradient(180deg,rgba(4,7,18,0.18)_0%,rgba(3,4,10,0.82)_68%,rgba(2,3,8,0.96)_100%)]" />
      <div className="absolute inset-0 backdrop-blur-[2px]" />
      <div className="absolute inset-0 shadow-[inset_0_0_160px_rgba(0,0,0,0.85)]" />

      <section className="relative mx-auto flex min-h-screen w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-10">
        <TavernClient initialMessages={messages} resident={resident} />
      </section>
    </main>
  );
}
```

Append these animations to `src/app/globals.css`:

```css
@keyframes tavern-composer-rise {
  from {
    opacity: 0;
    transform: translateY(1.2rem);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes tavern-meta-fade {
  from {
    opacity: 0;
    transform: translateY(0.25rem);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
corepack pnpm vitest run src/components/tavern/tavern-client.test.tsx
```

Expected: PASS once the shell/test IDs exist after the later client rewrite. If this task is implemented before Task 5, keep the test red and move directly into Task 5 without committing yet.

- [ ] **Step 5: Commit**

```bash
git add public/tavern-background.jpeg src/app/tavern/page.tsx src/app/globals.css src/components/tavern/tavern-client.test.tsx
git commit -m "feat: add tavern background shell"
```

---

### Task 3: Create square avatar component

**Files:**
- Create: `src/components/tavern/tavern-avatar.tsx`
- Test: `src/components/tavern/tavern-client.test.tsx`

- [ ] **Step 1: Write the failing test**

Add this test to `src/components/tavern/tavern-client.test.tsx`:

```tsx
it('renders a stable square avatar with the nickname initial', () => {
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
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
corepack pnpm vitest run src/components/tavern/tavern-client.test.tsx
```

Expected: FAIL because there is no dedicated avatar element yet.

- [ ] **Step 3: Write minimal implementation**

Create `src/components/tavern/tavern-avatar.tsx`:

```tsx
function getAvatarToken(nickname: string) {
  const trimmed = nickname.trim();
  const first = trimmed[0] ?? '?';
  let hash = 0;

  for (const char of trimmed) {
    hash = (hash * 33 + char.charCodeAt(0)) % 360;
  }

  return {
    initial: first.toUpperCase(),
    background: `hsla(${hash} 70% 68% / 0.28)`,
    border: `hsla(${hash} 76% 72% / 0.48)`,
  };
}

export function TavernAvatar({ nickname }: { nickname: string }) {
  const token = getAvatarToken(nickname);

  return (
    <div
      aria-label={`${nickname} 的头像`}
      className="aspect-square size-18 shrink-0 rounded-none border text-center text-2xl font-semibold text-white/92 shadow-[0_0_24px_rgba(0,0,0,0.18)]"
      style={{ backgroundColor: token.background, borderColor: token.border }}
    >
      <span className="flex h-full items-center justify-center">{token.initial}</span>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
corepack pnpm vitest run src/components/tavern/tavern-client.test.tsx
```

Expected: PASS for the new avatar assertion after Task 5 wires the avatar into each message item.

- [ ] **Step 5: Commit**

```bash
git add src/components/tavern/tavern-avatar.tsx src/components/tavern/tavern-client.test.tsx
git commit -m "feat: add tavern avatar tokens"
```

---

### Task 4: Create extensible tavern context menu

**Files:**
- Create: `src/components/tavern/tavern-context-menu.tsx`
- Test: `src/components/tavern/tavern-client.test.tsx`

- [ ] **Step 1: Write the failing test**

Add this test to `src/components/tavern/tavern-client.test.tsx`:

```tsx
it('opens a right-click menu with withdraw for the resident own message', async () => {
  mockFetch();
  const user = userEvent.setup();

  render(
    <TavernClient
      initialMessages={[
        {
          id: 'msg-1',
          content: '测试消息',
          createdAt: '2026-05-21T20:00:00.000Z',
          isDeleted: false,
          deleteReason: null,
          canWithdraw: true,
          canModerate: false,
          author: { id: 'a1', nickname: '阿北', avatarUrl: null, role: 'resident' },
        },
      ]}
      resident={{ id: 'a1', name: '阿北', role: 'resident' }}
    />,
  );

  await user.pointer({
    target: screen.getByText('测试消息'),
    keys: '[MouseRight]',
  });

  expect(screen.getByRole('menu')).toBeInTheDocument();
  expect(screen.getByRole('menuitem', { name: '撤回' })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
corepack pnpm vitest run src/components/tavern/tavern-client.test.tsx
```

Expected: FAIL because no right-click menu exists.

- [ ] **Step 3: Write minimal implementation**

Create `src/components/tavern/tavern-context-menu.tsx`:

```tsx
export type TavernMenuAction = {
  key: string;
  label: string;
  tone?: 'default' | 'danger';
  onSelect: () => void;
};

export function TavernContextMenu({
  actions,
  x,
  y,
}: {
  actions: TavernMenuAction[];
  x: number;
  y: number;
}) {
  return (
    <div
      className="fixed z-40 min-w-32 rounded-xl border border-white/15 bg-[#131722]/92 p-2 shadow-[0_18px_48px_rgba(0,0,0,0.42)] backdrop-blur-md"
      role="menu"
      style={{ left: x, top: y }}
    >
      {actions.map((action) => (
        <button
          className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition hover:bg-white/8 ${action.tone === 'danger' ? 'text-rose-200' : 'text-stone-200'}`}
          key={action.key}
          onClick={action.onSelect}
          role="menuitem"
          type="button"
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
corepack pnpm vitest run src/components/tavern/tavern-client.test.tsx
```

Expected: PASS for the right-click menu assertions after Task 5 connects it.

- [ ] **Step 5: Commit**

```bash
git add src/components/tavern/tavern-context-menu.tsx src/components/tavern/tavern-client.test.tsx
git commit -m "feat: add tavern context menu"
```

---

### Task 5: Create message-item component with bubble, hover meta, and deleted state

**Files:**
- Create: `src/components/tavern/tavern-message-item.tsx`
- Modify: `src/components/tavern/tavern-client.tsx`
- Test: `src/components/tavern/tavern-client.test.tsx`

- [ ] **Step 1: Write the failing tests**

Replace `src/components/tavern/tavern-client.test.tsx` with:

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TavernClient } from './tavern-client';

const withdrawTavernMessageAction = vi.fn();
const moderateTavernMessageAction = vi.fn();
const sendTavernMessageAction = vi.fn();

vi.mock('@/features/tavern/actions', () => ({
  moderateTavernMessageAction,
  sendTavernMessageAction,
  withdrawTavernMessageAction,
}));

function mockFetch(messages = []) {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => ({ messages }),
  } as Response);
}

describe('TavernClient', () => {
  it('renders the chat page inside a dedicated scroll shell instead of a full-page flow', () => {
    mockFetch();
    render(<TavernClient initialMessages={[]} resident={{ id: 'r1', name: '阿北', role: 'resident' }} />);

    expect(screen.getByTestId('tavern-shell')).toBeInTheDocument();
    expect(screen.getByTestId('tavern-messages-scroll')).toHaveClass('overflow-y-auto');
    expect(screen.getByTestId('tavern-composer')).toHaveClass('sticky');
  });

  it('uses the shorter placeholder and removes the identity helper copy', () => {
    mockFetch();
    render(<TavernClient initialMessages={[]} resident={{ id: 'r1', name: '阿北', role: 'resident' }} />);

    expect(screen.getByPlaceholderText('说点什么...')).toBeInTheDocument();
    expect(screen.queryByText(/最多 500 字/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/以 .* 的身份发言/i)).not.toBeInTheDocument();
  });

  it('renders a stable square avatar with the nickname initial', () => {
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
  });

  it('hides nickname by default and reveals nickname with time on hover', async () => {
    mockFetch();
    const user = userEvent.setup();
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

    expect(screen.queryByText('默弥')).not.toBeInTheDocument();
    await user.hover(screen.getByText('今晚有风。'));
    expect(screen.getByText('默弥')).toBeInTheDocument();
    expect(screen.getByText('2026-05-21 20:00')).toBeInTheDocument();
  });

  it('opens a right-click menu with withdraw for the resident own message', async () => {
    mockFetch();
    const user = userEvent.setup();
    withdrawTavernMessageAction.mockResolvedValue({ ok: true });

    render(
      <TavernClient
        initialMessages={[
          {
            id: 'msg-1',
            content: '测试消息',
            createdAt: '2026-05-21T20:00:00.000Z',
            isDeleted: false,
            deleteReason: null,
            canWithdraw: true,
            canModerate: false,
            author: { id: 'a1', nickname: '阿北', avatarUrl: null, role: 'resident' },
          },
        ]}
        resident={{ id: 'a1', name: '阿北', role: 'resident' }}
      />,
    );

    await user.pointer({ target: screen.getByText('测试消息'), keys: '[MouseRight]' });
    expect(screen.getByRole('menuitem', { name: '撤回' })).toBeInTheDocument();
  });

  it('renders deleted messages in the bubble layout', () => {
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

    expect(screen.getByText('这条消息已经离开了酒馆。')).toBeInTheDocument();
    expect(screen.getByLabelText('旅人甲 的头像')).toBeInTheDocument();
  });

  it('opens long-text mode as an upward overlay instead of growing normal layout height', async () => {
    mockFetch();
    const user = userEvent.setup();
    render(<TavernClient initialMessages={[]} resident={{ id: 'r1', name: '阿北', role: 'resident' }} />);

    await user.click(screen.getByRole('button', { name: '展开长文本' }));
    expect(screen.getByTestId('tavern-composer-overlay')).toHaveAttribute('data-state', 'open');
    expect(screen.getByTestId('tavern-composer-overlay')).toHaveClass('absolute');
  });

  it('renders a guest prompt when not logged in', () => {
    mockFetch();
    render(<TavernClient initialMessages={[]} resident={null} />);

    expect(screen.getByText('游客可以旁听。')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '登录后发言' })).toHaveAttribute('href', '/login');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
corepack pnpm vitest run src/components/tavern/tavern-client.test.tsx
```

Expected: FAIL across multiple assertions because the current client still renders the older linear article layout.

- [ ] **Step 3: Write minimal implementation**

Create `src/components/tavern/tavern-message-item.tsx`:

```tsx
import { useState } from 'react';
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
  const [hovered, setHovered] = useState(false);

  return (
    <div className="group relative flex gap-4" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <TavernAvatar nickname={message.author.nickname} />
      <div className="relative max-w-[min(42rem,calc(100%-6rem))]">
        {hovered ? (
          <div className="mb-2 animate-[tavern-meta-fade_180ms_ease-out_both] rounded-full bg-black/28 px-3 py-1 text-xs tracking-[0.2em] text-stone-200/88">
            <span>{message.author.nickname}</span>
            <span className="mx-2 text-stone-500">·</span>
            <span>{formatMessageTime(message.createdAt)}</span>
          </div>
        ) : null}
        <article
          className="relative rounded-sm border border-white/12 bg-white/[0.08] px-5 py-4 text-stone-100 shadow-[0_10px_34px_rgba(0,0,0,0.16)] backdrop-blur-md transition duration-300 group-hover:border-white/18 group-hover:bg-white/[0.11]"
          onContextMenu={(event) => {
            event.preventDefault();
            onContextMenu(message, event.clientX, event.clientY);
          }}
        >
          <span className="absolute left-[-0.7rem] top-8 h-0 w-0 border-y-[10px] border-r-[12px] border-y-transparent border-r-white/10" />
          {message.isDeleted ? (
            <p className="text-stone-400/88">这条消息已经离开了酒馆。</p>
          ) : (
            <MarkdownMessage content={message.content} />
          )}
        </article>
      </div>
    </div>
  );
}
```

Then replace `src/components/tavern/tavern-client.tsx` with:

```tsx
'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import type { CurrentResident } from '@/features/residents/session';
import { moderateTavernMessageAction, sendTavernMessageAction, withdrawTavernMessageAction } from '@/features/tavern/actions';
import type { TavernActionResult, TavernMessageView } from '@/features/tavern/types';
import { TavernContextMenu, type TavernMenuAction } from './tavern-context-menu';
import { TavernMessageItem } from './tavern-message-item';

type OpenMenuState = {
  message: TavernMessageView;
  x: number;
  y: number;
} | null;

export function TavernClient({
  initialMessages,
  resident,
}: {
  initialMessages: TavernMessageView[];
  resident: CurrentResident | null;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [content, setContent] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isLongText, setIsLongText] = useState(false);
  const [openMenu, setOpenMenu] = useState<OpenMenuState>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const latestCreatedAt = useMemo(() => messages.at(-1)?.createdAt, [messages]);

  useEffect(() => {
    const interval = window.setInterval(async () => {
      const query = latestCreatedAt ? `?after=${encodeURIComponent(latestCreatedAt)}` : '';
      const response = await fetch(`/api/tavern/messages${query}`);
      if (!response.ok) return;

      const data = (await response.json()) as { messages: TavernMessageView[] };
      if (data.messages.length === 0) return;

      setMessages((current) => {
        const existingIds = new Set(current.map((message) => message.id));
        const nextMessages = data.messages.filter((message) => !existingIds.has(message.id));
        return [...current, ...nextMessages];
      });
    }, 3000);

    return () => window.clearInterval(interval);
  }, [latestCreatedAt]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView?.({ block: 'end' });
  }, [messages.length]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpenMenu(null);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  function runAction(action: () => Promise<TavernActionResult>) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setNotice(result.error);
        return;
      }

      setNotice(null);
      setOpenMenu(null);
      await refreshMessages();
    });
  }

  async function refreshMessages() {
    const response = await fetch('/api/tavern/messages');
    if (!response.ok) return;

    const data = (await response.json()) as { messages: TavernMessageView[] };
    setMessages(data.messages);
  }

  const menuActions: TavernMenuAction[] = openMenu?.message.canWithdraw
    ? [
        {
          key: 'withdraw',
          label: '撤回',
          tone: 'danger',
          onSelect: () => {
            const formData = new FormData();
            formData.set('messageId', openMenu.message.id);
            runAction(() => withdrawTavernMessageAction(formData));
          },
        },
      ]
    : [];

  return (
    <div className="flex min-h-[calc(100vh-3rem)] w-full flex-col" data-testid="tavern-shell" onClick={() => setOpenMenu(null)}>
      <div className="mb-5 flex items-start justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <p className="text-xs tracking-[0.55em] text-cyan-100/72">TAVERN</p>
          <h1 className="mt-2 font-serif text-4xl font-semibold tracking-[0.18em] text-stone-50">小酒馆</h1>
        </div>
        <Link className="rounded-full border border-white/18 px-4 py-2 text-sm tracking-[0.34em] text-stone-200/76 transition duration-500 hover:border-cyan-200/45 hover:text-cyan-100" href="/">
          回到镇口
        </Link>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/18 shadow-[0_20px_80px_rgba(0,0,0,0.22)] backdrop-blur-sm">
        <div className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(5,7,15,0.50),transparent)]" />

        <div
          className="relative h-full overflow-y-auto px-4 pb-40 pt-5 sm:px-6"
          data-testid="tavern-messages-scroll"
          onScroll={() => setOpenMenu(null)}
        >
          <div className="space-y-5">
            {messages.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-sm tracking-[0.28em] text-stone-400">
                今晚的小酒馆还很安静。
              </p>
            ) : null}

            {messages.map((message) => (
              <TavernMessageItem
                key={message.id}
                message={message}
                onContextMenu={(nextMessage, x, y) => setOpenMenu({ message: nextMessage, x, y })}
              />
            ))}

            <div ref={messagesEndRef} />
          </div>
        </div>

        <div
          className="sticky bottom-0 z-20 border-t border-white/10 bg-[linear-gradient(180deg,rgba(7,10,20,0.08),rgba(7,10,20,0.88)_22%,rgba(7,10,20,0.95)_100%)] px-4 pb-5 pt-4 backdrop-blur-md sm:px-6"
          data-testid="tavern-composer"
        >
          {resident ? (
            <form
              action={(formData) => {
                runAction(async () => {
                  const result = await sendTavernMessageAction(formData);
                  if (result.ok) {
                    setContent('');
                    setIsLongText(false);
                  }
                  return result;
                });
              }}
            >
              <div className="relative">
                <div
                  className={`pointer-events-none absolute inset-x-0 bottom-full mb-3 origin-bottom rounded-[1.2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(22,25,38,0.84),rgba(12,14,24,0.95))] px-4 py-4 shadow-[0_-18px_42px_rgba(0,0,0,0.26)] backdrop-blur-xl transition duration-500 ${isLongText ? 'visible translate-y-0 opacity-100' : 'invisible translate-y-4 opacity-0'}`}
                  data-state={isLongText ? 'open' : 'closed'}
                  data-testid="tavern-composer-overlay"
                >
                  <textarea
                    className="pointer-events-auto h-[50vh] w-full resize-none bg-transparent text-stone-100 outline-none placeholder:text-stone-500"
                    maxLength={500}
                    name="content"
                    onChange={(event) => setContent(event.target.value)}
                    placeholder="说点什么..."
                    value={content}
                  />
                </div>

                <div className="flex items-end gap-3 rounded-[1.2rem] border border-white/12 bg-white/[0.05] px-3 py-3">
                  <button
                    aria-label={isLongText ? '收起' : '展开长文本'}
                    className="group flex shrink-0 items-center justify-center rounded-xl border border-white/12 bg-white/[0.05] p-3 transition duration-300 hover:border-cyan-200/30 hover:bg-white/[0.09]"
                    onClick={() => setIsLongText((value) => !value)}
                    type="button"
                  >
                    <svg aria-hidden="true" className="size-5 text-stone-300 transition group-hover:text-cyan-100" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
                      {isLongText ? (
                        <>
                          <path d="M8 11l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M8 17l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
                        </>
                      ) : (
                        <>
                          <path d="M8 7l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M8 13l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                        </>
                      )}
                    </svg>
                  </button>

                  <textarea
                    className={`w-full resize-none bg-transparent px-2 py-2 text-stone-100 outline-none placeholder:text-stone-500 ${isLongText ? 'opacity-0' : 'min-h-[3rem]'}`}
                    maxLength={500}
                    name="content"
                    onChange={(event) => setContent(event.target.value)}
                    placeholder="说点什么..."
                    rows={1}
                    value={content}
                  />

                  <button
                    aria-label="发送"
                    className="group flex shrink-0 items-center justify-center rounded-xl border border-white/12 bg-white/[0.05] p-3 transition duration-300 hover:border-cyan-200/40 hover:bg-cyan-200/10 disabled:opacity-30"
                    disabled={isPending}
                    type="submit"
                  >
                    <svg aria-hidden="true" className="size-5 text-stone-300 transition group-hover:text-cyan-100" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
                      <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>

              {notice ? <p className="mt-3 rounded-xl border border-red-300/20 bg-red-950/30 p-3 text-sm text-red-100">{notice}</p> : null}
            </form>
          ) : (
            <div className="flex flex-col items-center gap-4 py-4">
              <p className="text-sm tracking-[0.28em] text-stone-300">游客可以旁听。</p>
              <Link className="rounded-full border border-white/20 px-8 py-3 text-sm tracking-[0.35em] text-stone-200 transition duration-500 hover:border-cyan-200/50 hover:text-cyan-100" href="/login">
                登录后发言
              </Link>
            </div>
          )}
        </div>
      </div>

      {openMenu && menuActions.length > 0 ? <TavernContextMenu actions={menuActions} x={openMenu.x} y={openMenu.y} /> : null}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
corepack pnpm vitest run src/components/tavern/tavern-client.test.tsx
```

Expected: PASS for shell, placeholder, avatar, hover meta, right-click menu, deleted state, overlay composer, and guest prompt.

- [ ] **Step 5: Commit**

```bash
git add src/components/tavern/tavern-client.tsx src/components/tavern/tavern-client.test.tsx src/components/tavern/tavern-message-item.tsx src/components/tavern/tavern-avatar.tsx src/components/tavern/tavern-context-menu.tsx
git commit -m "feat: redesign tavern chat layout"
```

---

### Task 6: Add close behavior and withdraw action wiring for the context menu

**Files:**
- Modify: `src/components/tavern/tavern-client.tsx`
- Test: `src/components/tavern/tavern-client.test.tsx`

- [ ] **Step 1: Write the failing tests**

Append these tests to `src/components/tavern/tavern-client.test.tsx`:

```tsx
it('closes the context menu on Escape and on scroll', async () => {
  mockFetch();
  const user = userEvent.setup();

  render(
    <TavernClient
      initialMessages={[
        {
          id: 'msg-1',
          content: '测试消息',
          createdAt: '2026-05-21T20:00:00.000Z',
          isDeleted: false,
          deleteReason: null,
          canWithdraw: true,
          canModerate: false,
          author: { id: 'a1', nickname: '阿北', avatarUrl: null, role: 'resident' },
        },
      ]}
      resident={{ id: 'a1', name: '阿北', role: 'resident' }}
    />,
  );

  await user.pointer({ target: screen.getByText('测试消息'), keys: '[MouseRight]' });
  expect(screen.getByRole('menu')).toBeInTheDocument();

  fireEvent.keyDown(window, { key: 'Escape' });
  expect(screen.queryByRole('menu')).not.toBeInTheDocument();

  await user.pointer({ target: screen.getByText('测试消息'), keys: '[MouseRight]' });
  fireEvent.scroll(screen.getByTestId('tavern-messages-scroll'));
  expect(screen.queryByRole('menu')).not.toBeInTheDocument();
});

it('submits withdraw from the context menu', async () => {
  mockFetch();
  const user = userEvent.setup();
  withdrawTavernMessageAction.mockResolvedValue({ ok: true });

  render(
    <TavernClient
      initialMessages={[
        {
          id: 'msg-1',
          content: '测试消息',
          createdAt: '2026-05-21T20:00:00.000Z',
          isDeleted: false,
          deleteReason: null,
          canWithdraw: true,
          canModerate: false,
          author: { id: 'a1', nickname: '阿北', avatarUrl: null, role: 'resident' },
        },
      ]}
      resident={{ id: 'a1', name: '阿北', role: 'resident' }}
    />,
  );

  await user.pointer({ target: screen.getByText('测试消息'), keys: '[MouseRight]' });
  await user.click(screen.getByRole('menuitem', { name: '撤回' }));

  expect(withdrawTavernMessageAction).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
corepack pnpm vitest run src/components/tavern/tavern-client.test.tsx
```

Expected: FAIL until menu dismissal and withdraw flow are fully wired.

- [ ] **Step 3: Write minimal implementation**

Ensure `src/components/tavern/tavern-client.tsx` contains these exact menu-closing hooks:

```tsx
useEffect(() => {
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      setOpenMenu(null);
    }
  }

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

And make sure the scroll region and shell close the menu:

```tsx
<div className="flex min-h-[calc(100vh-3rem)] w-full flex-col" data-testid="tavern-shell" onClick={() => setOpenMenu(null)}>
```

```tsx
<div
  className="relative h-full overflow-y-auto px-4 pb-40 pt-5 sm:px-6"
  data-testid="tavern-messages-scroll"
  onScroll={() => setOpenMenu(null)}
>
```

And keep the withdraw action exactly in the menu action list:

```tsx
const menuActions: TavernMenuAction[] = openMenu?.message.canWithdraw
  ? [
      {
        key: 'withdraw',
        label: '撤回',
        tone: 'danger',
        onSelect: () => {
          const formData = new FormData();
          formData.set('messageId', openMenu.message.id);
          runAction(() => withdrawTavernMessageAction(formData));
        },
      },
    ]
  : [];
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
corepack pnpm vitest run src/components/tavern/tavern-client.test.tsx
```

Expected: PASS for menu closing and withdraw execution.

- [ ] **Step 5: Commit**

```bash
git add src/components/tavern/tavern-client.tsx src/components/tavern/tavern-client.test.tsx
git commit -m "feat: wire tavern menu actions"
```

---

### Task 7: Verify the tavern page, home page, and full project checks

**Files:**
- Modify: none if all earlier tasks are complete
- Test: existing suite only

- [ ] **Step 1: Run targeted home and tavern tests**

Run:

```bash
corepack pnpm vitest run src/components/home/home-client.test.tsx src/components/tavern/tavern-client.test.tsx
```

Expected: PASS for all homepage and tavern component tests.

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

Expected: PASS with zero lint errors.

- [ ] **Step 4: Run production build**

Run:

```bash
corepack pnpm build
```

Expected: PASS with successful Next.js build.

- [ ] **Step 5: Run manual browser verification**

Run:

```bash
corepack pnpm dev
```

Then verify manually:

1. Open `/` and confirm the red hydration mismatch button no longer appears.
2. Open `/tavern` and confirm the background image is visible but subdued.
3. Confirm only the message region scrolls.
4. Confirm the composer stays fixed.
5. Confirm long-text mode opens upward over the messages.
6. Confirm hover shows nickname and timestamp.
7. Confirm right-click on your own message shows the withdraw menu.
8. Confirm guest state still links to `/login`.

- [ ] **Step 6: Commit**

```bash
git add src/components/home/home-client.tsx src/components/home/home-client.test.tsx src/components/tavern/tavern-client.tsx src/components/tavern/tavern-client.test.tsx src/components/tavern/tavern-avatar.tsx src/components/tavern/tavern-context-menu.tsx src/components/tavern/tavern-message-item.tsx src/app/tavern/page.tsx src/app/globals.css public/tavern-background.jpeg
git commit -m "feat: polish tavern chat experience"
```

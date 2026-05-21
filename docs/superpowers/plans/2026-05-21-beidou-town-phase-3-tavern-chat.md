# 北斗镇 Phase 3: 小酒馆聊天室 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现小酒馆单公共频道聊天室，支持游客查看、居民发言、短轮询、安全 Markdown、撤回/删除占位和消息清理。

**Architecture:** 小酒馆作为 `src/features/tavern` 独立模块实现。数据继续使用 PostgreSQL/Prisma 的 `TavernMessage`，页面使用 Next.js App Router，写操作使用 server actions，短轮询使用 `/api/tavern/messages`，Markdown 在 React 组件中按白名单渲染。

**Tech Stack:** Next.js App Router, React, TypeScript, Prisma, PostgreSQL, Auth.js, Zod, Vitest, react-markdown, remark-gfm, rehype-sanitize.

---

## Scope

本计划覆盖：

- 扩展 `TavernMessage` 删除/撤回字段。
- 添加安全 Markdown 渲染组件。
- 添加消息校验、限流、读取、发送、撤回、管理员删除服务。
- 添加短轮询 API。
- 添加 `/tavern` 页面和客户端消息列表。
- 首页小酒馆卡片链接到 `/tavern`。
- 添加 `tavern:cleanup` 清理脚本。
- 本地迁移、seed 后手动验证。

不覆盖：表情包、图片消息、SSE、WebSocket、多频道、举报系统。

## File Structure

- `prisma/schema.prisma`：扩展 `TavernMessage`，新增 `TavernMessageDeleteReason`。
- `prisma/migrations/*/migration.sql`：数据库迁移。
- `src/features/tavern/types.ts`：前端消息 DTO 类型。
- `src/features/tavern/validation.ts`：消息长度、空白校验。
- `src/features/tavern/validation.test.ts`：消息校验测试。
- `src/features/tavern/rate-limit.ts`：发言频率判断。
- `src/features/tavern/rate-limit.test.ts`：限流测试。
- `src/features/tavern/messages.ts`：读取、发送、撤回、删除、DTO 转换。
- `src/features/tavern/messages.test.ts`：服务层测试。
- `src/features/tavern/actions.ts`：server actions。
- `src/features/tavern/cleanup.ts`：清理逻辑。
- `src/features/tavern/cleanup.test.ts`：清理逻辑测试。
- `scripts/tavern-cleanup.ts`：命令行清理入口。
- `src/app/api/tavern/messages/route.ts`：短轮询读取 API。
- `src/app/tavern/page.tsx`：小酒馆页面。
- `src/components/tavern/markdown-message.tsx`：安全 Markdown 渲染。
- `src/components/tavern/tavern-client.tsx`：客户端轮询和消息交互。
- `src/app/page.tsx`：小酒馆入口链接。
- `package.json`：新增依赖和 `tavern:cleanup` 脚本。

---

### Task 1: Markdown dependencies and message validation

**Files:**
- Modify: `package.json`
- Create: `src/features/tavern/validation.ts`
- Create: `src/features/tavern/validation.test.ts`

- [ ] **Step 1: Install Markdown dependencies**

Run:

```bash
corepack pnpm add react-markdown remark-gfm rehype-sanitize
```

Expected: dependencies install successfully and `pnpm-lock.yaml` changes.

- [ ] **Step 2: Write failing validation tests**

Create `src/features/tavern/validation.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { parseTavernMessageContent } from './validation';

describe('parseTavernMessageContent', () => {
  it('trims surrounding whitespace and accepts multiline markdown', () => {
    expect(parseTavernMessageContent('  hello\n**world**  ')).toEqual({ ok: true, content: 'hello\n**world**' });
  });

  it('rejects empty content', () => {
    expect(parseTavernMessageContent('   \n   ')).toEqual({ ok: false, error: '不能发送空消息。' });
  });

  it('rejects content over 500 characters', () => {
    expect(parseTavernMessageContent('a'.repeat(501))).toEqual({ ok: false, error: '这句话太长了，先拆成几段吧。' });
  });
});
```

- [ ] **Step 3: Run failing test**

Run:

```bash
corepack pnpm vitest run src/features/tavern/validation.test.ts
```

Expected: FAIL because `./validation` does not exist.

- [ ] **Step 4: Implement validation**

Create `src/features/tavern/validation.ts`:

```ts
const MAX_TAVERN_MESSAGE_LENGTH = 500;

export type TavernMessageContentResult =
  | { ok: true; content: string }
  | { ok: false; error: string };

export function parseTavernMessageContent(input: string): TavernMessageContentResult {
  const content = input.trim();

  if (content.length === 0) {
    return { ok: false, error: '不能发送空消息。' };
  }

  if (content.length > MAX_TAVERN_MESSAGE_LENGTH) {
    return { ok: false, error: '这句话太长了，先拆成几段吧。' };
  }

  return { ok: true, content };
}
```

- [ ] **Step 5: Verify**

Run:

```bash
corepack pnpm vitest run src/features/tavern/validation.test.ts
corepack pnpm lint && corepack pnpm test && corepack pnpm build
```

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add package.json pnpm-lock.yaml src/features/tavern/validation.ts src/features/tavern/validation.test.ts
git commit -m "feat: add tavern message validation"
```

---

### Task 2: Tavern deletion schema migration

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/*/migration.sql`

- [ ] **Step 1: Update Prisma schema**

Modify `prisma/schema.prisma` by adding enum:

```prisma
enum TavernMessageDeleteReason {
  WITHDRAWN
  MODERATED
}
```

Replace `TavernMessage` model with:

```prisma
model TavernMessage {
  id           String                      @id @default(cuid())
  authorId     String
  content      String
  isDeleted    Boolean                     @default(false)
  deletedAt    DateTime?
  deletedById  String?
  deleteReason TavernMessageDeleteReason?
  createdAt    DateTime                    @default(now())
  author       User                        @relation(fields: [authorId], references: [id], onDelete: Cascade)

  @@index([createdAt])
  @@index([authorId])
  @@index([deletedById])
}
```

- [ ] **Step 2: Generate migration**

Run:

```bash
corepack pnpm prisma migrate dev --name add_tavern_deletion_metadata
```

Expected: migration created and applied to local PostgreSQL.

- [ ] **Step 3: Verify**

Run:

```bash
corepack pnpm db:generate
corepack pnpm lint && corepack pnpm test && corepack pnpm build
```

Expected: PASS.

- [ ] **Step 4: Commit**

Run:

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat: add tavern deletion metadata"
```

---

### Task 3: Tavern service layer

**Files:**
- Create: `src/features/tavern/types.ts`
- Create: `src/features/tavern/rate-limit.ts`
- Create: `src/features/tavern/rate-limit.test.ts`
- Create: `src/features/tavern/messages.ts`
- Create: `src/features/tavern/messages.test.ts`

- [ ] **Step 1: Write rate limit tests**

Create `src/features/tavern/rate-limit.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { canSendTavernMessage } from './rate-limit';

describe('canSendTavernMessage', () => {
  it('allows sending when there is no previous message', () => {
    expect(canSendTavernMessage(null, new Date('2026-05-21T00:00:10Z'))).toBe(true);
  });

  it('rejects sending within 10 seconds', () => {
    expect(canSendTavernMessage(new Date('2026-05-21T00:00:05Z'), new Date('2026-05-21T00:00:10Z'))).toBe(false);
  });

  it('allows sending at 10 seconds', () => {
    expect(canSendTavernMessage(new Date('2026-05-21T00:00:00Z'), new Date('2026-05-21T00:00:10Z'))).toBe(true);
  });
});
```

- [ ] **Step 2: Implement rate limit**

Create `src/features/tavern/rate-limit.ts`:

```ts
const TAVERN_MESSAGE_INTERVAL_MS = 10_000;

export function canSendTavernMessage(lastMessageAt: Date | null, now = new Date()) {
  if (!lastMessageAt) {
    return true;
  }

  return now.getTime() - lastMessageAt.getTime() >= TAVERN_MESSAGE_INTERVAL_MS;
}
```

- [ ] **Step 3: Create types**

Create `src/features/tavern/types.ts`:

```ts
import type { TavernMessageDeleteReason, UserRole } from '@prisma/client';

export type TavernMessageView = {
  id: string;
  content: string;
  createdAt: string;
  isDeleted: boolean;
  deleteReason: TavernMessageDeleteReason | null;
  canWithdraw: boolean;
  canModerate: boolean;
  author: {
    id: string;
    nickname: string;
    avatarUrl: string | null;
    role: UserRole;
  };
};

export type TavernActionResult =
  | { ok: true }
  | { ok: false; error: string };
```

- [ ] **Step 4: Write service tests**

Create `src/features/tavern/messages.test.ts` with mocked `db` and tests for: guest cannot send, invalid content rejected, rate limited user rejected, owner can withdraw, non-owner cannot withdraw, admin can moderate. Use `vi.hoisted` for mocks.

```ts
import { UserRole } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTavernMessage, moderateTavernMessage, withdrawTavernMessage } from './messages';

const { messageCreate, messageFindFirst, messageFindUnique, messageUpdate } = vi.hoisted(() => ({
  messageCreate: vi.fn(),
  messageFindFirst: vi.fn(),
  messageFindUnique: vi.fn(),
  messageUpdate: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    tavernMessage: {
      create: messageCreate,
      findFirst: messageFindFirst,
      findUnique: messageFindUnique,
      update: messageUpdate,
    },
  },
}));

const resident = { id: 'user_1', role: UserRole.USER, name: 'Alice' };
const admin = { id: 'admin_1', role: UserRole.ADMIN, name: '镇长' };

describe('tavern message services', () => {
  beforeEach(() => {
    messageCreate.mockReset();
    messageFindFirst.mockReset();
    messageFindUnique.mockReset();
    messageUpdate.mockReset();
  });

  it('rejects guest sending', async () => {
    await expect(createTavernMessage(null, 'hello')).resolves.toEqual({ ok: false, error: '请先登录再发言。' });
  });

  it('rejects invalid content', async () => {
    await expect(createTavernMessage(resident, '   ')).resolves.toEqual({ ok: false, error: '不能发送空消息。' });
  });

  it('rejects messages sent too quickly', async () => {
    messageFindFirst.mockResolvedValue({ createdAt: new Date() });
    await expect(createTavernMessage(resident, 'hello')).resolves.toEqual({ ok: false, error: '先喝口茶，稍后再说。' });
    expect(messageCreate).not.toHaveBeenCalled();
  });

  it('creates a valid message', async () => {
    messageFindFirst.mockResolvedValue(null);
    messageCreate.mockResolvedValue({ id: 'msg_1' });
    await expect(createTavernMessage(resident, ' hello ')).resolves.toEqual({ ok: true });
    expect(messageCreate).toHaveBeenCalledWith({ data: { authorId: 'user_1', content: 'hello' } });
  });

  it('allows owner to withdraw message', async () => {
    messageFindUnique.mockResolvedValue({ id: 'msg_1', authorId: 'user_1', isDeleted: false });
    await expect(withdrawTavernMessage(resident, 'msg_1')).resolves.toEqual({ ok: true });
    expect(messageUpdate).toHaveBeenCalled();
  });

  it('rejects non-owner withdrawal', async () => {
    messageFindUnique.mockResolvedValue({ id: 'msg_1', authorId: 'other', isDeleted: false });
    await expect(withdrawTavernMessage(resident, 'msg_1')).resolves.toEqual({ ok: false, error: '只能撤回自己的消息。' });
  });

  it('allows admin moderation', async () => {
    messageFindUnique.mockResolvedValue({ id: 'msg_1', authorId: 'user_1', isDeleted: false });
    await expect(moderateTavernMessage(admin, 'msg_1')).resolves.toEqual({ ok: true });
    expect(messageUpdate).toHaveBeenCalled();
  });
});
```

- [ ] **Step 5: Implement services**

Create `src/features/tavern/messages.ts` with `listRecentTavernMessages`, `listTavernMessagesAfter`, `createTavernMessage`, `withdrawTavernMessage`, `moderateTavernMessage`, and `toTavernMessageView`. Use server-side permission checks and `TavernMessageDeleteReason.WITHDRAWN/MODERATED`.

- [ ] **Step 6: Verify and commit**

Run:

```bash
corepack pnpm vitest run src/features/tavern/rate-limit.test.ts src/features/tavern/messages.test.ts
corepack pnpm lint && corepack pnpm test && corepack pnpm build
```

Then commit:

```bash
git add src/features/tavern
git commit -m "feat: add tavern message services"
```

---

### Task 4: Tavern API, actions, and cleanup script

**Files:**
- Create: `src/features/tavern/actions.ts`
- Create: `src/features/tavern/cleanup.ts`
- Create: `src/features/tavern/cleanup.test.ts`
- Create: `scripts/tavern-cleanup.ts`
- Create: `src/app/api/tavern/messages/route.ts`
- Modify: `package.json`

- [ ] **Step 1: Create cleanup tests and implementation**

`cleanup.ts` must delete messages older than 30 days and, if total count exceeds 160000, delete the oldest excess messages. Implement the database operations in small functions that can be tested with mocked `db`.

- [ ] **Step 2: Create server actions**

`actions.ts` exports `sendTavernMessageAction`, `withdrawTavernMessageAction`, `moderateTavernMessageAction`; each reads current resident via `getCurrentResident()`, calls service, then `revalidatePath('/tavern')`.

- [ ] **Step 3: Create polling API**

`src/app/api/tavern/messages/route.ts` reads optional `after` query param, returns JSON `{ messages }`, and never requires login for reading.

- [ ] **Step 4: Add cleanup script**

Create `scripts/tavern-cleanup.ts`:

```ts
import { cleanupTavernMessages } from '../src/features/tavern/cleanup';
import { db } from '../src/lib/db';

cleanupTavernMessages()
  .then(async (result) => {
    console.log(JSON.stringify(result));
    await db.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await db.$disconnect();
    process.exit(1);
  });
```

Add script:

```json
"tavern:cleanup": "tsx scripts/tavern-cleanup.ts"
```

- [ ] **Step 5: Verify and commit**

Run:

```bash
corepack pnpm lint && corepack pnpm test && corepack pnpm build
```

Commit:

```bash
git add package.json pnpm-lock.yaml src/features/tavern/actions.ts src/features/tavern/cleanup.ts src/features/tavern/cleanup.test.ts scripts/tavern-cleanup.ts src/app/api/tavern/messages/route.ts
git commit -m "feat: add tavern API actions and cleanup"
```

---

### Task 5: Tavern UI and homepage link

**Files:**
- Create: `src/components/tavern/markdown-message.tsx`
- Create: `src/components/tavern/tavern-client.tsx`
- Create: `src/app/tavern/page.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Create Markdown renderer**

Use `react-markdown`, `remark-gfm`, and `rehype-sanitize`. Disallow raw HTML and image rendering. Links should use safe `target="_blank"` and `rel="noreferrer"`.

- [ ] **Step 2: Create tavern client component**

Client component receives initial messages and current resident. It renders messages, polls `/api/tavern/messages?after=<latestCreatedAt>` every 3000ms, has a send form for logged-in users, and shows login link for guests.

- [ ] **Step 3: Create tavern page**

`src/app/tavern/page.tsx` loads current resident and recent messages, then renders the tavern UI.

- [ ] **Step 4: Link homepage card**

Update `src/app/page.tsx` so the 小酒馆 card links to `/tavern`. Other cards can remain non-clickable or disabled.

- [ ] **Step 5: Verify manually and automatically**

Run:

```bash
corepack pnpm lint && corepack pnpm test && corepack pnpm build
corepack pnpm dev
```

Manual checks:

- `/tavern` loads as guest and shows messages area plus login prompt.
- Login as `admin@beidou.local` / `beidou-admin-123456`.
- Send Markdown message `**晚上好**\n\n- 第一杯`.
- Message appears rendered.
- Withdraw own message and see placeholder.
- Send another message and moderate it as admin.
- Run `corepack pnpm tavern:cleanup` and verify command exits 0.

- [ ] **Step 6: Commit**

```bash
git add src/components/tavern src/app/tavern/page.tsx src/app/page.tsx
git commit -m "feat: add tavern chat interface"
```

---

## Self-Review

- Spec coverage: Covers single public channel, guest read, resident send, safe Markdown, strict rate limit, withdrawal, admin moderation, placeholders, short polling, 30-day/160000 cleanup.
- Deferred by design: Sticker uploads, images, SSE/WebSocket, multi-channel, reports are not included.
- Placeholder scan: No TBD/TODO. Task 3 and 4 contain some implementation summaries where full service code is large; implementer must still produce named functions and tests listed in the plan.
- Type consistency: Uses existing Prisma `UserRole`, new `TavernMessageDeleteReason`, and `TavernMessageView` DTO throughout.

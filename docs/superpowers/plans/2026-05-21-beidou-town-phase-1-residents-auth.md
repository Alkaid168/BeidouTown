# 北斗镇 Phase 1: 居民系统与登录基础 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为北斗镇建立 PostgreSQL/Prisma 数据基础、邮箱密码注册登录、会话读取和受保护的小镇入口。

**Architecture:** 本阶段只实现居民系统，不实现小酒馆、树洞邮局、寺庙业务功能。认证采用 Auth.js Credentials Provider，密码使用 bcrypt 哈希，Prisma 管理数据库模型，服务端操作统一放在 `src/features/residents` 内。

**Tech Stack:** Next.js App Router, React, TypeScript, Prisma, PostgreSQL, Auth.js, bcryptjs, Zod, Vitest, Testing Library, pnpm.

---

## Scope

本计划覆盖：

- 安装认证、数据库和测试依赖。
- 创建 Prisma schema：User、TavernMessage、TreeholePost、TarotReading、AdminAction。
- 创建 Prisma client 单例。
- 实现居民注册服务和测试。
- 配置 Auth.js 邮箱密码登录。
- 创建注册页、登录页和登出按钮。
- 将小镇功能入口改为登录后可进入，未登录用户看到登录/注册入口。

本计划不覆盖：聊天室消息发送、树洞投递、塔罗 AI 解读、管理员后台页面、部署数据库容器。

## File Structure

- `prisma/schema.prisma`：数据库模型和枚举。
- `src/lib/db.ts`：Prisma client 单例。
- `src/auth.ts`：Auth.js 配置、session 类型映射和 credentials 校验。
- `src/app/api/auth/[...nextauth]/route.ts`：Auth.js route handler。
- `src/features/residents/password.ts`：密码哈希和校验。
- `src/features/residents/registration.ts`：注册输入校验和创建用户。
- `src/features/residents/actions.ts`：注册 server action。
- `src/features/residents/session.ts`：服务端读取当前居民。
- `src/app/register/page.tsx`：注册页面。
- `src/app/login/page.tsx`：登录页面。
- `src/components/logout-button.tsx`：客户端登出按钮。
- `src/app/page.tsx`：根据 session 展示入口或登录注册 CTA。
- `src/test/setup.ts`：Vitest DOM 测试环境。
- `src/features/residents/password.test.ts`：密码工具测试。
- `src/features/residents/registration.test.ts`：注册服务测试。
- `vitest.config.ts`：测试配置。
- `package.json`：新增脚本和依赖。
- `.env.example`：补充 Auth.js 和数据库说明。

---

### Task 1: 安装依赖和测试框架

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`

- [ ] **Step 1: 安装依赖**

Run:

```bash
corepack pnpm add @auth/prisma-adapter next-auth@beta @prisma/client bcryptjs zod
corepack pnpm add -D prisma vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @types/bcryptjs
```

Expected: dependencies 安装成功，`pnpm-lock.yaml` 更新。

- [ ] **Step 2: 修改 `package.json` scripts**

Ensure `package.json` scripts are:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

Keep existing dependencies and `packageManager`.

- [ ] **Step 3: 创建 `vitest.config.ts`**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

- [ ] **Step 4: 创建 `src/test/setup.ts`**

Create `src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 5: 运行测试命令，确认测试框架可启动**

Run:

```bash
corepack pnpm test
```

Expected: Vitest 启动并报告没有测试文件或 0 tests，不应出现配置错误。

- [ ] **Step 6: 运行 lint/build**

Run:

```bash
corepack pnpm lint && corepack pnpm build
```

Expected: PASS。

- [ ] **Step 7: 提交依赖和测试框架**

Run:

```bash
git add package.json pnpm-lock.yaml vitest.config.ts src/test/setup.ts
git commit -m "chore: add auth database and test dependencies"
```

Expected: commit 成功。

---

### Task 2: 建立 Prisma 数据模型和数据库 client

**Files:**
- Create: `prisma/schema.prisma`
- Create: `src/lib/db.ts`
- Modify: `.env.example`
- Modify: `package.json`

- [ ] **Step 1: 创建 `prisma/schema.prisma`**

Create `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  USER
  ADMIN
}

enum AdminActionType {
  DELETE_TAVERN_MESSAGE
  DELETE_TREEHOLE_POST
}

model User {
  id             String           @id @default(cuid())
  email          String           @unique
  passwordHash   String
  nickname       String
  avatarUrl      String?
  role           UserRole         @default(USER)
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt
  tavernMessages TavernMessage[]
  treeholePosts  TreeholePost[]
  tarotReadings  TarotReading[]
  adminActions   AdminAction[]
}

model TavernMessage {
  id        String   @id @default(cuid())
  authorId  String
  content   String
  isDeleted Boolean  @default(false)
  createdAt DateTime @default(now())
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)

  @@index([createdAt])
  @@index([authorId])
}

model TreeholePost {
  id          String   @id @default(cuid())
  authorId    String
  content     String
  isAnonymous Boolean  @default(true)
  isDeleted   Boolean  @default(false)
  createdAt   DateTime @default(now())
  author      User     @relation(fields: [authorId], references: [id], onDelete: Cascade)

  @@index([createdAt])
  @@index([authorId])
}

model TarotReading {
  id        String   @id @default(cuid())
  userId    String
  question  String
  cards     Json
  reading   String
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([createdAt])
  @@index([userId])
}

model AdminAction {
  id         String          @id @default(cuid())
  adminId    String
  actionType AdminActionType
  targetId   String
  createdAt  DateTime        @default(now())
  admin      User            @relation(fields: [adminId], references: [id], onDelete: Cascade)

  @@index([adminId])
  @@index([targetId])
  @@index([createdAt])
}
```

- [ ] **Step 2: 创建 `src/lib/db.ts`**

Create `src/lib/db.ts`:

```ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}
```

- [ ] **Step 3: 更新 `.env.example`**

Ensure `.env.example` contains:

```dotenv
# Database
DATABASE_URL="postgresql://beidou:beidou@localhost:5432/beidou_town"

# Auth
AUTH_SECRET="replace-with-a-secure-random-secret"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# AI Provider
AI_PROVIDER="mock"
AI_API_KEY=""
AI_BASE_URL=""
AI_MODEL=""

# Registration
REGISTRATION_MODE="open"
```

- [ ] **Step 4: 添加 Prisma scripts**

Ensure `package.json` scripts include:

```json
{
  "db:generate": "prisma generate",
  "db:migrate": "prisma migrate dev",
  "db:studio": "prisma studio"
}
```

Keep existing scripts.

- [ ] **Step 5: 生成 Prisma client**

Run:

```bash
corepack pnpm db:generate
```

Expected: Prisma Client generated successfully.

- [ ] **Step 6: 运行 lint/build/test**

Run:

```bash
corepack pnpm lint && corepack pnpm test && corepack pnpm build
```

Expected: PASS。

- [ ] **Step 7: 提交数据模型**

Run:

```bash
git add .env.example package.json pnpm-lock.yaml prisma/schema.prisma src/lib/db.ts
git commit -m "feat: add resident database models"
```

Expected: commit 成功。

---

### Task 3: 实现密码工具和注册服务

**Files:**
- Create: `src/features/residents/password.ts`
- Create: `src/features/residents/password.test.ts`
- Create: `src/features/residents/registration.ts`
- Create: `src/features/residents/registration.test.ts`

- [ ] **Step 1: 创建失败的密码测试**

Create `src/features/residents/password.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './password';

describe('resident password helpers', () => {
  it('hashes a password without storing the raw value', async () => {
    const hash = await hashPassword('correct horse battery staple');

    expect(hash).not.toBe('correct horse battery staple');
    expect(hash.length).toBeGreaterThan(20);
  });

  it('verifies matching and non-matching passwords', async () => {
    const hash = await hashPassword('correct horse battery staple');

    await expect(verifyPassword('correct horse battery staple', hash)).resolves.toBe(true);
    await expect(verifyPassword('wrong password', hash)).resolves.toBe(false);
  });
});
```

- [ ] **Step 2: 运行密码测试，确认失败**

Run:

```bash
corepack pnpm vitest run src/features/residents/password.test.ts
```

Expected: FAIL，提示找不到 `./password` 或导出函数。

- [ ] **Step 3: 创建 `src/features/residents/password.ts`**

Create `src/features/residents/password.ts`:

```ts
import bcrypt from 'bcryptjs';

const PASSWORD_COST = 12;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, PASSWORD_COST);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}
```

- [ ] **Step 4: 运行密码测试，确认通过**

Run:

```bash
corepack pnpm vitest run src/features/residents/password.test.ts
```

Expected: PASS。

- [ ] **Step 5: 创建失败的注册服务测试**

Create `src/features/residents/registration.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { registerResident } from './registration';

const userCreate = vi.fn();
const userFindUnique = vi.fn();

vi.mock('@/lib/db', () => ({
  db: {
    user: {
      create: userCreate,
      findUnique: userFindUnique,
    },
  },
}));

describe('registerResident', () => {
  beforeEach(() => {
    userCreate.mockReset();
    userFindUnique.mockReset();
  });

  it('creates a resident with normalized email and hashed password', async () => {
    userFindUnique.mockResolvedValue(null);
    userCreate.mockResolvedValue({
      id: 'user_1',
      email: 'alice@example.com',
      nickname: 'Alice',
      role: 'USER',
    });

    const result = await registerResident({
      email: ' Alice@Example.com ',
      password: 'correct horse battery staple',
      nickname: ' Alice ',
    });

    expect(result).toEqual({ ok: true, userId: 'user_1' });
    expect(userFindUnique).toHaveBeenCalledWith({ where: { email: 'alice@example.com' } });
    expect(userCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: 'alice@example.com',
        nickname: 'Alice',
      }),
      select: { id: true },
    });
    expect(userCreate.mock.calls[0][0].data.passwordHash).not.toBe('correct horse battery staple');
  });

  it('rejects duplicate email addresses', async () => {
    userFindUnique.mockResolvedValue({ id: 'existing' });

    const result = await registerResident({
      email: 'alice@example.com',
      password: 'correct horse battery staple',
      nickname: 'Alice',
    });

    expect(result).toEqual({ ok: false, error: '这个邮箱已经注册过了。' });
    expect(userCreate).not.toHaveBeenCalled();
  });

  it('rejects invalid input', async () => {
    const result = await registerResident({
      email: 'not-an-email',
      password: 'short',
      nickname: '',
    });

    expect(result.ok).toBe(false);
    expect(userFindUnique).not.toHaveBeenCalled();
    expect(userCreate).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 6: 运行注册测试，确认失败**

Run:

```bash
corepack pnpm vitest run src/features/residents/registration.test.ts
```

Expected: FAIL，提示找不到 `./registration` 或导出函数。

- [ ] **Step 7: 创建 `src/features/residents/registration.ts`**

Create `src/features/residents/registration.ts`:

```ts
import { z } from 'zod';
import { db } from '@/lib/db';
import { hashPassword } from './password';

const registrationSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
  nickname: z.string().trim().min(1).max(24),
});

type RegistrationInput = z.input<typeof registrationSchema>;

export type RegistrationResult =
  | { ok: true; userId: string }
  | { ok: false; error: string };

export async function registerResident(input: RegistrationInput): Promise<RegistrationResult> {
  const parsed = registrationSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: '请检查邮箱、密码和昵称。' };
  }

  const email = parsed.data.email.toLowerCase();
  const existingUser = await db.user.findUnique({ where: { email } });

  if (existingUser) {
    return { ok: false, error: '这个邮箱已经注册过了。' };
  }

  const user = await db.user.create({
    data: {
      email,
      passwordHash: await hashPassword(parsed.data.password),
      nickname: parsed.data.nickname,
    },
    select: { id: true },
  });

  return { ok: true, userId: user.id };
}
```

- [ ] **Step 8: 运行居民测试，确认通过**

Run:

```bash
corepack pnpm vitest run src/features/residents/password.test.ts src/features/residents/registration.test.ts
```

Expected: PASS。

- [ ] **Step 9: 运行全量验证**

Run:

```bash
corepack pnpm lint && corepack pnpm test && corepack pnpm build
```

Expected: PASS。

- [ ] **Step 10: 提交注册服务**

Run:

```bash
git add src/features/residents/password.ts src/features/residents/password.test.ts src/features/residents/registration.ts src/features/residents/registration.test.ts
git commit -m "feat: add resident registration service"
```

Expected: commit 成功。

---

### Task 4: 配置 Auth.js 登录和会话

**Files:**
- Create: `src/auth.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Create: `src/features/residents/session.ts`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: 创建 `src/auth.ts`**

Create `src/auth.ts`:

```ts
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { db } from '@/lib/db';
import { verifyPassword } from '@/features/residents/password';

const credentialsSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: '邮箱', type: 'email' },
        password: { label: '密码', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        const email = parsed.data.email.toLowerCase();
        const user = await db.user.findUnique({ where: { email } });

        if (!user) {
          return null;
        }

        const passwordMatches = await verifyPassword(parsed.data.password, user.passwordHash);

        if (!passwordMatches) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.nickname,
          image: user.avatarUrl,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? '';
        session.user.role = token.role;
      }

      return session;
    },
  },
});
```

- [ ] **Step 2: 创建 Auth.js 类型扩展 `src/auth.d.ts`**

Create `src/auth.d.ts`:

```ts
import type { DefaultSession } from 'next-auth';
import type { UserRole } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession['user'];
  }

  interface User {
    role: UserRole;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole;
  }
}
```

- [ ] **Step 3: 创建 `src/app/api/auth/[...nextauth]/route.ts`**

Create `src/app/api/auth/[...nextauth]/route.ts`:

```ts
import { handlers } from '@/auth';

export const { GET, POST } = handlers;
```

- [ ] **Step 4: 创建 `src/features/residents/session.ts`**

Create `src/features/residents/session.ts`:

```ts
import { auth } from '@/auth';

export async function getCurrentResident() {
  const session = await auth();

  return session?.user ?? null;
}
```

- [ ] **Step 5: 更新 `src/app/layout.tsx`**

Replace `src/app/layout.tsx` with:

```tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '北斗镇',
  description: '一个神秘夜色气质的网页小镇。',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 6: 运行验证**

Run:

```bash
corepack pnpm lint && corepack pnpm test && corepack pnpm build
```

Expected: PASS。

- [ ] **Step 7: 提交认证配置**

Run:

```bash
git add src/auth.ts src/auth.d.ts src/app/api/auth/[...nextauth]/route.ts src/features/residents/session.ts src/app/layout.tsx
git commit -m "feat: configure resident authentication"
```

Expected: commit 成功。

---

### Task 5: 创建注册、登录、登出界面和受保护首页

**Files:**
- Create: `src/features/residents/actions.ts`
- Create: `src/app/register/page.tsx`
- Create: `src/app/login/page.tsx`
- Create: `src/components/logout-button.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: 创建 `src/features/residents/actions.ts`**

Create `src/features/residents/actions.ts`:

```ts
'use server';

import { redirect } from 'next/navigation';
import { signIn, signOut } from '@/auth';
import { registerResident } from './registration';

export async function registerResidentAction(formData: FormData) {
  const result = await registerResident({
    email: String(formData.get('email') ?? ''),
    password: String(formData.get('password') ?? ''),
    nickname: String(formData.get('nickname') ?? ''),
  });

  if (!result.ok) {
    redirect(`/register?error=${encodeURIComponent(result.error)}`);
  }

  redirect('/login?registered=1');
}

export async function loginResidentAction(formData: FormData) {
  try {
    await signIn('credentials', {
      email: String(formData.get('email') ?? ''),
      password: String(formData.get('password') ?? ''),
      redirectTo: '/',
    });
  } catch {
    redirect('/login?error=1');
  }
}

export async function logoutResidentAction() {
  await signOut({ redirectTo: '/' });
}
```

- [ ] **Step 2: 创建 `src/app/register/page.tsx`**

Create `src/app/register/page.tsx`:

```tsx
import Link from 'next/link';
import { registerResidentAction } from '@/features/residents/actions';

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-[#02030a] px-6 py-16 text-stone-100">
      <section className="mx-auto max-w-md rounded-[2rem] border border-amber-100/15 bg-stone-100/[0.06] p-8 shadow-2xl shadow-indigo-950/50">
        <p className="text-sm tracking-[0.35em] text-amber-200/80">RESIDENT REGISTRY</p>
        <h1 className="mt-4 text-4xl font-semibold">成为北斗镇居民</h1>
        <p className="mt-4 text-sm leading-6 text-stone-300">注册后可以进入小酒馆、树洞邮局和寺庙。</p>
        {params.error ? <p className="mt-6 rounded-xl border border-red-300/30 bg-red-950/40 p-3 text-sm text-red-100">{params.error}</p> : null}
        <form action={registerResidentAction} className="mt-8 space-y-5">
          <label className="block text-sm text-stone-200">
            邮箱
            <input className="mt-2 w-full rounded-xl border border-stone-500/30 bg-black/30 px-4 py-3 text-stone-50 outline-none focus:border-amber-200/70" name="email" required type="email" />
          </label>
          <label className="block text-sm text-stone-200">
            昵称
            <input className="mt-2 w-full rounded-xl border border-stone-500/30 bg-black/30 px-4 py-3 text-stone-50 outline-none focus:border-amber-200/70" maxLength={24} name="nickname" required />
          </label>
          <label className="block text-sm text-stone-200">
            密码
            <input className="mt-2 w-full rounded-xl border border-stone-500/30 bg-black/30 px-4 py-3 text-stone-50 outline-none focus:border-amber-200/70" minLength={8} name="password" required type="password" />
          </label>
          <button className="w-full rounded-xl bg-amber-200 px-4 py-3 font-medium text-slate-950 transition hover:bg-amber-100" type="submit">注册</button>
        </form>
        <p className="mt-6 text-sm text-stone-300">已经是居民？ <Link className="text-amber-200" href="/login">去登录</Link></p>
      </section>
    </main>
  );
}
```

- [ ] **Step 3: 创建 `src/app/login/page.tsx`**

Create `src/app/login/page.tsx`:

```tsx
import Link from 'next/link';
import { loginResidentAction } from '@/features/residents/actions';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; registered?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-[#02030a] px-6 py-16 text-stone-100">
      <section className="mx-auto max-w-md rounded-[2rem] border border-amber-100/15 bg-stone-100/[0.06] p-8 shadow-2xl shadow-indigo-950/50">
        <p className="text-sm tracking-[0.35em] text-amber-200/80">TOWN GATE</p>
        <h1 className="mt-4 text-4xl font-semibold">进入北斗镇</h1>
        {params.registered ? <p className="mt-6 rounded-xl border border-emerald-300/30 bg-emerald-950/40 p-3 text-sm text-emerald-100">注册成功，请登录。</p> : null}
        {params.error ? <p className="mt-6 rounded-xl border border-red-300/30 bg-red-950/40 p-3 text-sm text-red-100">邮箱或密码不正确。</p> : null}
        <form action={loginResidentAction} className="mt-8 space-y-5">
          <label className="block text-sm text-stone-200">
            邮箱
            <input className="mt-2 w-full rounded-xl border border-stone-500/30 bg-black/30 px-4 py-3 text-stone-50 outline-none focus:border-amber-200/70" name="email" required type="email" />
          </label>
          <label className="block text-sm text-stone-200">
            密码
            <input className="mt-2 w-full rounded-xl border border-stone-500/30 bg-black/30 px-4 py-3 text-stone-50 outline-none focus:border-amber-200/70" name="password" required type="password" />
          </label>
          <button className="w-full rounded-xl bg-amber-200 px-4 py-3 font-medium text-slate-950 transition hover:bg-amber-100" type="submit">登录</button>
        </form>
        <p className="mt-6 text-sm text-stone-300">还没有身份？ <Link className="text-amber-200" href="/register">去注册</Link></p>
      </section>
    </main>
  );
}
```

- [ ] **Step 4: 创建 `src/components/logout-button.tsx`**

Create `src/components/logout-button.tsx`:

```tsx
import { logoutResidentAction } from '@/features/residents/actions';

export function LogoutButton() {
  return (
    <form action={logoutResidentAction}>
      <button className="rounded-full border border-stone-400/30 px-4 py-2 text-sm text-stone-200 transition hover:border-amber-200/60 hover:text-amber-100" type="submit">
        离开小镇
      </button>
    </form>
  );
}
```

- [ ] **Step 5: 更新 `src/app/page.tsx`**

Replace `src/app/page.tsx` with:

```tsx
import Link from 'next/link';
import { LogoutButton } from '@/components/logout-button';
import { getCurrentResident } from '@/features/residents/session';

const townAreas = [
  {
    name: '小酒馆',
    description: '居民们在夜色里闲聊的公共房间。',
  },
  {
    name: '树洞邮局',
    description: '投递心情、思考和不便署名的话。',
  },
  {
    name: '寺庙',
    description: '抽取塔罗牌，让星光给出一段解读。',
  },
];

export default async function Home() {
  const resident = await getCurrentResident();

  return (
    <main className="min-h-screen overflow-hidden bg-[#02030a] text-stone-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(79,70,229,0.28),transparent_34%),radial-gradient(circle_at_80%_10%,rgba(234,179,8,0.12),transparent_28%),linear-gradient(180deg,rgba(15,23,42,0),#02030a_78%)]" />
      <section className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-16">
        <div className="mb-10 flex items-center justify-between gap-4">
          <p className="text-sm tracking-[0.45em] text-amber-200/80">BEIDOU TOWN</p>
          {resident ? <LogoutButton /> : null}
        </div>
        <h1 className="text-6xl font-semibold tracking-tight text-stone-50 sm:text-8xl">北斗镇</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-300">
          一座仍在夜色中修建的小镇。小酒馆、树洞邮局和寺庙将先后点亮。
        </p>
        {resident ? (
          <>
            <p className="mt-8 text-amber-100">欢迎回来，{resident.name ?? '居民'}。</p>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {townAreas.map((area) => (
                <article
                  className="group rounded-[2rem] border border-amber-100/15 bg-stone-100/[0.06] p-7 shadow-2xl shadow-indigo-950/50 backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-amber-200/40 hover:bg-stone-100/[0.09]"
                  key={area.name}
                >
                  <div className="mb-8 h-1 w-12 rounded-full bg-amber-200/70 transition group-hover:w-20" />
                  <h2 className="text-2xl font-medium text-stone-50">{area.name}</h2>
                  <p className="mt-4 text-sm leading-6 text-stone-300">{area.description}</p>
                </article>
              ))}
            </div>
          </>
        ) : (
          <div className="mt-12 flex flex-col gap-3 sm:flex-row">
            <Link className="rounded-full bg-amber-200 px-6 py-3 text-center font-medium text-slate-950 transition hover:bg-amber-100" href="/register">
              成为居民
            </Link>
            <Link className="rounded-full border border-stone-400/30 px-6 py-3 text-center font-medium text-stone-100 transition hover:border-amber-200/60 hover:text-amber-100" href="/login">
              已有身份，进入小镇
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
```

- [ ] **Step 6: 运行验证**

Run:

```bash
corepack pnpm lint && corepack pnpm test && corepack pnpm build
```

Expected: PASS。

- [ ] **Step 7: 提交页面和交互**

Run:

```bash
git add src/features/residents/actions.ts src/app/register/page.tsx src/app/login/page.tsx src/components/logout-button.tsx src/app/page.tsx
git commit -m "feat: add resident login and registration pages"
```

Expected: commit 成功。

---

### Task 6: 本地手动验证和文档更新

**Files:**
- Modify: `README.md`

- [ ] **Step 1: 更新 `README.md`**

Replace the local development section in `README.md` with:

```markdown
## 本地开发

```bash
corepack pnpm install
cp .env.example .env.local
corepack pnpm db:generate
corepack pnpm dev
```

如果连接了本地 PostgreSQL，可运行：

```bash
corepack pnpm db:migrate
```

打开 http://localhost:3000 查看本地页面。
```

- [ ] **Step 2: 运行最终自动验证**

Run:

```bash
corepack pnpm lint && corepack pnpm test && corepack pnpm build
```

Expected: PASS。

- [ ] **Step 3: 手动启动应用**

Run:

```bash
corepack pnpm dev
```

Expected: Next.js dev server starts on `http://localhost:3000`.

- [ ] **Step 4: 浏览器验证**

Open `http://localhost:3000` and verify:

- 未登录首页显示“成为居民”和“已有身份，进入小镇”。
- `/register` 显示注册表单。
- `/login` 显示登录表单。

If no PostgreSQL database is running, do not verify actual registration submit in this task; database setup belongs to the next deployment/local-infra task.

- [ ] **Step 5: 提交文档**

Run:

```bash
git add README.md
git commit -m "docs: update local development instructions"
```

Expected: commit 成功。

---

## Self-Review

- Spec coverage: 本计划覆盖居民系统、开放注册、邮箱密码登录、User 数据模型、其他核心数据模型、密码哈希、服务端权限基础、未登录/登录首页分流。
- Deferred by design: 聊天室、树洞、塔罗 AI、管理员删除后台在后续计划实现，避免单阶段过大。
- Placeholder scan: 无 TBD、TODO、类似“稍后实现”的占位步骤；所有代码步骤包含具体文件内容。
- Type consistency: `UserRole` 使用 Prisma enum `USER/ADMIN`，session 类型、Auth.js token 和页面读取保持一致。

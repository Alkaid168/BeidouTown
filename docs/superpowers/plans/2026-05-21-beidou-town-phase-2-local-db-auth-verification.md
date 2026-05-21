# 北斗镇 Phase 2: 本地数据库与真实登录联调 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让北斗镇在本地 PostgreSQL 上完成 Prisma 迁移、种子管理员创建，并验证真实注册登录流程。

**Architecture:** 本阶段不新增业务模块，只补齐本地数据库运行和联调能力。使用 Docker Compose 提供 PostgreSQL，Prisma migration 管理 schema，seed 脚本创建管理员账号，页面继续使用 Phase 1 的 Auth.js 与注册服务。

**Tech Stack:** Docker Compose, PostgreSQL 16, Prisma 6, Next.js App Router, Auth.js, TypeScript, pnpm.

---

## Scope

本计划覆盖：

- 添加本地 PostgreSQL 的 `docker-compose.yml`。
- 添加 Prisma migration。
- 添加 seed 脚本创建管理员账号。
- 添加 `.env.local` 示例说明到 README，但不提交真实 `.env.local`。
- 真实运行数据库迁移和 seed。
- 启动应用并验证注册页、登录页和首页登录态。

不覆盖：生产部署、服务器 Docker Compose、聊天室、树洞、塔罗、管理员后台。

## File Structure

- `docker-compose.yml`：本地 PostgreSQL 服务。
- `prisma/seed.ts`：创建默认管理员账号。
- `package.json`：新增 `db:seed` 和 Prisma seed 配置。
- `README.md`：更新本地数据库启动和联调步骤。
- `.env.example`：注明 seed 账号变量。
- `prisma/migrations/*/migration.sql`：Prisma migration 生成文件。

---

### Task 1: 添加本地 PostgreSQL 和 seed 配置

**Files:**
- Create: `docker-compose.yml`
- Create: `prisma/seed.ts`
- Modify: `package.json`
- Modify: `.env.example`

- [ ] **Step 1: 创建 `docker-compose.yml`**

Create `docker-compose.yml`:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: beidou-town-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: beidou_town
      POSTGRES_USER: beidou
      POSTGRES_PASSWORD: beidou
    ports:
      - "5432:5432"
    volumes:
      - beidou-town-postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U beidou -d beidou_town"]
      interval: 5s
      timeout: 5s
      retries: 10

volumes:
  beidou-town-postgres-data:
```

- [ ] **Step 2: 安装 seed 运行依赖**

Run:

```bash
corepack pnpm add -D tsx
```

Expected: `tsx` added to devDependencies.

- [ ] **Step 3: 创建 `prisma/seed.ts`**

Create `prisma/seed.ts`:

```ts
import { UserRole } from '@prisma/client';
import { db } from '../src/lib/db';
import { hashPassword } from '../src/features/residents/password';

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@beidou.local';
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'beidou-admin-123456';
  const nickname = process.env.SEED_ADMIN_NICKNAME ?? '镇长';

  await db.user.upsert({
    where: { email },
    create: {
      email,
      passwordHash: await hashPassword(password),
      nickname,
      role: UserRole.ADMIN,
    },
    update: {
      nickname,
      role: UserRole.ADMIN,
    },
  });

  console.log(`Seeded admin resident: ${email}`);
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await db.$disconnect();
    process.exit(1);
  });
```

- [ ] **Step 4: 更新 `package.json`**

Ensure scripts include:

```json
"db:seed": "prisma db seed"
```

Add top-level Prisma seed config:

```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

- [ ] **Step 5: 更新 `.env.example`**

Append:

```dotenv

# Seed admin
SEED_ADMIN_EMAIL="admin@beidou.local"
SEED_ADMIN_PASSWORD="beidou-admin-123456"
SEED_ADMIN_NICKNAME="镇长"
```

- [ ] **Step 6: 运行验证**

Run:

```bash
corepack pnpm lint && corepack pnpm test && corepack pnpm build
```

Expected: PASS.

- [ ] **Step 7: 提交**

Run:

```bash
git add docker-compose.yml prisma/seed.ts package.json pnpm-lock.yaml .env.example
git commit -m "chore: add local database seed setup"
```

Expected: commit 成功。

---

### Task 2: 生成并验证 Prisma migration

**Files:**
- Create: `prisma/migrations/*/migration.sql`

- [ ] **Step 1: 启动本地数据库**

Run:

```bash
docker compose up -d postgres
```

Expected: PostgreSQL container starts.

- [ ] **Step 2: 等待数据库健康**

Run:

```bash
docker compose ps
```

Expected: `beidou-town-postgres` status includes healthy or running.

- [ ] **Step 3: 创建 `.env.local`，仅本地使用，不提交**

Run:

```bash
cp .env.example .env.local
```

Expected: `.env.local` exists and remains ignored by git.

- [ ] **Step 4: 生成 migration**

Run:

```bash
corepack pnpm prisma migrate dev --name init
```

Expected: migration created and applied successfully.

- [ ] **Step 5: 运行 seed**

Run:

```bash
corepack pnpm db:seed
```

Expected: output includes `Seeded admin resident: admin@beidou.local`.

- [ ] **Step 6: 运行验证**

Run:

```bash
corepack pnpm lint && corepack pnpm test && corepack pnpm build
```

Expected: PASS.

- [ ] **Step 7: 确认 `.env.local` 未被跟踪**

Run:

```bash
git status --short
```

Expected: migration files are untracked/modified; `.env.local` is not shown.

- [ ] **Step 8: 提交 migration**

Run:

```bash
git add prisma/migrations
git commit -m "feat: add initial database migration"
```

Expected: commit 成功。

---

### Task 3: 更新文档并手动验证注册登录

**Files:**
- Modify: `README.md`

- [ ] **Step 1: 更新 README 本地开发说明**

Replace `README.md` 本地开发 section with:

```markdown
## 本地开发

```bash
corepack pnpm install
cp .env.example .env.local
docker compose up -d postgres
corepack pnpm db:generate
corepack pnpm db:migrate
corepack pnpm db:seed
corepack pnpm dev
```

默认本地管理员：

- 邮箱：`admin@beidou.local`
- 密码：`beidou-admin-123456`

打开 http://localhost:3000 查看本地页面。
```

- [ ] **Step 2: 运行自动验证**

Run:

```bash
corepack pnpm lint && corepack pnpm test && corepack pnpm build
```

Expected: PASS.

- [ ] **Step 3: 启动应用**

Run:

```bash
corepack pnpm dev
```

Expected: Next.js starts at `http://localhost:3000`.

- [ ] **Step 4: 手动验证**

Open browser and verify:

- `/` 未登录时显示“成为居民”。
- `/register` 可以注册一个新账号。
- 注册后跳转 `/login?registered=1`。
- 用新账号登录后跳转首页。
- 首页显示“欢迎回来”。
- 点击“离开小镇”后回到未登录状态。
- 用 seed 管理员账号可登录。

- [ ] **Step 5: 提交 README**

Run:

```bash
git add README.md
git commit -m "docs: document local database workflow"
```

Expected: commit 成功。

---

## Self-Review

- Spec coverage: 本计划补齐 Phase 1 后缺失的本地数据库运行、迁移、seed 和真实注册登录联调。
- Deferred by design: 生产部署、聊天室、树洞、寺庙和后台管理不在本阶段范围。
- Placeholder scan: 无 TBD/TODO；所有文件和命令均具体。
- Type consistency: seed 使用现有 `UserRole.ADMIN`、`hashPassword` 和 `db`，不引入新身份模型。

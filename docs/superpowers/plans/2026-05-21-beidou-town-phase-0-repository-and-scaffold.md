# 北斗镇 Phase 0: 开源仓库与项目骨架 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将空目录初始化为可开源的 GitHub 仓库，并创建北斗镇 Next.js 全栈项目骨架。

**Architecture:** 第一阶段只建立工程基础，不实现小酒馆、树洞邮局、寺庙的业务功能。项目采用 Next.js App Router 单体结构，后续模块按 `src/features/*` 增长，数据库与认证在后续阶段接入。

**Tech Stack:** Git, GitHub, Node.js, pnpm, Next.js, React, TypeScript, ESLint, Tailwind CSS, PostgreSQL/Prisma 预留。

---

## Scope

本计划只覆盖：

- 初始化 Git 仓库。
- 创建开源必需文件。
- 创建 Next.js + TypeScript + Tailwind 项目骨架。
- 建立基础目录边界。
- 配置环境变量模板。
- 创建 GitHub 公开仓库并推送。

不覆盖：登录、数据库模型、聊天室、树洞、塔罗 AI、管理后台。这些应作为后续独立计划实现。

## File Structure

- `README.md`：项目介绍、本地开发命令、开源说明。
- `LICENSE`：开源许可证，推荐 MIT。
- `.gitignore`：忽略依赖、构建产物、环境变量和本地文件。
- `.env.example`：环境变量模板，不包含真实密钥。
- `package.json`：项目脚本和依赖。
- `next.config.ts`：Next.js 配置。
- `tsconfig.json`：TypeScript 配置。
- `eslint.config.mjs`：ESLint 配置。
- `postcss.config.mjs`：PostCSS/Tailwind 配置。
- `src/app/layout.tsx`：全站根布局。
- `src/app/page.tsx`：北斗镇首页占位。
- `src/app/globals.css`：全局样式。
- `src/features/README.md`：说明后续功能模块边界。
- `docs/superpowers/specs/2026-05-21-beidou-town-mvp-design.md`：已存在的设计规格。

---

### Task 1: 初始化 Git 仓库和开源文件

**Files:**
- Create: `.gitignore`
- Create: `LICENSE`
- Create: `README.md`
- Modify: existing repository metadata via `git init`

- [ ] **Step 1: 初始化 Git 仓库**

Run:

```bash
git init
```

Expected: 输出类似 `Initialized empty Git repository`。

- [ ] **Step 2: 创建 `.gitignore`**

Create `.gitignore`:

```gitignore
# dependencies
node_modules/
.pnp
.pnp.js

# testing
coverage/

# next.js
.next/
out/
build/

# production
*.tsbuildinfo

# env
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# OS / editor
.DS_Store
Thumbs.db
.vscode/
.idea/
```

- [ ] **Step 3: 创建 MIT `LICENSE`**

Create `LICENSE`:

```text
MIT License

Copyright (c) 2026 北斗镇 contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 4: 创建 `README.md`**

Create `README.md`:

```markdown
# 北斗镇

北斗镇是一个神秘夜色气质的网页小镇。MVP 计划包含：

- 小酒馆：单公共聊天室。
- 树洞邮局：投递心情和思考，默认匿名。
- 寺庙：塔罗牌占��与 AI 解读。
- 居民系统：注册、登录、昵称、头像和基础权限。

## 当前状态

项目处于早期设计与工程初始化阶段。

设计规格见：

- [北斗镇 MVP 设计说明](docs/superpowers/specs/2026-05-21-beidou-town-mvp-design.md)

## 本地开发

```bash
pnpm install
pnpm dev
```

## 开源协议

MIT License
```

- [ ] **Step 5: 验证 Git 状态**

Run:

```bash
git status --short
```

Expected: 显示 `.gitignore`、`LICENSE`、`README.md` 和 `docs/` 为未跟踪文件。

- [ ] **Step 6: 提交开源基础文件**

Run:

```bash
git add .gitignore LICENSE README.md docs/superpowers/specs/2026-05-21-beidou-town-mvp-design.md
git commit -m "chore: initialize open source repository"
```

Expected: commit 成功。

---

### Task 2: 创建 Next.js 项目骨架

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `eslint.config.mjs`
- Create: `postcss.config.mjs`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`

- [ ] **Step 1: 使用 Next.js 初始化当前目录**

Run:

```bash
pnpm create next-app@latest . --ts --tailwind --eslint --app --src-dir --import-alias "@/*"
```

When prompted:

```text
Would you like to use Turbopack? No
```

Expected: 生成 Next.js App Router 项目文件。

- [ ] **Step 2: 替换 `src/app/page.tsx` 为北斗镇首页占位**

Write `src/app/page.tsx`:

```tsx
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

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-16">
        <p className="mb-4 text-sm tracking-[0.35em] text-indigo-300">BEIDOU TOWN</p>
        <h1 className="text-5xl font-semibold tracking-tight sm:text-7xl">北斗镇</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
          一座仍在夜色中修建的小镇。小酒馆、树洞邮局和寺庙将先后点亮。
        </p>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {townAreas.map((area) => (
            <article
              className="rounded-2xl border border-indigo-300/20 bg-white/5 p-6 shadow-2xl shadow-indigo-950/40"
              key={area.name}
            >
              <h2 className="text-2xl font-medium">{area.name}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">{area.description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 3: 替换 `src/app/layout.tsx`**

Write `src/app/layout.tsx`:

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

- [ ] **Step 4: 确认全局样式支持 Tailwind**

Write `src/app/globals.css`:

```css
@import "tailwindcss";

:root {
  color-scheme: dark;
}

body {
  margin: 0;
  background: #020617;
}
```

- [ ] **Step 5: 运行静态检查**

Run:

```bash
pnpm lint
```

Expected: PASS，无 ESLint 错误。

- [ ] **Step 6: 运行构建**

Run:

```bash
pnpm build
```

Expected: PASS，Next.js 构建成功。

- [ ] **Step 7: 提交项目骨架**

Run:

```bash
git add package.json pnpm-lock.yaml next.config.ts tsconfig.json eslint.config.mjs postcss.config.mjs src
git commit -m "chore: scaffold nextjs app"
```

Expected: commit 成功。

---

### Task 3: 建立功能模块边界与环境变量模板

**Files:**
- Create: `.env.example`
- Create: `src/features/README.md`
- Modify: `README.md`

- [ ] **Step 1: 创建 `.env.example`**

Create `.env.example`:

```dotenv
# Database
DATABASE_URL="postgresql://beidou:beidou@localhost:5432/beidou_town"

# Auth
AUTH_SECRET="replace-with-a-secure-random-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# AI Provider
AI_PROVIDER="mock"
AI_API_KEY=""
AI_BASE_URL=""
AI_MODEL=""

# Registration
REGISTRATION_MODE="open"
```

- [ ] **Step 2: 创建 `src/features/README.md`**

Create `src/features/README.md`:

```markdown
# Feature Modules

北斗镇后续功能按“小镇建筑”组织，每个功能模块应保持清晰边界。

计划模块：

- `residents`：注册、登录、用户资料、角色权限。
- `tavern`：小酒馆公共聊天室。
- `treehole`：树洞邮局投递与展示。
- `temple`：塔罗抽牌、AI 解读和个人历史。
- `admin`：基础内容管理和管理员操作记录。
- `ai`：可切换 AI Provider 适配层。

共享 UI、数据库连接和认证配置不放在具体业务模块里。
```

- [ ] **Step 3: 更新 `README.md` 的环境变量说明**

Replace `README.md` with:

```markdown
# 北斗镇

北斗镇是一个神秘夜色气质的网页小镇。MVP 计划包含：

- 小酒馆：单公共聊天室。
- 树洞邮局：投递心情和思考，默认匿名。
- 寺庙：塔罗牌占卜与 AI 解读。
- 居民系统：注册、登录、昵称、头像和基础权限。

## 当前状态

项目处于早期设计与工程初始化阶段。

设计规格见：

- [北斗镇 MVP 设计说明](docs/superpowers/specs/2026-05-21-beidou-town-mvp-design.md)

## 本地开发

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

打开 http://localhost:3000 查看本地页面。

## 环境变量

`.env.example` 列出了本地开发所需变量。不要提交 `.env` 或 `.env.local`。

## 开源协议

MIT License
```

- [ ] **Step 4: 运行检查**

Run:

```bash
pnpm lint && pnpm build
```

Expected: PASS。

- [ ] **Step 5: 提交工程边界说明**

Run:

```bash
git add .env.example README.md src/features/README.md
git commit -m "docs: document project module boundaries"
```

Expected: commit 成功。

---

### Task 4: 创建 GitHub 公开仓库并推送

**Files:**
- No file changes required.
- Remote repository on GitHub.

- [ ] **Step 1: 确认 GitHub CLI 登录状态**

Run:

```bash
gh auth status
```

Expected: 显示已登录 GitHub。如果未登录，运行：

```bash
gh auth login
```

- [ ] **Step 2: 创建公开仓库**

Run:

```bash
gh repo create beidou-town --public --source . --remote origin --description "北斗镇：一个神秘夜色气质的网页小镇" --push
```

Expected: GitHub 创建公开仓库，并把本地 commits 推送到 `origin`。

- [ ] **Step 3: 确认远程仓库**

Run:

```bash
git remote -v
git status --short
```

Expected:

```text
origin  https://github.com/<your-account>/beidou-town.git (fetch)
origin  https://github.com/<your-account>/beidou-town.git (push)
```

`git status --short` 没有输出。

---

## Self-Review

- Spec coverage: 本计划覆盖开源仓库、Next.js 骨架、模块边界和 GitHub 推送；业务功能留给后续计划，符合 Phase 0 范围。
- Placeholder scan: 无 TBD、TODO、类似“稍后实现”的占位步骤。
- Type consistency: 本阶段仅定义首页组件和文件结构，无跨任务业务类型依赖。

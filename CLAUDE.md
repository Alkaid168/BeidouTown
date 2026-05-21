# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common commands

Use Corepack to run pnpm in this repo:

- `corepack pnpm install` — install dependencies
- `corepack pnpm dev` — start the Next.js dev server
- `corepack pnpm build` — build for production
- `corepack pnpm start` — start the production server after a build
- `corepack pnpm lint` — run ESLint
- `corepack pnpm test` — run the Vitest suite once
- `corepack pnpm vitest run src/path/to/file.test.ts` — run a single test file
- `corepack pnpm test:watch` — run Vitest in watch mode

Database and local services:

- `docker compose -p beidou-town up -d postgres` — start the local PostgreSQL container
- `corepack pnpm db:generate` — generate the Prisma client
- `corepack pnpm db:migrate` — run Prisma migrations in development
- `corepack pnpm db:seed` — seed the local admin user
- `corepack pnpm db:studio` — open Prisma Studio
- `corepack pnpm tavern:cleanup` — delete expired/excess tavern messages

The `-p beidou-town` Docker Compose project name avoids issues with the Chinese workspace directory name.

## Architecture overview

This is a Next.js App Router TypeScript monolith. Routes live under `src/app`, reusable UI lives under `src/components`, and feature-domain logic lives under `src/features`. The `@/*` path alias maps to `src/*`.

PostgreSQL is accessed through Prisma. The schema is in `prisma/schema.prisma`, and the shared Prisma client singleton is in `src/lib/db.ts`. Local development uses `docker-compose.yml` with PostgreSQL 16 Alpine.

Authentication uses Auth.js v5 credentials with JWT sessions. The Auth.js configuration is in `src/auth.ts`; resident session helpers live in `src/features/residents/session.ts`; registration, password hashing, and auth server actions live under `src/features/residents`. Successful `signIn()` calls throw a `NEXT_REDIRECT` error, so login actions must rethrow redirect errors instead of treating them as authentication failures.

The tavern feature is implemented as a thin full-stack slice:

- `src/features/tavern/*` contains validation, rate limiting, cleanup, service logic, server actions, and DTO types.
- `src/app/tavern/page.tsx` loads the current resident and initial messages on the server.
- `src/components/tavern/tavern-client.tsx` handles polling and client-side interaction.
- `src/app/api/tavern/messages/route.ts` supports short polling for new messages.
- `src/components/tavern/markdown-message.tsx` renders safe Markdown with an explicit element whitelist and custom classes.

The Prisma schema already includes MVP models for residents, tavern messages, treehole posts, tarot readings, and admin actions. Treehole and tarot UI/service slices should follow the existing tavern and residents patterns where they overlap.

## Development conventions

Use Vitest for unit and component tests. Prefer test-first changes for new behavior and bug fixes. Existing tests use Testing Library for React components and direct service/helper tests for domain logic.

Use Zod for user-input validation at feature boundaries. Service functions should return explicit result objects for expected domain failures rather than throwing for normal validation or permission errors.

Use server actions for form mutations and API routes for polling/query endpoints that need client-side refresh. Use `getCurrentResident()` for authenticated resident context in server components, actions, and route handlers.

Keep Markdown rendering safe: `react-markdown` should use `skipHtml`, `rehype-sanitize`, and an explicit `allowedElements` whitelist. Images are intentionally filtered out of the sanitize schema for the current text-only tavern MVP.

## Version and tooling notes

Prisma is pinned to 6.x because Prisma 7 changes datasource URL configuration. ESLint is pinned to 9.x because ESLint 10 caused configuration/runtime issues in this project. Use `corepack pnpm`, not bare `pnpm`, unless the shell environment has already configured pnpm explicitly.

# Temple Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the temple feature into a two-page major-arcana tarot experience with spread selection, sequential card reveals, and fixed-format AI interpretation in the same page.

**Architecture:** Replace the current history-first temple page with a spread-selection homepage and a single dynamic spread route driven by shared spread/card configuration. Keep the server-side reading creation flow, but upgrade the temple data model and DTOs so the backend stores spread-aware card draws and the frontend renders a deterministic reveal state machine with one reusable stage component.

**Tech Stack:** Next.js App Router, React client components, TypeScript, Prisma, Vitest, Testing Library, existing resident session helpers, existing AI-backed temple action flow, Tailwind CSS, safe markdown renderer.

---

## File Structure

### Existing files to modify
- `prisma/schema.prisma` — reshape tarot reading persistence to support spread type + structured drawn cards.
- `prisma/seed.ts` — update seed expectations if schema changes require it.
- `src/app/temple/page.tsx` — replace current history-oriented page with spread selection homepage using new background and tavern/treehole shell width pattern.
- `src/components/temple/temple-client.tsx` — either delete or reduce to a homepage chooser; current history/draw hybrid behavior no longer matches the product.
- `src/features/temple/actions.ts` — accept spread type and question, create a structured reading, and return DTO for the active session.
- `src/features/temple/readings.ts` — rebuild service functions around spread-aware readings instead of the old fixed three-card shape.
- `src/features/temple/types.ts` — define spread/card/reveal/result DTOs for the new flow.
- `src/features/temple/prompts.ts` or equivalent prompt file if it exists — lock the AI interpretation output format.
- `src/components/tavern/markdown-message.tsx` — only if needed to support the exact heading/section rendering desired by the interpretation blocks; otherwise leave untouched.

### New files to create
- `prisma/migrations/YYYYMMDDHHMMSS_temple_redesign/migration.sql` — migrate tarot reading storage to spread-aware structure.
- `src/app/temple/[spread]/page.tsx` — server page for the shared spread ritual experience.
- `src/components/temple/temple-home-client.tsx` — homepage UI showing the five spread choices.
- `src/components/temple/temple-spread-client.tsx` — state machine for question entry, summoning, reveal order, and interpretation display.
- `src/components/temple/temple-card.tsx` — reusable tarot card component with back/front, highlight, and reveal UI.
- `src/components/temple/temple-spread-layout.tsx` — layout renderer for 1/2/3/5-card spreads, including the five-card cross.
- `src/components/temple/temple-interpretation.tsx` — bottom interpretation section with ZCOOL XiaoWei typography and streaming/reveal presentation.
- `src/features/temple/spreads.ts` — all five spread definitions and position metadata.
- `src/features/temple/major-arcana.ts` — 22 major arcana definitions with Roman numerals, names, and image paths.
- `src/features/temple/validation.ts` — question and spread validation.
- `src/features/temple/validation.test.ts` — tests for question/spread validation.
- `src/features/temple/spreads.test.ts` — tests for spread definitions and layout metadata.
- `src/features/temple/readings.test.ts` — service tests for structured reading creation and AI payload formatting.
- `src/components/temple/temple-home-client.test.tsx` — homepage mode selection UI tests.
- `src/components/temple/temple-spread-client.test.tsx` — reveal-order and interpretation behavior tests.
- `src/components/temple/temple-spread-layout.test.tsx` — tests for the five-card cross and other spread arrangements.

### Static assets to reference
- `public/temple-background.png` — copied from `F:\CODES\北斗镇\占卜寺庙背景图.png`
- `public/temple-reading-background.png` — copied from `F:\CODES\北斗镇\占卜酒馆占卜背景图.png`
- `public/tarot/card-back.png` — copied from `F:\CODES\北斗镇\talo_images\塔罗牌牌背.png`
- `public/tarot/*.png` — the 22 major arcana face images, renamed to stable keys if needed

---

### Task 1: Define spread and major-arcana configuration

**Files:**
- Create: `src/features/temple/spreads.ts`
- Create: `src/features/temple/major-arcana.ts`
- Create: `src/features/temple/spreads.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest';
import { getSpreadBySlug, templeSpreads } from './spreads';
import { majorArcana } from './major-arcana';

describe('temple spreads', () => {
  it('defines the five supported spreads in display order', () => {
    expect(templeSpreads.map((spread) => spread.slug)).toEqual([
      'single-answer',
      'two-path',
      'classic-triangle',
      'decision',
      'major-cross',
    ]);
  });

  it('defines the major cross positions in the required cross order', () => {
    expect(getSpreadBySlug('major-cross')).toMatchObject({
      cardCount: 5,
      positions: [
        { key: 'support', label: '有利因素', revealOrder: 0, slot: 'left' },
        { key: 'obstacle', label: '阻碍挑战', revealOrder: 1, slot: 'right' },
        { key: 'truth', label: '真相', revealOrder: 2, slot: 'top' },
        { key: 'root', label: '根源', revealOrder: 3, slot: 'bottom' },
        { key: 'outcome', label: '结果', revealOrder: 4, slot: 'center' },
      ],
    });
  });
});

describe('major arcana', () => {
  it('contains exactly 22 cards with Roman numerals and image paths', () => {
    expect(majorArcana).toHaveLength(22);
    expect(majorArcana[0]).toMatchObject({
      key: 'the-fool',
      nameCn: '愚者',
      romanIndex: '0',
      imagePath: '/tarot/the-fool.png',
    });
    expect(majorArcana.at(-1)).toMatchObject({
      key: 'the-world',
      nameCn: '世界',
      romanIndex: 'XXI',
      imagePath: '/tarot/the-world.png',
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `corepack pnpm vitest run src/features/temple/spreads.test.ts`
Expected: FAIL because `spreads.ts` and `major-arcana.ts` do not exist yet.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/features/temple/spreads.ts
export type TempleSpreadSlug = 'single-answer' | 'two-path' | 'classic-triangle' | 'decision' | 'major-cross';

export type TempleSpreadPosition = {
  key: string;
  label: string;
  revealOrder: number;
  slot: 'center' | 'left' | 'right' | 'top' | 'bottom' | 'row-1' | 'row-2' | 'row-3';
};

export type TempleSpreadDefinition = {
  slug: TempleSpreadSlug;
  title: string;
  subtitle: string;
  cardCount: number;
  positions: TempleSpreadPosition[];
};

export const templeSpreads: TempleSpreadDefinition[] = [
  {
    slug: 'single-answer',
    title: '单牌 · 对答',
    subtitle: '启示',
    cardCount: 1,
    positions: [{ key: 'guidance', label: '启示', revealOrder: 0, slot: 'center' }],
  },
  {
    slug: 'two-path',
    title: '二牌 · 修炼',
    subtitle: '结果 + 对策',
    cardCount: 2,
    positions: [
      { key: 'result', label: '结果', revealOrder: 0, slot: 'left' },
      { key: 'advice', label: '对策', revealOrder: 1, slot: 'right' },
    ],
  },
  {
    slug: 'classic-triangle',
    title: '三牌 · 经典圣三角',
    subtitle: '过去 + 现在 + 未来',
    cardCount: 3,
    positions: [
      { key: 'past', label: '过去', revealOrder: 0, slot: 'left' },
      { key: 'present', label: '现在', revealOrder: 1, slot: 'center' },
      { key: 'future', label: '未来', revealOrder: 2, slot: 'right' },
    ],
  },
  {
    slug: 'decision',
    title: '三牌 · 决策',
    subtitle: '心态 + 现状 + 结果',
    cardCount: 3,
    positions: [
      { key: 'mindset', label: '心态', revealOrder: 0, slot: 'left' },
      { key: 'situation', label: '现状', revealOrder: 1, slot: 'center' },
      { key: 'outcome', label: '结果', revealOrder: 2, slot: 'right' },
    ],
  },
  {
    slug: 'major-cross',
    title: '五牌 · 大阿卡那十字',
    subtitle: '有利因素 + 阻碍挑战 + 真相 + 根源 + 结果',
    cardCount: 5,
    positions: [
      { key: 'support', label: '有利因素', revealOrder: 0, slot: 'left' },
      { key: 'obstacle', label: '阻碍挑战', revealOrder: 1, slot: 'right' },
      { key: 'truth', label: '真相', revealOrder: 2, slot: 'top' },
      { key: 'root', label: '根源', revealOrder: 3, slot: 'bottom' },
      { key: 'outcome', label: '结果', revealOrder: 4, slot: 'center' },
    ],
  },
];

export function getSpreadBySlug(slug: string) {
  return templeSpreads.find((spread) => spread.slug === slug) ?? null;
}
```

```ts
// src/features/temple/major-arcana.ts
export type MajorArcanaCard = {
  key: string;
  nameCn: string;
  romanIndex: string;
  imagePath: string;
};

export const majorArcana: MajorArcanaCard[] = [
  { key: 'the-fool', nameCn: '愚者', romanIndex: '0', imagePath: '/tarot/the-fool.png' },
  { key: 'the-magician', nameCn: '魔术师', romanIndex: 'I', imagePath: '/tarot/the-magician.png' },
  { key: 'the-high-priestess', nameCn: '女祭司', romanIndex: 'II', imagePath: '/tarot/the-high-priestess.png' },
  { key: 'the-empress', nameCn: '皇后', romanIndex: 'III', imagePath: '/tarot/the-empress.png' },
  { key: 'the-emperor', nameCn: '皇帝', romanIndex: 'IV', imagePath: '/tarot/the-emperor.png' },
  { key: 'the-hierophant', nameCn: '教皇', romanIndex: 'V', imagePath: '/tarot/the-hierophant.png' },
  { key: 'the-lovers', nameCn: '恋人', romanIndex: 'VI', imagePath: '/tarot/the-lovers.png' },
  { key: 'the-chariot', nameCn: '战车', romanIndex: 'VII', imagePath: '/tarot/the-chariot.png' },
  { key: 'strength', nameCn: '力量', romanIndex: 'VIII', imagePath: '/tarot/strength.png' },
  { key: 'the-hermit', nameCn: '隐者', romanIndex: 'IX', imagePath: '/tarot/the-hermit.png' },
  { key: 'wheel-of-fortune', nameCn: '命运之轮', romanIndex: 'X', imagePath: '/tarot/wheel-of-fortune.png' },
  { key: 'justice', nameCn: '正义', romanIndex: 'XI', imagePath: '/tarot/justice.png' },
  { key: 'the-hanged-man', nameCn: '倒吊人', romanIndex: 'XII', imagePath: '/tarot/the-hanged-man.png' },
  { key: 'death', nameCn: '死神', romanIndex: 'XIII', imagePath: '/tarot/death.png' },
  { key: 'temperance', nameCn: '节制', romanIndex: 'XIV', imagePath: '/tarot/temperance.png' },
  { key: 'the-devil', nameCn: '恶魔', romanIndex: 'XV', imagePath: '/tarot/the-devil.png' },
  { key: 'the-tower', nameCn: '高塔', romanIndex: 'XVI', imagePath: '/tarot/the-tower.png' },
  { key: 'the-star', nameCn: '星星', romanIndex: 'XVII', imagePath: '/tarot/the-star.png' },
  { key: 'the-moon', nameCn: '月亮', romanIndex: 'XVIII', imagePath: '/tarot/the-moon.png' },
  { key: 'the-sun', nameCn: '太阳', romanIndex: 'XIX', imagePath: '/tarot/the-sun.png' },
  { key: 'judgement', nameCn: '审判', romanIndex: 'XX', imagePath: '/tarot/judgement.png' },
  { key: 'the-world', nameCn: '世界', romanIndex: 'XXI', imagePath: '/tarot/the-world.png' },
];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `corepack pnpm vitest run src/features/temple/spreads.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/temple/spreads.ts src/features/temple/major-arcana.ts src/features/temple/spreads.test.ts
git commit -m "feat: define temple spreads and major arcana"
```

### Task 2: Validate spread and question input

**Files:**
- Create: `src/features/temple/validation.ts`
- Create: `src/features/temple/validation.test.ts`
- Modify: `src/features/temple/types.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { parseTempleQuestionInput } from './validation';

describe('parseTempleQuestionInput', () => {
  it('rejects an unknown spread slug', () => {
    expect(parseTempleQuestionInput('unknown', '今晚会顺利吗？')).toEqual({
      ok: false,
      error: '这座牌阵暂时还没有开放。',
    });
  });

  it('rejects blank questions', () => {
    expect(parseTempleQuestionInput('single-answer', '   ')).toEqual({
      ok: false,
      error: '请先说出你想问的问题。',
    });
  });

  it('trims valid spread and question', () => {
    expect(parseTempleQuestionInput('decision', '  我要不要换工作？  ')).toEqual({
      ok: true,
      spreadSlug: 'decision',
      question: '我要不要换工作？',
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `corepack pnpm vitest run src/features/temple/validation.test.ts`
Expected: FAIL because `validation.ts` does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/features/temple/types.ts
import type { TempleSpreadSlug } from './spreads';

export type TempleActionResult =
  | { ok: true; reading: TarotReadingView }
  | { ok: false; error: string };

export type TempleDrawnCardView = {
  positionKey: string;
  positionLabel: string;
  revealOrder: number;
  cardKey: string;
  cardNameCn: string;
  romanIndex: string;
  orientation: 'upright' | 'reversed';
  imagePath: string;
};

export type TarotReadingView = {
  id: string;
  spreadSlug: TempleSpreadSlug;
  spreadTitle: string;
  question: string;
  reading: string;
  createdAt: string;
  cards: TempleDrawnCardView[];
};
```

```ts
// src/features/temple/validation.ts
import { getSpreadBySlug, type TempleSpreadSlug } from './spreads';

export function parseTempleQuestionInput(spreadSlugInput: string, questionInput: string) {
  const spreadSlug = spreadSlugInput.trim() as TempleSpreadSlug;
  const question = questionInput.trim();

  if (!getSpreadBySlug(spreadSlug)) {
    return { ok: false as const, error: '这座牌阵暂时还没有开放。' };
  }

  if (!question) {
    return { ok: false as const, error: '请先说出你想问的问题。' };
  }

  if (question.length > 300) {
    return { ok: false as const, error: '这个问题太长了，先收束成一句吧。' };
  }

  return { ok: true as const, spreadSlug, question };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `corepack pnpm vitest run src/features/temple/validation.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/temple/types.ts src/features/temple/validation.ts src/features/temple/validation.test.ts
git commit -m "feat: validate temple question input"
```

### Task 3: Upgrade Prisma schema for spread-aware readings

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/YYYYMMDDHHMMSS_temple_redesign/migration.sql`
- Test: `src/features/temple/readings.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it, vi } from 'vitest';
import { createTarotReading } from './readings';

const readingCreate = vi.fn();

vi.mock('@/lib/db', () => ({
  db: {
    tarotReading: { create: readingCreate },
  },
}));

describe('createTarotReading', () => {
  it('stores spread-aware card draws with reveal order and orientation', async () => {
    readingCreate.mockResolvedValue({ id: 'reading_1' });

    await createTarotReading({
      resident: { id: 'resident-1', userId: 'user-1', name: '阿北', role: 'resident' as never },
      spreadSlug: 'two-path',
      question: '要不要表白？',
    });

    expect(readingCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          spreadType: 'two-path',
          question: '要不要表白？',
          cards: {
            create: [
              expect.objectContaining({ positionKey: 'result', revealOrder: 0 }),
              expect.objectContaining({ positionKey: 'advice', revealOrder: 1 }),
            ],
          },
        }),
      }),
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `corepack pnpm vitest run src/features/temple/readings.test.ts`
Expected: FAIL because the current schema/service only supports the old fixed structure.

- [ ] **Step 3: Write minimal implementation**

Update `prisma/schema.prisma` to a shape like:

```prisma
model TarotReading {
  id         String             @id @default(cuid())
  residentId String
  spreadType String
  question   String
  reading    String
  createdAt  DateTime           @default(now())
  resident   User               @relation(fields: [residentId], references: [id], onDelete: Cascade)
  cards      TarotReadingCard[]

  @@index([residentId, createdAt])
}

model TarotReadingCard {
  id            String       @id @default(cuid())
  readingId     String
  positionKey   String
  positionLabel String
  revealOrder   Int
  cardKey       String
  cardNameCn    String
  romanIndex    String
  orientation   String
  imagePath     String
  reading       TarotReading @relation(fields: [readingId], references: [id], onDelete: Cascade)

  @@index([readingId, revealOrder])
}
```

Create a migration that:
- Adds `spreadType` to `TarotReading`
- Creates `TarotReadingCard`
- Migrates or drops obsolete columns only if they exist in the current schema
- Preserves existing reading rows where feasible by mapping them to a default `classic-triangle` spread

- [ ] **Step 4: Run test to verify it passes**

Run: `corepack pnpm vitest run src/features/temple/readings.test.ts`
Expected: PASS after service/schema update.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations src/features/temple/readings.test.ts
git commit -m "feat: persist spread-aware temple readings"
```

### Task 4: Rebuild the temple reading service and AI payload formatter

**Files:**
- Modify: `src/features/temple/readings.ts`
- Modify: `src/features/temple/actions.ts`
- Test: `src/features/temple/readings.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest';
import { buildTempleInterpretationPrompt } from './readings';

it('formats AI prompt with question, spread, and every card position', () => {
  expect(
    buildTempleInterpretationPrompt({
      spreadTitle: '五牌 · 大阿卡那十字',
      question: '我要不要离开现在的团队？',
      cards: [
        { positionLabel: '有利因素', romanIndex: 'XIX', cardNameCn: '太阳', orientation: 'upright' },
        { positionLabel: '阻碍挑战', romanIndex: 'XV', cardNameCn: '恶魔', orientation: 'reversed' },
      ],
    }),
  ).toContain('有利因素：「XIX」太�� 正位');

  expect(
    buildTempleInterpretationPrompt({
      spreadTitle: '五牌 · 大阿卡那十字',
      question: '我要不要离开现在的团队？',
      cards: [
        { positionLabel: '有利因素', romanIndex: 'XIX', cardNameCn: '太阳', orientation: 'upright' },
        { positionLabel: '阻碍挑战', romanIndex: 'XV', cardNameCn: '恶魔', orientation: 'reversed' },
      ],
    }),
  ).toContain('输出必须包含：问题回响、逐牌解读、总结启示');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `corepack pnpm vitest run src/features/temple/readings.test.ts`
Expected: FAIL because the formatting helper does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Add helpers in `src/features/temple/readings.ts` like:

```ts
export function orientationLabel(orientation: 'upright' | 'reversed') {
  return orientation === 'upright' ? '正位' : '逆位';
}

export function buildTempleInterpretationPrompt(input: {
  spreadTitle: string;
  question: string;
  cards: Array<{
    positionLabel: string;
    romanIndex: string;
    cardNameCn: string;
    orientation: 'upright' | 'reversed';
  }>;
}) {
  const cardLines = input.cards
    .map((card) => `${card.positionLabel}：「${card.romanIndex}」${card.cardNameCn} ${orientationLabel(card.orientation)}`)
    .join('\n');

  return [
    '你是北斗镇占卜寺庙里的解读者。',
    `牌阵：${input.spreadTitle}`,
    `问题：${input.question}`,
    '抽到的牌：',
    cardLines,
    '输出必须包含：',
    '1. 问题回响',
    '2. 逐牌解读（每张牌单独一段，段首包含位置、罗马数字、牌名、正逆位）',
    '3. 总结启示',
  ].join('\n');
}
```

Update `createTarotReadingAction(formData)` to read both `spreadSlug` and `question`.

- [ ] **Step 4: Run test to verify it passes**

Run: `corepack pnpm vitest run src/features/temple/readings.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/temple/readings.ts src/features/temple/actions.ts src/features/temple/readings.test.ts
git commit -m "feat: format temple interpretation prompts"
```

### Task 5: Replace the temple homepage with spread selection

**Files:**
- Modify: `src/app/temple/page.tsx`
- Create: `src/components/temple/temple-home-client.tsx`
- Create: `src/components/temple/temple-home-client.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TempleHomeClient } from './temple-home-client';

describe('TempleHomeClient', () => {
  it('renders the five spread choices and no history list', () => {
    render(<TempleHomeClient spreads={[
      { slug: 'single-answer', title: '单牌 · 对答', subtitle: '启示' },
      { slug: 'two-path', title: '二牌 · 修炼', subtitle: '结果 + 对策' },
      { slug: 'classic-triangle', title: '三牌 · 经典圣三角', subtitle: '过去 + 现在 + 未来' },
      { slug: 'decision', title: '三牌 · 决策', subtitle: '心态 + 现状 + 结果' },
      { slug: 'major-cross', title: '五牌 · 大阿卡那十字', subtitle: '有利因素 + 阻碍挑战 + 真相 + 根源 + 结果' },
    ]} />);

    expect(screen.getByText('占卜寺庙')).toBeInTheDocument();
    expect(screen.getByText('五牌 · 大阿卡那十字')).toBeInTheDocument();
    expect(screen.queryByText('PRIVATE READING')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `corepack pnpm vitest run src/components/temple/temple-home-client.test.tsx`
Expected: FAIL because the new homepage component does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Implement `TempleHomeClient` with:
- tavern/treehole width shell
- left-aligned serif title
- five spread entry cards linking to `/temple/[spread]`
- no history sidebar

Example skeleton:

```tsx
'use client';

import Link from 'next/link';

export function TempleHomeClient({ spreads }: { spreads: Array<{ slug: string; title: string; subtitle: string }> }) {
  return (
    <div className="fixed inset-0 flex min-h-screen w-screen flex-col overflow-hidden animate-[page-float-in_900ms_ease-out_both] px-4 py-6 sm:px-6 lg:px-10">
      <div className="mb-5 flex shrink-0 items-start justify-between gap-4 border-b border-white/10 pb-5 relative z-[80] pointer-events-none">
        <div className="pointer-events-auto">
          <p className="text-xs tracking-[0.55em] text-amber-100/70">ORACLE TEMPLE</p>
          <h1 className="mt-2 font-serif text-4xl font-semibold tracking-[0.18em] text-stone-50">占卜寺庙</h1>
        </div>
        <Link className="pointer-events-auto border-0 bg-transparent px-1 py-1 text-sm tracking-[0.45em] text-stone-100/58 transition duration-500 hover:text-white" href="/">
          回到镇口
        </Link>
      </div>
      <div className="relative min-h-0 flex-1 overflow-y-auto rounded-[0.35rem] border border-[rgba(232,188,128,0.20)] bg-[linear-gradient(175deg,rgba(30,20,13,0.68),rgba(14,10,7,0.78))] px-6 py-6">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {spreads.map((spread) => (
            <Link key={spread.slug} href={`/temple/${spread.slug}`} className="group rounded-[0.35rem] border border-[rgba(232,188,128,0.18)] bg-[linear-gradient(175deg,rgba(40,28,20,0.68),rgba(18,13,10,0.82))] p-5">
              <p className="text-xs tracking-[0.18em] text-amber-100/70">{spread.subtitle}</p>
              <h2 className="mt-3 font-serif text-2xl text-amber-50">{spread.title}</h2>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `corepack pnpm vitest run src/components/temple/temple-home-client.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/temple/page.tsx src/components/temple/temple-home-client.tsx src/components/temple/temple-home-client.test.tsx
git commit -m "feat: add temple spread selection home"
```

### Task 6: Build the shared spread page and layout renderer

**Files:**
- Create: `src/app/temple/[spread]/page.tsx`
- Create: `src/components/temple/temple-spread-layout.tsx`
- Create: `src/components/temple/temple-spread-layout.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TempleSpreadLayout } from './temple-spread-layout';

it('renders the major cross in the required directional arrangement', () => {
  render(
    <TempleSpreadLayout
      spreadSlug="major-cross"
      cards={[
        { positionKey: 'support', positionLabel: '有利因素', slot: 'left', content: 'L' },
        { positionKey: 'obstacle', positionLabel: '阻碍挑战', slot: 'right', content: 'R' },
        { positionKey: 'truth', positionLabel: '真相', slot: 'top', content: 'T' },
        { positionKey: 'root', positionLabel: '根源', slot: 'bottom', content: 'B' },
        { positionKey: 'outcome', positionLabel: '结果', slot: 'center', content: 'C' },
      ]}
    />,
  );

  expect(screen.getByTestId('temple-slot-top')).toHaveTextContent('真相');
  expect(screen.getByTestId('temple-slot-left')).toHaveTextContent('有利因素');
  expect(screen.getByTestId('temple-slot-center')).toHaveTextContent('结果');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `corepack pnpm vitest run src/components/temple/temple-spread-layout.test.tsx`
Expected: FAIL because the layout component does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Create a layout component that maps `slot` to fixed grid areas.

```tsx
export function TempleSpreadLayout({
  spreadSlug,
  cards,
}: {
  spreadSlug: string;
  cards: Array<{ positionKey: string; positionLabel: string; slot: string; content: React.ReactNode }>;
}) {
  if (spreadSlug === 'major-cross') {
    const bySlot = Object.fromEntries(cards.map((card) => [card.slot, card]));
    return (
      <div className="mx-auto grid w-full max-w-4xl grid-cols-3 gap-6" style={{ gridTemplateAreas: '"empty-top top empty-top-right" "left center right" "empty-bottom-left bottom empty-bottom"' }}>
        <div data-testid="temple-slot-top" style={{ gridArea: 'top' }}>{bySlot.top?.positionLabel}{bySlot.top?.content}</div>
        <div data-testid="temple-slot-left" style={{ gridArea: 'left' }}>{bySlot.left?.positionLabel}{bySlot.left?.content}</div>
        <div data-testid="temple-slot-center" style={{ gridArea: 'center' }}>{bySlot.center?.positionLabel}{bySlot.center?.content}</div>
        <div data-testid="temple-slot-right" style={{ gridArea: 'right' }}>{bySlot.right?.positionLabel}{bySlot.right?.content}</div>
        <div data-testid="temple-slot-bottom" style={{ gridArea: 'bottom' }}>{bySlot.bottom?.positionLabel}{bySlot.bottom?.content}</div>
      </div>
    );
  }

  return <div className="mx-auto grid w-full max-w-4xl gap-6 md:grid-cols-3">{cards.map((card) => <div key={card.positionKey}>{card.positionLabel}{card.content}</div>)}</div>;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `corepack pnpm vitest run src/components/temple/temple-spread-layout.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/temple/[spread]/page.tsx src/components/temple/temple-spread-layout.tsx src/components/temple/temple-spread-layout.test.tsx
git commit -m "feat: add temple spread layouts"
```

### Task 7: Build the reveal-order state machine and card component

**Files:**
- Create: `src/components/temple/temple-card.tsx`
- Create: `src/components/temple/temple-spread-client.tsx`
- Create: `src/components/temple/temple-spread-client.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TempleSpreadClient } from './temple-spread-client';

it('allows only the current highlighted card to be revealed', async () => {
  render(
    <TempleSpreadClient
      spread={{ slug: 'two-path', title: '二牌 · 修炼', subtitle: '结果 + 对策', positions: [
        { key: 'result', label: '结果', revealOrder: 0, slot: 'left' },
        { key: 'advice', label: '对策', revealOrder: 1, slot: 'right' },
      ] }}
      initialReading={{
        id: 'reading-1',
        spreadSlug: 'two-path',
        spreadTitle: '二牌 · 修炼',
        question: '要不要表白？',
        reading: '问题回响\n\n结果……',
        createdAt: '2026-05-24T12:00:00.000Z',
        cards: [
          { positionKey: 'result', positionLabel: '结果', revealOrder: 0, cardKey: 'the-sun', cardNameCn: '太阳', romanIndex: 'XIX', orientation: 'upright', imagePath: '/tarot/the-sun.png' },
          { positionKey: 'advice', positionLabel: '对策', revealOrder: 1, cardKey: 'the-hermit', cardNameCn: '隐者', romanIndex: 'IX', orientation: 'reversed', imagePath: '/tarot/the-hermit.png' },
        ],
      }}
    />,
  );

  expect(screen.getByLabelText('翻开结果')).toBeEnabled();
  expect(screen.getByLabelText('翻开对策')).toBeDisabled();

  fireEvent.click(screen.getByLabelText('翻开结果'));

  expect(screen.getByText('「XIX」太阳 正位')).toBeInTheDocument();
  expect(screen.getByLabelText('翻开对策')).toBeEnabled();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `corepack pnpm vitest run src/components/temple/temple-spread-client.test.tsx`
Expected: FAIL because the client components do not exist yet.

- [ ] **Step 3: Write minimal implementation**

Implement `TempleCard` to render:
- card back before reveal
- face image after reveal
- first line = position label
- second line = `「罗马数字」牌名 正/逆位`
- disabled state for not-yet-active cards
- highlighted ring for the active reveal target

Implement `TempleSpreadClient` state:

```tsx
const [revealedCount, setRevealedCount] = useState(0);
const allRevealed = revealedCount === initialReading.cards.length;

function handleReveal(index: number) {
  if (index !== revealedCount) return;
  setRevealedCount((count) => count + 1);
}
```

Render each card with:
- `revealed={index < revealedCount}`
- `active={index === revealedCount}`
- `disabled={index !== revealedCount}`

- [ ] **Step 4: Run test to verify it passes**

Run: `corepack pnpm vitest run src/components/temple/temple-spread-client.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/temple/temple-card.tsx src/components/temple/temple-spread-client.tsx src/components/temple/temple-spread-client.test.tsx
git commit -m "feat: add temple sequential reveal flow"
```

### Task 8: Start interpretation automatically and render it with ZCOOL XiaoWei styling

**Files:**
- Create: `src/components/temple/temple-interpretation.tsx`
- Modify: `src/components/temple/temple-spread-client.tsx`
- Test: `src/components/temple/temple-spread-client.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TempleSpreadClient } from './temple-spread-client';

it('starts showing the interpretation after the final card is revealed', async () => {
  render(/* same two-card setup as Task 7 */);

  fireEvent.click(screen.getByLabelText('翻开结果'));
  fireEvent.click(screen.getByLabelText('翻开对策'));

  expect(await screen.findByText('问题回响')).toBeInTheDocument();
  expect(screen.getByTestId('temple-interpretation')).toHaveStyle({ fontFamily: '"ZCOOL XiaoWei", "LXGW WenKai", "KaiTi", "STKaiti", "Segoe UI", sans-serif' });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `corepack pnpm vitest run src/components/temple/temple-spread-client.test.tsx`
Expected: FAIL because interpretation rendering does not start automatically yet.

- [ ] **Step 3: Write minimal implementation**

Create `TempleInterpretation`:

```tsx
const interpretationFont = '"ZCOOL XiaoWei", "LXGW WenKai", "KaiTi", "STKaiti", "Segoe UI", sans-serif';

export function TempleInterpretation({ content }: { content: string }) {
  return (
    <section data-testid="temple-interpretation" style={{ fontFamily: interpretationFont }} className="mt-10 rounded-[0.35rem] border border-[rgba(232,188,128,0.20)] bg-[rgba(22,16,12,0.62)] px-5 py-5 text-stone-100">
      <MarkdownMessage content={content} />
    </section>
  );
}
```

In `TempleSpreadClient`, after `allRevealed` becomes true, reveal `reading` in the same page bottom area. For the first version, the “streaming” effect can be simulated by revealing pre-split sections one by one with `setTimeout`.

- [ ] **Step 4: Run test to verify it passes**

Run: `corepack pnpm vitest run src/components/temple/temple-spread-client.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/temple/temple-interpretation.tsx src/components/temple/temple-spread-client.tsx src/components/temple/temple-spread-client.test.tsx
git commit -m "feat: auto-show temple interpretation"
```

### Task 9: Wire the new temple routes into the real server flow

**Files:**
- Modify: `src/app/temple/page.tsx`
- Create: `src/app/temple/[spread]/page.tsx`
- Modify: `src/features/temple/actions.ts`
- Modify: `src/features/temple/readings.ts`
- Modify: `src/features/temple/types.ts`

- [ ] **Step 1: Write the failing integration test**

```ts
import { describe, expect, it } from 'vitest';
import { getSpreadBySlug } from '@/features/temple/spreads';

it('resolves the decision spread for the dynamic temple page', () => {
  expect(getSpreadBySlug('decision')).toMatchObject({ title: '三牌 · 决策' });
});
```

- [ ] **Step 2: Run test to verify it fails only if the route contract is incomplete**

Run: `corepack pnpm vitest run src/features/temple/spreads.test.ts src/features/temple/readings.test.ts`
Expected: PASS on config but the app route still lacks actual wiring, so manual inspection will still show missing route content.

- [ ] **Step 3: Write minimal implementation**

Server page structure:

```tsx
// src/app/temple/[spread]/page.tsx
import { notFound } from 'next/navigation';
import { TempleSpreadClient } from '@/components/temple/temple-spread-client';
import { getSpreadBySlug } from '@/features/temple/spreads';
import { getCurrentResident } from '@/features/residents/session';

export default async function TempleSpreadPage({ params }: { params: Promise<{ spread: string }> }) {
  const { spread } = await params;
  const spreadDefinition = getSpreadBySlug(spread);
  if (!spreadDefinition) notFound();

  const resident = await getCurrentResident();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05060d] text-stone-100">
      <div className="absolute inset-0 bg-[url('/temple-reading-background.png')] bg-cover bg-center opacity-88" />
      <section className="relative mx-auto flex min-h-screen w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-10">
        <TempleSpreadClient spread={spreadDefinition} resident={resident} />
      </section>
    </main>
  );
}
```

Pass the form through `createTarotReadingAction`, then render the returned reading in-place.

- [ ] **Step 4: Run test to verify it passes**

Run: `corepack pnpm test`
Expected: PASS with the new route wiring included.

- [ ] **Step 5: Commit**

```bash
git add src/app/temple/page.tsx src/app/temple/[spread]/page.tsx src/features/temple/actions.ts src/features/temple/readings.ts src/features/temple/types.ts
git commit -m "feat: wire temple spread routes"
```

### Task 10: Bring in static assets and finish visual polish

**Files:**
- Create/Copy: `public/temple-background.png`
- Create/Copy: `public/temple-reading-background.png`
- Create/Copy: `public/tarot/card-back.png`
- Create/Copy: `public/tarot/*.png`
- Modify: `src/components/temple/*.tsx`

- [ ] **Step 1: Write the failing UI test**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TempleCard } from './temple-card';

it('shows the card meta line with Roman numeral and orientation', () => {
  render(
    <TempleCard
      positionLabel="结果"
      revealed
      active={false}
      disabled={false}
      imagePath="/tarot/the-sun.png"
      cardNameCn="太阳"
      romanIndex="XIX"
      orientation="upright"
      onReveal={() => {}}
    />,
  );

  expect(screen.getByText('结果')).toBeInTheDocument();
  expect(screen.getByText('「XIX」太阳 正位')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `corepack pnpm vitest run src/components/temple/temple-spread-client.test.tsx src/components/temple/temple-home-client.test.tsx`
Expected: FAIL until the final visual/meta rendering matches the spec.

- [ ] **Step 3: Write minimal implementation**

Finish:
- card back image support
- face image rendering
- active glow/highlight styles
- serif page title styling
- same width shell as tavern/treehole
- icon-like buttons where possible for restart/back actions

Copy the provided asset files into `public/` using stable names that match `major-arcana.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run:
- `corepack pnpm vitest run src/components/temple/temple-home-client.test.tsx src/components/temple/temple-spread-layout.test.tsx src/components/temple/temple-spread-client.test.tsx`
- `corepack pnpm build`

Expected: PASS for all tests and successful build.

- [ ] **Step 5: Commit**

```bash
git add public/temple-background.png public/temple-reading-background.png public/tarot src/components/temple src/app/temple
git commit -m "feat: polish temple tarot experience"
```

---

## Self-Review

### Spec coverage check
- Two-page structure: covered by Tasks 5, 6, and 9.
- Five spreads: covered by Task 1.
- Sequential reveal: covered by Task 7.
- Roman numerals + upright/reversed display: covered by Tasks 1, 7, and 10.
- Same-page automatic AI interpretation: covered by Tasks 4 and 8.
- Five-card cross layout: covered by Task 6.
- No history sidebar: covered by Task 5.
- Shared tavern/treehole width and polished UI: covered by Tasks 5 and 10.
- Structured storage for spread-aware readings: covered by Tasks 3 and 4.

No spec gaps found.

### Placeholder scan
- No `TODO`, `TBD`, or “similar to Task N” placeholders remain.
- Every task includes explicit files, tests, commands, and implementation snippets.

### Type consistency check
- Spread slug name is consistently `TempleSpreadSlug`.
- Reading DTO is consistently `TarotReadingView`.
- Drawn-card DTO is consistently `TempleDrawnCardView`.
- Validation uses `parseTempleQuestionInput` consistently.

No naming mismatches found.

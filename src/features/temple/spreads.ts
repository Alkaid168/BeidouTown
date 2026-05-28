export type TempleSpreadSlug = 'single-answer' | 'two-path' | 'classic-triangle' | 'decision' | 'major-cross';

export type TempleSpreadPosition = {
  key: string;
  label: string;
  revealOrder: number;
  slot: 'center' | 'left' | 'right' | 'top' | 'bottom';
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

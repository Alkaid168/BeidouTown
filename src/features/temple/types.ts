import type { TempleSpreadDefinition, TempleSpreadSlug } from './spreads';

export type TarotOrientation = 'upright' | 'reversed';

export type TempleDrawnCardView = {
  positionKey: string;
  positionLabel: string;
  revealOrder: number;
  cardKey: string;
  cardNameCn: string;
  romanIndex: string;
  orientation: TarotOrientation;
  imagePath: string;
};

export type PreparedTarotReading = {
  spreadSlug: TempleSpreadSlug;
  spreadTitle: string;
  question: string;
  cards: TempleDrawnCardView[];
};

export type TarotAiRequest = {
  spreadSlug: TempleSpreadSlug;
  spreadTitle: string;
  question: string;
  cards: TempleDrawnCardView[];
};

export type TarotAiProvider = {
  generateReading(request: TarotAiRequest): Promise<string>;
  streamReading?: (request: TarotAiRequest) => Promise<ReadableStream<Uint8Array>>;
};

export type TarotReadingView = {
  id: string;
  spreadSlug: TempleSpreadSlug;
  spreadTitle: string;
  question: string;
  cards: TempleDrawnCardView[];
  reading: string;
  createdAt: string;
};

export type PrepareTempleReadingResult =
  | { ok: true; prepared: PreparedTarotReading }
  | { ok: false; error: string };

export type TempleActionResult =
  | { ok: true; reading: TarotReadingView }
  | { ok: false; error: string };

export type TempleSpreadPageData = {
  spread: TempleSpreadDefinition;
  resident: {
    id: string;
    name?: string | null;
    role: string;
  } | null;
};

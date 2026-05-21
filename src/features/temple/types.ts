export type TarotOrientation = 'upright' | 'reversed';

export type TarotDrawnCard = {
  name: string;
  arcana: 'major';
  orientation: TarotOrientation;
  position: string;
  meaning: string;
};

export type TarotAiRequest = {
  question: string;
  cards: TarotDrawnCard[];
};

export type TarotAiProvider = {
  generateReading(request: TarotAiRequest): Promise<string>;
};

export type TarotReadingView = {
  id: string;
  question: string;
  cards: TarotDrawnCard[];
  reading: string;
  createdAt: string;
};

export type TempleActionResult =
  | { ok: true; reading: TarotReadingView }
  | { ok: false; error: string };

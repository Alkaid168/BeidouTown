import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PrepareTempleReadingResult, TempleActionResult } from '@/features/temple/types';
import { TempleSpreadClient } from './temple-spread-client';

const spread = {
  slug: 'two-path',
  title: '二牌 · 修炼',
  subtitle: '结果 + 对策',
  cardCount: 2,
  positions: [
    { key: 'result', label: '结果', revealOrder: 0, slot: 'left' as const },
    { key: 'advice', label: '对策', revealOrder: 1, slot: 'right' as const },
  ],
};

const preparedResult: PrepareTempleReadingResult = {
  ok: true,
  prepared: {
    spreadSlug: 'two-path',
    spreadTitle: '二牌 · 修炼',
    question: '要不要表白？',
    cards: [
      {
        positionKey: 'result',
        positionLabel: '结果',
        revealOrder: 0,
        cardKey: 'the-sun',
        cardNameCn: '太阳',
        romanIndex: 'XIX',
        orientation: 'upright',
        imagePath: '/tarot/the-sun.png',
      },
      {
        positionKey: 'advice',
        positionLabel: '对策',
        revealOrder: 1,
        cardKey: 'the-hermit',
        cardNameCn: '隐者',
        romanIndex: 'IX',
        orientation: 'reversed',
        imagePath: '/tarot/the-hermit.png',
      },
    ],
  },
};

const finalResult: TempleActionResult = {
  ok: true,
  reading: {
    id: 'reading-1',
    spreadSlug: 'two-path',
    spreadTitle: '二牌 · 修炼',
    question: '要不要表白？',
    reading: '问题回响\n\n逐牌解读\n\n总结启示',
    createdAt: '2026-05-24T12:00:00.000Z',
    cards: preparedResult.prepared.cards,
  },
};

function createTextStream(chunks: string[]) {
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });
}

describe('TempleSpreadClient', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('allows only the current highlighted card to be revealed', async () => {
    render(
      <TempleSpreadClient
        spread={spread}
        resident={{ id: 'resident-1', name: '阿北', role: 'USER' }}
        initialPreparedReading={preparedResult.prepared}
      />,
    );

    expect(screen.getByLabelText('翻开结果')).toBeEnabled();
    expect(screen.getByLabelText('翻开对策')).toBeDisabled();

    fireEvent.click(screen.getByLabelText('翻开结果'));

    expect(screen.getByText('「XIX」太阳 正位')).toBeInTheDocument();
    expect(screen.getByLabelText('翻开对策')).toBeEnabled();
  });

  it('shows cards immediately after draw preparation without waiting for interpretation', async () => {
    const prepareReading = vi.fn<() => Promise<PrepareTempleReadingResult>>().mockResolvedValue(preparedResult);
    const finalizeReading = vi.fn<() => Promise<TempleActionResult>>().mockResolvedValue(finalResult);

    render(
      <TempleSpreadClient
        spread={spread}
        resident={{ id: 'resident-1', name: '阿北', role: 'USER' }}
        prepareReading={prepareReading}
        finalizeReading={finalizeReading}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText('输入你的问题……'), { target: { value: '要不要表白？' } });
    fireEvent.click(screen.getByRole('button', { name: '开始占卜' }));

    expect(await screen.findByLabelText('翻开结果')).toBeInTheDocument();
    expect(screen.queryByTestId('temple-interpretation')).not.toBeInTheDocument();
    expect(finalizeReading).not.toHaveBeenCalled();
  });

  it('streams interpretation after the final card is revealed and then persists the final reading', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(createTextStream(['问题回响', '\n\n逐牌解读', '\n\n总结启示']), { status: 200 }),
    );
    const prepareReading = vi.fn<() => Promise<PrepareTempleReadingResult>>().mockResolvedValue(preparedResult);
    const finalizeReading = vi.fn<() => Promise<TempleActionResult>>().mockResolvedValue(finalResult);

    render(
      <TempleSpreadClient
        spread={spread}
        resident={{ id: 'resident-1', name: '阿北', role: 'USER' }}
        prepareReading={prepareReading}
        finalizeReading={finalizeReading}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText('输入你的问题……'), { target: { value: '要不要表白？' } });
    fireEvent.click(screen.getByRole('button', { name: '开始占卜' }));

    fireEvent.click(await screen.findByLabelText('翻开结果'));
    expect(finalizeReading).not.toHaveBeenCalled();

    fireEvent.click(screen.getByLabelText('翻开对策'));

    await waitFor(() => {
      expect(finalizeReading).toHaveBeenCalledTimes(1);
    });

    expect(await screen.findByTestId('temple-interpretation')).toHaveStyle({ fontFamily: '"ZCOOL XiaoWei", "LXGW WenKai", "KaiTi", "STKaiti", "Segoe UI", sans-serif' });
    expect(screen.getByText('问题回响')).toBeInTheDocument();
    expect(screen.getByText('总结启示')).toBeInTheDocument();
  });
});

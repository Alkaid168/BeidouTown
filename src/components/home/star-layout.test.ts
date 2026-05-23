import { describe, expect, it } from 'vitest';
import { getAdaptiveStarLayout, getStarFrame } from './star-layout';

describe('getAdaptiveStarLayout', () => {
  it('keeps star sizes unscaled while widening the constellation on wide screens', () => {
    const layout = getAdaptiveStarLayout(16 / 9);

    expect(layout.transform).toBe('rotate(-8deg)');
    expect(layout.stars[0].x).toBeLessThan(24);
    expect(layout.stars.at(-1)?.x).toBeGreaterThan(84);
  });

  it('compresses width and height separately on tall screens without transform scaling', () => {
    const layout = getAdaptiveStarLayout(9 / 16);

    expect(layout.transform).not.toContain('scale');
    expect(layout.stars[0].x).toBeGreaterThan(24);
    expect(layout.stars.at(-1)?.x).toBeLessThan(84);
    expect(layout.stars[0].y).toBeGreaterThan(27);
    expect(layout.stars.at(-1)?.y).toBeLessThan(77);
  });

  it('adds deterministic organic offsets so the constellation is not rigid', () => {
    const layout = getAdaptiveStarLayout(16 / 9);

    expect(layout.stars[1].x).not.toBe(37);
    expect(layout.stars[1].y).not.toBe(22);
    expect(getAdaptiveStarLayout(16 / 9)).toEqual(layout);
  });

  it('keeps line points and star centers in the same animated frame', () => {
    const layout = getAdaptiveStarLayout(16 / 9);
    const frame = getStarFrame(layout.stars, 0.33);

    expect(frame.linePoints).toBe(frame.stars.map((star) => `${star.x},${star.y}`).join(' '));
  });
});

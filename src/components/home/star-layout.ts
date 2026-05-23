export type StarDefinition = {
  name: string;
  place: string;
  href?: string;
  x: number;
  y: number;
  hue: string;
  delay: string;
};

export type AdaptiveStar = StarDefinition & {
  baseX: number;
  baseY: number;
  driftX: number;
  driftY: number;
  driftPhase: number;
};

const baseStars: StarDefinition[] = [
  { name: '天枢', place: '聊天酒馆', href: '/tavern', x: 24, y: 27, hue: 'rgba(255, 190, 95, 0.95)', delay: '0s' },
  { name: '天璇', place: '树洞邮局', href: '/treehole', x: 37, y: 22, hue: 'rgba(127, 232, 196, 0.95)', delay: '-1.1s' },
  { name: '天玑', place: '占卜寺庙', href: '/temple', x: 48, y: 34, hue: 'rgba(177, 161, 255, 0.95)', delay: '-2.2s' },
  { name: '天权', place: '沉睡中的地点', x: 56, y: 48, hue: 'rgba(115, 196, 255, 0.95)', delay: '-3.3s' },
  { name: '玉衡', place: '沉睡中的地点', x: 66, y: 55, hue: 'rgba(255, 136, 194, 0.95)', delay: '-4.4s' },
  { name: '开阳', place: '沉睡中的地点', x: 74, y: 66, hue: 'rgba(208, 244, 121, 0.95)', delay: '-5.5s' },
  { name: '瑶光', place: '沉睡中的地点', x: 84, y: 77, hue: 'rgba(120, 222, 255, 0.95)', delay: '-6.6s' },
];

export function getAdaptiveStarLayout(aspectRatio: number) {
  const safeAspectRatio = Number.isFinite(aspectRatio) && aspectRatio > 0 ? aspectRatio : 16 / 9;
  const wideAmount = clamp((safeAspectRatio - 1.2) / 1.1, 0, 1);
  const tallAmount = clamp((1.1 - safeAspectRatio) / 0.55, 0, 1);
  const xSpread = 1 + wideAmount * 0.18 - tallAmount * 0.28;
  const ySpread = 1 - wideAmount * 0.08 - tallAmount * 0.22;
  const phase = safeAspectRatio * 1.731;

  return {
    transform: 'rotate(-8deg)',
    stars: baseStars.map((star, index): AdaptiveStar => {
      const organicX = Math.sin(index * 1.37 + phase) * 1.8;
      const organicY = Math.cos(index * 1.11 + phase) * 1.5;

      return {
        ...star,
        baseX: star.x,
        baseY: star.y,
        driftX: organicX * 0.42,
        driftY: organicY * 0.42,
        driftPhase: index * 0.73 + phase,
        x: clamp(50 + (star.x - 50) * xSpread + organicX, 8, 92),
        y: clamp(50 + (star.y - 50) * ySpread + organicY, 10, 90),
      };
    }),
  };
}

export function getStarFrame(stars: AdaptiveStar[], progress: number) {
  const angle = progress * Math.PI * 2;
  const frameStars = stars.map((star) => {
    const x = round(star.x + Math.sin(angle + star.driftPhase) * star.driftX);
    const y = round(star.y + Math.cos(angle * 0.82 + star.driftPhase) * star.driftY);

    return { ...star, x, y };
  });

  return {
    stars: frameStars,
    linePoints: frameStars.map((star) => `${star.x},${star.y}`).join(' '),
  };
}

function round(value: number) {
  return Math.round(value * 1000) / 1000;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

'use client';

import { templeSpreads } from '@/features/temple/spreads';
import { TempleHomeClient } from './temple-home-client';

export function TempleClient() {
  return <TempleHomeClient spreads={templeSpreads} />;
}

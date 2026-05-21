import { describe, expect, it } from 'vitest';
import { canSendTavernMessage } from './rate-limit';

describe('canSendTavernMessage', () => {
  it('allows sending when there is no previous message', () => {
    expect(canSendTavernMessage(null, new Date('2026-05-21T00:00:10Z'))).toBe(true);
  });

  it('rejects sending within 10 seconds', () => {
    expect(canSendTavernMessage(new Date('2026-05-21T00:00:05Z'), new Date('2026-05-21T00:00:10Z'))).toBe(false);
  });

  it('allows sending at 10 seconds', () => {
    expect(canSendTavernMessage(new Date('2026-05-21T00:00:00Z'), new Date('2026-05-21T00:00:10Z'))).toBe(true);
  });
});

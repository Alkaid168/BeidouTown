import { describe, expect, it } from 'vitest';
import { shouldRethrowLoginError } from './redirect-errors';

describe('shouldRethrowLoginError', () => {
  it('rethrows successful Next.js redirect errors instead of treating them as failed login', () => {
    const redirectError = new Error('NEXT_REDIRECT');
    Object.defineProperty(redirectError, 'digest', {
      value: 'NEXT_REDIRECT;push;/;307;',
    });

    expect(shouldRethrowLoginError(redirectError)).toBe(true);
  });

  it('does not rethrow ordinary authentication failures', () => {
    expect(shouldRethrowLoginError(new Error('CredentialsSignin'))).toBe(false);
  });
});

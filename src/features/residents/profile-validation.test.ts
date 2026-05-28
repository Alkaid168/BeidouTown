import { describe, expect, it } from 'vitest';
import { parseResidentPasswordChangeInput, parseResidentProfileInput } from './profile-validation';

describe('parseResidentProfileInput', () => {
  it('accepts trimmed nickname, optional avatar url, and optional signature', () => {
    expect(
      parseResidentProfileInput({
        nickname: '  阿北  ',
        avatarUrl: ' https://example.com/avatar.png ',
        signature: '  今夜星光恰好。  ',
      }),
    ).toEqual({
      ok: true,
      value: {
        nickname: '阿北',
        avatarUrl: 'https://example.com/avatar.png',
        signature: '今夜星光恰好。',
      },
    });
  });

  it('normalizes empty avatar and signature to null', () => {
    expect(
      parseResidentProfileInput({
        nickname: '阿北',
        avatarUrl: '   ',
        signature: '   ',
      }),
    ).toEqual({
      ok: true,
      value: {
        nickname: '阿北',
        avatarUrl: null,
        signature: null,
      },
    });
  });

  it('rejects invalid avatar url input', () => {
    expect(
      parseResidentProfileInput({
        nickname: '阿北',
        avatarUrl: 'not-a-url',
        signature: '',
      }),
    ).toEqual({ ok: false, error: '头像地址看起来不太对。' });
  });
});

describe('parseResidentPasswordChangeInput', () => {
  it('accepts a valid password change payload', () => {
    expect(
      parseResidentPasswordChangeInput({
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123',
      }),
    ).toEqual({
      ok: true,
      value: {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123',
      },
    });
  });

  it('rejects mismatched confirmation', () => {
    expect(
      parseResidentPasswordChangeInput({
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword124',
      }),
    ).toEqual({ ok: false, error: '两次输入的新密码不一致。' });
  });
});

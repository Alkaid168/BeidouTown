import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('./password', () => ({
  hashPassword: vi.fn(async (password: string) => `hashed:${password}`),
  verifyPassword: vi.fn(),
}));

import { db } from '@/lib/db';
import { changeResidentPassword, getResidentProfile, updateResidentProfile } from './profile';
import { verifyPassword } from './password';

describe('resident profile services', () => {
  it('loads the current resident profile', async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue({
      id: 'resident-1',
      email: 'abei@example.com',
      nickname: '阿北',
      avatarUrl: null,
      signature: '今夜星光恰好。',
      role: 'USER',
    });

    await expect(getResidentProfile('resident-1')).resolves.toEqual({
      id: 'resident-1',
      email: 'abei@example.com',
      nickname: '阿北',
      avatarUrl: null,
      signature: '今夜星光恰好。',
      role: 'USER',
    });
  });

  it('updates resident profile fields', async () => {
    vi.mocked(db.user.findFirst).mockResolvedValue(null);
    vi.mocked(db.user.update).mockResolvedValue({
      id: 'resident-1',
      email: 'abei@example.com',
      nickname: '阿北',
      avatarUrl: 'https://example.com/avatar.png',
      signature: '今夜星光恰好。',
      role: 'USER',
    });

    await expect(
      updateResidentProfile('resident-1', {
        nickname: '阿北',
        avatarUrl: 'https://example.com/avatar.png',
        signature: '今夜星光恰好。',
      }),
    ).resolves.toEqual({
      ok: true,
      profile: {
        id: 'resident-1',
        email: 'abei@example.com',
        nickname: '阿北',
        avatarUrl: 'https://example.com/avatar.png',
        signature: '今夜星光恰好。',
        role: 'USER',
      },
    });
  });

  it('rejects wrong current password during password change', async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue({ passwordHash: 'stored-hash' });
    vi.mocked(verifyPassword).mockResolvedValue(false);

    await expect(
      changeResidentPassword('resident-1', {
        currentPassword: 'wrongpass',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123',
      }),
    ).resolves.toEqual({ ok: false, error: '当前密码不正确。' });
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { registerResident } from './registration';

const { userCreate, userFindUnique } = vi.hoisted(() => ({
  userCreate: vi.fn(),
  userFindUnique: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    user: {
      create: userCreate,
      findUnique: userFindUnique,
    },
  },
}));

describe('registerResident', () => {
  beforeEach(() => {
    userCreate.mockReset();
    userFindUnique.mockReset();
  });

  it('creates a resident with normalized email and hashed password', async () => {
    userFindUnique.mockResolvedValue(null);
    userCreate.mockResolvedValue({
      id: 'user_1',
      email: 'alice@example.com',
      nickname: 'Alice',
      role: 'USER',
    });

    const result = await registerResident({
      email: ' Alice@Example.com ',
      password: 'correct horse battery staple',
      nickname: ' Alice ',
    });

    expect(result).toEqual({ ok: true, userId: 'user_1' });
    expect(userFindUnique).toHaveBeenCalledWith({ where: { email: 'alice@example.com' } });
    expect(userCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: 'alice@example.com',
        nickname: 'Alice',
      }),
      select: { id: true },
    });
    expect(userCreate.mock.calls[0][0].data.passwordHash).not.toBe('correct horse battery staple');
  });

  it('rejects duplicate email addresses', async () => {
    userFindUnique.mockResolvedValue({ id: 'existing' });

    const result = await registerResident({
      email: 'alice@example.com',
      password: 'correct horse battery staple',
      nickname: 'Alice',
    });

    expect(result).toEqual({ ok: false, error: '这个邮箱已经注册过了。' });
    expect(userCreate).not.toHaveBeenCalled();
  });

  it('rejects invalid input', async () => {
    const result = await registerResident({
      email: 'not-an-email',
      password: 'short',
      nickname: '',
    });

    expect(result.ok).toBe(false);
    expect(userFindUnique).not.toHaveBeenCalled();
    expect(userCreate).not.toHaveBeenCalled();
  });
});

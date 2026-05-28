import { db } from '@/lib/db';
import { hashPassword, verifyPassword } from './password';
import { parseResidentPasswordChangeInput, parseResidentProfileInput, type ResidentPasswordChangeInput, type ResidentProfileInput } from './profile-validation';

export type ResidentProfileView = {
  id: string;
  email: string;
  nickname: string;
  avatarUrl: string | null;
  signature: string | null;
  role: 'USER' | 'ADMIN';
};

export async function getResidentProfile(residentId: string): Promise<ResidentProfileView | null> {
  const user = await db.user.findUnique({
    where: { id: residentId },
    select: {
      id: true,
      email: true,
      nickname: true,
      avatarUrl: true,
      signature: true,
      role: true,
    },
  });

  if (!user) {
    return null;
  }

  return user;
}

export async function updateResidentProfile(residentId: string, input: ResidentProfileInput) {
  const parsed = parseResidentProfileInput(input);
  if (!parsed.ok) {
    return parsed;
  }

  const duplicate = await db.user.findFirst({
    where: {
      id: { not: residentId },
      nickname: parsed.value.nickname,
    },
    select: { id: true },
  });

  if (duplicate) {
    return { ok: false as const, error: '这个用户名已经有人用了。' };
  }

  const user = await db.user.update({
    where: { id: residentId },
    data: {
      nickname: parsed.value.nickname,
      avatarUrl: parsed.value.avatarUrl,
      signature: parsed.value.signature,
    },
    select: {
      id: true,
      email: true,
      nickname: true,
      avatarUrl: true,
      signature: true,
      role: true,
    },
  });

  return { ok: true as const, profile: user };
}

export async function changeResidentPassword(residentId: string, input: ResidentPasswordChangeInput) {
  const parsed = parseResidentPasswordChangeInput(input);
  if (!parsed.ok) {
    return parsed;
  }

  const user = await db.user.findUnique({
    where: { id: residentId },
    select: { passwordHash: true },
  });

  if (!user) {
    return { ok: false as const, error: '没有找到这位居民。' };
  }

  const matches = await verifyPassword(parsed.value.currentPassword, user.passwordHash);
  if (!matches) {
    return { ok: false as const, error: '当前密码不正确。' };
  }

  await db.user.update({
    where: { id: residentId },
    data: { passwordHash: await hashPassword(parsed.value.newPassword) },
    select: { id: true },
  });

  return { ok: true as const };
}

import { z } from 'zod';

const nicknameSchema = z.string().trim().min(1).max(24);
const avatarUrlSchema = z.string().trim().url();
const signatureSchema = z.string().trim().max(80);
const passwordSchema = z.string().min(8).max(128);

export type ResidentProfileInput = {
  nickname: string;
  avatarUrl: string;
  signature: string;
};

export type ResidentPasswordChangeInput = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export function parseResidentProfileInput(input: ResidentProfileInput) {
  const nickname = nicknameSchema.safeParse(input.nickname);
  if (!nickname.success) {
    return { ok: false as const, error: '请检查用户名。' };
  }

  const trimmedAvatarUrl = input.avatarUrl.trim();
  if (trimmedAvatarUrl) {
    const avatarUrl = avatarUrlSchema.safeParse(trimmedAvatarUrl);
    if (!avatarUrl.success) {
      return { ok: false as const, error: '头像地址看起来不太对。' };
    }
  }

  const trimmedSignature = input.signature.trim();
  const signature = signatureSchema.safeParse(trimmedSignature || '');
  if (!signature.success) {
    return { ok: false as const, error: '笺言不要写得太长。' };
  }

  return {
    ok: true as const,
    value: {
      nickname: nickname.data,
      avatarUrl: trimmedAvatarUrl || null,
      signature: trimmedSignature || null,
    },
  };
}

export function parseResidentPasswordChangeInput(input: ResidentPasswordChangeInput) {
  if (!input.currentPassword.trim()) {
    return { ok: false as const, error: '请先输入当前密码。' };
  }

  const password = passwordSchema.safeParse(input.newPassword);
  if (!password.success) {
    return { ok: false as const, error: '新密码长度需要在 8 到 128 个字符之间。' };
  }

  if (input.newPassword !== input.confirmPassword) {
    return { ok: false as const, error: '两次输入的新密码不一致。' };
  }

  return {
    ok: true as const,
    value: {
      currentPassword: input.currentPassword,
      newPassword: input.newPassword,
    },
  };
}

import { z } from 'zod';
import { db } from '@/lib/db';
import { hashPassword } from './password';

const registrationSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
  nickname: z.string().trim().min(1).max(24),
});

type RegistrationInput = z.input<typeof registrationSchema>;

export type RegistrationResult =
  | { ok: true; userId: string }
  | { ok: false; error: string };

export async function registerResident(input: RegistrationInput): Promise<RegistrationResult> {
  const parsed = registrationSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: '请检查邮箱、密码和昵称。' };
  }

  const email = parsed.data.email.toLowerCase();
  const existingUser = await db.user.findUnique({ where: { email } });

  if (existingUser) {
    return { ok: false, error: '这个邮箱已经注册过了。' };
  }

  const user = await db.user.create({
    data: {
      email,
      passwordHash: await hashPassword(parsed.data.password),
      nickname: parsed.data.nickname,
    },
    select: { id: true },
  });

  return { ok: true, userId: user.id };
}

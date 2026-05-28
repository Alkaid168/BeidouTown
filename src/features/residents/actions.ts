'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { signIn, signOut } from '@/auth';
import { changeResidentPassword, updateResidentProfile } from './profile';
import { registerResident } from './registration';
import { shouldRethrowLoginError } from './redirect-errors';
import { getCurrentResident } from './session';

export async function registerResidentAction(formData: FormData) {
  const result = await registerResident({
    email: String(formData.get('email') ?? ''),
    password: String(formData.get('password') ?? ''),
    nickname: String(formData.get('nickname') ?? ''),
  });

  if (!result.ok) {
    redirect(`/register?error=${encodeURIComponent(result.error)}`);
  }

  redirect('/login?registered=1');
}

export async function loginResidentAction(formData: FormData) {
  try {
    await signIn('credentials', {
      email: String(formData.get('email') ?? ''),
      password: String(formData.get('password') ?? ''),
      redirectTo: '/',
    });
  } catch (error) {
    if (shouldRethrowLoginError(error)) {
      throw error;
    }

    redirect('/login?error=1');
  }
}

export async function updateResidentProfileAction(formData: FormData) {
  const resident = await getCurrentResident();
  if (!resident) {
    return { ok: false as const, error: '请先登录。' };
  }

  const result = await updateResidentProfile(resident.id, {
    nickname: String(formData.get('nickname') ?? ''),
    avatarUrl: String(formData.get('avatarUrl') ?? ''),
    signature: String(formData.get('signature') ?? ''),
  });

  if (result.ok) {
    revalidatePath('/');
    revalidatePath('/resident');
  }

  return result;
}

export async function changeResidentPasswordAction(formData: FormData) {
  const resident = await getCurrentResident();
  if (!resident) {
    return { ok: false as const, error: '请先登录。' };
  }

  return changeResidentPassword(resident.id, {
    currentPassword: String(formData.get('currentPassword') ?? ''),
    newPassword: String(formData.get('newPassword') ?? ''),
    confirmPassword: String(formData.get('confirmPassword') ?? ''),
  });
}

export async function logoutResidentAction() {
  await signOut({ redirectTo: '/' });
}

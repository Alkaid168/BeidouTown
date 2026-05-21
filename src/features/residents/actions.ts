'use server';

import { redirect } from 'next/navigation';
import { signIn, signOut } from '@/auth';
import { registerResident } from './registration';
import { shouldRethrowLoginError } from './redirect-errors';

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

export async function logoutResidentAction() {
  await signOut({ redirectTo: '/' });
}

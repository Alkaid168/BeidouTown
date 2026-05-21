import { auth } from '@/auth';

export async function getCurrentResident() {
  const session = await auth();

  return session?.user ?? null;
}

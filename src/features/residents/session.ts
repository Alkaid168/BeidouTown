import type { UserRole } from '@prisma/client';
import { auth } from '@/auth';

export type CurrentResident = {
  id: string;
  email?: string | null;
  image?: string | null;
  name?: string | null;
  role: UserRole;
};

export async function getCurrentResident(): Promise<CurrentResident | null> {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  return session.user as CurrentResident;
}

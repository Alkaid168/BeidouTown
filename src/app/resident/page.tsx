import { redirect } from 'next/navigation';
import { ResidentProfileClient } from '@/components/resident/resident-profile-client';
import { getResidentProfile } from '@/features/residents/profile';
import { getCurrentResident } from '@/features/residents/session';

export default async function ResidentPage() {
  const resident = await getCurrentResident();

  if (!resident) {
    redirect('/login');
  }

  const profile = await getResidentProfile(resident.id);

  if (!profile) {
    redirect('/');
  }

  return <ResidentProfileClient profile={profile} />;
}

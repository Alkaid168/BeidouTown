import { HomeClient } from '@/components/home/home-client';
import { getCurrentResident } from '@/features/residents/session';

export default async function Home() {
  const resident = await getCurrentResident();

  return <HomeClient resident={resident} />;
}

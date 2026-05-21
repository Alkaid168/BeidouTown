import { TempleClient } from '@/components/temple/temple-client';
import { getCurrentResident } from '@/features/residents/session';
import { listTarotReadings } from '@/features/temple/readings';

export default async function TemplePage() {
  const resident = await getCurrentResident();
  const history = await listTarotReadings(resident);

  return (
    <main className="min-h-screen overflow-hidden bg-[#02030a] px-6 py-8 text-stone-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(79,70,229,0.24),transparent_32%),radial-gradient(circle_at_78%_12%,rgba(234,179,8,0.14),transparent_26%),linear-gradient(180deg,rgba(15,23,42,0),#02030a_80%)]" />
      <div className="relative mx-auto w-full max-w-6xl">
        <TempleClient history={history} resident={resident} />
      </div>
    </main>
  );
}

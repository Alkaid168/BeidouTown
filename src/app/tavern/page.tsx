import { TavernClient } from '@/components/tavern/tavern-client';
import { getCurrentResident } from '@/features/residents/session';
import { listRecentTavernMessages } from '@/features/tavern/messages';

export default async function TavernPage() {
  const resident = await getCurrentResident();
  const messages = await listRecentTavernMessages(resident);

  return (
    <main className="min-h-screen overflow-hidden bg-[#02030a] px-6 py-10 text-stone-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(79,70,229,0.28),transparent_34%),radial-gradient(circle_at_80%_10%,rgba(234,179,8,0.12),transparent_28%),linear-gradient(180deg,rgba(15,23,42,0),#02030a_78%)]" />
      <section className="relative mx-auto w-full max-w-6xl">
        <TavernClient initialMessages={messages} resident={resident} />
      </section>
    </main>
  );
}

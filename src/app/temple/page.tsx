import { TempleHomeClient } from '@/components/temple/temple-home-client';
import { templeSpreads } from '@/features/temple/spreads';

export default function TemplePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05060d] text-stone-100">
      <div className="absolute inset-0 bg-[url('/temple-background.png')] bg-cover bg-center opacity-88" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_52%_78%,rgba(255,182,96,0.18),transparent_48%),radial-gradient(ellipse_at_30%_24%,rgba(255,214,160,0.12),transparent_34%),radial-gradient(circle_at_18%_24%,rgba(119,167,255,0.08),transparent_26%),linear-gradient(180deg,rgba(6,4,2,0.20)_0%,rgba(5,3,2,0.56)_44%,rgba(3,2,1,0.90)_100%)]" />
      <div className="absolute inset-0 backdrop-blur-[1.5px]" />
      <div className="absolute inset-0 shadow-[inset_0_0_240px_rgba(0,0,0,0.88),inset_0_120px_180px_rgba(0,0,0,0.42),inset_0_-120px_180px_rgba(0,0,0,0.40)]" />

      <section className="relative mx-auto flex min-h-screen w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-10">
        <TempleHomeClient spreads={templeSpreads} />
      </section>
    </main>
  );
}

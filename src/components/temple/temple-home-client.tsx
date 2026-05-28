'use client';

import Link from 'next/link';

export function TempleHomeClient({
  spreads,
}: {
  spreads: Array<{ slug: string; title: string; subtitle: string }>;
}) {
  return (
    <div className="fixed inset-0 flex min-h-screen w-screen flex-col overflow-hidden animate-[page-float-in_900ms_ease-out_both] px-4 py-6 sm:px-6 lg:px-10">
      <div className="mb-5 flex shrink-0 items-start justify-between gap-4 border-b border-white/10 pb-5 relative z-[80] pointer-events-none">
        <div className="pointer-events-auto">
          <p className="text-xs tracking-[0.55em] text-amber-100/70">ORACLE TEMPLE</p>
          <h1 className="mt-2 font-serif text-4xl font-semibold tracking-[0.18em] text-stone-50">占卜寺庙</h1>
        </div>
        <Link className="pointer-events-auto border-0 bg-transparent px-1 py-1 text-sm tracking-[0.45em] text-stone-100/58 transition duration-500 hover:text-white hover:drop-shadow-[0_0_14px_rgba(255,214,245,0.85)]" href="/">
          回到镇口
        </Link>
      </div>

      <div className="relative min-h-0 flex-1 overflow-y-auto rounded-[0.35rem] border border-[rgba(232,188,128,0.20)] bg-[linear-gradient(175deg,rgba(30,20,13,0.68),rgba(14,10,7,0.78))] px-6 py-6 shadow-[inset_0_1px_0_rgba(255,244,226,0.06),0_24px_56px_rgba(0,0,0,0.34)] backdrop-blur-[2px]">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {spreads.map((spread) => (
            <Link
              key={spread.slug}
              href={`/temple/${spread.slug}`}
              className="group rounded-[0.35rem] border border-[rgba(232,188,128,0.18)] bg-[linear-gradient(175deg,rgba(40,28,20,0.68),rgba(18,13,10,0.82))] p-5 shadow-[inset_0_1px_0_rgba(255,244,226,0.04),0_16px_40px_rgba(0,0,0,0.28)] transition duration-500 hover:border-[rgba(255,214,156,0.36)] hover:bg-[linear-gradient(175deg,rgba(52,36,24,0.74),rgba(24,17,12,0.90))] hover:shadow-[inset_0_1px_0_rgba(255,244,226,0.06),0_24px_48px_rgba(0,0,0,0.34)]"
            >
              <p className="text-xs tracking-[0.18em] text-amber-100/70">{spread.subtitle}</p>
              <h2 className="mt-3 font-serif text-2xl text-amber-50 transition duration-300 group-hover:text-amber-100">{spread.title}</h2>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

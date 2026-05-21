import Link from 'next/link';
import { LogoutButton } from '@/components/logout-button';
import { getCurrentResident } from '@/features/residents/session';

const townAreas = [
  {
    name: '小酒馆',
    description: '居民们在夜色里闲聊的公共房间。',
    href: '/tavern',
  },
  {
    name: '树洞邮局',
    description: '投递心情、思考和不便署名的话。',
    href: null,
  },
  {
    name: '寺庙',
    description: '抽取塔罗牌，让星光给出一段解读。',
    href: null,
  },
];

export default async function Home() {
  const resident = await getCurrentResident();

  return (
    <main className="min-h-screen overflow-hidden bg-[#02030a] text-stone-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(79,70,229,0.28),transparent_34%),radial-gradient(circle_at_80%_10%,rgba(234,179,8,0.12),transparent_28%),linear-gradient(180deg,rgba(15,23,42,0),#02030a_78%)]" />
      <section className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-16">
        <div className="mb-10 flex items-center justify-between gap-4">
          <p className="text-sm tracking-[0.45em] text-amber-200/80">BEIDOU TOWN</p>
          {resident ? <LogoutButton /> : null}
        </div>
        <h1 className="text-6xl font-semibold tracking-tight text-stone-50 sm:text-8xl">北斗镇</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-300">
          一座仍在夜色中修建的小镇。小酒馆、树洞邮局和寺庙将先后点亮。
        </p>
        {resident ? (
          <>
            <p className="mt-8 text-amber-100">欢迎回来，{resident.name ?? '居民'}。</p>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {townAreas.map((area) => (
                area.href ? (
                  <Link
                    className="group rounded-[2rem] border border-amber-100/15 bg-stone-100/[0.06] p-7 shadow-2xl shadow-indigo-950/50 backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-amber-200/40 hover:bg-stone-100/[0.09]"
                    href={area.href}
                    key={area.name}
                  >
                    <div className="mb-8 h-1 w-12 rounded-full bg-amber-200/70 transition group-hover:w-20" />
                    <h2 className="text-2xl font-medium text-stone-50">{area.name}</h2>
                    <p className="mt-4 text-sm leading-6 text-stone-300">{area.description}</p>
                  </Link>
                ) : (
                  <article
                    className="rounded-[2rem] border border-amber-100/10 bg-stone-100/[0.03] p-7 opacity-70 shadow-2xl shadow-indigo-950/30 backdrop-blur"
                    key={area.name}
                  >
                    <div className="mb-8 h-1 w-12 rounded-full bg-stone-400/40" />
                    <h2 className="text-2xl font-medium text-stone-50">{area.name}</h2>
                    <p className="mt-4 text-sm leading-6 text-stone-300">{area.description}</p>
                    <p className="mt-6 text-xs tracking-[0.25em] text-stone-500">COMING SOON</p>
                  </article>
                )
              ))}
            </div>
          </>
        ) : (
          <div className="mt-12 flex flex-col gap-3 sm:flex-row">
            <Link className="rounded-full bg-amber-200 px-6 py-3 text-center font-medium text-slate-950 transition hover:bg-amber-100" href="/register">
              成为居民
            </Link>
            <Link className="rounded-full border border-stone-400/30 px-6 py-3 text-center font-medium text-stone-100 transition hover:border-amber-200/60 hover:text-amber-100" href="/login">
              已有身份，进入小镇
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}

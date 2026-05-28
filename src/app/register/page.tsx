import Link from 'next/link';
import { registerResidentAction } from '@/features/residents/actions';

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05050a] bg-[url('/auth-background.jpg')] bg-cover bg-center px-6 py-10 text-stone-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_74%_30%,rgba(255,222,164,0.16),transparent_28%),radial-gradient(circle_at_22%_32%,rgba(151,203,255,0.26),transparent_34%),linear-gradient(90deg,rgba(3,5,16,0.88)_0%,rgba(9,10,23,0.63)_48%,rgba(9,8,15,0.40)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.30)_0_1px,transparent_1.4px)] bg-[length:92px_92px] opacity-20 animate-[starfield-drift_40s_linear_infinite]" />
      <div className="absolute inset-0 shadow-[inset_0_0_160px_rgba(0,0,0,0.82)]" />

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center gap-10 lg:grid-cols-[1fr_27rem]">
        <div className="max-w-2xl animate-[page-float-in_900ms_ease-out_both]">
          <Link className="text-xs tracking-[0.55em] text-cyan-100/55 transition hover:text-cyan-100" href="/">
            返回镇口
          </Link>
          <p className="mt-16 text-xs tracking-[0.85em] text-amber-100/62">NEW START</p>
          <h1 className="mt-5 font-serif text-6xl font-semibold tracking-[0.26em] text-white drop-shadow-[0_0_26px_rgba(255,226,173,0.45)] sm:text-7xl">
            新的开始
          </h1>
          <p className="mt-7 max-w-xl text-sm leading-8 tracking-[0.25em] text-stone-100/66">
            领取一枚属于你的北斗镇星标。小酒馆、树洞邮局和占卜寺庙会在夜里等你。
          </p>
        </div>

        <section className="animate-[page-float-in_1050ms_160ms_ease-out_both] border-l border-white/12 bg-black/18 px-7 py-8 shadow-[0_0_60px_rgba(255,197,104,0.14)] backdrop-blur-md">
          <p className="text-xs tracking-[0.5em] text-amber-100/58">RESIDENT MARK</p>
          {params.error ? <p className="mt-6 border-l border-rose-200/50 bg-rose-300/10 px-4 py-3 text-sm tracking-[0.12em] text-rose-100">{params.error}</p> : null}
          <form action={registerResidentAction} className="mt-8 space-y-6">
            <label className="block text-sm tracking-[0.28em] text-stone-100/70">
              邮箱
              <input className="mt-3 w-full border-0 border-b border-white/24 bg-transparent px-1 py-3 text-lg tracking-[0.08em] text-stone-50 outline-none transition focus:border-amber-100/80 focus:drop-shadow-[0_0_12px_rgba(255,226,173,0.45)]" name="email" required type="email" />
            </label>
            <label className="block text-sm tracking-[0.28em] text-stone-100/70">
              昵称
              <input className="mt-3 w-full border-0 border-b border-white/24 bg-transparent px-1 py-3 text-lg tracking-[0.08em] text-stone-50 outline-none transition focus:border-pink-100/80 focus:drop-shadow-[0_0_12px_rgba(255,205,231,0.45)]" maxLength={24} name="nickname" required />
            </label>
            <label className="block text-sm tracking-[0.28em] text-stone-100/70">
              密码
              <input className="mt-3 w-full border-0 border-b border-white/24 bg-transparent px-1 py-3 text-lg tracking-[0.08em] text-stone-50 outline-none transition focus:border-cyan-100/80 focus:drop-shadow-[0_0_12px_rgba(125,211,252,0.45)]" minLength={8} name="password" required type="password" />
            </label>
            <button className="group mt-4 w-full bg-white/90 px-5 py-4 text-sm font-semibold tracking-[0.38em] text-slate-950 transition duration-500 hover:bg-white hover:tracking-[0.5em] hover:shadow-[0_0_30px_rgba(255,255,255,0.35)]" type="submit">
              写入星名
            </button>
          </form>
          <p className="mt-7 text-sm tracking-[0.16em] text-stone-100/56">
            已经是居民？ <Link className="text-amber-100/90 underline decoration-white/20 underline-offset-4 transition hover:text-white" href="/login">载入记忆</Link>
          </p>
        </section>
      </section>
    </main>
  );
}

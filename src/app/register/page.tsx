import Link from 'next/link';
import { registerResidentAction } from '@/features/residents/actions';

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-[#02030a] px-6 py-16 text-stone-100">
      <section className="mx-auto max-w-md rounded-[2rem] border border-amber-100/15 bg-stone-100/[0.06] p-8 shadow-2xl shadow-indigo-950/50">
        <p className="text-sm tracking-[0.35em] text-amber-200/80">RESIDENT REGISTRY</p>
        <h1 className="mt-4 text-4xl font-semibold">成为北斗镇居民</h1>
        <p className="mt-4 text-sm leading-6 text-stone-300">注册后可以进入小酒馆、树洞邮局和寺庙。</p>
        {params.error ? <p className="mt-6 rounded-xl border border-red-300/30 bg-red-950/40 p-3 text-sm text-red-100">{params.error}</p> : null}
        <form action={registerResidentAction} className="mt-8 space-y-5">
          <label className="block text-sm text-stone-200">
            邮箱
            <input className="mt-2 w-full rounded-xl border border-stone-500/30 bg-black/30 px-4 py-3 text-stone-50 outline-none focus:border-amber-200/70" name="email" required type="email" />
          </label>
          <label className="block text-sm text-stone-200">
            昵称
            <input className="mt-2 w-full rounded-xl border border-stone-500/30 bg-black/30 px-4 py-3 text-stone-50 outline-none focus:border-amber-200/70" maxLength={24} name="nickname" required />
          </label>
          <label className="block text-sm text-stone-200">
            密码
            <input className="mt-2 w-full rounded-xl border border-stone-500/30 bg-black/30 px-4 py-3 text-stone-50 outline-none focus:border-amber-200/70" minLength={8} name="password" required type="password" />
          </label>
          <button className="w-full rounded-xl bg-amber-200 px-4 py-3 font-medium text-slate-950 transition hover:bg-amber-100" type="submit">注册</button>
        </form>
        <p className="mt-6 text-sm text-stone-300">已经是居民？ <Link className="text-amber-200" href="/login">去登录</Link></p>
      </section>
    </main>
  );
}

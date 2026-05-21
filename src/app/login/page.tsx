import Link from 'next/link';
import { loginResidentAction } from '@/features/residents/actions';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; registered?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-[#02030a] px-6 py-16 text-stone-100">
      <section className="mx-auto max-w-md rounded-[2rem] border border-amber-100/15 bg-stone-100/[0.06] p-8 shadow-2xl shadow-indigo-950/50">
        <p className="text-sm tracking-[0.35em] text-amber-200/80">TOWN GATE</p>
        <h1 className="mt-4 text-4xl font-semibold">进入北斗镇</h1>
        {params.registered ? <p className="mt-6 rounded-xl border border-emerald-300/30 bg-emerald-950/40 p-3 text-sm text-emerald-100">注册成功，请登录。</p> : null}
        {params.error ? <p className="mt-6 rounded-xl border border-red-300/30 bg-red-950/40 p-3 text-sm text-red-100">邮箱或密码不正确。</p> : null}
        <form action={loginResidentAction} className="mt-8 space-y-5">
          <label className="block text-sm text-stone-200">
            邮箱
            <input className="mt-2 w-full rounded-xl border border-stone-500/30 bg-black/30 px-4 py-3 text-stone-50 outline-none focus:border-amber-200/70" name="email" required type="email" />
          </label>
          <label className="block text-sm text-stone-200">
            密码
            <input className="mt-2 w-full rounded-xl border border-stone-500/30 bg-black/30 px-4 py-3 text-stone-50 outline-none focus:border-amber-200/70" name="password" required type="password" />
          </label>
          <button className="w-full rounded-xl bg-amber-200 px-4 py-3 font-medium text-slate-950 transition hover:bg-amber-100" type="submit">登录</button>
        </form>
        <p className="mt-6 text-sm text-stone-300">还没有身份？ <Link className="text-amber-200" href="/register">去注册</Link></p>
      </section>
    </main>
  );
}

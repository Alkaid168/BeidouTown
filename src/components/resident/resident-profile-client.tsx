'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { changeResidentPasswordAction, updateResidentProfileAction } from '@/features/residents/actions';
import type { ResidentProfileView } from '@/features/residents/profile';

export function ResidentProfileClient({ profile }: { profile: ResidentProfileView }) {
  const [draft, setDraft] = useState(profile);
  const [profileNotice, setProfileNotice] = useState<string | null>(null);
  const [passwordNotice, setPasswordNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submitProfile(formData: FormData) {
    startTransition(async () => {
      const result = await updateResidentProfileAction(formData);
      if (!result.ok) {
        setProfileNotice(result.error);
        return;
      }

      setDraft(result.profile);
      setProfileNotice('住民档案已经更新。');
    });
  }

  function submitPassword(formData: FormData) {
    startTransition(async () => {
      const result = await changeResidentPasswordAction(formData);
      setPasswordNotice(result.ok ? '密码已经更新。' : result.error);
    });
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05050a] text-stone-50">
      <div className="absolute inset-0 bg-[url('/home-background.jpg')] bg-cover bg-center opacity-82 blur-[2.2px] scale-[1.018]" />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_20%,rgba(120,160,255,0.18),transparent_30%),radial-gradient(circle_at_76%_74%,rgba(255,151,213,0.14),transparent_28%),linear-gradient(180deg,rgba(4,7,19,0.84)_0%,rgba(8,10,24,0.62)_42%,rgba(8,10,20,0.84)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.32)_0_1px,transparent_1.5px)] bg-[length:86px_86px] opacity-18" />
      <div className="absolute inset-0 shadow-[inset_0_0_180px_rgba(0,0,0,0.84)]" />

      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8 sm:px-10 lg:px-14">
        <div className="flex items-start justify-between gap-6 border-b border-white/10 pb-6">
          <div>
            <p className="text-xs tracking-[0.7em] text-cyan-100/65">RESIDENT ARCHIVE</p>
            <h1 className="mt-3 font-serif text-5xl font-semibold tracking-[0.24em] text-stone-50 sm:text-6xl">住民档案</h1>
            <p className="mt-4 text-sm tracking-[0.18em] text-stone-200/65">把属于你的名字、面容与笺言留在北斗镇。</p>
          </div>
          <Link className="border-0 bg-transparent px-1 py-1 text-sm tracking-[0.45em] text-stone-100/58 transition duration-500 hover:text-white hover:drop-shadow-[0_0_14px_rgba(255,214,245,0.85)]" href="/">
            回到群星
          </Link>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-[0.45rem] border border-[rgba(232,188,128,0.18)] bg-[rgba(12,12,18,0.42)] px-6 py-6 shadow-[0_24px_56px_rgba(0,0,0,0.28)] backdrop-blur-[8px]">
            <div className="flex items-start gap-5 border-b border-white/10 pb-6">
              <div className="relative flex size-24 items-center justify-center overflow-hidden rounded-full border border-cyan-100/20 bg-[rgba(15,19,31,0.72)] shadow-[0_0_32px_rgba(125,211,252,0.16)]">
                {draft.avatarUrl ? (
                  <img alt={`${draft.nickname}的头像`} className="h-full w-full object-cover" src={draft.avatarUrl} />
                ) : (
                  <span className="font-serif text-3xl text-stone-100">{draft.nickname.slice(0, 1)}</span>
                )}
              </div>
              <div className="pt-2">
                <p className="text-xs tracking-[0.45em] text-amber-100/62">CURRENT RESIDENT</p>
                <h2 className="mt-3 font-serif text-3xl tracking-[0.16em] text-stone-50">{draft.nickname}</h2>
                <p className="mt-3 max-w-xl text-sm leading-7 text-stone-200/72">{draft.signature ?? '夜色正浓，你还没有留下笺言。'}</p>
              </div>
            </div>

            <form action={submitProfile} className="mt-6 grid gap-5">
              <label className="grid gap-2">
                <span className="text-xs tracking-[0.4em] text-stone-300/65">用户名</span>
                <input className="rounded-[0.35rem] border border-white/10 bg-[rgba(8,9,16,0.42)] px-4 py-3 text-sm text-stone-100 outline-none focus:border-cyan-100/40" defaultValue={draft.nickname} name="nickname" />
              </label>
              <label className="grid gap-2">
                <span className="text-xs tracking-[0.4em] text-stone-300/65">头像地址</span>
                <input className="rounded-[0.35rem] border border-white/10 bg-[rgba(8,9,16,0.42)] px-4 py-3 text-sm text-stone-100 outline-none focus:border-cyan-100/40" defaultValue={draft.avatarUrl ?? ''} name="avatarUrl" placeholder="https://example.com/avatar.png" />
              </label>
              <label className="grid gap-2">
                <span className="text-xs tracking-[0.4em] text-stone-300/65">笺言</span>
                <textarea className="min-h-28 rounded-[0.35rem] border border-white/10 bg-[rgba(8,9,16,0.42)] px-4 py-3 text-sm text-stone-100 outline-none focus:border-cyan-100/40" defaultValue={draft.signature ?? ''} maxLength={80} name="signature" placeholder="写下一句留给夜色的话。" />
              </label>
              {profileNotice ? <p className="text-sm text-amber-100/82">{profileNotice}</p> : null}
              <button className="w-fit rounded-[0.35rem] border border-[rgba(232,188,128,0.24)] bg-[rgba(255,244,226,0.10)] px-5 py-3 text-sm tracking-[0.28em] text-amber-50 transition duration-300 hover:border-[rgba(180,220,255,0.56)] hover:bg-[rgba(180,220,255,0.18)] disabled:opacity-30" disabled={isPending} type="submit">
                保存档案
              </button>
            </form>
          </section>

          <section className="rounded-[0.45rem] border border-[rgba(232,188,128,0.18)] bg-[rgba(12,12,18,0.42)] px-6 py-6 shadow-[0_24px_56px_rgba(0,0,0,0.28)] backdrop-blur-[8px]">
            <p className="text-xs tracking-[0.45em] text-amber-100/62">PASSWORD RITUAL</p>
            <h2 className="mt-3 font-serif text-3xl tracking-[0.16em] text-stone-50">更换密码</h2>
            <p className="mt-3 text-sm leading-7 text-stone-200/72">确认旧密码后，把新的记忆印记留在这里。</p>

            <form action={submitPassword} className="mt-6 grid gap-5">
              <label className="grid gap-2">
                <span className="text-xs tracking-[0.4em] text-stone-300/65">当前密码</span>
                <input className="rounded-[0.35rem] border border-white/10 bg-[rgba(8,9,16,0.42)] px-4 py-3 text-sm text-stone-100 outline-none focus:border-cyan-100/40" name="currentPassword" type="password" />
              </label>
              <label className="grid gap-2">
                <span className="text-xs tracking-[0.4em] text-stone-300/65">新密码</span>
                <input className="rounded-[0.35rem] border border-white/10 bg-[rgba(8,9,16,0.42)] px-4 py-3 text-sm text-stone-100 outline-none focus:border-cyan-100/40" name="newPassword" type="password" />
              </label>
              <label className="grid gap-2">
                <span className="text-xs tracking-[0.4em] text-stone-300/65">确认新密码</span>
                <input className="rounded-[0.35rem] border border-white/10 bg-[rgba(8,9,16,0.42)] px-4 py-3 text-sm text-stone-100 outline-none focus:border-cyan-100/40" name="confirmPassword" type="password" />
              </label>
              {passwordNotice ? <p className="text-sm text-amber-100/82">{passwordNotice}</p> : null}
              <button className="w-fit rounded-[0.35rem] border border-[rgba(232,188,128,0.24)] bg-transparent px-5 py-3 text-sm tracking-[0.28em] text-stone-100/82 transition duration-300 hover:border-[rgba(180,220,255,0.56)] hover:text-white disabled:opacity-30" disabled={isPending} type="submit">
                更新密码
              </button>
            </form>
          </section>
        </div>
      </section>
    </main>
  );
}

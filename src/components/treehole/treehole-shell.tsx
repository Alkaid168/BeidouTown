import Link from 'next/link';
import type { ReactNode } from 'react';

function actionClassName(primary = false) {
  return primary
    ? 'pointer-events-auto border-0 bg-transparent px-1 py-1 text-sm tracking-[0.45em] text-lime-200/78 transition duration-500 hover:text-lime-100 hover:drop-shadow-[0_0_14px_rgba(204,255,153,0.65)]'
    : 'pointer-events-auto border-0 bg-transparent px-1 py-1 text-sm tracking-[0.45em] text-stone-100/58 transition duration-500 hover:text-white hover:drop-shadow-[0_0_14px_rgba(255,214,245,0.85)]';
}

export function TreeholeShell({
  actions,
  backgroundImage,
  children,
  description,
  eyebrow,
  returnHref = '/treehole',
  returnLabel = '回到邮局',
  title,
}: {
  actions?: ReactNode;
  backgroundImage: string;
  children: ReactNode;
  description?: string;
  eyebrow: string;
  returnHref?: string;
  returnLabel?: string;
  title: string;
}) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05060d] text-stone-100">
      <div className="absolute inset-0 bg-cover bg-center opacity-88" style={{ backgroundImage: `url(${backgroundImage})` }} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_52%_78%,rgba(255,182,96,0.22),transparent_48%),radial-gradient(ellipse_at_30%_24%,rgba(255,214,160,0.14),transparent_34%),radial-gradient(circle_at_18%_24%,rgba(119,167,255,0.08),transparent_26%),linear-gradient(180deg,rgba(6,4,2,0.20)_0%,rgba(5,3,2,0.56)_44%,rgba(3,2,1,0.90)_100%)]" />
      <div className="absolute inset-0 backdrop-blur-[1.5px]" />
      <div className="absolute inset-0 shadow-[inset_0_0_240px_rgba(0,0,0,0.88),inset_0_120px_180px_rgba(0,0,0,0.42),inset_0_-120px_180px_rgba(0,0,0,0.40)]" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGRlZnM+PGZpbHRlciBpZD0iZyI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9Ii42IiBudW1PY3RhdmVzPSIyIiAvPjwvZmlsdGVyPjwvZGVmcz48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbHRlcj0idXJsKCNnKSIgb3BhY2l0eT0iLjAyIiAvPjwvc3ZnPg==')] bg-fixed opacity-60" />

      <section className="relative mx-auto flex min-h-screen w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-10">
        <div className="fixed inset-0 flex min-h-screen w-screen flex-col overflow-hidden animate-[page-float-in_900ms_ease-out_both] px-4 py-6 sm:px-6 lg:px-10">
          <div className="mb-5 flex shrink-0 items-start justify-between gap-4 border-b border-white/10 pb-5 relative z-[80] pointer-events-none">
            <div className="pointer-events-auto">
              <p className="text-xs tracking-[0.55em] text-amber-100/70">{eyebrow}</p>
              <h1 className="mt-2 font-serif text-4xl font-semibold tracking-[0.18em] text-stone-50">{title}</h1>
              {description ? <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-200/70">{description}</p> : null}
            </div>
            <div className="flex flex-wrap items-start justify-end gap-5 text-right pointer-events-auto">
              {actions}
              <Link className={actionClassName(false)} href={returnHref}>
                {returnLabel}
              </Link>
            </div>
          </div>

          <div className="relative min-h-0 flex-1 overflow-hidden rounded-[0.35rem] border border-[rgba(232,188,128,0.20)] bg-[linear-gradient(175deg,rgba(30,20,13,0.68),rgba(14,10,7,0.78))] shadow-[inset_0_1px_0_rgba(255,244,226,0.06),0_24px_56px_rgba(0,0,0,0.34)] backdrop-blur-[2px]">
            <div className="absolute inset-x-0 top-0 z-10 h-20 bg-[linear-gradient(180deg,rgba(10,8,6,0.55),transparent)] pointer-events-none" />
            <div className="relative z-20 h-full overflow-y-auto px-6 py-5 sm:px-6 sm:py-6">{children}</div>
          </div>
        </div>
      </section>
    </main>
  );
}

export { actionClassName };

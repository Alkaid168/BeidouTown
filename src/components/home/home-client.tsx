'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties, MouseEvent } from 'react';
import { logoutResidentAction } from '@/features/residents/actions';
import type { CurrentResident } from '@/features/residents/session';
import { getAdaptiveStarLayout, getStarFrame } from './star-layout';
import type { AdaptiveStar } from './star-layout';

const DEFAULT_HOME_ASPECT_RATIO = 16 / 9;
const HOME_STARTED_SESSION_KEY = 'beidou-home-started-resident';

type StarDestination = AdaptiveStar;

function getViewportAspectRatio() {
  return window.innerWidth / window.innerHeight;
}

export function HomeClient({ resident }: { resident: CurrentResident | null }) {
  const [hydrated, setHydrated] = useState(false);
  const [started, setStarted] = useState(false);
  const [cursorTarget, setCursorTarget] = useState({ x: 62, y: 38 });

  useEffect(() => {
    if (!resident) {
      setStarted(false);
      setHydrated(true);
      return;
    }

    setStarted(window.sessionStorage.getItem(HOME_STARTED_SESSION_KEY) === '1');
    setHydrated(true);
  }, [resident]);

  useEffect(() => {
    function handleKeydown() {
      setStarted((current) => {
        if (current) {
          return current;
        }

        if (resident) {
          window.sessionStorage.setItem(HOME_STARTED_SESSION_KEY, '1');
        }
        document.documentElement.requestFullscreen?.().catch(() => undefined);
        return true;
      });
    }

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [resident]);

  function updateCursor(event: MouseEvent<HTMLElement>) {
    setCursorTarget({
      x: (event.clientX / window.innerWidth) * 100,
      y: (event.clientY / window.innerHeight) * 100,
    });
  }

  function startTitleScreen() {
    if (started) {
      return;
    }

    if (resident) {
      window.sessionStorage.setItem(HOME_STARTED_SESSION_KEY, '1');
    }
    setStarted(true);
    document.documentElement.requestFullscreen?.().catch(() => undefined);
  }

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#05050a] text-stone-50"
      onMouseMove={updateCursor}
      style={{ '--cursor-x': `${cursorTarget.x}%`, '--cursor-y': `${cursorTarget.y}%` } as CSSProperties}
    >
      <div className="absolute inset-0 bg-[url('/home-background.png')] bg-cover bg-center opacity-82 blur-[2.2px] scale-[1.018]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_var(--cursor-x)_var(--cursor-y),rgba(255,151,213,0.18),rgba(118,202,255,0.08)_14%,transparent_30%),radial-gradient(circle_at_28%_24%,rgba(120,160,255,0.23),transparent_35%),radial-gradient(circle_at_80%_70%,transparent_0%,rgba(0,0,0,0.28)_58%,rgba(0,0,0,0.62)_100%),linear-gradient(90deg,rgba(4,7,19,0.88)_0%,rgba(7,9,22,0.66)_43%,rgba(10,12,20,0.42)_70%,rgba(255,255,255,0.05)_100%)] transition-[background] duration-700 ease-out" />
      <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.36)_0_1px,transparent_1.5px)] bg-[length:86px_86px] opacity-24 animate-[starfield-drift_34s_linear_infinite]" />
      <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_0%,rgba(255,207,236,0.13)_43%,rgba(130,206,255,0.12)_52%,transparent_64%)] opacity-45 animate-[aurora-sweep_18s_ease-in-out_infinite]" />
      <div data-testid="cursor-aura" className="pointer-events-none absolute left-[var(--cursor-x)] top-[var(--cursor-y)] size-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,214,244,0.24)_0%,rgba(125,211,252,0.13)_34%,rgba(250,204,21,0.05)_55%,transparent_76%)] blur-2xl opacity-55 mix-blend-screen transition-[left,top] duration-500 ease-out animate-[cursor-aura_9s_linear_infinite]" />
      <div className="absolute inset-0 shadow-[inset_0_0_170px_rgba(0,0,0,0.84)]" />

      {!hydrated || !started ? <SharedIntroGate onStart={startTitleScreen} /> : null}
      {hydrated && started && resident ? <ResidentConstellation resident={resident} /> : null}
      {hydrated && started && !resident ? <GuestMemoryMenu /> : null}
    </main>
  );
}

function SharedIntroGate({ onStart }: { onStart: () => void }) {
  return (
    <section className="relative z-20 flex min-h-screen w-full items-center px-8 sm:px-16 lg:px-24">
      <div className="w-full max-w-3xl text-center lg:text-left">
        <p className="mb-5 text-xs tracking-[0.85em] text-cyan-100/70">THE SEVENTH LIGHT OPENS</p>
        <h1 className="font-serif text-7xl font-semibold tracking-[0.26em] text-stone-50 drop-shadow-[0_0_24px_rgba(154,211,255,0.38)] sm:text-8xl lg:text-9xl">
          北斗镇
        </h1>
        <p className="mt-6 max-w-xl text-sm leading-7 tracking-[0.42em] text-stone-200/72 lg:mx-0">在星夜里醒来，选择一段记忆的入口</p>
        <button
          aria-label="按任意键开始"
          className="mt-20 bg-transparent text-sm tracking-[0.42em] text-stone-100/45 transition duration-700 hover:text-stone-100/80 animate-pulse"
          onClick={onStart}
          type="button"
        >
          按任意键开始
        </button>
      </div>
    </section>
  );
}

function GuestMemoryMenu() {
  return (
    <section className="relative z-10 flex min-h-screen w-full items-center px-8 sm:px-16 lg:px-24">
      <div className="w-full max-w-3xl text-center lg:text-left">
        <p className="mb-5 text-xs tracking-[0.85em] text-cyan-100/70">THE SEVENTH LIGHT OPENS</p>
        <h1 className="font-serif text-7xl font-semibold tracking-[0.26em] text-stone-50 drop-shadow-[0_0_24px_rgba(154,211,255,0.38)] sm:text-8xl lg:text-9xl">
          北斗镇
        </h1>
        <p className="mt-6 max-w-xl text-sm leading-7 tracking-[0.42em] text-stone-200/72 lg:mx-0">在星夜里醒来，选择一段记忆的入口</p>
        <nav aria-label="北斗镇记忆菜单" className="mt-8 grid gap-7 transition-all duration-1000 translate-y-0 opacity-100 blur-0">
          <TitleLink eyebrow="新的开始" href="/register" label="NEW START" />
          <TitleLink eyebrow="载入记忆" href="/login" label="LOAD MEMORY" />
        </nav>
      </div>
    </section>
  );
}

function TitleLink({ eyebrow, href, label }: { eyebrow: string; href: string; label: string }) {
  return (
    <Link className="group mx-auto grid w-fit gap-1 text-center lg:mx-0" href={href}>
      <span className="text-sm tracking-[0.55em] text-stone-300/62 transition group-hover:text-cyan-100">{eyebrow}</span>
      <span className="text-3xl font-semibold tracking-[0.32em] text-stone-200/82 transition duration-300 group-hover:scale-105 group-hover:text-white group-hover:drop-shadow-[0_0_18px_rgba(125,211,252,0.8)]">
        {label}
      </span>
    </Link>
  );
}

function ResidentConstellation({ resident }: { resident: CurrentResident }) {
  const [hoveredStar, setHoveredStar] = useState<StarDestination | null>(null);
  const [labelPosition, setLabelPosition] = useState({ x: 0, y: 0 });
  const [driftProgress, setDriftProgress] = useState(0);
  const [aspectRatio, setAspectRatio] = useState(DEFAULT_HOME_ASPECT_RATIO);
  const layout = useMemo(() => getAdaptiveStarLayout(aspectRatio), [aspectRatio]);
  const frame = useMemo(() => getStarFrame(layout.stars, driftProgress), [layout.stars, driftProgress]);
  const stars = frame.stars;
  const starLinePoints = frame.linePoints;

  useEffect(() => {
    function handleResize() {
      setAspectRatio(getViewportAspectRatio());
    }

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let frameId = 0;
    const startedAt = performance.now();

    function tick(now: number) {
      setDriftProgress(((now - startedAt) % 18_000) / 18_000);
      frameId = requestAnimationFrame(tick);
    }

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, []);

  function showStarLabel(star: StarDestination, event: MouseEvent<HTMLElement>) {
    setHoveredStar(star);
    setLabelPosition({ x: event.clientX, y: event.clientY });
  }

  function showFocusedStarLabel(star: StarDestination) {
    setHoveredStar(star);
    setLabelPosition({ x: window.innerWidth * (star.x / 100), y: window.innerHeight * (star.y / 100) });
  }

  return (
    <section className="relative z-10 min-h-screen px-5 py-7 sm:px-10 lg:px-16">
      <div className="flex items-start justify-between gap-4">
        <div className="animate-[home-title-in_900ms_ease-out_both]">
          <p className="text-xs tracking-[0.7em] text-cyan-100/65">BEIDOU TOWN</p>
          <h1 className="mt-3 font-serif text-5xl font-semibold tracking-[0.28em] text-stone-50 sm:text-6xl">北斗镇</h1>
          <p className="mt-4 text-sm tracking-[0.18em] text-stone-200/65">欢迎回来，{resident.name ?? '居民'}。</p>
        </div>
        <div className="pointer-events-auto relative z-[80]">
          <form action={logoutResidentAction}>
            <button className="cursor-pointer rounded-none border-0 bg-transparent px-2 py-1 text-sm tracking-[0.45em] text-stone-100/58 transition duration-500 hover:text-white hover:drop-shadow-[0_0_14px_rgba(255,214,245,0.85)]" type="submit">
              离去
            </button>
          </form>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-[12%] top-[14%] h-[68vh] sm:inset-x-[14%] lg:inset-x-[16%]">
        <div className="relative h-full w-full origin-center scale-[0.86] animate-[home-constellation-in_1200ms_260ms_ease-out_both,beidou-orbit_96s_1.46s_linear_infinite]" aria-label="缓缓旋转的北斗七星导航">
          <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <polyline data-testid="constellation-line" className="animate-[constellation-line_8s_ease-in-out_infinite]" points={starLinePoints} fill="none" stroke="rgba(214,232,255,0.28)" strokeWidth="0.24" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {stars.map((star) => <StarNode key={star.name} onBlur={() => setHoveredStar(null)} onFocus={showFocusedStarLabel} onHover={showStarLabel} onLeave={() => setHoveredStar(null)} star={star} />)}
        </div>
      </div>
      <ResidentProfileEntry resident={resident} />
      <StarLabel position={labelPosition} star={hoveredStar} />
    </section>
  );
}

function ResidentProfileEntry({ resident }: { resident: CurrentResident }) {
  return (
    <Link aria-label={`进入${resident.name ?? '这位居民'}的住民档案`} className="group pointer-events-auto absolute bottom-8 left-8 z-[70] flex items-end gap-4" href="/resident">
      <span className="relative flex size-14 items-center justify-center overflow-hidden rounded-full border border-cyan-100/20 bg-[rgba(15,19,31,0.72)] shadow-[0_0_24px_rgba(125,211,252,0.14)] transition duration-500 group-hover:scale-105 group-hover:border-cyan-100/45 group-hover:shadow-[0_0_36px_rgba(125,211,252,0.24)]">
        {resident.image ? (
          <img alt={resident.name ?? '居民头像'} className="h-full w-full object-cover" src={resident.image} />
        ) : (
          <span className="font-serif text-xl text-stone-100">{(resident.name ?? '居').slice(0, 1)}</span>
        )}
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.16),transparent_58%)]" />
      </span>
      <span className="translate-y-1 text-sm tracking-[0.32em] text-stone-100/0 transition duration-500 group-hover:translate-y-0 group-hover:text-stone-100/78 group-focus-visible:translate-y-0 group-focus-visible:text-stone-100/78">
        {resident.name ?? '居民'}
      </span>
    </Link>
  );
}

function StarLabel({ position, star }: { position: { x: number; y: number }; star: StarDestination | null }) {
  const style = {
    left: position.x + 30,
    top: position.y - 20,
    color: star?.hue ?? 'rgba(255, 255, 255, 0.8)',
  } as CSSProperties;

  return (
    <div className={`pointer-events-none fixed z-20 -translate-y-1/2 transition duration-500 ${star ? 'translate-x-2 opacity-100 blur-0' : '-translate-x-1 opacity-0 blur-[2px]'}`} style={style}>
      <strong className="block font-serif text-4xl font-semibold tracking-[0.24em] text-white/90 drop-shadow-[0_0_18px_currentColor]">{star?.name}</strong>
      <span className="mt-1 block text-base tracking-[0.28em] text-stone-100/64 drop-shadow-[0_0_14px_currentColor]">{star?.place}</span>
    </div>
  );
}

function StarNode({
  star,
  onBlur,
  onFocus,
  onHover,
  onLeave,
}: {
  star: StarDestination;
  onBlur: () => void;
  onFocus: (star: StarDestination) => void;
  onHover: (star: StarDestination, event: MouseEvent<HTMLElement>) => void;
  onLeave: () => void;
}) {
  const style = {
    '--star-hue': star.hue,
    '--star-delay': star.delay,
    left: `${star.x}%`,
    top: `${star.y}%`,
  } as CSSProperties;

  const content = (
    <>
      <span className="absolute inset-[-3.6rem] rounded-full bg-[radial-gradient(circle,var(--star-hue),rgba(255,255,255,0.32)_17%,transparent_62%)] opacity-45 blur-2xl transition duration-500 group-hover:scale-150 group-hover:opacity-100 group-hover:blur-3xl animate-[star-aura_3.4s_ease-in-out_infinite]" />
      <span className="absolute inset-[-1.25rem] rounded-full border border-white/35 opacity-0 transition duration-500 group-hover:scale-[2.3] group-hover:opacity-85" />
      <span className="relative block size-5 rounded-full bg-white shadow-[0_0_24px_var(--star-hue),0_0_62px_var(--star-hue)] transition duration-500 sm:size-6 group-hover:scale-[1.8] animate-[star-breathe_4.6s_ease-in-out_infinite]" />
    </>
  );

  const className = 'group pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 outline-none transition-[transform,filter] duration-500 hover:scale-150 focus-visible:scale-150 animate-[star-appear_900ms_ease-out_both]';

  if (star.href) {
    return (
      <Link aria-label={`${star.name} ${star.place}`} className={className} href={star.href} onBlur={onBlur} onFocus={() => onFocus(star)} onMouseEnter={(event) => onHover(star, event)} onMouseLeave={onLeave} onMouseMove={(event) => onHover(star, event)} style={style}>
        {content}
      </Link>
    );
  }

  return (
    <div aria-label={`${star.name} ${star.place}`} className={`${className} cursor-default`} onMouseEnter={(event) => onHover(star, event)} onMouseLeave={onLeave} onMouseMove={(event) => onHover(star, event)} style={style}>
      {content}
    </div>
  );
}

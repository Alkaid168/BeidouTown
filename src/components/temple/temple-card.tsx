'use client';

export function TempleCard({
  positionLabel,
  revealed,
  active,
  disabled,
  imagePath,
  cardNameCn,
  romanIndex,
  orientation,
  onReveal,
}: {
  positionLabel: string;
  revealed: boolean;
  active: boolean;
  disabled: boolean;
  imagePath: string;
  cardNameCn: string;
  romanIndex: string;
  orientation: 'upright' | 'reversed';
  onReveal: () => void;
}) {
  const meta = `「${romanIndex}」${cardNameCn} ${orientation === 'upright' ? '正位' : '逆位'}`;
  const cardStateClass = active
    ? 'scale-[1.03] opacity-100 saturate-110'
    : revealed
      ? 'scale-[0.98] opacity-72 saturate-75'
      : 'scale-[0.97] opacity-45 saturate-50';

  return (
    <button
      aria-label={`翻开${positionLabel}`}
      className={[
        'group relative flex w-full flex-col items-center gap-3 rounded-[0.45rem] border px-4 py-4 text-center transition duration-500',
        active
          ? 'z-20 border-amber-200/85 bg-[rgba(255,244,226,0.05)] shadow-[0_0_46px_rgba(255,214,156,0.28)]'
          : 'border-[rgba(232,188,128,0.18)] bg-[rgba(10,8,6,0.18)] shadow-[0_12px_32px_rgba(0,0,0,0.22)]',
        disabled ? 'cursor-default' : 'cursor-pointer',
      ].join(' ')}
      disabled={disabled}
      onClick={onReveal}
      type="button"
    >
      <div className={`pointer-events-none absolute inset-0 rounded-[0.45rem] bg-[radial-gradient(circle_at_center,rgba(255,223,168,0.16),transparent_62%)] blur-xl transition duration-500 ${active ? 'opacity-100' : 'opacity-0'}`} />
      <div className="w-full [perspective:1400px]">
        <div
          className={[
            'relative mx-auto aspect-[9/16] w-full max-w-[12rem] transition-[transform,opacity,filter] duration-700',
            active ? 'animate-[temple-card-pulse_1500ms_ease-in-out_infinite]' : '',
            revealed ? 'rotate-[1.5deg]' : 'rotate-0',
            cardStateClass,
          ].join(' ')}
        >
          <div className={`absolute inset-0 overflow-hidden rounded-[0.5rem] border border-[rgba(232,188,128,0.24)] bg-[rgba(20,14,10,0.78)] shadow-[0_18px_44px_rgba(0,0,0,0.34)] transition-all duration-500 ${revealed ? 'pointer-events-none scale-[0.96] opacity-0 blur-[2px]' : 'scale-100 opacity-100 blur-0'}`}>
            <img alt="塔罗牌背" className="h-full w-full object-cover" src="/tarot/card-back.png" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_32%,rgba(255,232,191,0.24),transparent_40%),linear-gradient(180deg,rgba(9,8,16,0.04),rgba(5,3,2,0.24))]" />
          </div>
          <div className={`absolute inset-0 overflow-hidden rounded-[0.5rem] border border-[rgba(232,188,128,0.24)] bg-[rgba(20,14,10,0.78)] shadow-[0_18px_44px_rgba(0,0,0,0.34)] transition-all duration-500 ${revealed ? 'scale-100 opacity-100 blur-0' : 'pointer-events-none scale-[1.04] opacity-0 blur-[2px]'}`}>
            <img alt={cardNameCn} className={`h-full w-full object-cover transition duration-500 ${orientation === 'reversed' ? 'rotate-180' : ''}`} src={imagePath} />
          </div>
        </div>
      </div>
      <div className={`transition duration-500 ${active ? 'opacity-100' : revealed ? 'opacity-80' : 'opacity-62'}`}>
        <p className={`text-sm tracking-[0.22em] ${active ? 'text-amber-50' : 'text-amber-100/72'}`}>{positionLabel}</p>
        {revealed ? <p className="mt-1 text-sm text-stone-100">{meta}</p> : null}
      </div>
    </button>
  );
}

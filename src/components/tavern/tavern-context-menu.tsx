export type TavernMenuAction = {
  key: string;
  label: string;
  tone?: 'default' | 'danger';
  onSelect: () => void;
};

export function TavernContextMenu({
  actions,
  x,
  y,
}: {
  actions: TavernMenuAction[];
  x: number;
  y: number;
}) {
  return (
    <div
      className="fixed z-40 min-w-32 rounded-xl border border-white/15 bg-[#131722]/92 p-2 shadow-[0_18px_48px_rgba(0,0,0,0.42)] backdrop-blur-md"
      role="menu"
      style={{ left: x, top: y }}
    >
      {actions.map((action) => (
        <button
          className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition hover:bg-white/8 ${action.tone === 'danger' ? 'text-rose-200' : 'text-stone-200'}`}
          key={action.key}
          onClick={action.onSelect}
          role="menuitem"
          type="button"
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}

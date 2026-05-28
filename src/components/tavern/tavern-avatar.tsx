const avatarPalette = [
  { background: 'rgba(84, 58, 39, 0.72)', border: 'rgba(178, 135, 88, 0.62)' },
  { background: 'rgba(66, 79, 47, 0.72)', border: 'rgba(151, 176, 110, 0.56)' },
  { background: 'rgba(88, 46, 42, 0.72)', border: 'rgba(189, 117, 98, 0.56)' },
  { background: 'rgba(78, 60, 92, 0.72)', border: 'rgba(162, 139, 186, 0.56)' },
  { background: 'rgba(95, 71, 44, 0.72)', border: 'rgba(201, 160, 92, 0.6)' },
];

function getAvatarToken(nickname: string) {
  const trimmed = nickname.trim();
  const first = trimmed[0] ?? '?';
  let hash = 0;

  for (const char of trimmed) {
    hash = (hash * 33 + char.charCodeAt(0)) % avatarPalette.length;
  }

  const palette = avatarPalette[hash];

  return {
    initial: first.toUpperCase(),
    background: palette.background,
    border: palette.border,
  };
}

export function TavernAvatar({ avatarUrl, nickname }: { avatarUrl?: string | null; nickname: string }) {
  const token = getAvatarToken(nickname);

  return (
    <div
      aria-label={`${nickname} 的头像`}
      className="aspect-square size-12 shrink-0 overflow-hidden border text-center text-xl font-semibold text-white/92 shadow-[0_0_18px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.06)]"
      style={{ backgroundColor: token.background, borderColor: token.border }}
    >
      {avatarUrl ? (
        <img alt={`${nickname} 的头像`} className="h-full w-full object-cover" src={avatarUrl} />
      ) : (
        <span className="flex h-full items-center justify-center">{token.initial}</span>
      )}
    </div>
  );
}

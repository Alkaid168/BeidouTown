const TAVERN_MESSAGE_INTERVAL_MS = 10_000;

export function canSendTavernMessage(lastMessageAt: Date | null, now = new Date()) {
  if (!lastMessageAt) {
    return true;
  }

  return now.getTime() - lastMessageAt.getTime() >= TAVERN_MESSAGE_INTERVAL_MS;
}

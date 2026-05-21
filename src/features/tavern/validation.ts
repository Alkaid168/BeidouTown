const MAX_TAVERN_MESSAGE_LENGTH = 500;

export type TavernMessageContentResult =
  | { ok: true; content: string }
  | { ok: false; error: string };

export function parseTavernMessageContent(input: string): TavernMessageContentResult {
  const content = input.trim();

  if (content.length === 0) {
    return { ok: false, error: '不能发送空消息。' };
  }

  if (content.length > MAX_TAVERN_MESSAGE_LENGTH) {
    return { ok: false, error: '这句话太长了，先拆成几段吧。' };
  }

  return { ok: true, content };
}

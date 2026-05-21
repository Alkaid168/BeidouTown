export const MAX_TREEHOLE_POST_LENGTH = 1000;

type TreeholePostContentResult =
  | { ok: true; content: string }
  | { ok: false; error: string };

export function parseTreeholePostContent(input: string): TreeholePostContentResult {
  const content = input.trim();

  if (!content) {
    return { ok: false, error: '不能投递空白信件。' };
  }

  if (content.length > MAX_TREEHOLE_POST_LENGTH) {
    return { ok: false, error: '这封信太长了，先拆成几封吧。' };
  }

  return { ok: true, content };
}

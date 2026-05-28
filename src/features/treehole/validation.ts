export const MAX_TREEHOLE_TITLE_LENGTH = 40;
export const MAX_TREEHOLE_POST_LENGTH = 1000;
export const MAX_TREEHOLE_REPLY_LENGTH = 500;

type TreeholePostInputResult =
  | { ok: true; title: string; content: string }
  | { ok: false; error: string };

type TreeholeReplyContentResult =
  | { ok: true; content: string }
  | { ok: false; error: string };

export function parseTreeholePostInput(titleInput: string, contentInput: string): TreeholePostInputResult {
  const title = titleInput.trim() || '无题';
  const content = contentInput.trim();

  if (!content) {
    return { ok: false, error: '不能投递空白信件。' };
  }

  if (title.length > MAX_TREEHOLE_TITLE_LENGTH) {
    return { ok: false, error: '标题太长了，先收束成一句吧。' };
  }

  if (content.length > MAX_TREEHOLE_POST_LENGTH) {
    return { ok: false, error: '这封信太长了，先拆成几封吧。' };
  }

  return { ok: true, title, content };
}

export function parseTreeholeReplyContent(input: string): TreeholeReplyContentResult {
  const content = input.trim();

  if (!content) {
    return { ok: false, error: '不能回复空白内容。' };
  }

  if (content.length > MAX_TREEHOLE_REPLY_LENGTH) {
    return { ok: false, error: '回复太长了，稍微短一点吧。' };
  }

  return { ok: true, content };
}

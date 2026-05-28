'use client';

import { MarkdownMessage } from '@/components/tavern/markdown-message';

const interpretationFont = '"ZCOOL XiaoWei", "LXGW WenKai", "KaiTi", "STKaiti", "Segoe UI", sans-serif';

export function TempleInterpretation({ content, streaming = false }: { content: string; streaming?: boolean }) {
  return (
    <section
      className="mt-10 rounded-[0.35rem] border border-[rgba(232,188,128,0.20)] bg-[rgba(22,16,12,0.62)] px-5 py-5 text-stone-100"
      data-testid="temple-interpretation"
      style={{ fontFamily: interpretationFont }}
    >
      {streaming ? <p className="mb-4 text-sm tracking-[0.18em] text-amber-100/80">解读显现中…</p> : null}
      <MarkdownMessage content={content} />
    </section>
  );
}

import ReactMarkdown from 'react-markdown';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';

const safeSchema = {
  ...defaultSchema,
  tagNames: defaultSchema.tagNames?.filter((tag) => tag !== 'img'),
};

const contentFont = '"ZCOOL XiaoWei", "LXGW WenKai", "KaiTi", "STKaiti", "Segoe UI", sans-serif';
const codeFont = 'Consolas, monospace';

export function MarkdownMessage({ content }: { content: string }) {
  return (
    <ReactMarkdown
      allowedElements={[
        'a',
        'blockquote',
        'br',
        'code',
        'del',
        'em',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'li',
        'ol',
        'p',
        'pre',
        'strong',
        'ul',
      ]}
      components={{
        a({ children, href }) {
          return (
            <a className="text-amber-100 underline decoration-amber-200/35 underline-offset-4" href={href} rel="noreferrer" style={{ fontFamily: contentFont }} target="_blank">
              {children}
            </a>
          );
        },
        blockquote({ children }) {
          return <blockquote className="my-3 border-l-2 border-[rgba(200,155,100,0.32)] pl-4 italic text-stone-200/82" style={{ fontFamily: contentFont }}>{children}</blockquote>;
        },
        code({ children }) {
          return (
            <code className="rounded-md bg-[rgba(30,20,14,0.72)] px-1.5 py-0.5 text-amber-100/90 shadow-[inset_0_1px_0_rgba(255,244,226,0.04)]" style={{ fontFamily: codeFont }}>
              {children}
            </code>
          );
        },
        del({ children }) {
          return <del className="text-stone-400/80 decoration-stone-400/70">{children}</del>;
        },
        em({ children }) {
          return <em className="italic text-stone-100/92" style={{ fontFamily: contentFont }}>{children}</em>;
        },
        h1({ children }) {
          return <h1 className="mb-3 mt-5 text-2xl font-semibold tracking-[0.04em] text-amber-100 first:mt-0" style={{ fontFamily: contentFont }}>{children}</h1>;
        },
        h2({ children }) {
          return <h2 className="mb-3 mt-4 text-xl font-semibold tracking-[0.03em] text-amber-100 first:mt-0" style={{ fontFamily: contentFont }}>{children}</h2>;
        },
        h3({ children }) {
          return <h3 className="mb-2 mt-3 text-lg font-semibold text-amber-100/95 first:mt-0" style={{ fontFamily: contentFont }}>{children}</h3>;
        },
        h4({ children }) {
          return <h4 className="mb-2 mt-3 font-semibold text-amber-50 first:mt-0" style={{ fontFamily: contentFont }}>{children}</h4>;
        },
        h5({ children }) {
          return <h5 className="mb-2 mt-3 text-sm font-semibold text-amber-50 first:mt-0" style={{ fontFamily: contentFont }}>{children}</h5>;
        },
        h6({ children }) {
          return <h6 className="mb-2 mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-amber-100/90 first:mt-0" style={{ fontFamily: contentFont }}>{children}</h6>;
        },
        li({ children }) {
          return <li className="my-1 pl-1 marker:text-amber-200/65" style={{ fontFamily: contentFont }}>{children}</li>;
        },
        ol({ children }) {
          return <ol className="my-3 list-decimal space-y-1 pl-6">{children}</ol>;
        },
        p({ children }) {
          return <p className="mb-3 last:mb-0 whitespace-pre-wrap text-stone-100/92" style={{ fontFamily: contentFont }}>{children}</p>;
        },
        pre({ children }) {
          return (
            <pre className="my-3 overflow-x-auto rounded-2xl bg-[rgba(22,15,10,0.82)] p-4 text-sm text-amber-50 shadow-[inset_0_1px_0_rgba(255,244,226,0.03)]" style={{ fontFamily: codeFont }}>
              {children}
            </pre>
          );
        },
        strong({ children }) {
          return <strong className="font-semibold text-amber-50" style={{ fontFamily: contentFont }}>{children}</strong>;
        },
        ul({ children }) {
          return <ul className="my-3 list-disc space-y-1 pl-6">{children}</ul>;
        },
      }}
      rehypePlugins={[[rehypeSanitize, safeSchema]]}
      remarkPlugins={[remarkGfm]}
      skipHtml
    >
      {content}
    </ReactMarkdown>
  );
}

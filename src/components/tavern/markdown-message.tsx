import ReactMarkdown from 'react-markdown';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';

const safeSchema = {
  ...defaultSchema,
  tagNames: defaultSchema.tagNames?.filter((tag) => tag !== 'img'),
};

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
            <a className="text-amber-200 underline decoration-amber-200/40 underline-offset-4" href={href} rel="noreferrer" target="_blank">
              {children}
            </a>
          );
        },
        blockquote({ children }) {
          return <blockquote className="my-3 border-l-2 border-amber-200/40 pl-4 text-stone-300">{children}</blockquote>;
        },
        code({ children }) {
          return (
            <code className="rounded-md bg-black/30 px-1.5 py-0.5 text-amber-100" style={{ fontFamily: codeFont }}>
              {children}
            </code>
          );
        },
        del({ children }) {
          return <del className="text-stone-400 decoration-stone-400/80">{children}</del>;
        },
        em({ children }) {
          return <em className="italic text-stone-100">{children}</em>;
        },
        h1({ children }) {
          return <h1 className="mb-3 mt-4 text-2xl font-semibold text-amber-100 first:mt-0">{children}</h1>;
        },
        h2({ children }) {
          return <h2 className="mb-3 mt-4 text-xl font-semibold text-amber-100 first:mt-0">{children}</h2>;
        },
        h3({ children }) {
          return <h3 className="mb-2 mt-3 text-lg font-semibold text-amber-100 first:mt-0">{children}</h3>;
        },
        h4({ children }) {
          return <h4 className="mb-2 mt-3 font-semibold text-amber-100 first:mt-0">{children}</h4>;
        },
        h5({ children }) {
          return <h5 className="mb-2 mt-3 text-sm font-semibold text-amber-100 first:mt-0">{children}</h5>;
        },
        h6({ children }) {
          return <h6 className="mb-2 mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-amber-100 first:mt-0">{children}</h6>;
        },
        li({ children }) {
          return <li className="my-1 pl-1">{children}</li>;
        },
        ol({ children }) {
          return <ol className="my-3 list-decimal space-y-1 pl-6">{children}</ol>;
        },
        p({ children }) {
          return <p className="mb-3 last:mb-0">{children}</p>;
        },
        pre({ children }) {
          return (
            <pre className="my-3 overflow-x-auto rounded-xl bg-black/40 p-4 text-sm text-amber-100" style={{ fontFamily: codeFont }}>
              {children}
            </pre>
          );
        },
        strong({ children }) {
          return <strong className="font-semibold text-stone-50">{children}</strong>;
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

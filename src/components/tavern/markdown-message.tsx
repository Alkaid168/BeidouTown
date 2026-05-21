import ReactMarkdown from 'react-markdown';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';

const safeSchema = {
  ...defaultSchema,
  tagNames: defaultSchema.tagNames?.filter((tag) => tag !== 'img'),
};

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
        code({ children }) {
          return <code className="rounded-md bg-black/30 px-1.5 py-0.5 text-amber-100">{children}</code>;
        },
        p({ children }) {
          return <p className="mb-3 last:mb-0">{children}</p>;
        },
        pre({ children }) {
          return <pre className="my-3 overflow-x-auto rounded-xl bg-black/40 p-4 text-sm text-amber-100">{children}</pre>;
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

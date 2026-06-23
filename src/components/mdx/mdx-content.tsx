import React from 'react';
import Link from 'next/link';
import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import { visit } from 'unist-util-visit';
import rehypeSlug from 'rehype-slug';
import type { Plugin } from 'unified';
import type { Root, Text, Element } from 'hast';
import { CodeBlock, InlineCode, PlainCodeBlock, MermaidDiagram, Callout, Badge } from '@/components/mdx/mdx-components';
import ExpandableContent from '@/components/mdx/expandable-content';
import { getAllSlugs } from '@/lib/mdx-utils';

interface MDXContentProps {
  source: string;
}

/**
 * Server component that renders MDX content with all wiki components.
 * Uses next-mdx-remote/rsc for server-side rendering.
 * Validates internal links against known slugs at render time.
 */
export default function MDXContent({ source }: MDXContentProps) {
  // Build component map with link validation for this render
  const validSlugs = getAllSlugs();
  const components = buildMdxComponents(validSlugs);

  return (
    <ExpandableContent>
      <MDXRemote source={source} components={components} options={{ mdxOptions: { remarkPlugins: [remarkGfm, remarkFencedCodeDefaultLang], rehypePlugins: [rehypeSlug, rehypeStatusBadges] } }} />
    </ExpandableContent>
  );
}

/**
 * Rehype plugin: auto-converts [ACTIVE], [NEW], [ARCHIVED], [REFERENCE]
 * text patterns into colored badge spans.
 * Works in table cells, paragraphs, list items — everywhere.
 */
const STATUS_BADGE_MAP: Record<string, string> = {
  ACTIVE: 'bg-green-500/10 text-green-600 dark:text-green-400',
  NEW: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  ARCHIVED: 'bg-red-500/10 text-red-600 dark:text-red-400',
  FROZEN: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  REFERENCE: 'bg-muted text-muted-foreground',
};
const BADGE_BASE = 'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium';
const STATUS_RE = /\[(ACTIVE|NEW|ARCHIVED|FROZEN|REFERENCE)\]/g;

const rehypeStatusBadges: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, 'text', (node: Text, index, parent) => {
      if (!parent || index === undefined) return;
      if (!STATUS_RE.test(node.value)) return;
      STATUS_RE.lastIndex = 0;

      const fragments: Array<Text | Element> = [];
      let lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = STATUS_RE.exec(node.value)) !== null) {
        if (match.index > lastIndex) {
          fragments.push({ type: 'text', value: node.value.slice(lastIndex, match.index) } as Text);
        }
        const status = match[1] as string;
        const colorClass = STATUS_BADGE_MAP[status] || STATUS_BADGE_MAP.REFERENCE;
        fragments.push({
          type: 'element',
          tagName: 'span',
          properties: { className: `${BADGE_BASE} ${colorClass}`.split(' ') },
          children: [{ type: 'text', value: status }],
        } as Element);
        lastIndex = STATUS_RE.lastIndex;
      }

      if (lastIndex < node.value.length) {
        fragments.push({ type: 'text', value: node.value.slice(lastIndex) } as Text);
      }

      (parent.children as Array<Text | Element>).splice(index, 1, ...fragments);
    });
  };
};

function remarkFencedCodeDefaultLang() {
  return (tree: any) => {
    visit(tree, 'code', (node: any) => {
      if (!node.lang && !node.meta) {
        node.lang = 'plain';
      }
    });
  };
}

/**
 * Build MDX component overrides with link validation.
 * Internal links pointing to non-existent pages get a visual "broken" indicator
 * (red strikethrough text with tooltip) instead of a clickable 404 link.
 */
function buildMdxComponents(validSlugs: string[]) {
  const linkClass = "text-[oklch(0.45_0.15_250)] hover:underline dark:text-[oklch(0.685_0.169_237.323)]";
  const brokenLinkClass = "text-red-500/70 hover:underline dark:text-red-400/70 line-through decoration-red-400/50";

  return {
    // Custom components (usable via JSX in MDX)
    CodeBlock,
    Callout,
    Badge,
    MermaidDiagram,

    // h1 is suppressed — DocsShell already renders <h1>{title}</h1> from frontmatter.
    // MDX files should still keep their # heading for readability in source,
    // but it won't appear in the rendered page to avoid duplication.
    h1: () => null,
    h2: ({ children, id, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h2 id={id} className="text-[30px] font-medium leading-tight text-foreground mb-4 mt-10 scroll-mt-20" {...props}>{children}</h2>
    ),
    h3: ({ children, id, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h3 id={id} className="text-[20px] font-semibold leading-snug text-foreground mb-3 mt-8 scroll-mt-20" {...props}>{children}</h3>
    ),
    h4: ({ children, id, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h4 id={id} className="text-[16px] font-semibold leading-snug text-foreground mb-2 mt-6 scroll-mt-20" {...props}>{children}</h4>
    ),
    p: ({ children }: React.HTMLAttributes<HTMLParagraphElement>) => (
      <p className="text-[16px] leading-relaxed text-muted-foreground mb-4">{children}</p>
    ),
    strong: ({ children }: React.HTMLAttributes<HTMLElement>) => (
      <strong className="font-medium text-foreground">{children}</strong>
    ),
    em: ({ children }: React.HTMLAttributes<HTMLElement>) => (
      <em className="italic text-foreground/80">{children}</em>
    ),
    ul: ({ children }: React.HTMLAttributes<HTMLUListElement>) => (
      <ul className="list-disc pl-6 mb-4 space-y-2">{children}</ul>
    ),
    ol: ({ children }: React.HTMLAttributes<HTMLOListElement>) => (
      <ol className="list-decimal pl-6 mb-4 space-y-2">{children}</ol>
    ),
    li: ({ children }: React.HTMLAttributes<HTMLLIElement>) => (
      <li className="text-[16px] leading-relaxed text-muted-foreground">{children}</li>
    ),
    table: ({ children }: React.HTMLAttributes<HTMLTableElement>) => (
      <div className="my-4 overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">{children}</table>
      </div>
    ),
    thead: ({ children }: React.HTMLAttributes<HTMLTableSectionElement>) => (
      <thead className="bg-muted">{children}</thead>
    ),
    th: ({ children }: React.HTMLAttributes<HTMLTableCellElement>) => (
      <th className="px-4 py-3 text-left font-medium text-foreground border-b border-border whitespace-nowrap">{children}</th>
    ),
    td: ({ children }: React.HTMLAttributes<HTMLTableCellElement>) => (
      <td className="px-4 py-3 text-muted-foreground border-b border-border/50">{children}</td>
    ),
    code: ({
      className,
      children,
      ...props
    }: React.HTMLAttributes<HTMLElement> & { inline?: boolean }) => {
      // Match language-xxx including languages with + - . characters
      // e.g. language-c++, language-objective-c, language-nginx-config
      const match = /language-([\w+.-]+)/.exec(className || '');
      const codeString = String(children).replace(/\n$/, '');

      // No language class -> true inline code (single backtick in text)
      if (!match) {
        return <InlineCode>{children}</InlineCode>;
      }

      // Plain code block (fenced block without language, tagged by remark plugin)
      if (match[1] === 'plain') return <PlainCodeBlock>{codeString}</PlainCodeBlock>;

      // Mermaid diagrams
      if (match[1] === 'mermaid') return <MermaidDiagram code={codeString} />;

      // Fenced code blocks with syntax highlighting
      return <CodeBlock language={match[1]}>{codeString}</CodeBlock>;
    },
    // Unwrap <pre> -- the code component above handles rendering.
    // Special case: <pre><code> WITHOUT a language class is a plain code block,
    // not inline code. We detect it here by checking if children is already
    // a CodeBlock/MermaidDiagram (has language) or if it's bare text.
    pre: ({ children }: React.HTMLAttributes<HTMLPreElement>) => {
      if (React.isValidElement(children)) {
        // Language-less fenced code block: the code component rendered InlineCode,
        // but inside <pre> it's a block-level element -- upgrade to PlainCodeBlock.
        if (children.type === InlineCode) {
          const text = String((children.props as { children: React.ReactNode }).children).replace(/\n$/, '');
          return <PlainCodeBlock>{text}</PlainCodeBlock>;
        }
        // CodeBlock or MermaidDiagram -- just unwrap from the extra <pre>
        return <>{children}</>;
      }
      // Bare <pre>text</pre> -- render as plain block
      const text = String(children).replace(/\n$/, '');
      return <PlainCodeBlock>{text}</PlainCodeBlock>;
    },
    blockquote: ({ children }: React.HTMLAttributes<HTMLQuoteElement>) => (
      <blockquote className="my-4 pl-4 border-l-2 border-border text-muted-foreground not-italic [&_p]:mb-1 [&_p:last-child]:mb-0 [&_p]:text-[14px] [&_p]:leading-relaxed [&_strong]:font-medium [&_strong]:text-foreground [&_em]:italic [&_em]:text-foreground/80 [&_code]:text-[13px] [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_a]:text-[oklch(0.45_0.15_250)] [&_a:hover]:underline dark:[&_a]:text-[oklch(0.685_0.169_237.323)]">{children}</blockquote>
    ),
    a: ({ children, href }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
      const isExternal = href?.startsWith('http') || href?.startsWith('//');

      // External link
      if (isExternal) {
        return (
          <a href={href} className={linkClass} target="_blank" rel="noopener noreferrer">{children}</a>
        );
      }

      // Internal link -- validate slug against known pages
      const rawSlug = (href || '/').replace(/^\/docs\//, '').replace(/\/$/, '');
      const isValid = rawSlug === '' || validSlugs.includes(rawSlug);

      if (!isValid) {
        // Broken link: render as non-clickable red strikethrough with tooltip
        return (
          <span
            className={brokenLinkClass}
            title={`Broken link: /docs/${rawSlug}/ does not exist`}
          >
            {children}
          </span>
        );
      }

      // Valid internal link -- use Next.js Link for client-side navigation
      return <Link href={href || '/'} className={linkClass}>{children}</Link>;
    },
    hr: () => <hr className="my-8 border-border" />,
    img: ({ src, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
      <img src={src} alt={alt || ''} className="max-w-full h-auto rounded-lg my-4" loading="lazy" {...props} />
    ),
    del: ({ children }: React.HTMLAttributes<HTMLElement>) => (
      <del className="line-through text-muted-foreground">{children}</del>
    ),
  };
}
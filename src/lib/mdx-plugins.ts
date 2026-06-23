import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import type { Root, Text, Element } from 'hast';

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

export const rehypeStatusBadges: Plugin<[], Root> = () => {
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

/**
 * Remark plugin: assigns 'plain' as default language to fenced code blocks
 * that have no language specified.
 */
export function remarkFencedCodeDefaultLang() {
  return (tree: any) => {
    visit(tree, 'code', (node: any) => {
      if (!node.lang && !node.meta) {
        node.lang = 'plain';
      }
    });
  };
}

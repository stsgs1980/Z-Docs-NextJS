'use client';

import React from 'react';

/**
 * Inline code component — for single-line code snippets within paragraphs.
 * Example: `const x = 1`
 */
export function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="px-1.5 py-0.5 rounded bg-muted text-foreground/90 text-sm font-mono">
      {children}
    </code>
  );
}
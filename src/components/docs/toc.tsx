'use client';

import React from 'react';
import type { Heading } from '@/lib/mdx-utils';

interface TOCProps {
  headings: Heading[];
  activeId: string;
}

export default function TOC({ headings, activeId }: TOCProps) {
  if (headings.length === 0) return null;

  return (
    /* TOC — width controlled by docs-golden-grid (220px on xl+) */
    <aside className="hidden xl:block shrink-0 h-[calc(100vh-49px)] sticky top-[49px]">
      <nav className="py-4 pl-6">
        <h4 className="text-[14px] font-medium text-muted-foreground mb-3 px-2">On this page</h4>
        <ul className="space-y-1 border-l border-border">
          {headings.map((heading, index) => (
            <li key={`${heading.id}-${index}`}>
              <a
                href={`#${heading.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  const el = document.getElementById(heading.id);
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className={`block text-[13px] leading-snug py-1 transition-colors ${
                  heading.level === 3 ? 'pl-8' : 'pl-4'
                } ${
                  activeId === heading.id
                    ? 'text-[var(--zai-color-accent)] font-medium border-l-2 border-[var(--zai-color-accent)] -ml-px'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {heading.text}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

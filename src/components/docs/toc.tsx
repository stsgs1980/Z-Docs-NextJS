"use client";

import React from "react";
import type { Heading } from "@/lib/mdx-utils";

interface TOCProps {
  headings: Heading[];
  activeId: string;
}

export default function TOC({ headings, activeId }: TOCProps) {
  if (headings.length === 0) return null;

  return (
    /* TOC — width controlled by docs-golden-grid (220px on xl+) */
    <aside className="docs-desktop-toc sticky top-[49px] h-[calc(100vh-49px)] shrink-0 scrollbar-thin overflow-y-auto">
      <nav className="px-4 py-8">
        <h4 className="text-muted-foreground mb-3 font-semibold tracking-wider text-[var(--text-sm)] uppercase">
          На этой странице
        </h4>
        <ul className="border-border space-y-0.5 border-l">
          {headings.map((heading, index) => (
            <li key={`${heading.id}-${index}`}>
              <a
                href={`#${heading.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  const el = document.getElementById(heading.id);
                  if (el) {
                    el.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                }}
                className={`block py-1 leading-snug text-[var(--text-sm)] transition-colors ${
                  heading.level === 3 ? "pl-6" : "pl-3"
                } ${
                  activeId === heading.id
                    ? "-ml-px border-l-2 border-[var(--zai-color-accent)] font-medium text-[var(--zai-color-accent)]"
                    : "text-muted-foreground hover:text-foreground"
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

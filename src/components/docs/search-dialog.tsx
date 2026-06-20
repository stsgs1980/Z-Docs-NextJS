'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Search, Command } from 'lucide-react';
import type { NavSection } from '@/lib/mdx-utils';

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (slug: string) => void;
  navigation: NavSection[];
}

export default function SearchDialog({
  open,
  onClose,
  onNavigate,
  navigation,
}: SearchDialogProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Flatten all pages for search
  const allPages = navigation.flatMap((section) =>
    section.items.map((item) => ({
      slug: item.slug,
      title: item.title,
      section: section.title,
    }))
  );

  const filtered = query
    ? allPages.filter((page) => {
        const q = query.toLowerCase();
        return (
          page.title.toLowerCase().includes(q) ||
          page.section.toLowerCase().includes(q) ||
          page.slug.toLowerCase().includes(q)
        );
      })
    : allPages;

  const handleNavigate = useCallback(
    (slug: string) => {
      onNavigate(slug);
      onClose();
    },
    [onNavigate, onClose]
  );

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        setQuery('');
        setSelectedIndex(0);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Reset selected index when query changes
  const handleQueryChange = useCallback((newQuery: string) => {
    setQuery(newQuery);
    setSelectedIndex(0);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        setSelectedIndex((current) => {
          if (filtered[current]) {
            handleNavigate(filtered[current].slug);
          }
          return current;
        });
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, filtered, handleNavigate, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-[560px] mx-4 rounded-xl border border-border bg-background shadow-2xl overflow-hidden">
        <div className="flex items-center px-4 border-b border-border">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search documentation..."
            className="flex-1 bg-transparent px-3 py-3.5 text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-muted text-[11px] text-muted-foreground">
            ESC
          </kbd>
        </div>
        <div className="max-h-[400px] overflow-y-auto py-2 scrollbar-thin">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-muted-foreground text-sm">
              No results found
            </div>
          ) : (
            filtered.map((page, idx) => (
              <button
                key={page.slug}
                onClick={() => handleNavigate(page.slug)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`flex items-center w-full px-4 py-2.5 text-left transition-colors ${
                  idx === selectedIndex
                    ? 'bg-muted'
                    : 'hover:bg-muted/50'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] text-foreground truncate">
                    {page.title}
                  </div>
                  <div className="text-[12px] text-muted-foreground truncate">
                    {page.section}
                  </div>
                </div>
                {idx === selectedIndex && (
                  <span className="text-[11px] text-muted-foreground ml-2 shrink-0">
                    Enter
                  </span>
                )}
              </button>
            ))
          )}
        </div>
        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-border text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded bg-muted">Up/Dn</kbd>{' '}
            navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded bg-muted">Enter</kbd> open
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded bg-muted">esc</kbd> close
          </span>
        </div>
      </div>
    </div>
  );
}

export function SearchButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
    >
      <Search className="h-3.5 w-3.5" />
      <span className="text-[13px]">Search</span>
      <kbd className="hidden sm:flex items-center gap-0.5 text-[11px] text-muted-foreground ml-2">
        <Command className="h-3 w-3" />K
      </kbd>
    </button>
  );
}

"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { SearchButton } from "./search-dialog";
import ThemeToggle from "./theme-toggle";
import { Menu, X, ExternalLink, Plus, PanelLeftClose, PanelLeftOpen, ChevronLeft, ChevronRight } from "lucide-react";

interface HeaderProps {
  onSearchOpen: () => void;
  onMobileMenuToggle: () => void;
  isMobileMenuOpen: boolean;
  currentSlug?: string;
  currentSection?: string;
  tabs: { title: string; firstSlug: string }[];
  canEdit?: boolean;
  version?: string;
  sidebarVisible?: boolean;
  onToggleSidebar?: () => void;
}

export default function Header({
  onSearchOpen,
  onMobileMenuToggle,
  isMobileMenuOpen,
  currentSlug,
  currentSection,
  tabs,
  canEdit = true,
  version,
  sidebarVisible = true,
  onToggleSidebar,
}: HeaderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      ro.disconnect();
    };
  }, [tabs, checkScroll]);

  // Auto-scroll active tab into view
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const activeTab = el.querySelector("[data-active-tab]");
    if (activeTab) {
      activeTab.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [currentSection]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction === "left" ? -200 : 200, behavior: "smooth" });
  };

  const activeTabStyle =
    "px-3 py-1 text-[14px] font-medium text-foreground bg-muted rounded-full whitespace-nowrap";
  const inactiveTabStyle =
    "px-3 py-1 text-[14px] font-medium text-muted-foreground hover:text-foreground bg-transparent rounded-full hover:bg-muted transition-colors whitespace-nowrap";

  return (
    <header className="border-border bg-background sticky top-0 z-30 flex h-[49px] items-center border-b">
      <div className="flex w-full items-center gap-4 px-4">
        {/* Left: Hamburger + Logo */}
        <div className="flex shrink-0 items-center gap-3">
          <button
            onClick={onMobileMenuToggle}
            className="hover:bg-muted -ml-1.5 rounded-md p-1.5 transition-colors xl:hidden"
            aria-label="Navigation menu"
          >
            {isMobileMenuOpen ? (
              <X className="text-muted-foreground h-5 w-5" />
            ) : (
              <Menu className="text-muted-foreground h-5 w-5" />
            )}
          </button>
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="docs-show-xl hover:bg-muted rounded-md p-1.5 transition-colors"
              aria-label={sidebarVisible ? "Hide sidebar" : "Show sidebar"}
              title={sidebarVisible ? "Hide sidebar" : "Show sidebar"}
            >
              {sidebarVisible ? (
                <PanelLeftClose className="text-muted-foreground h-4 w-4" />
              ) : (
                <PanelLeftOpen className="text-muted-foreground h-4 w-4" />
              )}
            </button>
          )}

          <Link href="/docs/" className="flex items-center gap-2">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              className="text-foreground"
            >
              <path
                d="M12 2L2 7L12 12L22 7L12 2Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 17L12 22L22 17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 12L12 17L22 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-foreground font-semibold text-[var(--text-md)]">
              StsDev Wiki
            </span>
          </Link>
        </div>

        {/* Tabs — scrollable with arrow buttons */}
        <div className="docs-show-md-flex relative flex min-w-0 flex-1 items-center ml-2">
          {canScrollLeft && (
            <button
              onClick={() => scroll("left")}
              className="bg-background/90 border-border absolute left-0 z-10 flex h-full w-7 items-center justify-center border-y border-l shadow-sm backdrop-blur-sm"
              aria-label="Scroll tabs left"
            >
              <ChevronLeft className="text-muted-foreground h-4 w-4" />
            </button>
          )}
          <nav
            ref={scrollRef}
            className="flex items-center gap-1 overflow-x-auto px-1 py-0.5 scrollbar-none"
          >
            {tabs.map((tab) => {
              const isActive = currentSection === tab.title;
              return (
                <Link
                  key={tab.title}
                  href={`/docs/${tab.firstSlug}/`}
                  data-active-tab={isActive || undefined}
                  className={isActive ? activeTabStyle : inactiveTabStyle}
                >
                  {tab.title}
                </Link>
              );
            })}
          </nav>
          {canScrollRight && (
            <button
              onClick={() => scroll("right")}
              className="bg-background/90 border-border absolute right-0 z-10 flex h-full w-7 items-center justify-center border-y border-r shadow-sm backdrop-blur-sm"
              aria-label="Scroll tabs right"
            >
              <ChevronRight className="text-muted-foreground h-4 w-4" />
            </button>
          )}
        </div>

        {/* Right: Actions */}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {canEdit && (
            <Link
              href="/docs/new/"
              className="docs-show-sm-flex text-muted-foreground hover:text-foreground hover:bg-muted items-center gap-1 rounded-md px-2.5 py-1.5 text-[var(--text-sm)] transition-colors"
              title="Create page"
            >
              <Plus className="h-4 w-4" />
              <span className="docs-show-lg-inline">Create</span>
            </Link>
          )}

          {canEdit && currentSlug && (
            <Link
              href={`/docs/${currentSlug}/edit/`}
              className="text-muted-foreground hover:text-foreground hover:bg-muted flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[var(--text-sm)] transition-colors"
              title="Edit this page"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                <path d="m15 5 4 4" />
              </svg>
              <span className="docs-show-lg-inline">Edit</span>
            </Link>
          )}

          <ThemeToggle />
          <SearchButton onClick={onSearchOpen} />

          <a
            href="https://github.com/stsgs1980/StsDev-Wiki-Template"
            target="_blank"
            rel="noopener noreferrer"
            className="docs-show-sm-flex bg-foreground text-background hover:bg-foreground/90 items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium text-[var(--text-sm)] transition-colors"
          >
            GitHub
            <ExternalLink className="h-3 w-3" />
          </a>

          {version && (
            <span className="docs-show-md-inline-flex text-muted-foreground/60 border-border items-center rounded-md border px-2 py-1 font-mono text-[11px] select-none">
              v{version}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
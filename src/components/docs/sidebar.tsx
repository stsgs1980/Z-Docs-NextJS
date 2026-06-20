'use client';

import React from 'react';
import { ChevronDown, ChevronRight, PanelLeftOpen, PanelLeftClose } from 'lucide-react';
import type { NavSection } from '@/lib/mdx-utils';

interface SidebarProps {
  currentSlug: string;
  navigation: NavSection[];
  onNavigate: (slug: string) => void;
  isOpen: boolean;
  onClose: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function Sidebar({
  currentSlug,
  navigation,
  onNavigate,
  isOpen,
  onClose,
  collapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const [openSections, setOpenSections] = React.useState<Set<string>>(() => {
    const initial = new Set<string>();
    for (const section of navigation) {
      if (section.items.some((i) => i.slug === currentSlug)) {
        initial.add(section.title);
      }
    }
    return initial;
  });

  const toggleSection = (title: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  };

  const handleNavigate = (slug: string) => {
    onNavigate(slug);
    onClose();
  };

  const sidebarContent = (
    <nav className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin">
        {navigation.map((section) => {
          const isSectionOpen = openSections.has(section.title);
          const isActive = section.items.some((i) => i.slug === currentSlug);

          return (
            <div key={section.title} className="mb-1">
              <button
                onClick={() => toggleSection(section.title)}
                className={`flex items-center w-full px-2 py-1.5 text-[14px] font-medium rounded-md transition-colors ${
                  isActive
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                } hover:text-foreground`}
              >
                {isSectionOpen ? (
                  <ChevronDown className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                )}
                {section.title}
              </button>
              {isSectionOpen && (
                <div className="ml-1 mt-0.5 space-y-0.5">
                  {section.items.map((item) => (
                    <button
                      key={item.slug}
                      onClick={() => handleNavigate(item.slug)}
                      className={`block w-full text-left px-3 py-1.5 text-[14px] rounded-md transition-all ${
                        currentSlug === item.slug
                          ? 'bg-muted text-foreground font-medium'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                    >
                      {item.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );

  return (
    <>
      {/* Desktop sidebar — collapsed: thin strip with toggle, expanded: full nav */}
      <aside
        className={`hidden xl:flex shrink-0 border-r border-border bg-sidebar h-[calc(100vh-49px)] sticky top-[49px] transition-[width] duration-200 ease-in-out ${
          collapsed ? 'w-[44px] flex-col items-center' : 'w-[280px]'
        }`}
      >
        {collapsed ? (
          /* Collapsed: toggle button centered vertically */
          <div className="flex flex-col items-center pt-3 w-full">
            <button
              onClick={onToggleCollapse}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          </div>
        ) : (
          /* Expanded: full navigation + collapse button */
          <>
            <div className="flex items-center justify-between px-3 h-[40px] border-b border-border shrink-0">
              <span className="text-[13px] font-medium text-muted-foreground">
                Navigation
              </span>
              <button
                onClick={onToggleCollapse}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            </div>
            {sidebarContent}
          </>
        )}
      </aside>

      {/* Mobile drawer */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 xl:hidden"
            onClick={onClose}
          />
          <aside className="fixed left-0 top-0 z-50 w-[280px] h-full bg-sidebar xl:hidden shadow-2xl">
            <div className="flex items-center h-[49px] px-4 border-b border-border">
              <span className="text-sm font-medium text-foreground">
                Navigation
              </span>
            </div>
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}

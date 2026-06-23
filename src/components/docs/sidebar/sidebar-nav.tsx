'use client';

import React from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2, FolderPlus, ArrowUp, ArrowDown } from 'lucide-react';
import type { NavSection } from '@/lib/mdx-utils';

interface SidebarNavProps {
  navigation: NavSection[];
  currentSlug: string;
  openSections: Set<string>;
  canEdit: boolean;
  onToggleSection: (title: string) => void;
  onNavigate: (slug: string) => void;
  onDelete: (slug: string, title: string) => void;
  onMoveSection: (sectionTitle: string, direction: 'up' | 'down') => void;
  onCreateInSection: (sectionTitle: string) => void;
  onNewSectionClick: () => void;
  moving: string | null;
}

export default function SidebarNav({
  navigation,
  currentSlug,
  openSections,
  canEdit,
  onToggleSection,
  onNavigate,
  onDelete,
  onMoveSection,
  onCreateInSection,
  onNewSectionClick,
  moving,
}: SidebarNavProps) {
  return (
    <nav className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin">
        {navigation.map((section, sectionIdx) => {
          const isSectionOpen = openSections.has(section.title);
          const isActive = section.items.some((i) => i.slug === currentSlug);

          return (
            <div key={section.title} className="mb-1">
              <div className="flex items-center">
                <button
                  onClick={() => onToggleSection(section.title)}
                  className={`flex items-center flex-1 min-w-0 px-2 py-1.5 text-[var(--text-sm)] font-medium rounded-md transition-colors text-left ${
                    isActive
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  } hover:text-foreground`}
                >
                  {isSectionOpen ? (
                    <ChevronDown className="h-3 w-3 mr-1.5 shrink-0" />
                  ) : (
                    <ChevronRight className="h-3 w-3 mr-1.5 shrink-0" />
                  )}
                  <span className="break-words">{section.title}</span>
                </button>
                {canEdit && (
                  <div className="flex items-center shrink-0">
                    <button
                      onClick={() => onMoveSection(section.title, 'up')}
                      disabled={sectionIdx === 0 || moving === section.title}
                      className="p-0.5 rounded text-muted-foreground/0 hover:text-muted-foreground hover:bg-muted/50 transition-colors disabled:opacity-20 disabled:hover:text-muted-foreground/0 disabled:hover:bg-transparent"
                      title="Секцию выше"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => onMoveSection(section.title, 'down')}
                      disabled={sectionIdx === navigation.length - 1 || moving === section.title}
                      className="p-0.5 rounded text-muted-foreground/0 hover:text-muted-foreground hover:bg-muted/50 transition-colors disabled:opacity-20 disabled:hover:text-muted-foreground/0 disabled:hover:bg-transparent"
                      title="Секцию ниже"
                    >
                      <ArrowDown className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => onCreateInSection(section.title)}
                      className="p-1 rounded text-muted-foreground/0 hover:text-muted-foreground hover:bg-muted/50 transition-colors"
                      title={`Добавить страницу в "${section.title}"`}
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
              {isSectionOpen && (
                <div className="ml-4 mt-0.5 space-y-0.5">
                  {section.items.map((item) => (
                    <div
                      key={item.slug}
                      className="group/item flex items-center"
                    >
                      <button
                        onClick={() => onNavigate(item.slug)}
                        className={`flex-1 min-w-0 text-left px-2.5 py-1.5 text-[var(--text-sm)] rounded-md transition-all break-words ${
                          currentSlug === item.slug
                            ? 'bg-muted text-foreground font-medium'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        }`}
                      >
                        <span className="break-words">{item.title}</span>
                      </button>
                      {canEdit && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(item.slug, item.title);
                          }}
                          className="p-1 mr-0.5 rounded text-muted-foreground/0 group-hover/item:text-muted-foreground/60 hover:!text-red-500 hover:bg-red-500/10 transition-colors shrink-0"
                          title={`Удалить "${item.title}"`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {canEdit && (
          <div className="mt-2 pt-2 border-t border-border">
            <button
              onClick={onNewSectionClick}
              className="flex items-center gap-2 w-full px-2 py-1.5 text-[var(--text-sm)] text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/50 transition-colors"
            >
              <FolderPlus className="h-3.5 w-3.5" />
              <span>Новая секция</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
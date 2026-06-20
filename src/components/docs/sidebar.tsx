'use client';

import React, { useState, useCallback } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2, FolderPlus } from 'lucide-react';
import type { NavSection } from '@/lib/mdx-utils';

interface SidebarProps {
  currentSlug: string;
  navigation: NavSection[];
  onNavigate: (slug: string) => void;
  isOpen: boolean;
  onClose: () => void;
  canEdit?: boolean;
}

export default function Sidebar({
  currentSlug,
  navigation,
  onNavigate,
  isOpen,
  onClose,
  canEdit = true,
}: SidebarProps) {
  const [openSections, setOpenSections] = React.useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<{ slug: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showNewSection, setShowNewSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [creating, setCreating] = useState(false);

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

  const handleCreateInSection = useCallback((sectionTitle: string) => {
    const params = new URLSearchParams({ section: sectionTitle });
    window.location.href = `/docs/new/?${params.toString()}`;
  }, []);

  const handleCreateNewSection = useCallback(async () => {
    if (!newSectionName.trim()) return;
    setCreating(true);
    try {
      // Calculate next section order
      const maxOrder = navigation.reduce((max, s) => Math.max(max, s.order ?? 0), 0);
      const nextOrder = maxOrder + 1;

      // Create a placeholder document in the new section
      const slug = newSectionName
        .toLowerCase()
        .replace(/[^\w\sа-яА-ЯёЁ-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .replace(/[а-яА-ЯёЁ]/g, (c) => {
          const map: Record<string, string> = {
            'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
            'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
            'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
            'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
            'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
          };
          return map[c.toLowerCase()] || c;
        })
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') + '-index';

      const res = await fetch('/api/docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newSectionName.trim(),
          section: newSectionName.trim(),
          sectionOrder: nextOrder,
          order: 0,
          slug,
          content: `# ${newSectionName.trim()}\n\n`,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Create failed');
      }

      const data = await res.json();
      window.location.href = `/docs/${data.slug}/`;
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка создания секции');
    } finally {
      setCreating(false);
      setShowNewSection(false);
      setNewSectionName('');
    }
  }, [newSectionName, navigation]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/docs/${deleteTarget.slug}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Delete failed');
      }
      // If we deleted the current page, navigate away
      if (deleteTarget.slug === currentSlug) {
        const firstSlug = navigation[0]?.items[0]?.slug;
        if (firstSlug) {
          onNavigate(firstSlug);
        } else {
          window.location.href = '/docs/';
        }
      }
      // Full refresh to update navigation
      window.location.reload();
    } catch (err) {
      console.error('Delete failed:', err);
      alert(err instanceof Error ? err.message : 'Ошибка удаления');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }, [deleteTarget, currentSlug, navigation, onNavigate]);

  const sidebarContent = (
    <nav className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin">
        {navigation.map((section) => {
          const isSectionOpen = openSections.has(section.title);
          const isActive = section.items.some((i) => i.slug === currentSlug);

          return (
            <div key={section.title} className="mb-1">
              <div className="flex items-center">
                <button
                  onClick={() => toggleSection(section.title)}
                  className={`flex items-center flex-1 min-w-0 px-2 py-1.5 text-[13px] font-medium rounded-md transition-colors text-left ${
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
                  <span className="break-words truncate">{section.title}</span>
                </button>
                {canEdit && (
                  <button
                    onClick={() => handleCreateInSection(section.title)}
                    className="p-1 mr-1 rounded text-muted-foreground/0 hover:text-muted-foreground hover:bg-muted/50 transition-colors group/section"
                    title={`Добавить в "${section.title}"`}
                  >
                    <Plus className="h-3 w-3" />
                  </button>
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
                        onClick={() => handleNavigate(item.slug)}
                        className={`flex-1 min-w-0 text-left px-2.5 py-1.5 text-[13px] rounded-md transition-all break-words ${
                          currentSlug === item.slug
                            ? 'bg-muted text-foreground font-medium'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        }`}
                      >
                        <span className="truncate">{item.title}</span>
                      </button>
                      {canEdit && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget({ slug: item.slug, title: item.title });
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
              onClick={() => setShowNewSection(true)}
              className="flex items-center gap-2 w-full px-2 py-1.5 text-[13px] text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/50 transition-colors"
            >
              <FolderPlus className="h-3.5 w-3.5" />
              <span>Новая секция</span>
            </button>
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-background border border-border rounded-xl p-6 max-w-[380px] w-full mx-4 shadow-2xl">
            <h3 className="text-[15px] font-semibold text-foreground mb-2">
              Удалить страницу?
            </h3>
            <p className="text-[14px] text-muted-foreground mb-5">
              &laquo;{deleteTarget.title}&raquo; будет удалена без возможности восстановления.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-4 py-2 text-[13px] rounded-lg border border-border text-foreground hover:bg-muted/50 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="px-4 py-2 text-[13px] font-medium rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Удаление...' : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New section dialog */}
      {showNewSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-background border border-border rounded-xl p-6 max-w-[400px] w-full mx-4 shadow-2xl">
            <h3 className="text-[15px] font-semibold text-foreground mb-2">
              Новая секция
            </h3>
            <p className="text-[14px] text-muted-foreground mb-4">
              Будет создана секция с документом-заглушкой. Вставить между существующими секциями можно изменив &laquo;Порядок секции&raquo; при редактировании.
            </p>
            <input
              type="text"
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              placeholder="Название новой секции"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateNewSection();
              }}
              className="w-full px-3 py-2 text-[14px] rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring mb-5"
            />
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => { setShowNewSection(false); setNewSectionName(''); }}
                disabled={creating}
                className="px-4 py-2 text-[13px] rounded-lg border border-border text-foreground hover:bg-muted/50 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleCreateNewSection}
                disabled={creating || !newSectionName.trim()}
                className="px-4 py-2 text-[13px] font-medium rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-50"
              >
                {creating ? 'Создание...' : 'Создать'}
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );

  return (
    <>
      {/* Desktop sidebar — width controlled by docs-golden-grid (280px on xl+) */}
      <aside className="hidden xl:block shrink-0 border-r border-border bg-sidebar h-[calc(100vh-49px)] sticky top-[49px]">
        {sidebarContent}
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

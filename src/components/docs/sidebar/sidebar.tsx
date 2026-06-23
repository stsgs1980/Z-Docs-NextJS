'use client';

import React, { useState, useCallback, useEffect } from 'react';
import type { NavSection } from '@/lib/mdx-utils';
import { useSidebarDeletion } from './use-sidebar-deletion';
import { useSidebarSectionCreation } from './use-sidebar-section-creation';
import DeleteDialog from './delete-dialog';
import NewSectionDialog from './new-section-dialog';
import SidebarNav from './sidebar-nav';

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
  const findActiveSection = (slug: string) => {
    if (!navigation?.length) return '';
    const sec = navigation.find((s) =>
      s.items.some((p) => p.slug === slug)
    );
    return sec ? sec.title : '';
  };

  const [openSections, setOpenSections] = useState<Set<string>>(
    () => {
      const active = findActiveSection(currentSlug);
      return new Set(active ? [active] : []);
    }
  );

  useEffect(() => {
    const active = findActiveSection(currentSlug);
    setOpenSections((prev) => {
      if (prev.has(active)) return prev;
      return new Set(active ? [active] : []);
    });
  }, [currentSlug, navigation]);

  const [moving, setMoving] = useState<string | null>(null);

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

  const handleMoveSection = useCallback(async (sectionTitle: string, direction: 'up' | 'down') => {
    const idx = navigation.findIndex((s) => s.title === sectionTitle);
    if (idx < 0) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === navigation.length - 1) return;

    setMoving(sectionTitle);

    const newSections: Record<string, number> = {};
    navigation.forEach((s) => {
      newSections[s.title] = s.order;
    });

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    const currentOrder = newSections[sectionTitle];
    const swapOrder = newSections[navigation[swapIdx].title];

    newSections[sectionTitle] = swapOrder;
    newSections[navigation[swapIdx].title] = currentOrder;

    try {
      const res = await fetch('/api/docs/reorder-section', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections: newSections }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Reorder failed');
      }

      window.location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка перемещения');
    } finally {
      setMoving(null);
    }
  }, [navigation]);

  const {
    deleteTarget,
    setDeleteTarget,
    deleting,
    handleDeleteConfirm,
  } = useSidebarDeletion(currentSlug, navigation, onNavigate);

  const {
    showNewSection,
    setShowNewSection,
    newSectionName,
    setNewSectionName,
    newSectionPosition,
    setNewSectionPosition,
    newSectionRef,
    setNewSectionRef,
    creating,
    handleCreateNewSection,
  } = useSidebarSectionCreation(navigation);

  const sidebarContent = (
    <>
      <SidebarNav
        navigation={navigation}
        currentSlug={currentSlug}
        openSections={openSections}
        canEdit={canEdit}
        onToggleSection={toggleSection}
        onNavigate={handleNavigate}
        onDelete={(slug, title) => setDeleteTarget({ slug, title })}
        onMoveSection={handleMoveSection}
        onCreateInSection={handleCreateInSection}
        onNewSectionClick={() => {
          setNewSectionPosition('end');
          setNewSectionRef(navigation[navigation.length - 1]?.title || '');
          setShowNewSection(true);
        }}
        moving={moving}
      />
      <DeleteDialog
        target={deleteTarget}
        deleting={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
      <NewSectionDialog
        show={showNewSection}
        name={newSectionName}
        position={newSectionPosition}
        ref_={newSectionRef}
        creating={creating}
        navigation={navigation}
        onNameChange={setNewSectionName}
        onPositionChange={setNewSectionPosition}
        onRefChange={setNewSectionRef}
        onCreate={handleCreateNewSection}
        onCancel={() => {
          setShowNewSection(false);
          setNewSectionName('');
          setNewSectionPosition('end');
          setNewSectionRef('');
        }}
      />
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
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
            <div className="flex items-center h-[49px] px-4 border-b border-border gap-2">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                className="text-foreground shrink-0"
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
              <span className="text-sm font-medium text-foreground">
                StsDev Wiki
              </span>
            </div>
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
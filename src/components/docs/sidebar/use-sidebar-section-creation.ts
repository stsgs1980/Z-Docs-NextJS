'use client';

import { useState, useCallback } from 'react';
import type { NavSection } from '@/lib/mdx-utils';
import { slugifySectionName } from '@/lib/slugify';
import { createSectionDoc, reorderExistingSections } from '@/lib/docs-api';
import { calculateSectionOrder } from '@/lib/section-order';

export function useSidebarSectionCreation(navigation: NavSection[]) {
  const [showNewSection, setShowNewSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionPosition, setNewSectionPosition] = useState<'end' | 'before' | 'after'>('end');
  const [newSectionRef, setNewSectionRef] = useState<string>('');
  const [creating, setCreating] = useState(false);

  const handleCreateNewSection = useCallback(async () => {
    if (!newSectionName.trim()) return;
    setCreating(true);
    const title = newSectionName.trim();
    const slug = slugifySectionName(title);
    try {
      const { sectionOrder, needsRenumber, renumberedSections } = calculateSectionOrder(
        navigation, newSectionPosition, newSectionRef, title,
      );

      await createSectionDoc(title, sectionOrder, slug);

      if (needsRenumber) {
        await reorderExistingSections(renumberedSections, title);
      }

      window.location.href = `/docs/${slug}/`;
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка создания секции');
    } finally {
      setCreating(false);
      setShowNewSection(false);
      setNewSectionName('');
      setNewSectionPosition('end');
      setNewSectionRef('');
    }
  }, [newSectionName, newSectionPosition, newSectionRef, navigation]);

  return {
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
  };
}

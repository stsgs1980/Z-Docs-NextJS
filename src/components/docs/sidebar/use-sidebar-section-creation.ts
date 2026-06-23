'use client';

import { useState, useCallback } from 'react';
import type { NavSection } from '@/lib/mdx-utils';
import { slugifySectionName } from '@/lib/slugify';
import { createSectionDoc, reorderExistingSections } from '@/lib/docs-api';

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
      // Calculate sectionOrder based on position
      let sectionOrder: number;
      let needsRenumber = false;
      let renumberedSections: Record<string, number> = {};

      if (newSectionPosition === 'end' || !newSectionRef) {
        const maxOrder = navigation.reduce((max, s) => Math.max(max, s.order), 0);
        sectionOrder = maxOrder + 100;
      } else {
        const refIdx = navigation.findIndex((s) => s.title === newSectionRef);
        if (refIdx < 0) {
          sectionOrder = navigation.length * 100;
        } else {
          const refOrder = navigation[refIdx].order;
          const neighborOrder = newSectionPosition === 'before'
            ? (refIdx > 0 ? navigation[refIdx - 1].order : 0)
            : (refIdx < navigation.length - 1 ? navigation[refIdx + 1].order : refOrder + 200);
          sectionOrder = Math.round((refOrder + neighborOrder) / 2);

          // Collision: renumber all sections with 100-step spacing
          if (sectionOrder === refOrder || sectionOrder === neighborOrder) {
            needsRenumber = true;
            let counter = 100;
            for (let i = 0; i < navigation.length; i++) {
              renumberedSections[navigation[i].title] = counter;
              counter += 100;
              if (newSectionPosition === 'before' && i === refIdx) {
                renumberedSections[title] = counter;
                counter += 100;
              } else if (newSectionPosition === 'after' && i === refIdx) {
                renumberedSections[title] = counter;
                counter += 100;
              }
            }
            sectionOrder = renumberedSections[title];
          }
        }
      }

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
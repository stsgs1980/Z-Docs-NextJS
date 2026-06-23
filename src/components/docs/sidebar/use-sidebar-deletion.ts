'use client';

import { useState, useCallback } from 'react';
import type { NavSection } from '@/lib/mdx-utils';

export function useSidebarDeletion(
  currentSlug: string,
  navigation: NavSection[],
  onNavigate: (slug: string) => void,
) {
  const [deleteTarget, setDeleteTarget] = useState<{ slug: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/docs/${deleteTarget.slug}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Delete failed');
      }
      if (deleteTarget.slug === currentSlug) {
        const firstSlug = navigation[0]?.items[0]?.slug;
        if (firstSlug) {
          onNavigate(firstSlug);
        } else {
          window.location.href = '/docs/';
        }
      }
      window.location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка удаления');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }, [deleteTarget, currentSlug, navigation, onNavigate]);

  return {
    deleteTarget,
    setDeleteTarget,
    deleting,
    handleDeleteConfirm,
  };
}
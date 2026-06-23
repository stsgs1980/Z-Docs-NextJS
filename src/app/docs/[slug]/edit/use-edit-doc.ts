'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

export interface DocData {
  meta: {
    title: string;
    section: string;
    sectionOrder?: number;
    order: number;
    slug: string;
  };
  content: string;
}

interface UseEditDocParams {
  slug: string;
  router: AppRouterInstance;
}

export function useEditDoc({ slug, router }: UseEditDocParams) {
  const [doc, setDoc] = useState<DocData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Load document
  useEffect(() => {
    async function loadDoc() {
      try {
        const res = await fetch(`/api/docs/${slug}`);
        if (!res.ok) throw new Error('Page not found');
        const data = await res.json();
        setDoc(data);
        setCommitMessage(`docs: update ${slug}`);
      } catch (err) {
        setError('Не удалось загрузить страницу');
      } finally {
        setLoading(false);
      }
    }
    loadDoc();
  }, [slug]);

  const handleDelete = useCallback(async () => {
    setDeleting(true);
    setError('');
    try {
      const res = await fetch(`/api/docs/${slug}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Delete failed');
      }
      router.push('/docs/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка удаления');
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  }, [slug, router]);

  const handleSave = useCallback(async () => {
    if (!doc) return;
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/docs/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...doc.meta,
          content: doc.content,
          commitMessage: commitMessage || `docs: update ${slug}`,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Save failed');
      }

      setSuccess('Сохранено!');
      setTimeout(() => {
        router.push(`/docs/${slug}`);
        router.refresh();
      }, 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  }, [doc, slug, commitMessage, router]);

  return {
    doc,
    setDoc,
    loading,
    saving,
    error,
    success,
    commitMessage,
    setCommitMessage,
    deleting,
    showDeleteConfirm,
    setShowDeleteConfirm,
    handleDelete,
    handleSave,
  };
}
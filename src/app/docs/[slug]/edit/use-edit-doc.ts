'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import type { DocData } from '@/lib/docs-actions';
import { deleteDoc, saveDoc } from '@/lib/docs-actions';

export type { DocData };

/**
 * Hook that loads a document by slug and populates doc data + commit message.
 * Sets an error via the provided callback if loading fails.
 */
function useDocLoader(slug: string, setError: (msg: string) => void) {
  const [doc, setDoc] = useState<DocData | null>(null);
  const [loading, setLoading] = useState(true);
  const [commitMessage, setCommitMessage] = useState('');

  useEffect(() => {
    async function loadDoc() {
      try {
        const res = await fetch(`/api/docs/${slug}`);
        if (!res.ok) throw new Error('Page not found');
        const data = await res.json();
        setDoc(data);
        setCommitMessage(`docs: update ${slug}`);
      } catch {
        setError('Не удалось загрузить страницу');
      } finally {
        setLoading(false);
      }
    }
    loadDoc();
  }, [slug, setError]);

  return { doc, setDoc, loading, commitMessage, setCommitMessage };
}

interface UseEditDocParams {
  slug: string;
  router: AppRouterInstance;
}

export function useEditDoc({ slug, router }: UseEditDocParams) {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { doc, setDoc, loading, commitMessage, setCommitMessage } = useDocLoader(slug, setError);

  const handleDelete = useCallback(async () => {
    setDeleting(true);
    setError('');
    const result = await deleteDoc(slug);
    if (result.success) {
      router.push('/docs/');
    } else {
      setError(result.error);
      setShowDeleteConfirm(false);
    }
    setDeleting(false);
  }, [slug, router]);

  const handleSave = useCallback(async () => {
    if (!doc) return;
    setSaving(true);
    setError('');
    setSuccess('');
    const result = await saveDoc(doc, slug, commitMessage);
    if (result.success) {
      setSuccess('Сохранено!');
      setTimeout(() => {
        router.push(`/docs/${slug}`);
        router.refresh();
      }, 1000);
    } else {
      setError(result.error);
    }
    setSaving(false);
  }, [doc, slug, commitMessage, router]);

  return {
    doc, setDoc, loading, saving, error, success,
    commitMessage, setCommitMessage, deleting,
    showDeleteConfirm, setShowDeleteConfirm,
    handleDelete, handleSave,
  };
}

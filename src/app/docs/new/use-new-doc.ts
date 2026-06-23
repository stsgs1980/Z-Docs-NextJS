'use client';

import { useState, useCallback } from 'react';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import type { ReadonlyURLSearchParams } from 'next/navigation';
import { slugify } from '@/lib/slugify';

interface UseNewDocParams {
  router: AppRouterInstance;
  searchParams: ReadonlyURLSearchParams;
}

export function useNewDoc({ router, searchParams }: UseNewDocParams) {
  const [title, setTitle] = useState('');
  const [section, setSection] = useState(searchParams.get('section') || '');
  const [slug, setSlug] = useState('');
  const [sectionOrder, setSectionOrder] = useState(searchParams.get('sectionOrder') || '');
  const [order, setOrder] = useState('0');
  const [content, setContent] = useState('# Новая страница\n\nНачните писать здесь...');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  // Auto-generate slug from title
  const handleTitleChange = (val: string) => {
    setTitle(val);
    setSlug(slugify(val));
  };

  const handleSave = useCallback(async () => {
    if (!title || !slug) {
      setError('Заголовок и slug обязательны');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          section: section || 'Uncategorized',
          sectionOrder: sectionOrder ? parseInt(sectionOrder) : undefined,
          order: order ? parseInt(order) : 0,
          slug,
          content,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Create failed');
      }

      router.push(`/docs/${data.slug}`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка создания');
    } finally {
      setSaving(false);
    }
  }, [title, slug, section, sectionOrder, order, content, router]);

  // File upload
  const handleFileUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setUploading(true);
      setError('');

      const formData = new FormData();
      formData.append('section', section || 'Uploaded');

      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }

      try {
        const res = await fetch('/api/docs/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Upload failed');
        }

        // Navigate to the first uploaded file
        if (data.results && data.results.length > 0) {
          router.push(`/docs/${data.results[0].slug}`);
          router.refresh();
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки');
      } finally {
        setUploading(false);
      }
    },
    [section, router]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      handleFileUpload(e.dataTransfer.files);
    },
    [handleFileUpload]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return {
    title,
    section,
    slug,
    setSlug,
    sectionOrder,
    setSectionOrder,
    order,
    setOrder,
    content,
    setContent,
    saving,
    error,
    uploading,
    handleTitleChange,
    handleSave,
    handleFileUpload,
    handleDrop,
    handleDragOver,
    setSection,
  };
}
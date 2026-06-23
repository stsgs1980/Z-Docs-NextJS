'use client';

import { useState, useCallback } from 'react';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import type { ReadonlyURLSearchParams } from 'next/navigation';
import { slugify } from '@/lib/slugify';
import { createDoc, uploadDocs } from '@/lib/docs-actions';

/**
 * Hook for file drag & drop handling.
 */
function useFileDragUpload(handleFileUpload: (files: FileList | null) => void) {
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      handleFileUpload(e.dataTransfer.files);
    },
    [handleFileUpload],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  return { handleDrop, handleDragOver };
}

/**
 * Form state for new document creation.
 */
function useNewDocFormState(searchParams: ReadonlyURLSearchParams) {
  const [title, setTitle] = useState('');
  const [section, setSection] = useState(searchParams.get('section') || '');
  const [slug, setSlug] = useState('');
  const [sectionOrder, setSectionOrder] = useState(searchParams.get('sectionOrder') || '');
  const [order, setOrder] = useState('0');
  const [content, setContent] = useState('# Новая страница\n\nНачните писать здесь...');

  const handleTitleChange = (val: string) => {
    setTitle(val);
    setSlug(slugify(val));
  };

  return {
    title, setTitle, section, setSection, slug, setSlug,
    sectionOrder, setSectionOrder, order, setOrder,
    content, setContent, handleTitleChange,
  };
}

interface UseNewDocParams {
  router: AppRouterInstance;
  searchParams: ReadonlyURLSearchParams;
}

export function useNewDoc({ router, searchParams }: UseNewDocParams) {
  const form = useNewDocFormState(searchParams);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleSave = useCallback(async () => {
    if (!form.title || !form.slug) {
      setError('Заголовок и slug обязательны');
      return;
    }
    setSaving(true);
    setError('');
    const result = await createDoc(form.title, form.slug, form.section, form.sectionOrder, form.order, form.content);
    if (result.success) {
      router.push(`/docs/${result.slug}`);
      router.refresh();
    } else {
      setError(result.error);
    }
    setSaving(false);
  }, [form.title, form.slug, form.section, form.sectionOrder, form.order, form.content, router]);

  const handleFileUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setUploading(true);
      setError('');
      const result = await uploadDocs(files, form.section);
      if (result.success && result.slug) {
        router.push(`/docs/${result.slug}`);
        router.refresh();
      } else if (!result.success) {
        setError(result.error);
      }
      setUploading(false);
    },
    [form.section, router],
  );

  const dragHandlers = useFileDragUpload(handleFileUpload);

  return { ...form, saving, error, uploading, handleSave, handleFileUpload, ...dragHandlers };
}

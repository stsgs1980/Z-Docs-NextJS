'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Upload, FileText, ArrowLeft } from 'lucide-react';
import { MDXEditor } from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';
import { getEditorPlugins } from '@/components/editor/mdx-editor-config';
import { useNewDoc } from './use-new-doc';

export default function NewDocPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-muted-foreground/60" /></div>}>
      <NewDocPageInner />
    </Suspense>
  );
}

function NewDocPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
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
  } = useNewDoc({ router, searchParams });

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Top bar */}
      <div className="sticky top-0 z-30 border-b border-border bg-background">
        <div className="flex items-center justify-between px-4 h-[49px]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1 text-[14px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Назад
            </button>
            <span className="text-[14px] text-muted-foreground">|</span>
            <span className="text-[14px] font-medium text-foreground">
              Новая страница
            </span>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted cursor-pointer">
              <Upload className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">
                {uploading ? 'Загрузка...' : 'Загрузить файл'}
              </span>
              <input
                type="file"
                accept=".md,.mdx"
                multiple
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files)}
                disabled={uploading}
              />
            </label>
            <button
              onClick={handleSave}
              disabled={saving || !title || !slug}
              className="px-4 py-1.5 text-[13px] font-medium rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-50"
            >
              {saving ? 'Создание...' : 'Создать'}
            </button>
          </div>
        </div>
        {error && (
          <div className="px-4 py-2 bg-red-500/10 text-red-500 text-[13px]">
            {error}
          </div>
        )}
      </div>

      {/* Frontmatter form */}
      <div className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-[960px] px-4 py-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div>
            <label className="block text-[12px] text-muted-foreground mb-1">
              Заголовок *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Моя новая страница"
              className="w-full px-3 py-1.5 text-[14px] rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-[12px] text-muted-foreground mb-1">
              Секция
            </label>
            <input
              type="text"
              value={section}
              onChange={(e) => setSection(e.target.value)}
              placeholder="Название секции"
              className="w-full px-3 py-1.5 text-[14px] rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-[12px] text-muted-foreground mb-1">
              Slug *
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="auto-generated-from-title"
              className="w-full px-3 py-1.5 text-[14px] rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-[12px] text-muted-foreground mb-1">
              Порядок секции
            </label>
            <input
              type="number"
              value={sectionOrder}
              onChange={(e) => setSectionOrder(e.target.value)}
              placeholder="авто"
              className="w-full px-3 py-1.5 text-[14px] rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-[12px] text-muted-foreground mb-1">
              Порядок страницы
            </label>
            <input
              type="number"
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              placeholder="0"
              className="w-full px-3 py-1.5 text-[14px] rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="flex items-end">
            <div className="text-[12px] text-muted-foreground">
              <FileText className="h-3.5 w-3.5 inline mr-1" />
              Перетяните .md/.mdx файл на эту страницу
            </div>
          </div>
        </div>
      </div>

      {/* MDX Editor */}
      <div className="mx-auto max-w-[960px] px-4 py-6">
        <div className="rounded-lg border border-border overflow-hidden [&_.mdxeditor]:min-h-[60vh] [&_.mdxeditor-toolbar]:border-b [&_.mdxeditor-toolbar]:border-border [&_.mdxeditor-toolbar]:bg-muted/30">
          <MDXEditor
            markdown={content}
            onChange={setContent}
            plugins={getEditorPlugins({ markdown: content })}
          />
        </div>
      </div>
    </div>
  );
}
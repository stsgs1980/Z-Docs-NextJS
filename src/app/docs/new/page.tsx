"use client";

import React, { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Upload, FileText, ArrowLeft } from "lucide-react";
import { MDXEditor } from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";
import { getEditorPlugins } from "@/components/editor/mdx-editor-config";
import { useNewDoc } from "./use-new-doc";

export default function NewDocPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-background flex min-h-screen items-center justify-center">
          <div className="border-muted-foreground/20 border-t-muted-foreground/60 h-8 w-8 animate-spin rounded-full border-2" />
        </div>
      }
    >
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
      className="bg-background text-foreground min-h-screen"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Top bar */}
      <div className="border-border bg-background sticky top-0 z-30 border-b">
        <div className="flex h-[49px] items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-[14px] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Назад
            </button>
            <span className="text-muted-foreground text-[14px]">|</span>
            <span className="text-foreground text-[14px] font-medium">
              Новая страница
            </span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-muted-foreground hover:text-foreground hover:bg-muted flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] transition-colors">
              <Upload className="h-3.5 w-3.5" />
              <span className="docs-show-sm-inline">
                {uploading ? "Загрузка..." : "Загрузить файл"}
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
              className="bg-foreground text-background hover:bg-foreground/90 rounded-lg px-4 py-1.5 text-[13px] font-medium transition-colors disabled:opacity-50"
            >
              {saving ? "Создание..." : "Создать"}
            </button>
          </div>
        </div>
        {error && (
          <div className="bg-red-500/10 px-4 py-2 text-[13px] text-red-500">
            {error}
          </div>
        )}
      </div>

      {/* Frontmatter form */}
      <div className="border-border bg-muted/30 border-b">
        <div className="mx-auto grid max-w-[960px] grid-cols-2 gap-3 px-4 py-4 sm:grid-cols-3 lg:grid-cols-6">
          <div>
            <label className="text-muted-foreground mb-1 block text-[12px]">
              Заголовок *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Моя новая страница"
              className="border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring w-full rounded-md border px-3 py-1.5 text-[14px] focus:ring-1 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-muted-foreground mb-1 block text-[12px]">
              Секция
            </label>
            <input
              type="text"
              value={section}
              onChange={(e) => setSection(e.target.value)}
              placeholder="Название секции"
              className="border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring w-full rounded-md border px-3 py-1.5 text-[14px] focus:ring-1 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-muted-foreground mb-1 block text-[12px]">
              Slug *
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="auto-generated-from-title"
              className="border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring w-full rounded-md border px-3 py-1.5 text-[14px] focus:ring-1 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-muted-foreground mb-1 block text-[12px]">
              Порядок секции
            </label>
            <input
              type="number"
              value={sectionOrder}
              onChange={(e) => setSectionOrder(e.target.value)}
              placeholder="авто"
              className="border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring w-full rounded-md border px-3 py-1.5 text-[14px] focus:ring-1 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-muted-foreground mb-1 block text-[12px]">
              Порядок страницы
            </label>
            <input
              type="number"
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              placeholder="0"
              className="border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring w-full rounded-md border px-3 py-1.5 text-[14px] focus:ring-1 focus:outline-none"
            />
          </div>
          <div className="flex items-end">
            <div className="text-muted-foreground text-[12px]">
              <FileText className="mr-1 inline h-3.5 w-3.5" />
              Перетяните .md/.mdx файл на эту страницу
            </div>
          </div>
        </div>
      </div>

      {/* MDX Editor */}
      <div className="mx-auto max-w-[960px] px-4 py-6">
        <div className="border-border [&_.mdxeditor-toolbar]:border-border [&_.mdxeditor-toolbar]:bg-muted/30 overflow-hidden rounded-lg border [&_.mdxeditor]:min-h-[60vh] [&_.mdxeditor-toolbar]:border-b">
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

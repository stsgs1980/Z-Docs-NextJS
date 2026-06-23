'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { MDXEditor } from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';
import { getEditorPlugins } from '@/components/editor/mdx-editor-config';
import { useEditDoc } from './use-edit-doc';
import { DeleteConfirmDialog } from './delete-confirm-dialog';
import { FrontmatterEditor } from './frontmatter-editor';

export default function EditDocPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const {
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
  } = useEditDoc({ slug, router });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-muted-foreground/60" />
      </div>
    );
  }

  if (error && !doc) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => router.push(`/docs/${slug}`)}
            className="px-4 py-2 rounded-lg bg-foreground text-background hover:bg-foreground/90"
          >
            Назад
          </button>
        </div>
      </div>
    );
  }

  if (!doc) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <div className="sticky top-0 z-30 border-b border-border bg-background">
        <div className="flex items-center justify-between px-4 h-[49px]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/docs/${slug}`)}
              className="flex items-center gap-1 text-[14px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Назад к странице
            </button>
            <span className="text-[14px] text-muted-foreground">|</span>
            <span className="text-[14px] font-medium text-foreground">
              Редактирование: {doc.meta.title}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="Сообщение коммита..."
              className="hidden sm:block w-[240px] px-3 py-1.5 text-[13px] rounded-md border border-border bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              onClick={() => router.push(`/docs/${slug}`)}
              className="px-3 py-1.5 text-[13px] font-medium rounded-lg border border-border text-foreground hover:bg-muted/50 transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3 py-1.5 text-[13px] font-medium rounded-lg border border-red-500/40 text-red-500 hover:bg-red-500/10 transition-colors"
            >
              Удалить
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 text-[13px] font-medium rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-50"
            >
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </div>
        {error && (
          <div className="px-4 py-2 bg-red-500/10 text-red-500 text-[13px]">
            {error}
          </div>
        )}
        {success && (
          <div className="px-4 py-2 bg-green-500/10 text-green-500 text-[13px]">
            {success}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      <DeleteConfirmDialog
        show={showDeleteConfirm}
        title={doc.meta.title}
        deleting={deleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* Frontmatter edit */}
      <FrontmatterEditor doc={doc} onChange={setDoc} />

      {/* MDX Editor */}
      <div className="mx-auto max-w-[960px] px-4 py-6">
        <div className="rounded-lg border border-border overflow-hidden [&_.mdxeditor]:min-h-[60vh] [&_.mdxeditor-toolbar]:border-b [&_.mdxeditor-toolbar]:border-border [&_.mdxeditor-toolbar]:bg-muted/30">
          <MDXEditor
            markdown={doc.content}
            onChange={(md) => setDoc({ ...doc, content: md })}
            plugins={getEditorPlugins({ markdown: doc.content, withFrontmatter: true })}
          />
        </div>
      </div>
    </div>
  );
}
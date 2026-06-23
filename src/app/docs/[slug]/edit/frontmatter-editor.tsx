'use client';

import React from 'react';
import type { DocData } from './use-edit-doc';

interface FrontmatterEditorProps {
  doc: DocData;
  onChange: (updated: DocData) => void;
}

export function FrontmatterEditor({ doc, onChange }: FrontmatterEditorProps) {
  return (
    <div className="border-b border-border bg-muted/30">
      <details className="mx-auto max-w-[960px] px-4 py-3">
        <summary className="text-[14px] font-medium text-muted-foreground cursor-pointer hover:text-foreground">
          Метаданные (frontmatter)
        </summary>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-[12px] text-muted-foreground mb-1">
              Заголовок
            </label>
            <input
              type="text"
              value={doc.meta.title}
              onChange={(e) =>
                onChange({ ...doc, meta: { ...doc.meta, title: e.target.value } })
              }
              className="w-full px-3 py-1.5 text-[14px] rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-[12px] text-muted-foreground mb-1">
              Секция
            </label>
            <input
              type="text"
              value={doc.meta.section}
              onChange={(e) =>
                onChange({
                  ...doc,
                  meta: { ...doc.meta, section: e.target.value },
                })
              }
              className="w-full px-3 py-1.5 text-[14px] rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-[12px] text-muted-foreground mb-1">
              Порядок секции
            </label>
            <input
              type="number"
              value={doc.meta.sectionOrder ?? 0}
              onChange={(e) =>
                onChange({
                  ...doc,
                  meta: { ...doc.meta, sectionOrder: parseInt(e.target.value) || 0 },
                })
              }
              className="w-full px-3 py-1.5 text-[14px] rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-[12px] text-muted-foreground mb-1">
              Порядок страницы
            </label>
            <input
              type="number"
              value={doc.meta.order}
              onChange={(e) =>
                onChange({
                  ...doc,
                  meta: { ...doc.meta, order: parseInt(e.target.value) || 0 },
                })
              }
              className="w-full px-3 py-1.5 text-[14px] rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-[12px] text-muted-foreground mb-1">
              Slug
            </label>
            <input
              type="text"
              value={doc.meta.slug}
              disabled
              className="w-full px-3 py-1.5 text-[14px] rounded-md border border-border bg-muted text-muted-foreground cursor-not-allowed"
            />
          </div>
        </div>
      </details>
    </div>
  );
}
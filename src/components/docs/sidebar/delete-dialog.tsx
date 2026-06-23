'use client';

import React from 'react';

interface DeleteDialogProps {
  target: { slug: string; title: string } | null;
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteDialog({ target, deleting, onConfirm, onCancel }: DeleteDialogProps) {
  if (!target) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-background border border-border rounded-xl p-6 max-w-[380px] w-full mx-4 shadow-2xl">
        <h3 className="text-[15px] font-semibold text-foreground mb-2">
          Удалить страницу?
        </h3>
        <p className="text-[14px] text-muted-foreground mb-5">
          &laquo;{target.title}&raquo; будет удалена без возможности восстановления.
        </p>
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="px-4 py-2 text-[var(--text-sm)] rounded-lg border border-border text-foreground hover:bg-muted/50 transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="px-4 py-2 text-[var(--text-sm)] font-medium rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {deleting ? 'Удаление...' : 'Удалить'}
          </button>
        </div>
      </div>
    </div>
  );
}
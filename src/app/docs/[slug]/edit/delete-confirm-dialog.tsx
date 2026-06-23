'use client';

import React from 'react';

interface DeleteConfirmDialogProps {
  show: boolean;
  title: string;
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmDialog({
  show,
  title,
  deleting,
  onConfirm,
  onCancel,
}: DeleteConfirmDialogProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-background border border-border rounded-xl p-6 max-w-[400px] w-full mx-4 shadow-2xl">
        <h3 className="text-[16px] font-semibold text-foreground mb-2">
          Удалить страницу?
        </h3>
        <p className="text-[14px] text-muted-foreground mb-6">
          Страница &laquo;{title}&raquo; будет удалена без возможности восстановления.
        </p>
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-[13px] rounded-lg border border-border text-foreground hover:bg-muted/50 transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="px-4 py-2 text-[13px] font-medium rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {deleting ? 'Удаление...' : 'Удалить'}
          </button>
        </div>
      </div>
    </div>
  );
}
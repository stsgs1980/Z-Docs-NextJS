'use client';

import React from 'react';
import type { NavSection } from '@/lib/mdx-utils';

interface NewSectionDialogProps {
  show: boolean;
  name: string;
  position: 'end' | 'before' | 'after';
  ref_: string;
  creating: boolean;
  navigation: NavSection[];
  onNameChange: (value: string) => void;
  onPositionChange: (value: 'end' | 'before' | 'after') => void;
  onRefChange: (value: string) => void;
  onCreate: () => void;
  onCancel: () => void;
}

export default function NewSectionDialog({
  show,
  name,
  position,
  ref_,
  creating,
  navigation,
  onNameChange,
  onPositionChange,
  onRefChange,
  onCreate,
  onCancel,
}: NewSectionDialogProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-background border border-border rounded-xl p-6 max-w-[420px] w-full mx-4 shadow-2xl">
        <h3 className="text-[15px] font-semibold text-foreground mb-4">
          Новая секция
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-[var(--text-xs)] text-muted-foreground mb-1.5">
              Название секции
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Например: API Reference"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') onCreate();
              }}
              className="w-full px-3 py-2 text-[14px] rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div>
            <label className="block text-[var(--text-xs)] text-muted-foreground mb-1.5">
              Позиция
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="sectionPos"
                  value="end"
                  checked={position === 'end'}
                  onChange={() => onPositionChange('end')}
                  className="accent-foreground"
                />
                <span className="text-[14px] text-foreground">В конец</span>
              </label>
              {navigation.length > 0 && (
                <>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="sectionPos"
                      value="before"
                      checked={position === 'before'}
                      onChange={() => {
                        onPositionChange('before');
                        if (!ref_) onRefChange(navigation[0].title);
                      }}
                      className="accent-foreground"
                    />
                    <span className="text-[14px] text-foreground">Перед секцией</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="sectionPos"
                      value="after"
                      checked={position === 'after'}
                      onChange={() => {
                        onPositionChange('after');
                        if (!ref_) onRefChange(navigation[0].title);
                      }}
                      className="accent-foreground"
                    />
                    <span className="text-[14px] text-foreground">После секции</span>
                  </label>
                </>
              )}
            </div>
          </div>

          {(position === 'before' || position === 'after') && navigation.length > 0 && (
            <div>
              <label className="block text-[var(--text-xs)] text-muted-foreground mb-1.5">
                {position === 'before' ? 'Перед какой секцией' : 'После какой секции'}
              </label>
              <select
                value={ref_}
                onChange={(e) => onRefChange(e.target.value)}
                className="w-full px-3 py-2 text-[14px] rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {navigation.map((s) => (
                  <option key={s.title} value={s.title}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 mt-5">
          <button
            onClick={onCancel}
            disabled={creating}
            className="px-4 py-2 text-[var(--text-sm)] rounded-lg border border-border text-foreground hover:bg-muted/50 transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={onCreate}
            disabled={creating || !name.trim()}
            className="px-4 py-2 text-[var(--text-sm)] font-medium rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-50"
          >
            {creating ? 'Создание...' : 'Создать'}
          </button>
        </div>
      </div>
    </div>
  );
}
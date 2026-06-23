'use client';

import React from 'react';

/**
 * Callout component for tips, warnings, info blocks.
 * Usage in MDX:
 *   <Callout type="info">Important information</Callout>
 *   <Callout type="warning">Be careful!</Callout>
 */
const calloutStyles: Record<string, { icon: string; borderColor: string; bgColor: string }> = {
  info: {
    icon: 'i',
    borderColor: 'border-blue-500/40',
    bgColor: 'bg-blue-500/5',
  },
  warning: {
    icon: '!',
    borderColor: 'border-yellow-500/40',
    bgColor: 'bg-yellow-500/5',
  },
  tip: {
    icon: '*',
    borderColor: 'border-green-500/40',
    bgColor: 'bg-green-500/5',
  },
  danger: {
    icon: 'x',
    borderColor: 'border-red-500/40',
    bgColor: 'bg-red-500/5',
  },
};

export function Callout({
  type = 'info',
  title,
  children,
}: {
  type?: 'info' | 'warning' | 'tip' | 'danger';
  title?: string;
  children: React.ReactNode;
}) {
  const style = calloutStyles[type] || calloutStyles.info;

  return (
    <div
      className={`my-4 rounded-lg border-l-4 ${style.borderColor} ${style.bgColor} p-4`}
    >
      {title && (
        <div className="font-semibold text-foreground mb-1">{title}</div>
      )}
      <div className="text-muted-foreground text-[15px] leading-relaxed">
        {children}
      </div>
    </div>
  );
}
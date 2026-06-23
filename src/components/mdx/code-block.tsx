'use client';

import React, { useEffect, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from 'next-themes';
import { Check, Copy } from 'lucide-react';

interface CodeBlockProps {
  children: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
}

/**
 * CodeBlock — code display with syntax highlighting.
 *
 * Architecture:
 * - Theme-aware: switches oneDark/oneLight based on resolvedTheme
 * - No SSR flash: renders a skeleton placeholder until mounted
 * - Copy button with clipboard API + fallback
 * - Line numbers + optional filename header
 * - CSS custom properties from globals.css (no hardcoded colors)
 */
export function CodeBlock({
  children,
  language = 'text',
  filename,
  showLineNumbers = true,
}: CodeBlockProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === 'dark' : false;
  const codeBg = isDark ? '#0f0f1a' : '#fafafa';
  const headerBg = isDark ? '#15151f' : '#f0f0f0';
  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';
  const lineNumberColor = isDark ? '#3a3a4a' : '#c8c8c8';
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(children.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for contexts where clipboard API is unavailable
      const textarea = document.createElement('textarea');
      textarea.value = children.trim();
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Before mount: render a theme-aware placeholder using CSS custom properties
  // to avoid SSR/client mismatch + white flash in dark mode.
  if (!mounted) {
    return (
      <div
        className="my-4 rounded-lg overflow-hidden"
        style={{ border: '1px solid var(--code-border)' }}
      >
        <div
          className="flex items-center justify-between px-4 py-2.5 border-b"
          style={{ background: 'var(--code-header-bg)', borderColor: 'var(--code-border)' }}
        >
          <span className="text-xs font-mono" style={{ color: 'var(--muted-foreground)' }}>
            {filename || language}
          </span>
        </div>
        <div
          className="p-4 font-mono text-[13px] leading-relaxed whitespace-pre overflow-x-auto"
          style={{ background: 'var(--code-bg)', color: 'var(--foreground)' }}
        >
          {children.trim()}
        </div>
      </div>
    );
  }

  // Shared syntax highlighter props
  const highlighterProps = {
    style: (isDark ? oneDark : oneLight) as object,
    language,
    PreTag: 'div' as const,
    showLineNumbers,
    customStyle: {
      margin: 0,
      borderRadius: 0,
      background: codeBg,
      fontSize: '13px',
      padding: '16px',
      border: 'none',
    },
    lineNumberStyle: {
      minWidth: '2.5em',
      paddingRight: '1em',
      color: lineNumberColor,
      userSelect: 'none' as const,
      background: 'transparent',
    },
    codeTagProps: {
      style: {
        fontFamily:
          'var(--font-mono), ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
      },
    },
  };

  const headerBar = (
    <div
      className="flex items-center justify-between px-4 py-2.5 border-b shrink-0"
      style={{ background: headerBg, borderColor: borderColor }}
    >
      <span
        className={`text-xs font-mono ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
      >
        {filename || language}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={(e) => { e.stopPropagation(); handleCopy(); }}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
            isDark
              ? 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              : 'text-gray-500 hover:text-gray-700 hover:bg-black/5'
          }`}
          aria-label="Copy code"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-green-500" />
              <span className="text-green-500">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div
      className="my-4 rounded-lg overflow-hidden"
      style={{ border: `1px solid ${borderColor}` }}
      data-expandable
    >
      {headerBar}
      <SyntaxHighlighter {...highlighterProps}>
        {children.trim()}
      </SyntaxHighlighter>
    </div>
  );
}
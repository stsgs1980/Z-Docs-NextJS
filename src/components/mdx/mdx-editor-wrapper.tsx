'use client';

import React, { useState, useEffect } from 'react';

// Lazy-loaded MDXEditor — avoids hydration mismatch because
// @mdxeditor/editor (Lexical-based) renders different HTML on server vs client.
// We only mount it after the first client render.
export default function MDXEditorWrapper({
  markdown,
  onChange,
  plugins,
}: {
  markdown: string;
  onChange: (md: string) => void;
  plugins: React.ReactNode[];
}) {
  const [Editor, setEditor] = useState<React.ComponentType<{
    markdown: string;
    onChange: (md: string) => void;
    plugins: React.ReactNode[];
  }> | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Dynamic import — runs only on client
    import('@mdxeditor/editor').then((mod) => {
      setEditor(() => mod.MDXEditor);
      setMounted(true);
    });
  }, []);

  if (!mounted || !Editor) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground text-[14px]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-muted-foreground/60 mr-3" />
        Loading editor...
      </div>
    );
  }

  return <Editor markdown={markdown} onChange={onChange} plugins={plugins} />;
}

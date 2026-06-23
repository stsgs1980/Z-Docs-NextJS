'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';

/**
 * Mermaid diagram component
 */
export function MermaidDiagram({ code }: { code: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;
    const renderDiagram = async () => {
      try {
        const mermaid = (await import('mermaid')).default;
        const isDark = resolvedTheme === 'dark';
        mermaid.initialize({
          startOnLoad: false,
          theme: isDark ? 'dark' : 'default',
          themeVariables: isDark
            ? {
                background: '#0a0a0f',
                primaryColor: '#1e1e30',
                primaryTextColor: '#E6E6E6',
                primaryBorderColor: 'rgba(125,211,252,0.35)',
                lineColor: 'rgba(125,211,252,0.5)',
                secondaryColor: '#1a1a2a',
                tertiaryColor: '#15151f',
                fontFamily: 'system-ui, sans-serif',
                fontSize: '13px',
                nodeBorder: 'rgba(125,211,252,0.3)',
                mainBkg: '#1e1e30',
                clusterBkg: '#0d0d14',
              }
            : {
                background: '#ffffff',
                primaryColor: '#dbeafe',
                primaryTextColor: '#1e293b',
                primaryBorderColor: '#93c5fd',
                lineColor: '#64748b',
                secondaryColor: '#e0e7ff',
                tertiaryColor: '#f8fafc',
                fontFamily: 'system-ui, sans-serif',
                fontSize: '13px',
                nodeBorder: '#93c5fd',
                mainBkg: '#dbeafe',
                clusterBkg: '#f0f9ff',
                edgeLabelBackground: '#ffffff',
              },
        });
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg: renderedSvg } = await mermaid.render(id, code.trim());
        if (!cancelled) {
          setSvg(renderedSvg);
          setError(false);
        }
      } catch {
        if (!cancelled) setError(true);
      }
    };
    renderDiagram();
    return () => {
      cancelled = true;
    };
  }, [code, resolvedTheme, mounted]);

  const isDark = mounted ? resolvedTheme === 'dark' : false;

  if (error) {
    return (
      <div className="my-4 rounded-lg border border-border bg-muted p-4 overflow-x-auto">
        <pre className="text-sm text-muted-foreground font-mono">{code}</pre>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="my-4 rounded-lg border border-border bg-muted/50 p-4 overflow-auto"
      data-expandable
    >
      {svg ? (
        <div
          dangerouslySetInnerHTML={{ __html: svg }}
          className="[&>svg]:max-w-full"
        />
      ) : (
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-muted-foreground/60" />
        </div>
      )}
    </div>
  );
}
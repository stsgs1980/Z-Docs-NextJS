import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import TOC from '@/components/docs/toc';
import type { Heading } from '@/lib/mdx-utils';

const mockHeadings: Heading[] = [
  { id: 'overview', text: 'Overview', level: 2 },
  { id: 'installation', text: 'Installation', level: 2 },
  { id: 'quick-start', text: 'Quick Start', level: 3 },
  { id: 'configuration', text: 'Configuration', level: 2 },
];

describe('TOC', () => {
  it('не рендерится при пустом массиве headings', () => {
    const { container } = render(<TOC headings={[]} activeId="" />);
    expect(container.innerHTML).toBe('');
  });

  it('отображает все заголовки', () => {
    render(<TOC headings={mockHeadings} activeId="" />);

    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Installation')).toBeInTheDocument();
    expect(screen.getByText('Quick Start')).toBeInTheDocument();
    expect(screen.getByText('Configuration')).toBeInTheDocument();
  });

  it('ссылки имеют правильные href', () => {
    render(<TOC headings={mockHeadings} activeId="" />);

    expect(screen.getByText('Overview').closest('a')).toHaveAttribute('href', '#overview');
    expect(screen.getByText('Quick Start').closest('a')).toHaveAttribute('href', '#quick-start');
  });

  it('активный заголовок имеет подсветку', () => {
    render(<TOC headings={mockHeadings} activeId="installation" />);

    const activeLink = screen.getByText('Installation').closest('a');
    expect(activeLink).toHaveClass('font-medium');
  });

  it('неактивный заголовок не имеет подсветки', () => {
    render(<TOC headings={mockHeadings} activeId="installation" />);

    const inactiveLink = screen.getByText('Overview').closest('a');
    expect(inactiveLink).not.toHaveClass('font-medium');
  });

  it('показывает заголовок "На этой странице"', () => {
    render(<TOC headings={mockHeadings} activeId="" />);
    expect(screen.getByText('На этой странице')).toBeInTheDocument();
  });

  it('h3 имеет больший отступ слева (pl-6)', () => {
    render(<TOC headings={mockHeadings} activeId="" />);

    const h2Link = screen.getByText('Overview').closest('a');
    const h3Link = screen.getByText('Quick Start').closest('a');

    expect(h2Link).toHaveClass('pl-3');
    expect(h3Link).toHaveClass('pl-6');
  });
});
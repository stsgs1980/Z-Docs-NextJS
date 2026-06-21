import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchDialog, { SearchButton } from '@/components/docs/search-dialog';
import type { NavSection } from '@/lib/mdx-utils';

const mockNavigation: NavSection[] = [
  {
    title: 'Getting Started',
    order: 100,
    items: [
      { slug: 'intro', title: 'Introduction', order: 1, snippet: 'Learn the basics of the system' },
      { slug: 'quick-start', title: 'Quick Start', order: 2, snippet: 'Get up and running in 5 minutes' },
    ],
  },
  {
    title: 'Advanced',
    order: 200,
    items: [
      { slug: 'api-reference', title: 'API Reference', order: 1, snippet: 'Complete API documentation with examples' },
    ],
  },
];

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  onNavigate: vi.fn(),
  navigation: mockNavigation,
};

describe('SearchDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('не рендерится когда open=false', () => {
    const { container } = render(<SearchDialog {...defaultProps} open={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('показывает все страницы при открытии', () => {
    render(<SearchDialog {...defaultProps} />);
    expect(screen.getByText('Introduction')).toBeInTheDocument();
    expect(screen.getByText('Quick Start')).toBeInTheDocument();
    expect(screen.getByText('API Reference')).toBeInTheDocument();
  });

  it('показывает секцию для каждой страницы', () => {
    render(<SearchDialog {...defaultProps} />);
    const introBtn = screen.getByText('Introduction').closest('button')!;
    expect(within(introBtn).getByText('Getting Started')).toBeInTheDocument();
  });

  it('фильтрует по названию страницы', async () => {
    const user = userEvent.setup();
    render(<SearchDialog {...defaultProps} />);

    const input = screen.getByPlaceholderText('Search documentation...');
    await user.type(input, 'Quick');

    expect(screen.getByText('Quick Start')).toBeInTheDocument();
    expect(screen.queryByText('Introduction')).not.toBeInTheDocument();
    expect(screen.queryByText('API Reference')).not.toBeInTheDocument();
  });

  it('фильтрует по названию секции', async () => {
    const user = userEvent.setup();
    render(<SearchDialog {...defaultProps} />);

    const input = screen.getByPlaceholderText('Search documentation...');
    await user.type(input, 'Advanced');

    expect(screen.getByText('API Reference')).toBeInTheDocument();
    expect(screen.queryByText('Introduction')).not.toBeInTheDocument();
  });

  it('фильтрует по содержимому (snippet)', async () => {
    const user = userEvent.setup();
    render(<SearchDialog {...defaultProps} />);

    const input = screen.getByPlaceholderText('Search documentation...');
    await user.type(input, 'basics');

    expect(screen.getByText('Introduction')).toBeInTheDocument();
    expect(screen.queryByText('Quick Start')).not.toBeInTheDocument();
  });

  it('фильтрует по slug', async () => {
    const user = userEvent.setup();
    render(<SearchDialog {...defaultProps} />);

    const input = screen.getByPlaceholderText('Search documentation...');
    await user.type(input, 'api-ref');

    expect(screen.getByText('API Reference')).toBeInTheDocument();
    expect(screen.queryByText('Introduction')).not.toBeInTheDocument();
  });

  it('показывает "Ничего не найдено" при пустом результате', async () => {
    const user = userEvent.setup();
    render(<SearchDialog {...defaultProps} />);

    const input = screen.getByPlaceholderText('Search documentation...');
    await user.type(input, 'zzzzzzzzz');

    expect(screen.getByText('Ничего не найдено')).toBeInTheDocument();
  });

  it('вызывает onNavigate + onClose при клике на результат', async () => {
    const user = userEvent.setup();
    render(<SearchDialog {...defaultProps} />);

    await user.click(screen.getByText('Introduction'));

    expect(defaultProps.onNavigate).toHaveBeenCalledWith('intro');
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('вызывает onClose при клике на оверлей', async () => {
    const user = userEvent.setup();
    render(<SearchDialog {...defaultProps} />);

    const overlay = screen.getByText('Introduction').closest('.fixed')!.querySelector('.bg-black\\/60')!;
    await user.click(overlay);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('вызывает onClose при Escape', async () => {
    const user = userEvent.setup();
    render(<SearchDialog {...defaultProps} />);

    await user.keyboard('{Escape}');

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('навигация стрелками вниз/вверх', async () => {
    const user = userEvent.setup();
    render(<SearchDialog {...defaultProps} />);

    // "Enter" есть в футере всегда + у выделенного элемента = минимум 2
    const enterBefore = screen.getAllByText('Enter');
    expect(enterBefore.length).toBeGreaterThanOrEqual(2);

    await user.keyboard('{ArrowDown}');

    // После ArrowDown количество "Enter" не изменилось (выделение сместилось)
    const enterAfter = screen.getAllByText('Enter');
    expect(enterAfter.length).toBe(enterBefore.length);
  });

  it('Enter вызывает навигацию по выделенному элементу', async () => {
    const user = userEvent.setup();
    render(<SearchDialog {...defaultProps} />);

    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');

    expect(defaultProps.onNavigate).toHaveBeenCalledWith('api-reference');
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('сбрасывает query при закрытии (после таймера 150ms)', async () => {
    const { rerender } = render(<SearchDialog {...defaultProps} />);

    const input = screen.getByPlaceholderText('Search documentation...') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'test' } });
    expect(input.value).toBe('test');

    // Закрываем — компонент ставит setTimeout(150ms) для сброса
    act(() => rerender(<SearchDialog {...defaultProps} open={false} />));

    // Ждём сброса состояния и открываем снова
    await new Promise((r) => setTimeout(r, 200));
    act(() => rerender(<SearchDialog {...defaultProps} open={true} />));

    const newInput = screen.getByPlaceholderText('Search documentation...') as HTMLInputElement;
    expect(newInput.value).toBe('');
  });

  it('регистронезависимый поиск', async () => {
    const user = userEvent.setup();
    render(<SearchDialog {...defaultProps} />);

    const input = screen.getByPlaceholderText('Search documentation...');
    await user.type(input, 'INTRO');

    expect(screen.getByText('Introduction')).toBeInTheDocument();
  });
});

describe('SearchButton', () => {
  it('вызывает onClick при клике', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<SearchButton onClick={onClick} />);

    await user.click(screen.getByText('Search'));
    expect(onClick).toHaveBeenCalled();
  });
});
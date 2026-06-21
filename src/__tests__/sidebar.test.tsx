import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Sidebar from '@/components/docs/sidebar';
import type { NavSection } from '@/lib/mdx-utils';

const mockNavigation: NavSection[] = [
  {
    title: 'Getting Started',
    order: 100,
    items: [
      { slug: 'intro', title: 'Introduction', order: 1 },
      { slug: 'quick-start', title: 'Quick Start', order: 2 },
    ],
  },
  {
    title: 'Advanced',
    order: 200,
    items: [
      { slug: 'api-ref', title: 'API Reference', order: 1 },
    ],
  },
  {
    title: 'Extras',
    order: 300,
    items: [
      { slug: 'faq', title: 'FAQ', order: 1 },
    ],
  },
];

const defaultProps = {
  currentSlug: 'intro',
  navigation: mockNavigation,
  onNavigate: vi.fn(),
  isOpen: false,
  onClose: vi.fn(),
  canEdit: true,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Sidebar — рендеринг', () => {
  it('отображает названия всех секций', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText('Getting Started')).toBeInTheDocument();
    expect(screen.getByText('Advanced')).toBeInTheDocument();
    expect(screen.getByText('Extras')).toBeInTheDocument();
  });

  it('открывает только секцию с текущей страницей', () => {
    render(<Sidebar {...defaultProps} currentSlug="api-ref" />);

    // "Advanced" секция открыта — видны дочерние элементы
    expect(screen.getByText('API Reference')).toBeInTheDocument();

    // "Getting Started" закрыта — дочерних нет
    expect(screen.queryByText('Introduction')).not.toBeInTheDocument();
  });

  it('подсвечивает текущую страницу', () => {
    render(<Sidebar {...defaultProps} currentSlug="quick-start" />);

    const quickStartBtn = screen.getByText('Quick Start').closest('button');
    expect(quickStartBtn).toHaveClass('bg-muted');
    expect(quickStartBtn).toHaveClass('font-medium');
  });

  it('не подсвечивает неактивные страницы', () => {
    render(<Sidebar {...defaultProps} currentSlug="intro" />);

    const quickStartBtn = screen.getByText('Quick Start').closest('button');
    expect(quickStartBtn).toHaveClass('text-muted-foreground');
  });

  it('отображает все элементы открытой секции', () => {
    render(<Sidebar {...defaultProps} />);

    expect(screen.getByText('Introduction')).toBeInTheDocument();
    expect(screen.getByText('Quick Start')).toBeInTheDocument();
  });
});

describe('Sidebar — открытие/закрытие секций', () => {
  it('открывает секцию при клике на заголовок', async () => {
    const user = userEvent.setup();
    render(<Sidebar {...defaultProps} currentSlug="intro" />);

    // "Advanced" закрыта по умолчанию (currentSlug='intro' в другой секции)
    expect(screen.queryByText('API Reference')).not.toBeInTheDocument();

    await user.click(screen.getByText('Advanced'));

    expect(screen.getByText('API Reference')).toBeInTheDocument();
  });

  it('закрывает секцию при повторном клике', async () => {
    const user = userEvent.setup();
    render(<Sidebar {...defaultProps} />);

    // "Getting Started" открыта
    expect(screen.getByText('Introduction')).toBeInTheDocument();

    await user.click(screen.getByText('Getting Started'));

    expect(screen.queryByText('Introduction')).not.toBeInTheDocument();
  });

  it('переключается на секцию новой страницы при изменении currentSlug', () => {
    const { rerender } = render(<Sidebar {...defaultProps} currentSlug="intro" />);

    expect(screen.getByText('Introduction')).toBeInTheDocument();
    expect(screen.queryByText('API Reference')).not.toBeInTheDocument();

    // Навигируемся в другую секцию
    rerender(<Sidebar {...defaultProps} currentSlug="api-ref" />);

    expect(screen.getByText('API Reference')).toBeInTheDocument();
    expect(screen.queryByText('Introduction')).not.toBeInTheDocument();
  });
});

describe('Sidebar — навигация', () => {
  it('вызывает onNavigate + onClose при клике на страницу', async () => {
    const user = userEvent.setup();
    render(<Sidebar {...defaultProps} />);

    await user.click(screen.getByText('Quick Start'));

    expect(defaultProps.onNavigate).toHaveBeenCalledWith('quick-start');
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});

describe('Sidebar — canEdit', () => {
  it('скрывает кнопки редактирования когда canEdit=false', () => {
    render(<Sidebar {...defaultProps} canEdit={false} />);

    // Кнопка "Новая секция" не видна
    expect(screen.queryByText('Новая секция')).not.toBeInTheDocument();
  });

  it('показывает кнопку "Новая секция" когда canEdit=true', () => {
    render(<Sidebar {...defaultProps} canEdit={true} />);

    expect(screen.getByText('Новая секция')).toBeInTheDocument();
  });

  it('скрывает иконки перемещения/плюса/удаления когда canEdit=false', () => {
    const { container } = render(<Sidebar {...defaultProps} canEdit={false} />);

    // Open the active section so items are rendered
    // (intro is in "Getting Started" which is already open)
    // In canEdit=false, no ArrowUp/ArrowDown/Plus/Trash buttons should be rendered
    // Check that no title="Секцию выше" buttons exist
    const moveUpButtons = container.querySelectorAll('[title="Секцию выше"]');
    expect(moveUpButtons).toHaveLength(0);

    const addButtons = container.querySelectorAll('[title*="Добавить"]');
    expect(addButtons).toHaveLength(0);
  });
});

describe('Sidebar — mobile drawer', () => {
  it('не показывает мобильное меню когда isOpen=false', () => {
    const { container } = render(<Sidebar {...defaultProps} isOpen={false} />);

    // Mobile drawer has class "xl:hidden" and "fixed"
    const mobileDrawers = container.querySelectorAll('aside.fixed');
    // Only desktop aside is rendered (it's not fixed)
    expect(mobileDrawers).toHaveLength(0);
  });

  it('показывает мобильное меню когда isOpen=true', () => {
    const { container } = render(<Sidebar {...defaultProps} isOpen={true} />);

    const mobileDrawers = container.querySelectorAll('aside.fixed');
    expect(mobileDrawers.length).toBeGreaterThanOrEqual(1);

    // Should show "StsDev Wiki" text in mobile header
    expect(screen.getByText('StsDev Wiki')).toBeInTheDocument();
  });

  it('вызывает onClose при клике на оверлей', async () => {
    const user = userEvent.setup();
    render(<Sidebar {...defaultProps} isOpen={true} />);

    const overlay = document.querySelector('.fixed.inset-0.z-40');
    expect(overlay).toBeTruthy();
    await user.click(overlay!);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});

describe('Sidebar — delete confirmation', () => {
  it('показывает диалог подтверждения удаления при клике на корзину', async () => {
    const user = userEvent.setup();
    render(<Sidebar {...defaultProps} />);

    // First we need to hover over the item group to reveal the delete button
    // The delete button has title like 'Удалить "Introduction"'
    const introItem = screen.getByText('Introduction').closest('.group\\/item');
    expect(introItem).toBeTruthy();

    // Find the delete button within the group
    const deleteBtn = within(introItem!).getByTitle('Удалить "Introduction"');
    await user.click(deleteBtn);

    // Dialog should appear
    expect(screen.getByText('Удалить страницу?')).toBeInTheDocument();
    // The dialog text contains the page name (but getByText would match the sidebar item too, so use getAllByText)
    const matches = screen.getAllByText(/Introduction/);
    expect(matches.length).toBeGreaterThanOrEqual(2); // sidebar item + dialog text
  });

  it('закрывает диалог при клике "Отмена"', async () => {
    const user = userEvent.setup();
    render(<Sidebar {...defaultProps} />);

    // Open delete dialog
    const introItem = screen.getByText('Introduction').closest('.group\\/item')!;
    const deleteBtn = within(introItem).getByTitle('Удалить "Introduction"');
    await user.click(deleteBtn);

    expect(screen.getByText('Удалить страницу?')).toBeInTheDocument();

    // Click cancel
    await user.click(screen.getByText('Отмена'));

    expect(screen.queryByText('Удалить страницу?')).not.toBeInTheDocument();
  });
});

describe('Sidebar — new section dialog', () => {
  it('открывает диалог "Новая секция" при клике на кнопку', async () => {
    const user = userEvent.setup();
    render(<Sidebar {...defaultProps} />);

    await user.click(screen.getByText('Новая секция'));

    expect(screen.getByText('Новая секция', { selector: 'h3' })).toBeInTheDocument();
  });

  it('кнопка "Создать" disabled когда имя пустое', async () => {
    const user = userEvent.setup();
    render(<Sidebar {...defaultProps} />);

    await user.click(screen.getByText('Новая секция'));

    const createBtn = screen.getByText('Создать');
    expect(createBtn).toBeDisabled();
  });

  it('закрывает диалог при клике "Отмена"', async () => {
    const user = userEvent.setup();
    render(<Sidebar {...defaultProps} />);

    await user.click(screen.getByText('Новая секция'));
    expect(screen.getByText('Новая секция', { selector: 'h3' })).toBeInTheDocument();

    // Click the "Отмена" in the new section dialog (there are multiple "Отмена" buttons)
    const cancelButtons = screen.getAllByText('Отмена');
    // The new section dialog cancel is the last one (or we can target by the dialog context)
    await user.click(cancelButtons[cancelButtons.length - 1]);

    expect(screen.queryByText('Новая секция', { selector: 'h3' })).not.toBeInTheDocument();
  });

  it('показывает radio для позиции (end, before, after)', async () => {
    const user = userEvent.setup();
    render(<Sidebar {...defaultProps} />);

    await user.click(screen.getByText('Новая секция'));

    expect(screen.getByText('В конец')).toBeInTheDocument();
    expect(screen.getByText('Перед секцией')).toBeInTheDocument();
    expect(screen.getByText('После секции')).toBeInTheDocument();
  });
});
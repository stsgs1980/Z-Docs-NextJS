import { describe, it, expect } from 'vitest';
import { reducer } from '@/hooks/use-toast';
import type { State } from '@/hooks/use-toast';

const emptyState: State = { toasts: [] };

function makeState(overrides?: Partial<State>): State {
  return {
    toasts: [],
    ...overrides,
  };
}

describe('toast reducer', () => {
  describe('ADD_TOAST', () => {
    it('добавляет toast в пустой state', () => {
      const next = reducer(emptyState, {
        type: 'ADD_TOAST',
        toast: { id: '1', open: true, title: 'Hello' },
      });
      expect(next.toasts).toHaveLength(1);
      expect(next.toasts[0].title).toBe('Hello');
    });

    it('добавляет новый toast в начало списка', () => {
      const state = makeState({
        toasts: [{ id: '1', open: true, title: 'First' }],
      });
      const next = reducer(state, {
        type: 'ADD_TOAST',
        toast: { id: '2', open: true, title: 'Second' },
      });
      // TOAST_LIMIT = 1, поэтому новый toast замещает старый
      expect(next.toasts).toHaveLength(1);
      expect(next.toasts[0].title).toBe('Second');
    });

    it('лимитирует количество toast до TOAST_LIMIT (1)', () => {
      const state = makeState({
        toasts: [{ id: '1', open: true, title: 'Old' }],
      });
      const next = reducer(state, {
        type: 'ADD_TOAST',
        toast: { id: '2', open: true, title: 'New' },
      });
      expect(next.toasts).toHaveLength(1);
      expect(next.toasts[0].title).toBe('New');
    });
  });

  describe('UPDATE_TOAST', () => {
    it('обновляет существующий toast по id', () => {
      const state = makeState({
        toasts: [
          { id: '1', open: true, title: 'Old Title' },
          { id: '2', open: true, title: 'Another' },
        ],
      });
      const next = reducer(state, {
        type: 'UPDATE_TOAST',
        toast: { id: '1', title: 'New Title' },
      });
      expect(next.toasts[0].title).toBe('New Title');
      expect(next.toasts[1].title).toBe('Another');
    });

    it('не трогает остальные toast', () => {
      const state = makeState({
        toasts: [{ id: '1', open: true, title: 'A' }],
      });
      const next = reducer(state, {
        type: 'UPDATE_TOAST',
        toast: { id: 'nonexistent', title: 'X' },
      });
      expect(next.toasts[0].title).toBe('A');
    });
  });

  describe('DISMISS_TOAST', () => {
    it('ставит open=false для конкретного toast', () => {
      const state = makeState({
        toasts: [
          { id: '1', open: true, title: 'A' },
          { id: '2', open: true, title: 'B' },
        ],
      });
      const next = reducer(state, {
        type: 'DISMISS_TOAST',
        toastId: '1',
      });
      expect(next.toasts[0].open).toBe(false);
      expect(next.toasts[1].open).toBe(true);
    });

    it('закрывает все toast когда toastId не указан', () => {
      const state = makeState({
        toasts: [
          { id: '1', open: true, title: 'A' },
          { id: '2', open: true, title: 'B' },
        ],
      });
      const next = reducer(state, { type: 'DISMISS_TOAST' });
      expect(next.toasts.every((t) => t.open === false)).toBe(true);
    });
  });

  describe('REMOVE_TOAST', () => {
    it('удаляет конкретный toast по id', () => {
      const state = makeState({
        toasts: [
          { id: '1', open: true, title: 'A' },
          { id: '2', open: true, title: 'B' },
        ],
      });
      const next = reducer(state, {
        type: 'REMOVE_TOAST',
        toastId: '1',
      });
      expect(next.toasts).toHaveLength(1);
      expect(next.toasts[0].id).toBe('2');
    });

    it('удаляет все toast когда toastId не указан', () => {
      const state = makeState({
        toasts: [
          { id: '1', open: true, title: 'A' },
          { id: '2', open: true, title: 'B' },
        ],
      });
      const next = reducer(state, { type: 'REMOVE_TOAST' });
      expect(next.toasts).toHaveLength(0);
    });
  });

  it('не мутирует исходный state', () => {
    const state = makeState({
      toasts: [{ id: '1', open: true, title: 'A' }],
    });
    const next = reducer(state, {
      type: 'ADD_TOAST',
      toast: { id: '2', open: true, title: 'B' },
    });
    expect(state.toasts).toHaveLength(1);
    expect(next.toasts).toHaveLength(1);
    expect(state.toasts[0].title).toBe('A');
  });
});
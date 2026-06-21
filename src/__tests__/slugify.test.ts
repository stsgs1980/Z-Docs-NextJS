import { describe, it, expect } from 'vitest';
import { slugify, slugifySectionName } from '@/lib/slugify';

describe('slugify', () => {
  it('преобразует латиницу в нижний регистр с дефисами', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('удаляет спецсимволы', () => {
    expect(slugify('API Reference (v2)')).toBe('api-reference-v2');
  });

  it('удаляет ведущие и замыкающие дефисы', () => {
    expect(slugify('--hello--world--')).toBe('hello-world');
  });

  it('схлопывает несколько дефисов в один', () => {
    expect(slugify('foo  bar---baz')).toBe('foo-bar-baz');
  });

  it('транслитерирует кириллицу', () => {
    expect(slugify('Привет Мир')).toBe('privet-mir');
  });

  it('транслитерирует сложные кириллические символы', () => {
    expect(slugify('Щука Чашка Шар')).toBe('shchuka-chashka-shar');
  });

  it('транслитерирует ё и Й', () => {
    expect(slugify('Ёжик Йод')).toBe('yozhik-yod');
  });

  it('удаляет мягкий и твёрдый знак', () => {
    expect(slugify('подъезд дверь')).toBe('podezd-dver');
  });

  it('обрабатывает смешанный ввод (кириллица + латиница + цифры)', () => {
    expect(slugify('3A Studio 2024')).toBe('3a-studio-2024');
  });

  it('возвращает пустую строку для строки без алфавитных символов', () => {
    expect(slugify('---')).toBe('');
  });

  it('оставляет цифры и дефисы', () => {
    expect(slugify('v2-0-1')).toBe('v2-0-1');
  });
});

describe('slugifySectionName', () => {
  it('добавляет суффикс -index', () => {
    expect(slugifySectionName('My Section')).toBe('my-section-index');
  });

  it('транслитерирует кириллицу и добавляет суффикс', () => {
    // 'х' транслитерируется как 'kh' в CYRILLIC_MAP
    expect(slugifySectionName('Архитектура')).toBe('arkhitektura-index');
  });
});
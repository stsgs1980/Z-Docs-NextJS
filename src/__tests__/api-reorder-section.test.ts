import { describe, it, expect, vi, beforeEach } from 'vitest';
import path from 'path';

vi.mock('child_process', () => ({ default: { execSync: vi.fn() }, execSync: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

const memFS = new Map<string, string>();

vi.mock('fs', () => ({
  default: {
    readdirSync: (dir: string) => {
      const prefix = dir.endsWith('/') ? dir : dir + '/';
      return [...memFS.keys()]
        .filter((k) => k.startsWith(prefix))
        .map((k) => k.slice(prefix.length));
    },
    readFileSync: (p: string) => {
      const content = memFS.get(p);
      if (content === undefined) throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
      return content;
    },
    writeFileSync: (p: string, data: string) => { memFS.set(p, data); },
    existsSync: (p: string) => memFS.has(p),
    unlinkSync: (p: string) => { memFS.delete(p); },
  },
  existsSync: (p: string) => memFS.has(p),
}));

import { revalidatePath } from 'next/cache';
import matter from 'gray-matter';
import { PUT as reorderSections } from '@/app/api/docs/reorder-section/route';

const CONTENT_DIR = path.join(process.cwd(), 'docs');

function putMdx(slug: string, frontmatter: Record<string, unknown>, body: string) {
  const fm = Object.entries(frontmatter)
    .map(([k, v]) => typeof v === 'string' ? `${k}: "${v}"` : `${k}: ${v}`)
    .join('\n');
  memFS.set(`${CONTENT_DIR}/${slug}.mdx`, `---\n${fm}\n---\n\n${body}`);
}

function getFrontmatter(slug: string) {
  const raw = memFS.get(`${CONTENT_DIR}/${slug}.mdx`);
  return matter(raw!).data;
}

beforeEach(() => {
  memFS.clear();
  vi.clearAllMocks();
});

describe('PUT /api/docs/reorder-section', () => {
  it('обновляет sectionOrder у файлов в указанных секциях', async () => {
    putMdx('a1', { title: 'A1', section: 'Alpha', sectionOrder: 100, order: 1, slug: 'a1' }, 'body');
    putMdx('a2', { title: 'A2', section: 'Alpha', sectionOrder: 100, order: 2, slug: 'a2' }, 'body');
    putMdx('b1', { title: 'B1', section: 'Beta', sectionOrder: 200, order: 1, slug: 'b1' }, 'body');

    const res = await reorderSections(new Request('http://localhost', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sections: { Alpha: 500, Beta: 100 } }),
    }));

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.updatedSections).toContain('Alpha');
    expect(data.updatedSections).toContain('Beta');

    expect(getFrontmatter('a1').sectionOrder).toBe(500);
    expect(getFrontmatter('a2').sectionOrder).toBe(500);
    expect(getFrontmatter('b1').sectionOrder).toBe(100);
  });

  it('возвращает 400 если sections не передан', async () => {
    const res = await reorderSections(new Request('http://localhost', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    }));
    expect(res.status).toBe(400);
  });

  it('не трогает файлы из секций не указанных в sections', async () => {
    putMdx('x', { title: 'X', section: 'Gamma', sectionOrder: 999, order: 1, slug: 'x' }, 'body');

    await reorderSections(new Request('http://localhost', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sections: { Alpha: 100 } }),
    }));

    expect(getFrontmatter('x').sectionOrder).toBe(999);
  });

  it('вызывает revalidatePath("/docs")', async () => {
    await reorderSections(new Request('http://localhost', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sections: { A: 1 } }),
    }));

    expect(revalidatePath).toHaveBeenCalledWith('/docs');
  });

  it('возвращает пустой updatedSections если ни один файл не совпал', async () => {
    const res = await reorderSections(new Request('http://localhost', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sections: { NonExistent: 1 } }),
    }));

    const data = await res.json();
    expect(data.updatedSections).toEqual([]);
  });
});
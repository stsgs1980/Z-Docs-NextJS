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
import { GET as getDoc, PUT as updateDoc, DELETE as deleteDoc } from '@/app/api/docs/[slug]/route';

const CONTENT_DIR = path.join(process.cwd(), 'docs');

function putMdx(slug: string, frontmatter: Record<string, unknown>, body: string) {
  const fm = Object.entries(frontmatter)
    .map(([k, v]) => typeof v === 'string' ? `${k}: "${v}"` : `${k}: ${v}`)
    .join('\n');
  memFS.set(`${CONTENT_DIR}/${slug}.mdx`, `---\n${fm}\n---\n\n${body}`);
}

function jsonRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeParams(slug: string) {
  return Promise.resolve({ slug });
}

beforeEach(() => {
  memFS.clear();
  vi.clearAllMocks();
});

describe('GET /api/docs/[slug]', () => {
  it('возвращает метаданные и контент', async () => {
    putMdx('test-page', { title: 'Test Page', section: 'Demo' }, '# Hello\n\nBody text');

    const res = await getDoc(new Request('http://localhost'), { params: makeParams('test-page') });
    const data = await res.json();

    expect(data.meta.title).toBe('Test Page');
    expect(data.content).toContain('# Hello');
  });

  it('возвращает 404 для несуществующего slug', async () => {
    const res = await getDoc(new Request('http://localhost'), { params: makeParams('nonexistent') });
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/docs/[slug]', () => {
  it('обновляет существующий файл', async () => {
    putMdx('editable', { title: 'Old Title', section: 'S', order: 1, slug: 'editable' }, 'Old body');

    const res = await updateDoc(jsonRequest({
      title: 'New Title',
      section: 'Updated',
      order: 5,
      slug: 'editable',
      content: '# New Content',
    }), { params: makeParams('editable') });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);

    const raw = memFS.get(`${CONTENT_DIR}/editable.mdx`);
    expect(raw).toContain('title: "New Title"');
    expect(raw).toContain('# New Content');
  });

  it('возвращает 400 если нет title', async () => {
    putMdx('ed2', { title: 'T', slug: 'ed2' }, 'body');

    const res = await updateDoc(jsonRequest({ content: 'C', slug: 'ed2' }), {
      params: makeParams('ed2'),
    });
    expect(res.status).toBe(400);
  });

  it('возвращает 400 если нет content', async () => {
    putMdx('ed3', { title: 'T', slug: 'ed3' }, 'body');

    const res = await updateDoc(jsonRequest({ title: 'T', slug: 'ed3' }), {
      params: makeParams('ed3'),
    });
    expect(res.status).toBe(400);
  });

  it('возвращает 404 для несуществующего файла', async () => {
    const res = await updateDoc(jsonRequest({
      title: 'X',
      content: 'Y',
      slug: 'nope',
    }), { params: makeParams('nope') });
    expect(res.status).toBe(404);
  });

  it('вызывает revalidatePath для страницы и /docs', async () => {
    putMdx('rv', { title: 'Rv', slug: 'rv' }, 'body');

    await updateDoc(jsonRequest({
      title: 'Rv',
      section: 'S',
      content: 'updated',
      slug: 'rv',
    }), { params: makeParams('rv') });

    expect(revalidatePath).toHaveBeenCalledWith('/docs/rv');
    expect(revalidatePath).toHaveBeenCalledWith('/docs');
  });
});

describe('DELETE /api/docs/[slug]', () => {
  it('удаляет существующий файл', async () => {
    putMdx('del-me', { title: 'Delete Me', slug: 'del-me' }, '# Bye');

    const res = await deleteDoc(new Request('http://localhost'), {
      params: makeParams('del-me'),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);

    expect(memFS.has(`${CONTENT_DIR}/del-me.mdx`)).toBe(false);
  });

  it('возвращает 404 для несуществующего файла', async () => {
    const res = await deleteDoc(new Request('http://localhost'), {
      params: makeParams('ghost'),
    });
    expect(res.status).toBe(404);
  });

  it('вызывает revalidatePath("/docs")', async () => {
    putMdx('rv-del', { title: 'Rv Del', slug: 'rv-del' }, 'body');

    await deleteDoc(new Request('http://localhost'), {
      params: makeParams('rv-del'),
    });

    expect(revalidatePath).toHaveBeenCalledWith('/docs');
  });
});
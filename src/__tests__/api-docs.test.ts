import { describe, it, expect, vi, beforeEach } from 'vitest';
import path from 'path';

// ── Module-level mocks (hoisted automatically by vitest) ──────────
vi.mock('child_process', () => ({ default: { execSync: vi.fn() }, execSync: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

// Shared in-memory FS
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

// ── Import mocked modules & route handlers ─────────────────────────
import { revalidatePath } from 'next/cache';
import { GET, POST } from '@/app/api/docs/route';

const CONTENT_DIR = path.join(process.cwd(), 'src', 'content', 'docs');

function putMdx(slug: string, frontmatter: Record<string, unknown>, body: string) {
  const fm = Object.entries(frontmatter)
    .map(([k, v]) => typeof v === 'string' ? `${k}: "${v}"` : `${k}: ${v}`)
    .join('\n');
  memFS.set(`${CONTENT_DIR}/${slug}.mdx`, `---\n${fm}\n---\n\n${body}`);
}

function jsonRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost/api/docs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  memFS.clear();
  vi.clearAllMocks();
});

// ── GET /api/docs ───────────────────────────────────────────────────
describe('GET /api/docs', () => {
  it('возвращает пустой список при отсутствии файлов', async () => {
    const res = await GET();
    const data = await res.json();
    expect(data.docs).toEqual([]);
  });

  it('возвращает метаданные всех .mdx файлов', async () => {
    putMdx('intro', { title: 'Intro', section: 'Getting Started', order: 1 }, '# Intro');
    putMdx('api-ref', { title: 'API Reference', section: 'Advanced', order: 2 }, '# API');

    const res = await GET();
    const data = await res.json();

    expect(data.docs).toHaveLength(2);
    expect(data.docs[0]).toMatchObject({ slug: 'intro', title: 'Intro', section: 'Getting Started' });
    expect(data.docs[1]).toMatchObject({ slug: 'api-ref', title: 'API Reference' });
  });

  it('использует имя файла как title если нет frontmatter', async () => {
    memFS.set(`${CONTENT_DIR}/no-fm.mdx`, '# No Frontmatter');

    const res = await GET();
    const data = await res.json();
    expect(data.docs[0].title).toBe('no-fm.mdx');
    expect(data.docs[0].section).toBe('Uncategorized');
  });
});

// ── POST /api/docs ──────────────────────────────────────────────────
describe('POST /api/docs', () => {
  it('создаёт новый .mdx файл с корректным frontmatter', async () => {
    const res = await POST(jsonRequest({
      title: 'New Page',
      slug: 'new-page',
      content: '# Hello World\n\nSome content',
      section: 'Testing',
      order: 5,
    }));

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.slug).toBe('new-page');

    const raw = memFS.get(`${CONTENT_DIR}/new-page.mdx`);
    expect(raw).toContain('title: "New Page"');
    expect(raw).toContain('section: "Testing"');
    expect(raw).toContain('order: 5');
    expect(raw).toContain('slug: "new-page"');
    expect(raw).toContain('# Hello World');
  });

  it('возвращает 400 если нет title', async () => {
    const res = await POST(jsonRequest({ slug: 'x', content: 'y' }));
    expect(res.status).toBe(400);
  });

  it('возвращает 400 если нет content', async () => {
    const res = await POST(jsonRequest({ title: 'T', slug: 'x' }));
    expect(res.status).toBe(400);
  });

  it('возвращает 400 если нет slug', async () => {
    const res = await POST(jsonRequest({ title: 'T', content: 'C' }));
    expect(res.status).toBe(400);
  });

  it('возвращает 409 при дублировании slug', async () => {
    putMdx('dup', { title: 'Dup' }, '# Dup');

    const res = await POST(jsonRequest({
      title: 'Another',
      slug: 'dup',
      content: 'content',
    }));
    expect(res.status).toBe(409);
  });

  it('санитизирует slug', async () => {
    const res = await POST(jsonRequest({
      title: 'Test',
      slug: 'My New---Page!!',
      content: 'C',
    }));
    const data = await res.json();
    expect(data.slug).toBe('my-new-page');
  });

  it('использует "Uncategorized" как секцию по умолчанию', async () => {
    const res = await POST(jsonRequest({
      title: 'Test',
      slug: 'no-section',
      content: 'C',
    }));
    expect(res.status).toBe(201);

    const raw = memFS.get(`${CONTENT_DIR}/no-section.mdx`);
    expect(raw).toContain('section: "Uncategorized"');
  });

  it('вызывает revalidatePath("/docs")', async () => {
    await POST(jsonRequest({
      title: 'Test',
      slug: 'reval',
      content: 'C',
    }));
    expect(revalidatePath).toHaveBeenCalledWith('/docs');
  });

  it('экранирует кавычки в title и section', async () => {
    const res = await POST(jsonRequest({
      title: 'He said "hello"',
      slug: 'quotes',
      content: 'C',
      section: 'A "quoted" section',
    }));
    expect(res.status).toBe(201);

    const raw = memFS.get(`${CONTENT_DIR}/quotes.mdx`);
    expect(raw).toContain('title: "He said \\"hello\\""');
    expect(raw).toContain('section: "A \\"quoted\\" section"');
  });
});
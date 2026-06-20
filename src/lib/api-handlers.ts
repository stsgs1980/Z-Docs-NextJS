/**
 * API handler functions for docs CRUD operations.
 * Separated from route files to allow conditional loading (no fs in static builds).
 */
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { execSync } from 'child_process';
import { revalidatePath } from 'next/cache';

const CONTENT_DIR = path.join(process.cwd(), 'src', 'content', 'docs');

function buildMdxFile(data: {
  title: string;
  section: string;
  order: number;
  slug: string;
  content: string;
}): string {
  return `---
title: "${data.title.replace(/"/g, '\\"')}"
section: "${data.section.replace(/"/g, '\\"')}"
order: ${data.order}
slug: "${data.slug}"
---

${data.content}`;
}

function gitCommit(filePath: string, message: string): void {
  try {
    execSync(`git add "${filePath}"`, { cwd: process.cwd(), stdio: 'pipe' });
    execSync(`git commit -m "${message.replace(/"/g, '\\"')}"`, {
      cwd: process.cwd(),
      stdio: 'pipe',
    });
    try {
      execSync('git push', { cwd: process.cwd(), stdio: 'pipe', timeout: 10000 });
    } catch {
      // Push failed silently
    }
  } catch {
    // Git not available or no changes
  }
}

// ---- List all docs ----
export async function listDocs() {
  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.mdx'));

  const docs = files.map((file) => {
    const fileContent = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf-8');
    const { data } = matter(fileContent);
    return {
      slug: file.replace(/\.mdx$/, ''),
      title: data.title || file,
      section: data.section || 'Uncategorized',
      order: data.order ?? 0,
    };
  });

  return NextResponse.json({ docs });
}

// ---- Create a new doc ----
export async function createDoc(request: NextRequest) {
  const body = await request.json();

  if (!body.title || !body.content || !body.slug) {
    return NextResponse.json(
      { error: 'Title, slug, and content are required' },
      { status: 400 }
    );
  }

  const slug = body.slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  if (!slug) {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
  }

  const filePath = path.join(CONTENT_DIR, `${slug}.mdx`);

  if (fs.existsSync(filePath)) {
    return NextResponse.json(
      { error: `Page "${slug}" already exists` },
      { status: 409 }
    );
  }

  const mdxContent = buildMdxFile({
    title: body.title,
    section: body.section || 'Uncategorized',
    order: body.order ?? 0,
    slug,
    content: body.content,
  });

  fs.writeFileSync(filePath, mdxContent, 'utf-8');

  const commitMsg = body.commitMessage || `docs: create ${slug}`;
  gitCommit(filePath, commitMsg);

  revalidatePath('/docs');

  return NextResponse.json({ success: true, slug }, { status: 201 });
}

// ---- Get a single doc ----
export async function getDoc(params: Promise<{ slug: string }>) {
  const { slug } = await params;
  const filePath = path.join(CONTENT_DIR, `${slug}.mdx`);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'Page not found' }, { status: 404 });
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(fileContent);

  return NextResponse.json({
    meta: data,
    content,
  });
}

// ---- Update a doc ----
export async function updateDoc(
  request: NextRequest,
  params: Promise<{ slug: string }>
) {
  const { slug } = await params;
  const body = await request.json();

  if (!body.title || !body.content) {
    return NextResponse.json(
      { error: 'Title and content are required' },
      { status: 400 }
    );
  }

  const filePath = path.join(CONTENT_DIR, `${slug}.mdx`);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'Page not found' }, { status: 404 });
  }

  const mdxContent = buildMdxFile(body);
  fs.writeFileSync(filePath, mdxContent, 'utf-8');

  const commitMsg = body.commitMessage || `docs: update ${slug}`;
  gitCommit(filePath, commitMsg);

  revalidatePath(`/docs/${slug}`);
  revalidatePath('/docs');

  return NextResponse.json({ success: true, slug });
}

// ---- Delete a doc ----
export async function deleteDoc(params: Promise<{ slug: string }>) {
  const { slug } = await params;
  const filePath = path.join(CONTENT_DIR, `${slug}.mdx`);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'Page not found' }, { status: 404 });
  }

  fs.unlinkSync(filePath);

  try {
    execSync(`git add "${filePath}"`, { cwd: process.cwd(), stdio: 'pipe' });
    execSync(`git commit -m "docs: delete ${slug}"`, {
      cwd: process.cwd(),
      stdio: 'pipe',
    });
    try {
      execSync('git push', { cwd: process.cwd(), stdio: 'pipe', timeout: 10000 });
    } catch {}
  } catch {}

  revalidatePath('/docs');

  return NextResponse.json({ success: true });
}

// ---- Upload files ----
export async function uploadDocs(request: NextRequest) {
  const formData = await request.formData();
  const files = formData.getAll('files') as File[];
  const section = (formData.get('section') as string) || 'Uploaded';

  if (!files || files.length === 0) {
    return NextResponse.json({ error: 'No files provided' }, { status: 400 });
  }

  const results: { slug: string; title: string; status: string }[] = [];

  for (const file of files) {
    const fileName = file.name;
    const slug = fileName.replace(/\.(mdx|md)$/, '').toLowerCase();

    if (!fileName.endsWith('.md') && !fileName.endsWith('.mdx')) {
      results.push({ slug, title: fileName, status: 'skipped (not .md/.mdx)' });
      continue;
    }

    const text = await file.text();
    const filePath = path.join(CONTENT_DIR, `${slug}.mdx`);

    if (text.startsWith('---')) {
      fs.writeFileSync(filePath, text, 'utf-8');
    } else {
      const title = slug
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

      const mdxContent = `---
title: "${title}"
section: "${section}"
order: 0
slug: "${slug}"
---

${text}`;

      fs.writeFileSync(filePath, mdxContent, 'utf-8');
    }

    gitCommit(filePath, `docs: upload ${slug}`);

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const { data } = matter(fileContent);

    results.push({
      slug,
      title: data.title || slug,
      status: 'created',
    });
  }

  revalidatePath('/docs');

  return NextResponse.json({ success: true, results });
}

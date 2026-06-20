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
    } catch {}
  } catch {}
}

/**
 * GET /api/docs — list all docs with metadata
 */
export async function GET() {
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

/**
 * POST /api/docs — create a new doc page
 */
export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.title || !body.content || !body.slug) {
    return NextResponse.json(
      { error: 'Title, slug, and content are required' },
      { status: 400 }
    );
  }

  // Sanitize slug
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

  // Git commit
  const commitMsg = body.commitMessage || `docs: create ${slug}`;
  gitCommit(filePath, commitMsg);

  // Revalidate
  revalidatePath('/docs');

  return NextResponse.json({ success: true, slug }, { status: 201 });
}

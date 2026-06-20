import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { execSync } from 'child_process';
import { revalidatePath } from 'next/cache';

const CONTENT_DIR = path.join(process.cwd(), 'src', 'content', 'docs');

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
 * POST /api/docs/upload — upload .mdx or .md files
 * Accepts multipart/form-data with one or more files
 */
export async function POST(request: NextRequest) {
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

    // Check if file already has frontmatter
    if (text.startsWith('---')) {
      // Has frontmatter — write as-is (converting .md to .mdx)
      fs.writeFileSync(filePath, text, 'utf-8');
    } else {
      // No frontmatter — generate it
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

    // Git commit
    gitCommit(filePath, `docs: upload ${slug}`);

    // Read metadata for response
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

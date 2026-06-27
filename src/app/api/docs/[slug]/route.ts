import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { execSync } from "child_process";
import { revalidatePath } from "next/cache";
import { resolveDocPath } from "@/lib/mdx-utils";
import { bumpVersion } from "@/lib/version";

const CONTENT_DIR = path.join(process.cwd(), "docs");

interface DocBody {
  title: string;
  section: string;
  sectionOrder?: number;
  order: number;
  slug: string;
  content: string;
  commitMessage?: string;
}

function buildMdxFile(data: Omit<DocBody, "commitMessage">): string {
  const sectionOrderLine =
    data.sectionOrder != null ? `\nsectionOrder: ${data.sectionOrder}` : "";
  return `---
title: "${data.title.replace(/"/g, '\\"')}"
section: "${data.section.replace(/"/g, '\\"')}"${sectionOrderLine}
order: ${data.order}
slug: "${data.slug}"
---

${data.content}`;
}

function gitCommit(filePath: string, message: string): void {
  try {
    execSync(`git add "${filePath}"`, { cwd: process.cwd(), stdio: "pipe" });
    execSync(`git commit -m "${message.replace(/"/g, '\\"')}"`, {
      cwd: process.cwd(),
      stdio: "pipe",
    });
    // Try to push, but don't fail if it doesn't work
    try {
      execSync("git push", {
        cwd: process.cwd(),
        stdio: "pipe",
        timeout: 10000,
      });
    } catch {
      // Push failed silently — commit is local
    }
  } catch {
    // Git not available or no changes — that's OK
  }
}

/**
 * GET /api/docs/[slug] — read a doc page
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const filePath = resolveDocPath(slug);

  if (!filePath) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(fileContent);

  return NextResponse.json({
    meta: data,
    content,
  });
}

/**
 * PUT /api/docs/[slug] — update an existing doc page
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const body: DocBody = await request.json();

  if (!body.title || !body.content) {
    return NextResponse.json(
      { error: "Title and content are required" },
      { status: 400 },
    );
  }

  const filePath = resolveDocPath(slug);

  if (!filePath) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  const mdxContent = buildMdxFile(body);
  fs.writeFileSync(filePath, mdxContent, "utf-8");

  // Bump version
  const ver = bumpVersion();

  // Git commit
  const commitMsg =
    body.commitMessage || `docs: update ${slug} (v${ver.version})`;
  gitCommit(filePath, commitMsg);

  // Revalidate cache
  revalidatePath(`/docs/${slug}`);
  revalidatePath("/docs");

  return NextResponse.json({ success: true, slug });
}

/**
 * DELETE /api/docs/[slug] — delete a doc page
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const filePath = resolveDocPath(slug);

  if (!filePath) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  fs.unlinkSync(filePath);

  // Bump version
  const ver = bumpVersion();

  // Git commit
  try {
    execSync(`git add "${filePath}"`, { cwd: process.cwd(), stdio: "pipe" });
    execSync(`git commit -m "docs: delete ${slug} (v${ver.version})"`, {
      cwd: process.cwd(),
      stdio: "pipe",
    });
    try {
      execSync("git push", {
        cwd: process.cwd(),
        stdio: "pipe",
        timeout: 10000,
      });
    } catch {}
  } catch {}

  revalidatePath("/docs");

  return NextResponse.json({ success: true });
}

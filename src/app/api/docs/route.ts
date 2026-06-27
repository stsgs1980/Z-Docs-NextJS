import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { execSync } from "child_process";
import { revalidatePath } from "next/cache";
import { resolveDocPath } from "@/lib/mdx-utils";

import { bumpVersion } from "@/lib/version";

function buildMdxFile(data: {
  title: string;
  section: string;
  sectionOrder?: number;
  order: number;
  slug: string;
  content: string;
}): string {
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
    try {
      execSync("git push", {
        cwd: process.cwd(),
        stdio: "pipe",
        timeout: 10000,
      });
    } catch {}
  } catch {}
}

/**
 * GET /api/docs — list all docs with metadata
 */
export async function GET() {
  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".md") || f.endsWith(".mdx"));
  const seen = new Set<string>();

  const docs = files.map((file) => {
    const base = file.replace(/\.(md|mdx)$/, "");
    if (seen.has(base)) return null;
    seen.add(base);
    const fileContent = fs.readFileSync(path.join(CONTENT_DIR, file), "utf-8");
    const { data } = matter(fileContent);
    return {
      slug: base,
      title: data.title || file,
      section: data.section || "Uncategorized",
      sectionOrder: data.sectionOrder ?? data["section-order"] ?? 0,
      order: data.order ?? 0,
    };
  }).filter(Boolean);

  return NextResponse.json({ docs });
}

/**
 * POST /api/docs — create a new doc page
 */
export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.title || !body.content || !body.slug) {
    return NextResponse.json(
      { error: "Title, slug, and content are required" },
      { status: 400 },
    );
  }

  // Sanitize slug
  const slug = body.slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (!slug) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  const filePath = path.join(CONTENT_DIR, `${slug}.mdx`);

  if (fs.existsSync(filePath) || resolveDocPath(slug)) {
    return NextResponse.json(
      { error: `Page "${slug}" already exists` },
      { status: 409 },
    );
  }

  const mdxContent = buildMdxFile({
    title: body.title,
    section: body.section || "Uncategorized",
    sectionOrder: body.sectionOrder,
    order: body.order ?? 0,
    slug,
    content: body.content,
  });

  fs.writeFileSync(filePath, mdxContent, "utf-8");

  // Bump version
  const ver = bumpVersion();

  // Git commit
  const commitMsg =
    body.commitMessage || `docs: create ${slug} (v${ver.version})`;
  gitCommit(filePath, commitMsg);

  // Revalidate
  revalidatePath("/docs");

  return NextResponse.json({ success: true, slug }, { status: 201 });
}

/**
 * Content Utilities
 * Reads .md and .mdx files from docs/, parses frontmatter,
 * generates navigation structure, and provides content for rendering.
 */
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import GithubSlugger from "github-slugger";

const CONTENT_DIR = path.join(process.cwd(), "docs");

/**
 * Resolve the file path for a slug.
 * Tries .mdx first, then .md.
 * Returns null if neither exists.
 */
export function resolveDocPath(slug: string): string | null {
  for (const ext of [".mdx", ".md"]) {
    const p = path.join(CONTENT_DIR, `${slug}${ext}`);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

export interface DocMeta {
  title: string;
  section: string;
  sectionOrder: number;
  order: number;
  slug: string;
}

export interface DocPage {
  meta: DocMeta;
  content: string; // Raw MDX content (without frontmatter)
}

export interface NavSection {
  title: string;
  order: number;
  items: { slug: string; title: string; order: number; snippet?: string }[];
}

export interface Heading {
  id: string;
  text: string;
  level: number;
}

/**
 * Get all doc slugs (filenames without extension).
 * Supports both .md and .mdx files.
 * If both exist for the same slug, .mdx takes priority.
 */
export function getAllSlugs(): string[] {
  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".md") || f.endsWith(".mdx"));
  const slugMap = new Map<string, string>(); // slug -> extension
  for (const f of files) {
    const base = f.replace(/\.(md|mdx)$/, "");
    const ext = f.endsWith(".mdx") ? ".mdx" : ".md";
    // .mdx always wins over .md
    if (ext === ".mdx" || !slugMap.has(base)) {
      slugMap.set(base, ext);
    }
  }
  return Array.from(slugMap.keys());
}

/**
 * Get a single doc page by slug
 */
export function getDocBySlug(slug: string): DocPage {
  const filePath = resolveDocPath(slug);
  if (!filePath) throw new Error(`Doc not found: ${slug}`);
  const fileContent = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(fileContent);

  return {
    meta: {
      title: data.title || slug,
      section: data.section || "Uncategorized",
      sectionOrder: data.sectionOrder ?? data["section-order"] ?? 0,
      order: data.order ?? 0,
      slug: data.slug || slug,
    },
    content,
  };
}

/**
 * Get all docs with metadata
 */
export function getAllDocs(): DocPage[] {
  const slugs = getAllSlugs();
  return slugs.map((slug) => getDocBySlug(slug));
}

/**
 * Extract plain-text snippet from MDX content (strip markdown, first 200 chars)
 */
function extractSnippet(content: string): string {
  return content
    .replace(/^---[\s\S]*?---/, "")
    .replace(/#{1,6}\s+.+/g, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/^[>\-\*|]\s?/gm, "")
    .replace(/\n+/g, " ")
    .trim()
    .slice(0, 200);
}

/**
 * Generate navigation structure from frontmatter data
 * Groups pages by section, sorts by order within each section
 */
export function getNavigation(): NavSection[] {
  const docs = getAllDocs();

  // Group by section
  const sectionMap = new Map<string, { meta: DocMeta; snippet: string }[]>();
  const sectionOrderMap = new Map<string, number>();
  for (const doc of docs) {
    const section = doc.meta.section;
    if (!sectionMap.has(section)) {
      sectionMap.set(section, []);
    }
    sectionMap
      .get(section)!
      .push({ meta: doc.meta, snippet: extractSnippet(doc.content) });
    if (
      !sectionOrderMap.has(section) ||
      doc.meta.sectionOrder < sectionOrderMap.get(section)!
    ) {
      sectionOrderMap.set(section, doc.meta.sectionOrder);
    }
  }

  // Sort sections by their order, then build nav
  const sortedSections = [...sectionMap.entries()].sort(
    (a, b) =>
      (sectionOrderMap.get(a[0]) ?? 0) - (sectionOrderMap.get(b[0]) ?? 0),
  );

  const navSections: NavSection[] = sortedSections.map(
    ([sectionTitle, items]) => {
      items.sort((a, b) => a.meta.order - b.meta.order);
      return {
        title: sectionTitle,
        order: sectionOrderMap.get(sectionTitle) ?? 0,
        items: items.map((item) => ({
          slug: item.meta.slug,
          title: item.meta.title,
          order: item.meta.order,
          snippet: item.snippet,
        })),
      };
    },
  );

  return navSections;
}

/**
 * Get all page IDs (slugs) in navigation order
 */
export function getAllPageIds(): string[] {
  const nav = getNavigation();
  return nav.flatMap((section) => section.items.map((item) => item.slug));
}

/**
 * Get the section title for a page
 */
export function getSectionForPage(slug: string): string {
  const doc = getDocBySlug(slug);
  return doc.meta.section;
}

/**
 * Get adjacent pages (prev/next) in navigation order
 */
export function getAdjacentPages(slug: string): {
  prev?: { slug: string; title: string };
  next?: { slug: string; title: string };
} {
  const allIds = getAllPageIds();
  const idx = allIds.indexOf(slug);
  return {
    prev:
      idx > 0
        ? {
            slug: allIds[idx - 1],
            title: getDocBySlug(allIds[idx - 1]).meta.title,
          }
        : undefined,
    next:
      idx < allIds.length - 1
        ? {
            slug: allIds[idx + 1],
            title: getDocBySlug(allIds[idx + 1]).meta.title,
          }
        : undefined,
  };
}

/**
 * Extract headings from MDX content (for TOC)
 */
export function extractHeadings(content: string): Heading[] {
  const headings: Heading[] = [];
  const slugger = new GithubSlugger();
  const lines = content.split("\n");
  for (const line of lines) {
    const match = line.match(/^(#{2,3})\s+(.+)/);
    if (match) {
      const level = match[1].length;
      const text = match[2].replace(/\*\*/g, "").replace(/`/g, "");
      const id = slugger.slug(text);
      headings.push({ id, text, level });
    }
  }
  return headings;
}

/**
 * Get page title by slug
 */
export function getPageTitle(slug: string): string {
  const doc = getDocBySlug(slug);
  return doc.meta.title;
}

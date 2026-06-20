# Architecture Decision Records — StsDev Wiki Template

This document records all significant architectural decisions made during the
development of the StsDev Wiki Template. Each ADR follows the
[Y-Statement](https://adr.github.io/) format: **Context → Decision → Consequences**.

---

## ADR-001: Translate all documentation to English

- **Date:** 2026-06-20
- **Status:** Accepted
- **Context:** All documentation, MDX content, UI strings, and metadata were in Russian. This limited the audience to Russian speakers only and created inconsistency with the codebase (which uses English identifiers, comments, and commit messages). Open-source projects typically have a global audience, and Russian-only content creates an unnecessary barrier for contributors.
- **Decision:** Translate all content to English — MDX files (22 pages), UI component strings (header, sidebar, search dialog, edit page), metadata titles and descriptions, and README. No i18n framework was added; the project is single-language (English).
- **Consequences:**
  - (+) Broader audience reach; consistency between code and content
  - (+) Easier contribution from international developers
  - (+) Aligns with open-source conventions (README, commit messages already English)
  - (-) Russian-speaking users need English proficiency
  - (-) No i18n infrastructure — adding a second language later requires significant refactoring (react-intl, next-intl, or similar)

---

## ADR-002: Add remark-gfm for GitHub Flavored Markdown support

- **Date:** 2026-06-20
- **Status:** Accepted
- **Context:** The MDX rendering pipeline used `next-mdx-remote/rsc` without any GFM plugin. Tables, strikethrough, task lists, and autolinks are not part of standard Markdown — they are GFM extensions. Without `remark-gfm`, tables rendered as raw pipe-delimited text, strikethrough (`~~text~~`) showed literal tildes, and task list checkboxes were invisible. Documentation content relies heavily on comparison tables, making this a blocking issue.
- **Decision:** Install `remark-gfm` (v4.0.1) and pass it as a remark plugin via `options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}` to the `<MDXRemote>` component. No custom table/strikethrough components needed for basic rendering.
- **Consequences:**
  - (+) Native GFM table rendering without custom components
  - (+) Strikethrough (`~~text~~`), task lists (`- [x]`), autolinks supported
  - (+) Aligns with GitHub Markdown conventions — content looks the same in repo and on site
  - (-) Slight increase in bundle size (remark-gfm dependency)
  - (-) GFM tables render as plain `<table>` without styling; existing custom table component in `mdx-components.tsx` overrides still apply for styled tables

---

## ADR-003: Next.js 16 as the documentation framework

- **Date:** 2026-06-20 (recorded retrospectively)
- **Status:** Accepted
- **Context:** The project needed a framework supporting (1) static export for GitHub Pages, (2) server mode with API routes for in-app editing, (3) MDX rendering with custom components, (4) syntax highlighting with theme switching, (5) dark/light theming, and (6) responsive design. Alternatives considered: Astro (excellent static output but weaker server-mode story), Docusaurus (opinionated, harder to customize), Hugo (fast builds but Go templating, no server mode).
- **Decision:** Use Next.js 16 with App Router. Static export mode (`output: 'export'`) for GitHub Pages; conditional removal of API routes in CI. Server mode (`output: 'standalone'`) with all features active for local/development use.
- **Consequences:**
  - (+) Server Components for fast MDX rendering (no client-side JS for content)
  - (+) Flexible: same codebase produces both static site and full-featured server app
  - (+) Rich ecosystem: next-themes, shadcn/ui, next-mdx-remote, MDXEditor
  - (+) TypeScript support out of the box
  - (-) Framework lock-in — migration to another framework would be costly
  - (-) Static export limits: no API routes, no dynamic server features, no ISR
  - (-) Next.js 16 defaults to Turbopack which has issues with static export; `--webpack` flag required

---

## ADR-004: StsDev branding (rebranding from Z-AI/ZCode)

- **Date:** 2026-06-20 (recorded retrospectively)
- **Status:** Accepted
- **Context:** The project was originally a Z-AI/ZCode internal template with references to the parent brand in package names, URLs, metadata, and visual assets. It needed to be rebranded as a standalone open-source template under the StsDev identity. The z-ai-web-dev-sdk dependency was unnecessary for the template's functionality and added coupling to the Z-AI ecosystem.
- **Decision:** Rename all identifiers, URLs, metadata, and visual assets to StsDev branding. Remove `z-ai-web-dev-sdk` dependency. Update logo to "S" monogram. Rename GitHub repository from `Z-Docs-NextJS` to `StsDev-Wiki-Template`. Update `basePath` and `assetPrefix` in `next.config.ts` accordingly.
- **Consequences:**
  - (+) Clean, independent project identity — no confusion about ownership
  - (+) No dependency on Z-AI SDK — reduces bundle size and coupling
  - (+) StsDev can evolve the template independently
  - (-) Historical context lost (original authorship, prior commits reference old name)
  - (-) Any future rebranding would require similar effort across all identifiers
  - (-) Old `Z-Docs-NextJS` GitHub Pages deployment still exists and needs manual cleanup

---

## ADR-005: Prism-based syntax highlighting with theme awareness

- **Date:** 2026-06-20 (recorded retrospectively)
- **Status:** Accepted
- **Context:** Code blocks in documentation require syntax highlighting that adapts to the current light/dark theme. Options evaluated: (1) **Prism** via `react-syntax-highlighter` — 200+ languages, client-side rendering, easy theme switching; (2) **Highlight.js** — lighter but fewer language grammars, similar client-side approach; (3) **Shiki** — uses VS Code themes, server-side rendering, excellent fidelity but requires async initialization and has larger language bundles.
- **Decision:** Use `react-syntax-highlighter` with Prism engine and `oneDark`/`oneLight` themes, switching based on `next-themes` `resolvedTheme`. Client component wraps the highlighter to access theme via `useTheme()` hook.
- **Consequences:**
  - (+) 200+ language support out of the box
  - (+) Seamless dark/light theme switching (oneDark/oneLight)
  - (+) Line numbers, copy button, filename header implemented as custom features
  - (-) Larger bundle than Shiki (Prism languages are bundled in the client)
  - (-) Client component required (useTheme hook) — cannot be a Server Component
  - (-) Flash of unstyled content possible on first load before theme resolves

---

## ADR-006: Dual-mode deployment strategy (CI + local script)

- **Date:** 2026-06-20
- **Status:** Accepted
- **Context:** Next.js 16 static export on GitHub Actions runners (7 GB RAM) causes OOM kills. The build compiles successfully, but Node.js worker processes for static page generation exceed available memory and are killed by the OS (exit code 137). This resulted in 42+ consecutive CI failures. Adding 4 GB swap and limiting to 1 CPU worker (`experimental.cpus: 1`) did not consistently solve the OOM — the problem is the peak memory during page generation, not sustained usage. Additionally, `output: "export"` is incompatible with API routes and server-only pages (edit, new), which must be physically removed from the source tree before building. Next.js requires `dynamicParams` as a static boolean literal — runtime expressions like `process.env.GITHUB_PAGES !== 'true'` cause a "BinaryExpression" build error (see ADR-007).
- **Decision:** Two deployment paths from the same codebase:
  1. **CI workflow** (`.github/workflows/deploy.yml`): on push to `main`, removes server-only routes (`src/app/api`, `edit`, `new`), builds with `GITHUB_PAGES=true` and `experimental.cpus: 1`, deploys `out/` to `gh-pages` branch. Includes a fallback job that retries with lower memory if the primary build OOMs.
  2. **Local script** (`scripts/deploy-gh-pages.sh`): same logic but runs on developer machine with full RAM — backs up server routes to a temp directory, removes them, builds, pushes to `gh-pages`, restores from backup. This is the reliable path when CI fails.
  
  Server mode (no `GITHUB_PAGES` env) runs with `output: "standalone"`, all API routes and editing features active.
- **Consequences:**
  - (+) Same codebase serves both static site and full-featured server app
  - (+) Local deploy script works reliably regardless of CI memory limits
  - (+) CI fallback job catches OOM failures and retries with lower memory
  - (-) Server-only routes must be manually excluded from static build (rm -rf in workflow)
  - (-) Two deployment methods to maintain and keep in sync
  - (-) CI may still OOM if project grows significantly; local deploy is the ultimate fallback
  - (-) Restoring files after local deploy depends on temp directory not being lost (set -euo pipefail + explicit cp)

---

## ADR-007: dynamicParams = false for static compatibility

- **Date:** 2026-06-20
- **Status:** Accepted
- **Context:** Next.js requires `dynamicParams` to be a static boolean literal when using `output: "export"`. A runtime expression (`process.env.GITHUB_PAGES !== 'true'`) caused the build error "Unsupported node type BinaryExpression" because Next.js statically analyzes this value during build. Previously, CI used `sed` to replace `true` with `false` in the source file before building — this was fragile and failed silently. The real error (incompatible dynamicParams with static export) was masked by the OOM investigation, contributing to 40+ failed CI runs before the root cause was identified.
- **Decision:** Set `export const dynamicParams = false` unconditionally in `src/app/docs/[slug]/page.tsx`. In server mode, unknown slugs trigger `notFound()` from the catch block in `generateStaticParams`, which is the desired behavior regardless. The edit/new pages are separate routes (`/docs/[slug]/edit`, `/docs/new`) and do not depend on `dynamicParams` at all.
- **Consequences:**
  - (+) No fragile sed hacks in CI — source code is the same for both modes
  - (+) Build works identically locally and in CI
  - (+) No "BinaryExpression" errors from Next.js compiler
  - (-) Cannot add new MDX files at runtime in server mode without rebuild (acceptable — the in-app editor creates files on disk and calls `revalidatePath`, which triggers regeneration)
  - (-) Slightly different semantic than `true` (explicit 404 vs. attempting to render unknown slug), but functionally equivalent given the `notFound()` catch block

---

## ADR-008: Webpack override for Next.js 16 static export

- **Date:** 2026-06-20
- **Status:** Accepted
- **Context:** Next.js 16 defaults to Turbopack as the bundler. However, Turbopack has known issues with `output: "export"` in Next.js 16 — it produces incomplete output, fails to resolve certain plugins (remark-gfm, next-mdx-remote), and generates incorrect chunk splitting for static pages. The `--webpack` flag forces the legacy Webpack bundler which has mature support for static export.
- **Decision:** Use `npx next build --webpack` instead of `npx next build` for all production builds (both CI and local). The `package.json` dev script uses Turbopack (fine for development), but production builds must use Webpack.
- **Consequences:**
  - (+) Reliable static export output — all pages generated correctly
  - (+) remark-gfm and next-mdx-remote plugins resolved properly
  - (+) Consistent with Next.js 15 behavior (Webpack was default)
  - (-) Slower builds than Turbopack (Webpack is mature but slower)
  - (-) Must remember to pass `--webpack` flag; forgetting it causes silent build failures
  - (-) When Turbopack stabilizes for static export, this override should be removed

---

## ADR-009: MDXEditor (WYSIWYG) for in-app document editing

- **Date:** 2026-06-20
- **Status:** Accepted
- **Context:** The project needs an in-app editing interface that allows users to create and modify documentation without leaving the application. Requirements: (1) WYSIWYG editing with Markdown output, (2) support for frontmatter editing (title, section, order, slug), (3) source/diff mode for advanced users, (4) toolbar with formatting buttons, (5) table, code block, and link insertion. Options: (1) **@mdxeditor/editor** — purpose-built for MDX, rich plugin system, WYSIWYG + source mode; (2) Plain textarea — minimal but no WYSIWYG; (3) TipTap — flexible but requires custom MDX serialization.
- **Decision:** Use `@mdxeditor/editor` (v3.39+) as the editing component. Configure with plugins: headings, lists, quotes, thematic break, markdown shortcuts, links (with dialog), tables, code blocks (with CodeMirror), frontmatter, diff/source toggle, and a custom toolbar.
- **Consequences:**
  - (+) Full WYSIWYG editing with live preview — users see formatted content as they type
  - (+) Built-in plugin system covers all required features (tables, code, frontmatter)
  - (+) Source mode toggle for advanced users who prefer raw Markdown
  - (+) Diff mode to compare changes before saving
  - (-) Large dependency (~2 MB client bundle for the editor)
  - (-) Client-only component — cannot be server-rendered (marked 'use client')
  - (-) Editor CSS (`@mdxeditor/editor/style.css`) must be imported globally and may conflict with Tailwind styles
  - (-) Some UI strings in the editor are hardcoded in Russian — need translation to English for consistency with ADR-001

---

## ADR-010: REST API design for document CRUD + Git integration

- **Date:** 2026-06-20
- **Status:** Accepted
- **Context:** The server mode of the application requires API endpoints for creating, reading, updating, and deleting documentation pages. Additionally, each save should auto-commit changes to the Git repository so that the file system and Git history stay in sync. The API must handle: (1) listing all documents with metadata, (2) reading a single document's content + frontmatter, (3) updating a document (content and/or metadata), (4) creating a new document with auto-generated slug, (5) uploading files (images, attachments) to the public directory, (6) auto-committing on save.
- **Decision:** Implement REST API under `/api/docs/`:
  - `GET /api/docs` — list all documents with metadata
  - `GET /api/docs/[slug]` — read document content + parsed frontmatter
  - `PUT /api/docs/[slug]` — update document, auto-commit with provided message
  - `POST /api/docs` — create new document
  - `POST /api/docs/upload` — upload file to `public/uploads/`
  
  Handlers are in `src/lib/api-handlers.ts`, shared between route files. Git commits use `child_process.execSync('git add ... && git commit -m ...')`.
- **Consequences:**
  - (+) Simple, RESTful API — easy to understand and consume
  - (+) Auto-commit keeps Git history in sync with file system changes
  - (+) Shared handler logic between route files (DRY)
  - (-) API routes are incompatible with `output: "export"` — must be removed before static build
  - (-) Git commit via `execSync` is blocking — slow commits block the request
  - (-) No authentication — anyone with access to the server can edit documents (acceptable for local/internal use, not for public deployment)
  - (-) File upload has no size/type validation beyond basic checks

---

## ADR-011: Content storage as MDX files on disk

- **Date:** 2026-06-20
- **Status:** Accepted
- **Context:** Documentation content needs a storage format that supports (1) rich formatting (headings, tables, code blocks, diagrams), (2) metadata (title, section, order), (3) version control via Git, (4) editing both in-app and via any text editor, (5) no database dependency for the static build. Options: (1) **MDX files on disk** — Markdown + JSX, frontmatter for metadata, Git-friendly, no DB; (2) Database (SQLite/PostgreSQL) — structured queries, relations, but requires migration and breaks static build; (3) Headless CMS (Contentful, Strapi) — web UI, API, but external dependency and not Git-native.
- **Decision:** Store all content as `.mdx` files in `src/content/docs/`. Each file has YAML frontmatter with `title`, `section`, `order`, and `slug` fields. Content is read at build time via `fs.readFileSync` in `generateStaticParams` and `generateMetadata`. The `gray-matter` library parses frontmatter; `next-mdx-remote/rsc` renders the MDX body.
- **Consequences:**
  - (+) Git-native — every edit is a commit, full history, branching, diffs
  - (+) No database — zero operational overhead, works with static export
  - (+) Editable with any text editor — not locked into the app
  - (+) Build-time reading — no runtime file I/O for page rendering
  - (-) No full-text search index at build time — search is client-side (loading all docs)
  - (-) Adding a new MDX file requires rebuild (dynamicParams = false, see ADR-007)
  - (-) No relations between documents — ordering and grouping are manual via frontmatter

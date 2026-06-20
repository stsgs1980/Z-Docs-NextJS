# StsDev Wiki Template

A Wiki documentation template built on Next.js 16 — MDX content, syntax highlighting, dark/light themes, in-app editing, and static deployment to GitHub Pages.

## Features

- **MDX Content** — each page as a `.mdx` file with frontmatter (title, section, order, slug)
- **Syntax Highlighting** — Prism-based, One Dark / One Light matching the theme
- **Mermaid Diagrams** — adapt to the current theme (dark/light)
- **Dark and Light Themes** — toggle with one button, state persisted in localStorage
- **Full-text Search (Cmd+K)** — instant search across all pages
- **In-app Editing** — WYSIWYG MDX editor, page creation, file upload
- **Git Integration** — auto-commit on save from the application
- **Table of Contents (TOC)** — auto-generated, active section highlighting
- **Cross-navigation** — "Previous / Next" buttons between pages
- **GitHub Pages** — static deployment via GitHub Actions (server routes removed in CI)
- **GFM Support** — GitHub Flavored Markdown via remark-gfm (tables, strikethrough, task lists, autolinks)
- **Responsive Design** — mobile navigation with drawer menu

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Theming | next-themes (class-based) |
| Content Rendering | next-mdx-remote/rsc (Server Component) + remark-gfm |
| Editor | @mdxeditor/editor (WYSIWYG + source) |
| Code Highlighting | react-syntax-highlighter (Prism) |
| Diagrams | Mermaid.js (dynamic import) |
| Frontmatter | gray-matter |
| Icons | Lucide React |

## Local Development

```bash
# Install dependencies
bun install

# Start dev server
bun run dev

# Linting
bun run lint
```

Open http://localhost:3000 — the documentation will load with the dark theme by default.

## Project Structure

```
src/
  app/
    layout.tsx                # Root layout + ThemeProvider
    page.tsx                  # Redirect to first page
    globals.css               # CSS variables for light/dark themes
    docs/
      [slug]/
        page.tsx              # Server page (SSG/SSR)
        docs-shell.tsx        # Client shell (sidebar, TOC, search)
        edit/page.tsx         # In-app editing
      new/page.tsx            # Create new page
    api/docs/                 # REST API for document CRUD
  components/
    docs/                     # Documentation components
    mdx/                      # MDX rendering and editor
    ui/                       # shadcn/ui components
  content/
    docs/                     # MDX content files
  lib/
    mdx-utils.ts              # Utilities for reading MDX files
    api-handlers.ts           # API handlers (CRUD + git)
```

## Deployment

### GitHub Pages (static)

The CI workflow automatically removes server routes (API, edit, new) and builds a static site:

```bash
# Manual deployment
GITHUB_PAGES=true npx next build
```

### Vercel / server mode

```bash
bun run build
bun run start
```

In server mode, in-app editing and the API are available.

Built with: Next.js 16 + TypeScript + Tailwind CSS

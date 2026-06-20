#!/usr/bin/env bash
# Build and deploy script for GitHub Pages static export
# Removes server-only routes (API, edit, new) before building,
# then pushes the output to gh-pages branch, then restores.

set -euo pipefail

REPO_URL=$(git remote get-url origin)

echo "=== StsDev Wiki — GitHub Pages Deploy ==="
echo ""

# Step 1: Backup server-only routes
echo "[1/6] Backing up server-only routes..."
TMPDIR=$(mktemp -d)
cp -r src/app/api "$TMPDIR/api" 2>/dev/null || true
cp -r src/app/docs/*/edit "$TMPDIR/" 2>/dev/null || true
# edit is inside [slug], handle specially
mkdir -p "$TMPDIR/edit-backup"
[ -d "src/app/docs/[slug]/edit" ] && cp -r src/app/docs/\[slug\]/edit "$TMPDIR/edit-backup/" || true
[ -d "src/app/docs/new" ] && cp -r src/app/docs/new "$TMPDIR/new" || true
echo "  ✓ Backed up to $TMPDIR"

# Step 2: Remove server-only routes for static export
echo "[2/6] Removing server-only routes..."
rm -rf src/app/api
rm -rf src/app/docs/*/edit
rm -rf src/app/docs/new
echo "  ✓ Removed: api/, edit/, new/"

# Step 3: Build
echo "[3/6] Building static site..."
rm -rf out .next
GITHUB_PAGES=true NODE_OPTIONS="--max-old-space-size=3072" npx next build --webpack
echo "  ✓ Build complete"

# Step 4: Add .nojekyll
echo "[4/6] Adding .nojekyll..."
touch out/.nojekyll
echo "  ✓ Done"

# Step 5: Push to gh-pages
echo "[5/6] Deploying to gh-pages branch..."
cd out
git init
git add -A
git commit -m "Deploy: static build $(date -u +%Y-%m-%d-%H%M)"
git push --force "$REPO_URL" HEAD:gh-pages
cd ..
echo "  ✓ Pushed to gh-pages"

# Step 6: Restore removed files
echo "[6/6] Restoring server-only routes..."
[ -d "$TMPDIR/api" ] && cp -r "$TMPDIR/api" src/app/api && echo "  ✓ Restored api/"
[ -d "$TMPDIR/edit-backup/edit" ] && mkdir -p "src/app/docs/[slug]/edit" && cp -r "$TMPDIR/edit-backup/edit/"* "src/app/docs/[slug]/edit/" && echo "  ✓ Restored edit/"
[ -d "$TMPDIR/new" ] && cp -r "$TMPDIR/new" src/app/docs/new && echo "  ✓ Restored new/"
rm -rf "$TMPDIR"
echo "  ✓ Cleanup done"

echo ""
echo "=== Deploy complete! ==="
echo "Site: https://stsgs1980.github.io/StsDev-Wiki-Template/"

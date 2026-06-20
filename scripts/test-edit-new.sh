#!/bin/bash
# Screenshot Edit & New pages at multiple viewports × dark/light themes
# Using agent-browser CLI

BASE="http://localhost:3000"
OUT="/home/z/my-project/download/screenshots-test"
mkdir -p "$OUT"

# Viewports: width x height
VIEWPORTS=("1440x900" "1280x800" "768x1024" "375x812")
VP_NAMES=("xl" "lg" "md" "sm")

# Pages to test
declare -A PAGES
PAGES[edit]="/docs/corporate/edit/"
PAGES[new]="/docs/new/"

for page_name in edit new; do
  url="${BASE}${PAGES[$page_name]}"
  for i in "${!VIEWPORTS[@]}"; do
    vp="${VIEWPORTS[$i]}"
    vn="${VP_NAMES[$i]}"
    w="${vp%x*}"
    h="${vp#*x}"

    # Dark theme
    dark_file="$OUT/${page_name}-${vn}-dark.png"
    npx agent-browser navigate "$url" --viewport "${w},${h}" --dark-mode 2>/dev/null
    sleep 3
    npx agent-browser screenshot "$dark_file" 2>/dev/null
    echo "✓ $dark_file"

    # Light theme  
    light_file="$OUT/${page_name}-${vn}-light.png"
    npx agent-browser navigate "$url" --viewport "${w},${h}" 2>/dev/null
    sleep 3
    npx agent-browser screenshot "$light_file" 2>/dev/null
    echo "✓ $light_file"
  done
done

echo "=== Done ==="
ls -la "$OUT"

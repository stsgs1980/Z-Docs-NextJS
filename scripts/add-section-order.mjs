#!/usr/bin/env node
/**
 * Add sectionOrder to all MDX frontmatter.
 * 
 * Section order mapping:
 * 1 - Case Studies
 * 2 - Wiki Architecture Approaches
 * 3 - Classification
 * 4 - Uploaded
 * 5 - Formats
 * 6 - Tools
 * 7 - GitHub
 * 8 - Knowledge Paradigms
 * 9 - Selection
 * 10 - Sintax Highlight
 */
import fs from 'fs';
import path from 'path';

const CONTENT_DIR = path.join(process.cwd(), 'src', 'content', 'docs');

const SECTION_ORDER = {
  'Case Studies': 1,
  'Wiki Architecture Approaches': 2,
  'Classification': 3,
  'Uploaded': 4,
  'Formats': 5,
  'Tools': 6,
  'GitHub': 7,
  'Knowledge Paradigms': 8,
  'Selection': 9,
  'Sintax Highlight': 10,
};

const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.mdx'));

for (const file of files) {
  const filePath = path.join(CONTENT_DIR, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Find section value
  const sectionMatch = content.match(/^section:\s*"([^"]+)"/m);
  if (!sectionMatch) {
    console.log(`SKIP ${file} — no section found`);
    continue;
  }
  
  const section = sectionMatch[1];
  const order = SECTION_ORDER[section] ?? 99;
  
  // Check if sectionOrder already exists
  if (content.includes('sectionOrder:') || content.includes('section-order:')) {
    console.log(`SKIP ${file} — sectionOrder already exists`);
    continue;
  }
  
  // Add sectionOrder after the section line
  content = content.replace(
    /^section:\s*"[^"]+"/m,
    `$&\nsectionOrder: ${order}`
  );
  
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`OK ${file} — section "${section}" → order ${order}`);
}

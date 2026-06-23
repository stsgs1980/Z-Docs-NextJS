/**
 * Version utilities — reads/writes src/data/version.json.
 * Format: { version: "1.2.3", build: 42 }
 */

import fs from 'fs';
import path from 'path';

const VERSION_FILE = path.join(process.cwd(), 'src', 'data', 'version.json');

export interface VersionInfo {
  version: string;
  build: number;
}

export function getVersion(): VersionInfo {
  try {
    const raw = fs.readFileSync(VERSION_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { version: '0.0.0', build: 0 };
  }
}

/** Increment patch version and build counter. Returns new VersionInfo. */
export function bumpVersion(): VersionInfo {
  const cur = getVersion();
  const [major, minor, patch] = cur.version.split('.').map(Number);
  const next: VersionInfo = {
    version: `${major}.${minor}.${patch + 1}`,
    build: cur.build + 1,
  };
  fs.writeFileSync(VERSION_FILE, JSON.stringify(next, null, 2) + '\n', 'utf-8');
  return next;
}
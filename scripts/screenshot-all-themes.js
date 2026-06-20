// Screenshot Edit & New pages at multiple viewports × dark/light themes
// Using agent-browser CLI with JS-based theme switching

const { execSync } = require('child_process');
const path = require('path');
const OUT = '/home/z/my-project/download/screenshots-test2';

function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf-8', timeout: 30000 }).trim();
  } catch (e) {
    return e.stdout?.trim() || 'ERROR';
  }
}

function navigate(url, viewport) {
  run(`npx agent-browser navigate "${url}" --viewport ${viewport} 2>/dev/null`);
}

function screenshot(filepath) {
  run(`npx agent-browser screenshot "${filepath}" 2>/dev/null`);
}

function setDark() {
  // First ensure we're on a page with theme toggle
  run(`npx agent-browser eval "localStorage.setItem('theme','dark'); document.documentElement.className='dark'" 2>/dev/null`);
}

function setLight() {
  run(`npx agent-browser eval "localStorage.setItem('theme','light'); document.documentElement.className='light'" 2>/dev/null`);
}

const viewports = [
  { name: 'xl', w: 1440, h: 900 },
  { name: 'lg', w: 1280, h: 800 },
  { name: 'md', w: 768, h: 1024 },
  { name: 'sm', w: 375, h: 812 },
];

const pages = [
  { name: 'edit', url: 'http://localhost:3000/docs/corporate/edit/' },
  { name: 'new', url: 'http://localhost:3000/docs/new/' },
];

for (const page of pages) {
  for (const vp of viewports) {
    const vpStr = `${vp.w},${vp.h}`;
    
    // Dark
    navigate(page.url, vpStr);
    // Wait for page to load
    run('sleep 3');
    setDark();
    run('sleep 1');
    screenshot(path.join(OUT, `${page.name}-${vp.name}-dark.png`));
    console.log(`✓ ${page.name}-${vp.name}-dark`);
    
    // Light
    navigate(page.url, vpStr);
    run('sleep 3');
    setLight();
    run('sleep 1');
    screenshot(path.join(OUT, `${page.name}-${vp.name}-light.png`));
    console.log(`✓ ${page.name}-${vp.name}-light`);
  }
}

console.log('=== ALL DONE ===');

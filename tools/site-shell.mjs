import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export async function syncSharedShell(root, pages) {
  const header = await readFile(path.join(root, 'tools/partials/header.html'), 'utf8');
  const footer = await readFile(path.join(root, 'tools/partials/footer.html'), 'utf8');
  const startup = await readFile(path.join(root, 'tools/partials/startup.html'), 'utf8');
  for (const relative of pages) {
    const output = path.join(root, relative);
    let html = await readFile(output, 'utf8');
    // Resolve theme and scripted navigation before any styles or body can paint.
    html = html.replace(/\s*<!-- site:startup:start -->[\s\S]*?<!-- site:startup:end -->\s*/g, '\n');
    const headStart = /(<head\b[^>]*>\s*(?:<meta\b[^>]*charset[^>]*>\s*)?)/i;
    html = html.replace(headStart, (_, opening) => `${opening}${startup.trim()}\n`);
    if (!html.includes('href="/assets/page-loading.css"')) {
      html = html.replace('</head>', '<link rel="stylesheet" href="/assets/page-loading.css">\n</head>');
    }
    const current = relative === 'index.html' ? 'home' : relative.startsWith('about/') ? 'about' : relative.startsWith('contact/') ? 'contact' : 'work';
    let pageHeader = header;
    for (const name of ['home', 'work', 'about', 'contact']) pageHeader = pageHeader.replaceAll(`{{${name}Current}}`, name === current ? 'aria-current="page" class="is-active"' : '');
    // The logo already has a class; keep a single class attribute on its anchor.
    pageHeader = pageHeader.replace('class="nav-brand" href="/" aria-label="J.R. Bone, Home" aria-current="page" class="is-active"', 'class="nav-brand is-active" href="/" aria-label="J.R. Bone, Home" aria-current="page"');
    for (const [region, content] of [['header', pageHeader], ['footer', footer]]) {
      const start = `<!-- site:${region}:start -->`;
      const end = `<!-- site:${region}:end -->`;
      if (!html.includes(start) || !html.includes(end)) continue;
      html = html.slice(0, html.indexOf(start) + start.length) + '\n' + content.trim() + '\n' + html.slice(html.indexOf(end));
    }
    await writeFile(output, html);
  }
}

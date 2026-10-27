import { readFile, writeFile, mkdir, readdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const origin = 'https://jrpbone.vercel.app';
const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
export const sortProjects = (projects) => [...projects].sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));

function replaceRegion(html, region, content) {
  const start = `<!-- works:${region}:start -->`;
  const end = `<!-- works:${region}:end -->`;
  if (!html.includes(start) || !html.includes(end)) throw new Error(`Missing ${region} markers`);
  return html.slice(0, html.indexOf(start) + start.length) + '\n' + content + '\n' + html.slice(html.indexOf(end));
}

export function card(project) {
  const p = Object.fromEntries(Object.entries(project).map(([key, value]) => [key, typeof value === 'string' ? escape(value) : value]));
  return `<li class="home-project" data-platform="${p.platform.toLowerCase()}" data-slug="${p.slug}">
  <a class="home-project-link" href="/works/${p.slug}/">
    <div class="home-project-image" style="view-transition-name: project-${p.slug}"><img src="${p.cover}" width="${p.coverWidth}" height="${p.coverHeight}" loading="lazy" decoding="async" alt="${p.name} project screenshot"></div>
    <div class="home-project-body"><span class="project-type">${p.type} &middot; ${p.platform}</span><h3>${p.name}</h3>
      <div class="project-card-meta"><span class="project-status${p.status === 'complete' ? ' is-complete' : ''}">${p.status === 'in-development' ? 'In Development' : 'Completed'}</span><time datetime="${p.date}">${p.date.slice(0, 4)}</time></div>
      <p>${p.summary}</p><ul class="work-tags" aria-label="Technologies used">${p.tags.slice(0, 3).map((tag) => `<li class="tag">${escape(tag)}</li>`).join('')}</ul>
      <span class="home-project-more">View project <span aria-hidden="true">&rarr;</span></span>
    </div>
  </a>
</li>`;
}

async function validate(projects) {
  const slugs = new Set();
  for (const p of projects) {
    for (const field of ['slug', 'name', 'type', 'platform', 'status', 'date', 'role', 'timeline', 'team', 'projectType', 'summary', 'cover', 'repo']) {
      if (typeof p[field] !== 'string' || !p[field].trim()) throw new Error(`${p.slug}: missing ${field}`);
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug) || slugs.has(p.slug)) throw new Error(`Invalid or duplicate slug: ${p.slug}`);
    slugs.add(p.slug);
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(p.date)) throw new Error(`${p.slug}: date must be YYYY-MM`);
    if (!['Web', 'Mobile', 'Desktop'].includes(p.platform) || !['complete', 'in-development'].includes(p.status)) throw new Error(`${p.slug}: invalid platform or status`);
    if (!Array.isArray(p.tags) || !p.tags.every((tag) => typeof tag === 'string') || !(p.coverWidth > 0 && p.coverHeight > 0)) throw new Error(`${p.slug}: invalid image dimensions or tags`);
    if (!p.cover.startsWith('/') || p.cover.includes('..')) throw new Error(`${p.slug}: cover must be root-relative`);
    for (const url of [p.repo, p.liveUrl].filter(Boolean)) if (!/^https:\/\//.test(url)) throw new Error(`${p.slug}: external links must use HTTPS`);
    await readFile(path.join(root, p.cover.split('?')[0]));
    await readFile(path.join(root, 'works', p.slug, 'index.html'));
  }
}

export async function buildWorks() {
  const registry = sortProjects(JSON.parse(await readFile(path.join(root, 'works/projects.json'), 'utf8')));
  const projects = registry.filter((project) => project.published !== false);
  await validate(registry);
  const homePath = path.join(root, 'index.html');
  const featured = projects.filter((p) => p.featured !== false).slice(0, 3);
  await writeFile(homePath, replaceRegion(await readFile(homePath, 'utf8'), 'featured', `<ul class="home-work-grid">\n${featured.map(card).join('\n')}\n</ul>`));
  const indexPath = path.join(root, 'works/index.html');
  const base = await readFile(indexPath, 'utf8');
  const pages = Math.max(1, Math.ceil(projects.length / 9));
  const pagePaths = [];
  for (let page = 1; page <= pages; page++) {
    const url = page === 1 ? '/works/' : `/works/page/${page}/`;
    pagePaths.push(url);
    const pagination = pages > 1 ? '<nav class="works-pagination" aria-label="Project pages">' + Array.from({ length: pages }, (_, i) => `<a href="${i === 0 ? '/works/' : `/works/page/${i + 1}/`}"${page === i + 1 ? ' aria-current="page"' : ''}>${i + 1}</a>`).join(' ') + '</nav>' : '';
    let html = replaceRegion(base, 'index', `<ul class="works-grid">\n${projects.slice((page - 1) * 9, page * 9).map(card).join('\n')}\n</ul>${pagination}`);
    if (page > 1) html = html.replace('<title>Works |', `<title>Works, page ${page} |`).replaceAll(`${origin}/works/"`, `${origin}${url}"`);
    const output = page === 1 ? indexPath : path.join(root, 'works/page', String(page), 'index.html');
    await mkdir(path.dirname(output), { recursive: true });
    await writeFile(output, html);
  }
  // Only remove stale numbered output inside this builder's dedicated pagination directory.
  const pageRoot = path.join(root, 'works/page');
  for (const item of await readdir(pageRoot, { withFileTypes: true }).catch(() => [])) {
    if (item.isDirectory() && /^\d+$/.test(item.name) && Number(item.name) > pages) await rm(path.join(pageRoot, item.name), { recursive: true });
  }
  for (const [index, project] of projects.entries()) {
    const neighbor = (p, label) => p ? `<a href="/works/${escape(p.slug)}/"><span>${label}</span> ${escape(p.name)} &rarr;</a>` : '';
    const navigation = '<nav class="project-neighbors container" aria-label="Previous and next project">' + neighbor(projects[index - 1], 'Previous project') + neighbor(projects[index + 1], 'Next project') + '</nav>';
    const output = path.join(root, 'works', project.slug, 'index.html');
    let html = replaceRegion(await readFile(output, 'utf8'), 'neighbors', navigation);
    // Hero links follow the registry and omit Live demo when no live URL is set.
    const actions = `<div class="project-actions"><a class="btn-outline" href="${escape(project.repo)}" target="_blank" rel="noopener noreferrer">View code</a>${project.liveUrl ? `<a class="btn-outline project-live" href="${escape(project.liveUrl)}" target="_blank" rel="noopener noreferrer">Live demo</a>` : ''}</div>`;
    html = html.replace(/<div class="project-actions">[\s\S]*?<\/div>/, actions);
    await writeFile(output, html);
  }
  for (const project of registry) {
    const output = path.join(root, 'works', project.slug, 'index.html');
    let html = await readFile(output, 'utf8');
    html = html.replace(/<meta\b(?=[^>]*name="robots")(?=[^>]*content="noindex, nofollow")[^>]*>/g, '');
    if (project.published === false) {
      html = replaceRegion(html, 'neighbors', '');
      html = html.replace('</head>', '<meta name="robots" content="noindex, nofollow"></head>');
    }
    html = html.replace(/^[ \t]+$/gm, '').trimEnd() + '\n';
    await writeFile(output, html);
  }
  const urls = ['/', ...pagePaths, ...projects.map((p) => `/works/${p.slug}/`)];
  await writeFile(path.join(root, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls.map((url) => `  <url><loc>${origin}${url}</loc></url>`).join('\n') + '\n</urlset>\n');
  console.log(`Built ${featured.length} homepage cards and ${projects.length} projects across ${pages} Works page(s).`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await buildWorks();

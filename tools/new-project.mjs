import { readFile, writeFile, mkdir, cp, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const [slug, name] = process.argv.slice(2);
if (!slug || slug === 'page' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || !name?.trim()) {
  console.error('Usage: node tools/new-project.mjs <lowercase-slug> "<Name>"'); process.exit(1);
}
const registryPath = path.join(root, 'works/projects.json');
const projects = JSON.parse(await readFile(registryPath, 'utf8'));
const destination = path.join(root, 'works', slug);
if (projects.some((p) => p.slug === slug) || await access(destination).then(() => true, () => false)) {
  console.error(`Project already exists: ${slug}`); process.exit(1);
}
const escape = (value) => value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const date = new Date().toISOString().slice(0, 7);
await mkdir(destination);
await cp(path.join(root, 'works/_template/project.css'), path.join(destination, 'project.css'));
await mkdir(path.join(destination, 'images'));
let html = await readFile(path.join(root, 'works/_template/index.html'), 'utf8');
html = html.replaceAll('{{slug}}', slug).replaceAll('{{name}}', escape(name.trim())).replaceAll('{{nameJson}}', JSON.stringify(name.trim()).replaceAll('<', '\\u003c')).replaceAll('{{date}}', date);
await writeFile(path.join(destination, 'index.html'), html);
projects.push({ slug, name: name.trim(), type: 'Project', platform: 'Web', status: 'in-development', date, role: 'To be confirmed', timeline: 'To be confirmed', team: 'To be confirmed', projectType: 'Personal', summary: 'Project details to follow.', tags: [], cover: '/assets/branding/og-preview-bw.png', coverWidth: 1200, coverHeight: 630, repo: 'https://github.com/jrpbone', featured: false, published: false });
await writeFile(registryPath, JSON.stringify(projects, null, 2) + '\n');
console.log(`Created /works/${slug}/. Fill in the page and registry, add images, then run npm run build:works.`);

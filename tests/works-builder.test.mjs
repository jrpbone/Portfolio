import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, cp, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const source = fileURLToPath(new URL('../', import.meta.url));

test('static builder supports date order, unpublished drafts, pagination, and a new project', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'portfolio-works-'));
  const run = (file, ...args) => execFileSync(process.execPath, [path.join(root, file), ...args], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  try {
    await mkdir(path.join(root, 'tools'));
    await mkdir(path.join(root, 'works'));
    for (const section of ['about', 'contact']) {
      await mkdir(path.join(root, section));
      await writeFile(path.join(root, section, 'index.html'), '<html><body><!-- site:header:start --><!-- site:header:end --><!-- site:footer:start --><!-- site:footer:end --></body></html>');
    }
    await cp(path.join(source, 'tools/site-shell.mjs'), path.join(root, 'tools/site-shell.mjs'));
    await cp(path.join(source, 'tools/partials'), path.join(root, 'tools/partials'), { recursive: true });
    await cp(path.join(source, 'tools/build-works.mjs'), path.join(root, 'tools/build-works.mjs'));
    await cp(path.join(source, 'tools/new-project.mjs'), path.join(root, 'tools/new-project.mjs'));
    await cp(path.join(source, 'works/_template'), path.join(root, 'works/_template'), { recursive: true });
    await mkdir(path.join(root, 'assets/branding'), { recursive: true });
    await cp(path.join(source, 'assets/branding/og-preview-bw.png'), path.join(root, 'assets/branding/og-preview-bw.png'));
    await writeFile(path.join(root, 'index.html'), '<!-- works:featured:start --><!-- works:featured:end -->');
    await writeFile(path.join(root, 'works/index.html'), '<html><head><title>Works | JR Bone</title><link rel="canonical" href="https://jrpbone.vercel.app/works/"></head><body><!-- works:index:start --><!-- works:index:end --></body></html>');
    const base = JSON.parse(await readFile(path.join(source, 'works/projects.json'), 'utf8'))[0];
    const projects = Array.from({ length: 11 }, (_, index) => ({ ...base, slug: `project-${index}`, name: `Project ${index}`, date: `2026-${String(index + 1).padStart(2, '0')}`, published: index !== 10, featured: true, cover: '/assets/branding/og-preview-bw.png', liveUrl: index === 9 ? 'https://example.com/' : undefined }));
    for (const project of projects) {
      await mkdir(path.join(root, 'works', project.slug));
      await writeFile(path.join(root, 'works', project.slug, 'index.html'), '<html><head></head><body><div class="project-actions"><a>Old code</a></div><!-- works:neighbors:start --><!-- works:neighbors:end --></body></html>');
    }
    const registry = path.join(root, 'works/projects.json');
    await writeFile(registry, JSON.stringify(projects));
    run('tools/build-works.mjs');
    const home = await readFile(path.join(root, 'index.html'), 'utf8');
    assert.equal((home.match(/class="home-project featured-project"/g) || []).length, 3);
    assert.ok(home.indexOf('project-9/') < home.indexOf('project-8/'));
    assert.ok(home.indexOf('project-8/') < home.indexOf('project-7/'));
    const index = await readFile(path.join(root, 'works/index.html'), 'utf8');
    assert.equal((index.match(/class="home-project"/g) || []).length, 9);
    const second = await readFile(path.join(root, 'works/page/2/index.html'), 'utf8');
    assert.equal((second.match(/class="home-project"/g) || []).length, 1);
    assert.ok(second.includes('https://jrpbone.vercel.app/works/page/2/'));
    assert.ok(second.includes('aria-current="page"'));
    assert.ok((await readFile(path.join(root, 'works/project-9/index.html'), 'utf8')).includes('Live demo'));
    assert.ok((await readFile(path.join(root, 'works/project-10/index.html'), 'utf8')).includes('noindex, nofollow'));
    assert.ok(!(await readFile(path.join(root, 'sitemap.xml'), 'utf8')).includes('project-10'));
    run('tools/new-project.mjs', 'demo', 'Demo <Project>');
    let registryData = JSON.parse(await readFile(registry, 'utf8'));
    const demo = registryData.find(p => p.slug === 'demo');
    assert.equal(demo.published, false);
    assert.ok((await readFile(path.join(root, 'works/demo/index.html'), 'utf8')).includes('Demo &lt;Project&gt;'));
    assert.throws(() => run('tools/new-project.mjs', '../escape', 'Escape'));
    assert.throws(() => run('tools/new-project.mjs', 'demo', 'Duplicate'));
    demo.published = true;
    await writeFile(registry, JSON.stringify(registryData));
    run('tools/build-works.mjs');
    const generated = await readFile(path.join(root, 'works/demo/index.html'), 'utf8');
    assert.ok(!generated.includes('{{'));
    assert.ok((await readFile(path.join(root, 'works/index.html'), 'utf8')).includes('/works/demo/'));
    // Dropping below ten projects cleans up obsolete static pagination.
    await writeFile(registry, JSON.stringify(projects.slice(0, 1)));
    run('tools/build-works.mjs');
    await assert.rejects(readFile(path.join(root, 'works/page/2/index.html')));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const startup = await readFile(new URL('tools/partials/startup.html', root), 'utf8');
const script = startup.match(/<script>([\s\S]*?)<\/script>/)[1];

test('the first-paint theme respects saved choices, system defaults, and unavailable storage', () => {
  for (const [saved, systemDark, expected] of [
    ['dark', false, 'dark'], ['light', true, 'light'],
    [null, true, 'dark'], [null, false, 'light'],
    ['invalid', true, 'dark'], ['blocked', true, 'dark'],
  ]) {
    const html = { dataset: {}, setAttribute(name, value) { this[name] = value; } };
    vm.runInNewContext(script, {
      document: { documentElement: html },
      localStorage: { getItem() { if (saved === 'blocked') throw new Error('Storage blocked'); return saved; } },
      window: { matchMedia: () => ({ matches: systemDark }) },
    });
    assert.equal(html.dataset.theme, expected);
    assert.equal(html['data-theme-ready'], '');
  }
});

test('every shared page resolves its theme before styles and navigation markup', async () => {
  const registry = JSON.parse(await readFile(new URL('works/projects.json', root), 'utf8'));
  const pages = ['index.html', 'works/index.html', 'about/index.html', 'contact/index.html',
    'works/_template/index.html', ...registry.map(p => `works/${p.slug}/index.html`)];
  for (const page of pages) {
    const html = await readFile(new URL(page, root), 'utf8');
    const start = html.indexOf('<!-- site:startup:start -->');
    const end = html.indexOf('<!-- site:startup:end -->');
    assert.ok(start > html.indexOf('<head'), page);
    assert.ok(end > start && end < html.search(/<link\b[^>]*rel="stylesheet"/), page);
    assert.ok(end < html.indexOf('<!-- site:header:start -->'), page);
    assert.equal(html.split('<!-- site:startup:start -->').length, 2, page);
  }
});

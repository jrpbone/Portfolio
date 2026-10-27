import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const script = await readFile(new URL('../assets/page-loading.js', import.meta.url), 'utf8');
function harness(path = '/', images = []) {
  const events = {};
  const root = { dataset: {} };
  const main = { setAttribute(name, value) { this[name] = value; }, removeAttribute(name) { delete this[name]; } };
  let timeout;
  let releaseFont;
  const ready = new Promise(resolve => { releaseFont = resolve; });
  vm.runInNewContext(script, {
    location: { pathname: path }, innerHeight: 900,
    document: { documentElement: root, fonts: { ready }, querySelector: () => main,
      querySelectorAll: () => images, addEventListener: (name, handler) => { events[name] = handler; } },
    setTimeout(handler) { timeout = handler; return 1; }, clearTimeout() {},
    requestAnimationFrame(handler) { handler(); },
    addEventListener(name, handler) { events[name] = handler; },
  });
  return { root, main, events, releaseFont, expire: () => timeout() };
}

test('skeletons wait for fonts and visible images, then release the existing content', async () => {
  let releaseImage;
  const image = { getBoundingClientRect: () => ({ top: 200 }), decode: () => new Promise(resolve => { releaseImage = resolve; }) };
  const h = harness('/', [image]);
  assert.equal(h.root.dataset.contentLoading, '');
  const loaded = h.events.DOMContentLoaded();
  h.releaseFont();
  await Promise.resolve();
  assert.equal(h.root.dataset.contentLoading, '');
  releaseImage();
  await loaded;
  assert.equal('contentLoading' in h.root.dataset, false);
  assert.equal('aria-busy' in h.main, false);
});

test('stalled resources and restored cached pages cannot leave skeletons stuck', async () => {
  const h = harness('/works/');
  const loaded = h.events.DOMContentLoaded();
  h.expire();
  assert.equal('contentLoading' in h.root.dataset, false);
  assert.equal('aria-busy' in h.main, false);
  h.releaseFont();
  await loaded;
  const restored = harness('/index.html');
  restored.events.pageshow({ persisted: true });
  assert.equal('contentLoading' in restored.root.dataset, false);
});

test('only Home and Works listing routes use skeletons', () => {
  for (const route of ['/', '/index.html', '/works/', '/works/index.html', '/works/page/2/']) {
    assert.equal(harness(route).root.dataset.contentLoading, '', route);
  }
  for (const route of ['/about/', '/contact/', '/works/karaok/']) {
    assert.equal('contentLoading' in harness(route).root.dataset, false, route);
  }
});

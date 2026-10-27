import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
const source = readFileSync(new URL('../assets/navigation.js', import.meta.url), 'utf8');

function preview(url, reduced = false) {
  const events = {}, scrolls = [], redirects = [];
  const location = new URL(url);
  location.replace = next => { redirects.push(next); location.href = new URL(next, location).href; };
  const target = id => ({ hasAttribute: () => false, setAttribute() {}, focus() {}, scrollIntoView: options => scrolls.push({ id, ...options }) });
  const targets = Object.fromEntries(['featured-work', 'services', 'contact', 'main-content'].map(id => [id, target(id)]));
  const document = { readyState: 'complete', getElementById: id => targets[id] || null, addEventListener: (name, callback) => events[name] = callback };
  const history = { state: null, replaceState(state, unused, next) { location.href = new URL(next, location).href; } };
  const window = { location, history, matchMedia: () => ({ matches: reduced }), addEventListener: (name, callback) => events[name] = callback };
  vm.runInNewContext(source, { window, document, URL, requestAnimationFrame: callback => callback() });
  return { location, scrolls, redirects, events };
}

test('old homepage contact URLs redirect to the full contact page', () => {
  for (const url of ['http://localhost/index.html?section=contact', 'http://localhost/#contact']) {
    const page = preview(url);
    assert.deepEqual(page.redirects, ['/contact/']);
    assert.equal(page.scrolls.length, 0);
  }
});
test('legacy About redirects preserve unrelated query parameters', () => {
  const page = preview('http://localhost/index.html?section=about&ref=portfolio');
  assert.deepEqual(page.redirects, ['/about/?ref=portfolio']);
});
test('legacy work destinations arrive at the generated featured section', () => {
  for (const destination of ['selected-work', 'recent-work', 'featured-work']) {
    const page = preview(`http://localhost/index.html?section=${destination}&ref=portfolio`);
    assert.equal(page.location.search, '?ref=portfolio');
    assert.equal(page.scrolls[0].id, 'featured-work');
    assert.equal(preview(page.location.href).scrolls.length, 0);
  }
});
test('arrivals on the new Contact page scroll without redirect loops', () => {
  const page = preview('http://localhost/contact/?section=contact');
  assert.equal(page.redirects.length, 0);
  assert.equal(page.scrolls[0].id, 'contact');
  assert.equal(page.location.search, '');
});
test('ordinary reload leaves browser scroll restoration alone', () => {
  assert.equal(preview('http://localhost/').scrolls.length, 0);
});
test('same-page section clicks scroll; modified and cross-page clicks stay native', () => {
  const page = preview('http://localhost/');
  let prevented = false;
  const link = { dataset: { section: 'featured-work' }, href: 'http://localhost/#featured-work', target: '', hasAttribute: () => false };
  const event = { button: 0, target: { closest: () => link }, preventDefault: () => prevented = true };
  page.events.click(event);
  assert.equal(prevented, true);
  assert.equal(page.location.href, 'http://localhost/');
  assert.equal(page.scrolls[0].behavior, 'smooth');
  prevented = false;
  page.events.click({ ...event, ctrlKey: true });
  assert.equal(prevented, false);
  const project = preview('http://localhost/works/karaok/');
  project.events.click(event);
  assert.equal(prevented, false);
});
test('reduced motion makes section arrival immediate', () => {
  const page = preview('http://localhost/', true);
  const link = { dataset: { section: 'featured-work' }, href: 'http://localhost/#featured-work', target: '', hasAttribute: () => false };
  page.events.click({ button: 0, target: { closest: () => link }, preventDefault() {} });
  assert.equal(page.scrolls[0].behavior, 'instant');
});

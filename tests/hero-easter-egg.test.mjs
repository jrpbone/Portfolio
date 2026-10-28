import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { setupHeroAnimation, singlePlayGif } from '../assets/hero-easter-egg.js';
const settle = () => new Promise(setImmediate);
function harness(ready) {
  const image = new EventTarget(), attrs = { src: '/assets/first_hero.jpg' }, timers = new Map();
  let visibility, next = 0;
  image.getAttribute = key => attrs[key];
  image.setAttribute = (key, value) => { attrs[key] = value; };
  image.alt = 'Original';
  Object.defineProperty(image, 'attributes', { get: () => Object.entries(attrs).map(([name, value]) => ({ name, value })) });
  image.replaceWith = portrait => Object.assign(attrs, portrait.attrs);
  setupHeroAnimation(image, {
    prepareAnimation: async () => 'blob:animation',
    prepareFinal: async () => { await ready; return { attrs: { src: '/assets/second_hero.jpg' }, setAttribute(key, value) { this.attrs[key] = value; } }; },
    observeVisibility(callback) { visibility = callback; return () => {}; },
    schedule(fn, delay) { timers.set(++next, { fn, delay }); return next; }, cancel(id) { timers.delete(id); }
  });
  return { image, attrs, timers, visible(value) { visibility(value); }, async play() { image.dispatchEvent(new Event('click')); await settle(); image.dispatchEvent(new Event('load')); }, async end() { await [...timers.values()][0].fn(); await settle(); } };
}
test('holds final frame until fully offscreen, then shows photo and cannot replay', async () => {
  const p = harness(); await p.play(); await p.end();
  assert.equal(p.attrs.src, 'blob:animation');
  p.visible(true); await settle(); assert.equal(p.attrs.src, 'blob:animation');
  p.visible(false); await settle(); assert.equal(p.attrs.src, '/assets/second_hero.jpg');
  p.visible(true); p.image.dispatchEvent(new Event('click')); await settle();
  assert.equal(p.attrs.src, '/assets/second_hero.jpg');
  assert.equal(harness().attrs.src, '/assets/first_hero.jpg');
});
test('scrolling away mid-animation waits for playback to finish', async () => {
  const p = harness(); await p.play(); p.visible(false); await settle();
  assert.equal(p.attrs.src, 'blob:animation');
  await p.end(); assert.equal(p.attrs.src, '/assets/second_hero.jpg');
});
test('returning before portrait decode completes postpones the swap', async () => {
  let resolve;
  const p = harness(new Promise(r => { resolve = r; }));
  await p.play(); await p.end(); p.visible(false); await settle();
  p.visible(true); resolve(); await settle(); assert.equal(p.attrs.src, 'blob:animation');
  p.visible(false); await settle(); assert.equal(p.attrs.src, '/assets/second_hero.jpg');
});
test('animation load failure restores original photo', async () => {
  const p = harness(); await p.play(); p.image.dispatchEvent(new Event('error'));
  assert.equal(p.attrs.src, '/assets/first_hero.jpg'); assert.equal(p.timers.size, 0);
});
test('GIF conversion removes only the loop extension, preserving every frame', async () => {
  const original = await readFile(new URL('../assets/hero.gif', import.meta.url));
  const start = original.indexOf('NETSCAPE2.0') - 3;
  assert.ok(start > 0);
  assert.deepEqual(Buffer.from(singlePlayGif(original)), Buffer.concat([original.subarray(0, start), original.subarray(start + 19)]));
});

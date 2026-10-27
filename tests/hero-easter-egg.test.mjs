import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { setupHeroAnimation, singlePlayGif } from '../assets/hero-easter-egg.js';
const settle = () => new Promise(setImmediate);
function portrait(ready) {
  const image = new EventTarget();
  const attrs = { src: '/assets/first_hero.jpg' };
  image.alt = 'Portrait';
  image.getAttribute = key => attrs[key];
  image.setAttribute = (key, value) => { attrs[key] = value; };
  Object.defineProperty(image, 'attributes', { get: () => Object.entries(attrs).map(([name, value]) => ({ name, value })) });
  let overlay, visibility;
  image.after = next => { overlay = next; };
  image.remove = () => Object.assign(attrs, overlay.attrs);
  const final = { attrs: { src: '/assets/second_hero.jpg' }, decode: async () => {}, remove() {}, setAttribute(key, value) { this.attrs[key] = value; }, removeAttribute(key) { delete this.attrs[key]; delete attrs[key]; } };
  const timers = new Map();
  let next = 0;
  setupHeroAnimation(image, {
    paint: async () => {}, prepareAnimation: async () => 'blob:animation',
    observeVisibility(callback) { visibility = callback; return () => {}; },
    prepareFinal: async () => { if (ready) await ready; return final; },
    schedule(fn, delay) { timers.set(++next, { fn, delay }); return next; }, cancel(id) { timers.delete(id); }
  });
  return { image, attrs, timers, visibility: value => visibility(value), async play() { image.dispatchEvent(new Event('click')); await settle(); image.dispatchEvent(new Event('load')); } };
}
test('holds the completed GIF while visible, swaps offscreen, and cannot replay', async () => {
  const p = portrait();
  await p.play();
  assert.equal(p.attrs.src, 'blob:animation');
  const cycle = [...p.timers.values()][0];
  assert.equal(cycle.delay, 4000);
  await cycle.fn();
  await settle();
  assert.equal(p.attrs.src, 'blob:animation');
  p.visibility(false);
  await settle();
  assert.equal(p.attrs.src, '/assets/second_hero.jpg');
  p.visibility(true);
  p.image.dispatchEvent(new Event('click'));
  await settle();
  assert.equal(p.attrs.src, '/assets/second_hero.jpg');
  assert.equal(portrait().attrs.src, '/assets/first_hero.jpg');
});
test('scrolling away before playback ends waits for the end', async () => {
  const p = portrait(); await p.play(); p.visibility(false);
  await settle(); assert.equal(p.attrs.src, 'blob:animation');
  await [...p.timers.values()][0].fn();
  assert.equal(p.attrs.src, '/assets/second_hero.jpg');
});
test('returning while the photo decodes postpones replacement until offscreen again', async () => {
  let decoded;
  const p = portrait(new Promise(resolve => { decoded = resolve; }));
  await p.play(); await [...p.timers.values()][0].fn();
  p.visibility(false); await settle(); p.visibility(true); decoded(); await settle();
  assert.equal(p.attrs.src, 'blob:animation');
  p.visibility(false); await settle();
  assert.equal(p.attrs.src, '/assets/second_hero.jpg');
});
test('failed animation loading restores the original photo', async () => {
  const p = portrait(); await p.play(); p.image.dispatchEvent(new Event('error'));
  assert.equal(p.attrs.src, '/assets/first_hero.jpg');
  assert.equal(p.timers.size, 0);
});
test('single-play GIF removes only the loop extension from the actual asset', async () => {
  const original = await readFile(new URL('../assets/hero.gif', import.meta.url));
  const result = Buffer.from(singlePlayGif(original));
  const app = original.indexOf('NETSCAPE2.0');
  assert.ok(app > 0);
  const start = app - 3;
  assert.deepEqual(result, Buffer.concat([original.subarray(0, start), original.subarray(start + 19)]));
  assert.equal(result.includes(Buffer.from('NETSCAPE2.0')), false);
});

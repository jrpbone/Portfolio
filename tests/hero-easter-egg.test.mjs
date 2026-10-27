import test from 'node:test';
import assert from 'node:assert/strict';
import { setupHeroAnimation } from '../assets/hero-easter-egg.js';

function portrait(ready, paint = async () => {}) {
  const image = new EventTarget();
  const attrs = { src: '/assets/first_hero.jpg' };
  image.alt = 'Portrait of JR Bone';
  image.getAttribute = key => attrs[key];
  image.setAttribute = (key, value) => { attrs[key] = value; };
  Object.defineProperty(image, 'attributes', { get: () => Object.entries(attrs).map(([name, value]) => ({ name, value })) });
  let overlay;
  image.after = next => { overlay = next; };
  image.remove = () => { Object.assign(attrs, overlay.attrs); image.alt = overlay.alt; };
  const final = { attrs: { src: '/assets/second_hero.jpg' }, decode: async () => {}, setAttribute(key, value) { this.attrs[key] = value; }, removeAttribute(key) { delete this.attrs[key]; delete attrs[key]; } };
  const timers = new Map();
  let next = 0;
  setupHeroAnimation(image, { paint, prepareFinal: async () => { if (ready) await ready; return final; }, schedule(fn, delay) { timers.set(++next, { fn, delay }); return next; }, cancel(id) { timers.delete(id); } });
  return { image, attrs, timers };
}

test('photo plays once and shows the final portrait after the four-second GIF cycle', async () => {
  const { image, attrs, timers } = portrait();
  assert.equal(attrs.src, '/assets/first_hero.jpg');
  image.dispatchEvent(new Event('click'));
  assert.equal(attrs.src, '/assets/hero.gif');
  image.dispatchEvent(new Event('load'));
  assert.equal(timers.size, 1);
  const cycle = [...timers.values()][0];
  assert.equal(cycle.delay, 4000);
  image.dispatchEvent(new Event('click'));
  assert.equal(timers.size, 1);
  await cycle.fn();
  assert.equal(attrs.src, '/assets/second_hero.jpg');
  assert.equal(image.alt, 'J.R. Bone facing the camera');
  image.dispatchEvent(new Event('click'));
  assert.equal(attrs.src, '/assets/second_hero.jpg');
  const refreshed = portrait();
  refreshed.image.dispatchEvent(new Event('click'));
  assert.equal(refreshed.attrs.src, '/assets/hero.gif');
});

test('the GIF stays displayed until the replacement has finished decoding', async () => {
  let decoded;
  const ready = new Promise(resolve => { decoded = resolve; });
  const { image, attrs, timers } = portrait(ready);
  image.dispatchEvent(new Event('click'));
  image.dispatchEvent(new Event('load'));
  const transition = [...timers.values()][0].fn();
  await Promise.resolve();
  assert.equal(attrs.src, '/assets/hero.gif');
  decoded();
  await transition;
  assert.equal(attrs.src, '/assets/second_hero.jpg');
});

test('failed or stalled GIF loading restores the photo', () => {
  for (const error of [true, false]) {
    const { image, attrs, timers } = portrait();
    image.dispatchEvent(new Event('click'));
    if (error) image.dispatchEvent(new Event('error'));
    else [...timers.values()][0].fn();
    assert.equal(attrs.src, '/assets/first_hero.jpg');
    assert.equal(timers.size, 0);
  }
});

test('the GIF remains underneath the new image through two paint frames', async () => {
  const paints = [];
  const { image, attrs, timers } = portrait(undefined, () => new Promise(resolve => paints.push(resolve)));
  image.dispatchEvent(new Event('click'));
  image.dispatchEvent(new Event('load'));
  const transition = [...timers.values()][0].fn();
  await new Promise(setImmediate);
  assert.equal(attrs.src, '/assets/hero.gif');
  assert.equal(paints.length, 1);
  paints.shift()();
  await new Promise(setImmediate);
  assert.equal(attrs.src, '/assets/hero.gif');
  assert.equal(paints.length, 1);
  paints.shift()();
  await transition;
  assert.equal(attrs.src, '/assets/second_hero.jpg');
  assert.equal('data-hero-overlay' in attrs, false);
});

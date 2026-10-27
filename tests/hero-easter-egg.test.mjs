import test from 'node:test';
import assert from 'node:assert/strict';
import { setupHeroAnimation } from '../assets/hero-easter-egg.js';

function portrait() {
  const image = new EventTarget();
  const attrs = { src: '/assets/jr-bone-hero.jpg' };
  image.alt = 'Portrait of JR Bone';
  image.getAttribute = key => attrs[key];
  image.setAttribute = (key, value) => { attrs[key] = value; };
  const timers = new Map();
  let next = 0;
  setupHeroAnimation(image, { schedule(fn, delay) { timers.set(++next, { fn, delay }); return next; }, cancel(id) { timers.delete(id); } });
  return { image, attrs, timers };
}

test('photo plays once and shows the final portrait after the four-second GIF cycle', () => {
  const { image, attrs, timers } = portrait();
  assert.equal(attrs.src, '/assets/jr-bone-hero.jpg');
  image.dispatchEvent(new Event('click'));
  assert.equal(attrs.src, '/assets/hero-animation.gif');
  image.dispatchEvent(new Event('load'));
  assert.equal(timers.size, 1);
  const cycle = [...timers.values()][0];
  assert.equal(cycle.delay, 4000);
  image.dispatchEvent(new Event('click'));
  assert.equal(timers.size, 1);
  cycle.fn();
  assert.equal(attrs.src, '/assets/hero-face.jpg');
  assert.equal(image.alt, 'J.R. Bone facing the camera');
  image.dispatchEvent(new Event('click'));
  assert.equal(attrs.src, '/assets/hero-face.jpg');
  const refreshed = portrait();
  refreshed.image.dispatchEvent(new Event('click'));
  assert.equal(refreshed.attrs.src, '/assets/hero-animation.gif');
});

test('failed or stalled GIF loading restores the photo', () => {
  for (const error of [true, false]) {
    const { image, attrs, timers } = portrait();
    image.dispatchEvent(new Event('click'));
    if (error) image.dispatchEvent(new Event('error'));
    else [...timers.values()][0].fn();
    assert.equal(attrs.src, '/assets/jr-bone-hero.jpg');
    assert.equal(timers.size, 0);
  }
});

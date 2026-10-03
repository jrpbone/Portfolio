import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../assets/scroll-background.js", import.meta.url), "utf8");

async function preview({ reduced = false, failed = false } = {}) {
  const events = {};
  const videoEvents = {};
  const callbacks = new Map();
  const classes = new Set();
  const seeks = [];
  let currentTime = 0;
  let id = 0;
  let fetches = 0;
  let changeMotion;
  const preference = { matches: reduced, addEventListener: (_, cb) => changeMotion = cb };
  const video = {
    duration: 9.3,
    seeking: false,
    setAttribute() {},
    load() {},
    classList: {
      toggle(name, enabled) { enabled ? classes.add(name) : classes.delete(name); },
      remove(name) { classes.delete(name); },
    },
    addEventListener: (name, cb) => videoEvents[name] = cb,
    get currentTime() { return currentTime; },
    set currentTime(value) { currentTime = value; seeks.push(value); this.seeking = true; },
  };
  const window = {
    innerHeight: 1000, scrollY: 0,
    matchMedia: () => preference,
    addEventListener: (name, cb) => events[name] = cb,
  };
  const document = {
    body: { prepend() {} }, hidden: false,
    documentElement: { scrollHeight: 11000 },
    createElement: () => video,
    addEventListener: (name, cb) => events[name] = cb,
  };
  vm.runInNewContext(source, {
    window, document,
    fetch: async () => { fetches++; return { ok: !failed, status: 500, blob: async () => ({}) }; },
    URL: { createObjectURL: () => "blob:buffered", revokeObjectURL() {} },
    ResizeObserver: class { observe() {} },
    requestAnimationFrame: cb => { callbacks.set(++id, cb); return id; },
    cancelAnimationFrame: key => callbacks.delete(key),
  });
  await new Promise(resolve => setImmediate(resolve));
  return {
    video, classes, seeks, window, document, events,
    get fetches() { return fetches; },
    ready() { videoEvents.loadeddata(); },
    finishSeek() { video.seeking = false; videoEvents.seeked(); },
    motion(value) { preference.matches = value; changeMotion(); },
    frame(time) {
      const batch = [...callbacks.values()]; callbacks.clear();
      batch.forEach(cb => cb(time));
    },
  };
}

test("poster remains until buffered video has decoded data; failures retain poster", async () => {
  const page = await preview();
  assert.equal(page.video.src, "blob:buffered");
  assert.equal(page.classes.has("is-ready"), false);
  page.ready();
  assert.equal(page.classes.has("is-ready"), true);
  const failed = await preview({ failed: true });
  assert.equal(failed.video.src, undefined);
  assert.equal(failed.classes.has("is-ready"), false);
});

test("rapid scrolling does not interrupt a pending seek and resumes toward newest target", async () => {
  const page = await preview();
  page.ready();
  page.window.scrollY = 10000;
  page.events.scroll();
  page.frame(16);
  assert.ok(page.seeks[0] > 0 && page.seeks[0] < 9);
  page.window.scrollY = 0;
  page.events.scroll();
  page.frame(32);
  assert.equal(page.seeks.length, 1, "do not cancel an unfinished decode");
  page.finishSeek();
  page.frame(48);
  assert.ok(page.seeks[1] < page.seeks[0], "reverse toward the newest scroll position");
  for (let i = 0; i < 100; i++) { page.finishSeek(); page.frame(64 + i * 16); }
  assert.equal(page.video.currentTime, 0);
});

test("reduced motion avoids downloading and hides video when enabled later", async () => {
  const page = await preview({ reduced: true });
  assert.equal(page.fetches, 0);
  page.motion(false);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(page.fetches, 1);
  page.ready();
  assert.equal(page.classes.has("is-ready"), true);
  page.motion(true);
  assert.equal(page.classes.has("is-ready"), false);
});

test("scroll endpoint stays within the last frame and hidden pages stop seeking", async () => {
  const page = await preview();
  page.ready();
  page.window.scrollY = 20000;
  page.events.scroll();
  for (let i = 0; i < 100; i++) { page.finishSeek(); page.frame(16 + i * 16); }
  assert.ok(Math.abs(page.video.currentTime - (9.3 - 1 / 30)) < 0.001);
  const count = page.seeks.length;
  page.document.hidden = true;
  page.events.visibilitychange();
  page.window.scrollY = 0;
  page.events.scroll();
  page.frame(2000);
  assert.equal(page.seeks.length, count);
});

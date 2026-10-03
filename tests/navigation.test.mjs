import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../assets/navigation.js", import.meta.url), "utf8");

function preview(url) {
  const events = {};
  const scrolls = [];
  const target = {
    hasAttribute: () => false,
    setAttribute() {},
    focus() {},
    scrollIntoView: (options) => scrolls.push(options),
  };
  const location = new URL(url);
  const history = { state: null, replaceState(state, unused, next) { Object.assign(location, { href: new URL(next, location).href }); } };
  const document = {
    readyState: "complete",
    getElementById: (id) => id === "contact" ? target : null,
    addEventListener: (name, callback) => events[name] = callback,
  };
  const window = { location, history, matchMedia: () => ({ matches: false }), addEventListener: (name, callback) => events[name] = callback };
  vm.runInNewContext(source, { window, document, URL, requestAnimationFrame: (cb) => cb() });
  return { location, scrolls, events };
}

test("legacy hash is removed after navigating to its section", () => {
  const page = preview("http://localhost/index.html#contact");
  assert.equal(page.location.hash, "");
  assert.equal(page.scrolls.length, 1);
});

test("cross-page destination is consumed without affecting other query parameters", () => {
  const page = preview("http://localhost/index.html?section=contact&ref=portfolio");
  assert.equal(page.location.search, "?ref=portfolio");
  assert.equal(page.scrolls.length, 1);
  assert.equal(preview(page.location.href).scrolls.length, 0, "refresh must not jump to the section again");
});

test("ordinary reload leaves browser scroll restoration alone", () => {
  assert.equal(preview("http://localhost/index.html").scrolls.length, 0);
});

test("section clicks scroll without changing the URL; modified clicks stay native", () => {
  const page = preview("http://localhost/index.html");
  let prevented = false;
  const link = { dataset: { section: "contact" }, href: "http://localhost/index.html?section=contact", target: "", hasAttribute: () => false };
  const event = { button: 0, target: { closest: () => link }, preventDefault: () => prevented = true };
  page.events.click(event);
  assert.equal(prevented, true);
  assert.equal(page.location.href, "http://localhost/index.html");
  assert.equal(page.scrolls.length, 1);
  prevented = false;
  page.events.click({ ...event, ctrlKey: true });
  assert.equal(prevented, false);
});

// Section destinations are transient; refresh uses native scroll restoration.
const normalizePath = (path) => path.replace(/\/index\.html$/, "/");

function goToSection(id, behavior) {
  const section = document.getElementById(id);
  if (!section) return false;
  if (!section.hasAttribute("tabindex")) section.setAttribute("tabindex", "-1");
  section.focus({ preventScroll: true });
  section.scrollIntoView({ behavior, block: "start" });
  return true;
}

document.addEventListener("click", (event) => {
  if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  const link = event.target.closest("a[data-section]");
  if (!link || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;
  const destination = new URL(link.href, window.location.href);
  if (destination.origin !== window.location.origin ||
      normalizePath(destination.pathname) !== normalizePath(window.location.pathname)) return;
  const section = document.getElementById(link.dataset.section);
  if (!section) return;
  event.preventDefault();
  const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth";
  goToSection(link.dataset.section, behavior);
});

// Support incoming links from other pages and old bookmarked fragment URLs.
const arrival = new URL(window.location.href);
let destination = arrival.searchParams.get("section");
if (!destination && arrival.hash) {
  try { destination = decodeURIComponent(arrival.hash.slice(1)); } catch { destination = null; }
}
if (arrival.hash || arrival.searchParams.has("section")) {
  arrival.hash = "";
  arrival.searchParams.delete("section");
  window.history.replaceState(window.history.state, "", arrival.pathname + arrival.search);
}
if (destination) {
  const scrollOnArrival = () => requestAnimationFrame(() => goToSection(destination, "instant"));
  if (document.readyState === "complete") scrollOnArrival();
  else window.addEventListener("load", scrollOnArrival, { once: true });
}

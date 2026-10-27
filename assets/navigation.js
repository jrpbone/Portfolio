// Native links work without scripting. Legacy section URLs route to the new pages.
(() => {
  const normalizePath = path => path.replace(/\/index\.html$/, '/');
  const aliases = { 'selected-work': 'featured-work', 'recent-work': 'featured-work' };
  const sectionId = id => aliases[id] || id;
  function goToSection(id, behavior) {
    const section = document.getElementById(sectionId(id));
    if (!section) return false;
    if (!section.hasAttribute('tabindex')) section.setAttribute('tabindex', '-1');
    section.focus({ preventScroll: true });
    section.scrollIntoView({ behavior, block: 'start' });
    return true;
  }
  document.addEventListener('click', event => {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[data-section]');
    if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    const destination = new URL(link.href, window.location.href);
    if (destination.origin !== window.location.origin || normalizePath(destination.pathname) !== normalizePath(window.location.pathname)) return;
    if (!document.getElementById(sectionId(link.dataset.section))) return;
    event.preventDefault();
    goToSection(link.dataset.section, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth');
  });
  const arrival = new URL(window.location.href);
  let destination = arrival.searchParams.get('section');
  if (!destination && arrival.hash) {
    try { destination = decodeURIComponent(arrival.hash.slice(1)); } catch { destination = null; }
  }
  const oldPage = normalizePath(arrival.pathname) === '/';
  if (oldPage && ['contact', 'about'].includes(destination)) {
    arrival.pathname = `/${destination}/`;
    arrival.searchParams.delete('section');
    arrival.hash = '';
    window.location.replace(arrival.pathname + arrival.search);
    return;
  }
  if (arrival.hash || arrival.searchParams.has('section')) {
    arrival.hash = '';
    arrival.searchParams.delete('section');
    window.history.replaceState(window.history.state, '', arrival.pathname + arrival.search);
  }
  if (destination) {
    const scrollOnArrival = () => requestAnimationFrame(() => goToSection(destination, 'instant'));
    if (document.readyState === 'complete') scrollOnArrival();
    else window.addEventListener('load', scrollOnArrival, { once: true });
  }
})();

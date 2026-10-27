/* Both grids are static HTML; filtering and motion are optional. */
(() => {
  function init() {
    const grids = [...document.querySelectorAll('.works-grid, .home-work-grid')];
    if (!grids.length) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const gsap = window.gsap;
    const cards = grids.flatMap(grid => [...grid.querySelectorAll(':scope > .home-project')]);
    // Replace only site.js's card reveal, leaving its other timelines intact.
    if (gsap) gsap.getTweensOf(cards).forEach(tween => {
      tween.scrollTrigger?.kill();
      tween.kill();
    });
    if (gsap) gsap.set(cards, { clearProps: 'transform,opacity,visibility' });
    if (gsap && window.Flip) gsap.registerPlugin(window.Flip);
    const grid = document.querySelector('.works-grid');
    const filters = document.querySelector('.platform-filters');
    let flip;
    if (grid && filters) {
      const items = [...grid.querySelectorAll(':scope > .home-project')];
      const buttons = [...filters.querySelectorAll('button[data-platform]')];
      const allowed = new Set(['all', 'web', 'mobile', 'desktop']);
      const status = document.querySelector('.filter-status') || document.createElement('p');
      status.className = 'works-empty';
      status.setAttribute('role', 'status');
      status.setAttribute('aria-live', 'polite');
      if (!status.isConnected) grid.after(status);
      function apply(platform, animate = false) {
        if (!allowed.has(platform)) platform = 'all';
        flip?.kill();
        // Cancel pending reveals before Flip captures geometry.
        if (gsap) {
          gsap.getTweensOf(items).forEach(tween => { tween.scrollTrigger?.kill(); tween.kill(); });
          gsap.set(items, { clearProps: 'transform,opacity,visibility' });
        }
        const state = animate && !reduced.matches && gsap && window.Flip ? window.Flip.getState(items) : null;
        items.forEach(item => { item.hidden = platform !== 'all' && item.dataset.platform !== platform; });
        buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.platform === platform)));
        document.querySelectorAll('.works-pagination a').forEach(link => {
          const destination = new URL(link.href, location.href);
          if (platform === 'all') destination.searchParams.delete('platform');
          else destination.searchParams.set('platform', platform);
          link.href = destination.pathname + destination.search;
        });
        const count = items.filter(item => !item.hidden).length;
        status.textContent = count ? `${count} project${count === 1 ? '' : 's'} shown` : 'No projects on this page match this platform.';
        if (state) flip = window.Flip.from(state, { duration: .45, ease: 'power3.out', absolute: true, onEnter: elements => gsap.fromTo(elements, { opacity: 0, scale: .96 }, { opacity: 1, scale: 1, duration: .3, clearProps: 'transform,opacity' }), onComplete: () => window.ScrollTrigger?.refresh() });
        else window.ScrollTrigger?.refresh();
      }
      const read = () => new URL(location.href).searchParams.get('platform') || 'all';
      filters.hidden = false;
      apply(read());
      buttons.forEach(button => button.addEventListener('click', () => {
        const platform = button.dataset.platform;
        if (!allowed.has(platform)) return;
        const url = new URL(location.href);
        if (platform === 'all') url.searchParams.delete('platform');
        else url.searchParams.set('platform', platform);
        if (url.href !== location.href) history.pushState(null, '', url);
        apply(platform, true);
      }));
      addEventListener('popstate', () => apply(read(), true));
      reduced.addEventListener('change', () => { flip?.kill(); apply(read()); });
    }
    if (!(gsap && window.ScrollTrigger)) return;
    gsap.registerPlugin(window.ScrollTrigger);
    gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
      grids.forEach(grid => {
        const visible = [...grid.querySelectorAll(':scope > .home-project')].filter(card => !card.hidden);
        if (!visible.length) return;
        gsap.from(visible, { autoAlpha: 0, y: 16, scale: .96, duration: .6, stagger: { each: .06, grid: 'auto' }, ease: 'power3.out', clearProps: 'transform,opacity,visibility', scrollTrigger: { trigger: grid, start: 'top 88%', once: true } });
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => queueMicrotask(init), { once: true });
  else init();
})();


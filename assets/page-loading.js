/* Run before styles: skeletons reuse the real layout, rather than replacing it. */
(() => {
  if (!/^\/(?:index\.html)?$|^\/works\/(?:index\.html|page\/\d+\/?)?$/.test(location.pathname)) return;
  const root = document.documentElement;
  root.dataset.contentLoading = '';
  let finished = false;
  function finish() {
    if (finished) return;
    finished = true;
    clearTimeout(deadline);
    delete root.dataset.contentLoading;
    document.querySelector('main')?.removeAttribute('aria-busy');
  }
  // Content stays available even if a font, image, or third-party script stalls.
  const deadline = setTimeout(finish, 5000);
  document.addEventListener('DOMContentLoaded', async () => {
    if (finished) return;
    document.querySelector('main')?.setAttribute('aria-busy', 'true');
    const visibleImages = [...document.querySelectorAll('main img')]
      .filter(image => image.getBoundingClientRect().top < innerHeight);
    await Promise.allSettled([
      document.fonts?.ready,
      ...visibleImages.map(image => image.decode?.()),
    ]);
    requestAnimationFrame(() => requestAnimationFrame(finish));
  }, { once: true });
  // A restored back/forward-cache page must never retain its loading mask.
  addEventListener('pageshow', event => { if (event.persisted) finish(); });
})();

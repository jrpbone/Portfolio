/* Static links remain usable when any enhancement is unavailable. */
(() => {
  function init() {
    const page = document.querySelector('main.project-page');
    if (!page) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const links = [...page.querySelectorAll('.project-gallery a[href]')].filter(a => a.querySelector('img'));
    if (links.length && typeof HTMLDialogElement !== 'undefined' && HTMLDialogElement.prototype.showModal) {
      const dialog = document.createElement('dialog');
      dialog.className = 'project-lightbox';
      dialog.setAttribute('aria-label', 'Project screenshots');
      dialog.innerHTML = '<div class="project-lightbox-toolbar"><span class="project-lightbox-count" role="status" aria-live="polite"></span><div class="project-lightbox-controls"><button type="button" data-action="previous" aria-label="Previous screenshot">←</button><button type="button" data-action="next" aria-label="Next screenshot">→</button><button type="button" data-action="close" autofocus>Close</button></div></div><img alt=""><p class="project-lightbox-caption"></p>';
      document.body.append(dialog);
      const image = dialog.querySelector('img');
      const count = dialog.querySelector('.project-lightbox-count');
      const caption = dialog.querySelector('.project-lightbox-caption');
      let current = 0;
      let opener;
      function show(index) {
        current = (index + links.length) % links.length;
        const source = links[current].querySelector('img');
        image.src = links[current].href;
        image.alt = source.alt || 'Project screenshot';
        count.textContent = `${current + 1} of ${links.length}`;
        caption.textContent = links[current].closest('figure')?.querySelector('figcaption')?.textContent || source.alt;
      }
      dialog.querySelectorAll('[data-action]').forEach(button => {
        if (links.length === 1 && button.dataset.action !== 'close') button.hidden = true;
        button.addEventListener('click', () => {
          if (button.dataset.action === 'close') dialog.close();
          else show(current + (button.dataset.action === 'next' ? 1 : -1));
        });
      });
      links.forEach((link, index) => link.addEventListener('click', event => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        opener = link;
        show(index);
        dialog.showModal();
        document.documentElement.classList.add('project-lightbox-open');
        event.preventDefault();
      }));
      dialog.addEventListener('keydown', event => {
        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
          event.preventDefault();
          show(current + (event.key === 'ArrowRight' ? 1 : -1));
        }
      });
      // Native cancel handles Escape and the modal's focus containment.
      dialog.addEventListener('close', () => {
        document.documentElement.classList.remove('project-lightbox-open');
        if (opener?.isConnected) opener.focus({ preventScroll: true });
      });
      dialog.addEventListener('click', event => {
        const rect = dialog.getBoundingClientRect();
        if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
      });
    }

    const navLinks = [...page.querySelectorAll('.project-section-nav a[href^="#"]')];
    const sections = navLinks.map(link => document.getElementById(link.hash.slice(1))).filter(Boolean);
    const progress = document.querySelector('.scroll-progress');
    // Own this bar even when site.js skips pages without a homepage hero.
    if (progress && window.gsap) window.gsap.getTweensOf(progress).forEach(tween => { tween.scrollTrigger?.kill(); tween.kill(); });
    const ownProgress = Boolean(progress);
    if (progress) progress.style.opacity = '1';
    let pending = false;
    function update() {
      pending = false;
      const offset = (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 80) + 40;
      let active = sections[0];
      sections.forEach(section => { if (section.getBoundingClientRect().top <= offset) active = section; });
      if (innerHeight + scrollY >= document.documentElement.scrollHeight - 2) active = sections.at(-1);
      navLinks.forEach(link => {
        if (active && link.hash === `#${active.id}`) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
      if (ownProgress) {
        const distance = document.documentElement.scrollHeight - innerHeight;
        progress.style.transformOrigin = 'left center';
        progress.style.transform = `scaleX(${distance > 0 ? Math.min(1, Math.max(0, scrollY / distance)) : 1})`;
      }
    }
    function schedule() { if (!pending) { pending = true; requestAnimationFrame(update); } }
    addEventListener('scroll', schedule, { passive: true });
    addEventListener('resize', schedule);
    addEventListener('load', schedule);
    if (window.ResizeObserver) new ResizeObserver(schedule).observe(page);
    update();

    if (!(window.gsap && window.ScrollTrigger)) return;
    const gsap = window.gsap;
    gsap.registerPlugin(window.ScrollTrigger);
    gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
      const defaults = { duration: .6, ease: 'power3.out', clearProps: 'transform,opacity,visibility' };
      const hero = page.querySelector('.project-hero h1');
      const facts = page.querySelector('.project-facts');
      const intro = [hero, facts].filter(Boolean);
      if (intro.length) gsap.from(intro, { ...defaults, autoAlpha: 0, y: 24, stagger: .08 });
      page.querySelectorAll('.project-content > section').forEach(section => {
        gsap.from(section, { ...defaults, autoAlpha: 0, y: 24, scrollTrigger: { trigger: section, start: 'top 88%', once: true } });
      });
      const gallery = page.querySelector('.project-gallery');
      if (gallery) gsap.from([...gallery.children], { ...defaults, autoAlpha: 0, y: 24, stagger: { each: .06, grid: 'auto' }, scrollTrigger: { trigger: gallery, start: 'top 88%', once: true } });
      page.querySelectorAll('.architecture-diagram').forEach(diagram => {
        const nodes = diagram.querySelectorAll('.architecture-node');
        if (nodes.length) gsap.from(nodes, { ...defaults, autoAlpha: 0, y: 16, stagger: .1, scrollTrigger: { trigger: diagram, start: 'top 88%', once: true } });
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => queueMicrotask(init), { once: true });
  else init();
})();



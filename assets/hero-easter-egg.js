export function setupHeroAnimation(image, { schedule = setTimeout, cancel = clearTimeout } = {}) {
  if (!image) return;
  const original = image.getAttribute('src');
  const originalAlt = image.alt;
  let used = false;
  let completed = false;
  let timer;
  function restore() {
    cancel(timer);
    image.removeEventListener('load', loaded);
    image.removeEventListener('error', restore);
    image.setAttribute('src', original);
    image.alt = originalAlt;
  }
  function loaded() {
    cancel(timer);
    // The replacement GIF has 96 frames: one cycle lasts four seconds.
    timer = schedule(showFace, 4000);
  }
  function showFace() {
    completed = true;
    cancel(timer);
    image.removeEventListener('load', loaded);
    image.removeEventListener('error', restore);
    image.setAttribute('src', '/assets/hero-face.jpg');
    image.alt = 'J.R. Bone facing the camera';
  }
  function play() {
    if (used) return;
    used = true;
    image.setAttribute('aria-disabled', 'true');
    image.setAttribute('aria-label', 'Animated portrait already played; refresh to play again');
    image.addEventListener('load', loaded, { once: true });
    image.addEventListener('error', restore, { once: true });
    timer = schedule(restore, 30000);
    image.alt = 'Animated portrait of J.R. Bone';
    image.setAttribute('src', '/assets/hero-animation.gif');
  }
  image.setAttribute('role', 'button');
  image.setAttribute('tabindex', '0');
  image.setAttribute('aria-label', 'Play animated portrait once');
  image.addEventListener('click', play);
  image.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      play();
    }
  });
  return () => { if (completed) showFace(); else restore(); };
}

if (typeof document !== 'undefined') {
  const restore = setupHeroAnimation(document.querySelector('.hero-image-wrapper img'));
  if (restore) addEventListener('pagehide', restore);
}

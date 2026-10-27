// Remove only the GIF's loop instruction; the original frame data is unchanged.
export function singlePlayGif(bytes) {
  const chunks = [];
  let cursor = 13 + (bytes[10] & 128 ? 3 * 2 ** ((bytes[10] & 7) + 1) : 0);
  let keepFrom = 0;
  const skipBlocks = () => { while (bytes[cursor]) cursor += 1 + bytes[cursor]; cursor++; };
  while (cursor < bytes.length) {
    const start = cursor;
    if (bytes[cursor] === 0x3b) break;
    if (bytes[cursor] === 0x21) {
      const label = bytes[cursor + 1];
      cursor += 2;
      const app = label === 0xff ? String.fromCharCode(...bytes.subarray(cursor + 1, cursor + 12)) : '';
      skipBlocks();
      if (app === 'NETSCAPE2.0' || app === 'ANIMEXTS1.0') {
        chunks.push(bytes.subarray(keepFrom, start));
        keepFrom = cursor;
      }
    } else if (bytes[cursor] === 0x2c) {
      const packed = bytes[cursor + 9];
      cursor += 10 + (packed & 128 ? 3 * 2 ** ((packed & 7) + 1) : 0);
      cursor++; // LZW code size, followed by compressed data sub-blocks.
      skipBlocks();
    } else throw new Error('Invalid GIF block');
  }
  chunks.push(bytes.subarray(keepFrom));
  const result = new Uint8Array(chunks.reduce((size, chunk) => size + chunk.length, 0));
  let offset = 0;
  for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.length; }
  return result;
}

export function setupHeroAnimation(image, {
  schedule = setTimeout, cancel = clearTimeout,
  paint = () => new Promise(resolve => requestAnimationFrame(resolve)),
  prepareAnimation = async () => {
    const response = await fetch('/assets/hero.gif');
    if (!response.ok) throw new Error('Unable to load hero animation');
    const bytes = singlePlayGif(new Uint8Array(await response.arrayBuffer()));
    return URL.createObjectURL(new Blob([bytes], { type: 'image/gif' }));
  },
  observeVisibility = callback => {
    const observer = new IntersectionObserver(entries => callback(entries[0].isIntersecting));
    observer.observe(image);
    return () => observer.disconnect();
  },
  prepareFinal = async () => {
    const portrait = new Image();
    portrait.src = '/assets/second_hero.jpg';
    await portrait.decode();
    return portrait;
  },
} = {}) {
  if (!image) return;
  const original = image.getAttribute('src');
  const originalAlt = image.alt;
  let used = false;
  let completed = false;
  let timer;
  let finalPortrait;
  let cancelled = false;
  let visible = true;
  let animationFinished = false;
  let animationUrl;
  let transitioning = false;
  const stopObserving = observeVisibility(value => {
    visible = value;
    if (!visible && animationFinished) void showFace();
  });
  function restore() {
    cancelled = true;
    cancel(timer);
    image.removeEventListener('load', loaded);
    image.removeEventListener('error', restore);
    image.setAttribute('src', original);
    image.alt = originalAlt;
  }
  function loaded() {
    cancel(timer);
    // The replacement GIF has 96 frames: one cycle lasts four seconds.
    timer = schedule(() => {
      animationFinished = true;
      if (!visible) return showFace();
    }, 4000);
  }
  async function showFace() {
    if (completed || cancelled || visible || transitioning || !animationFinished) return;
    transitioning = true;
    const portrait = await finalPortrait;
    if (visible || completed || cancelled) { transitioning = false; return; }
    if (cancelled || !portrait) { if (!cancelled) restore(); return; }
    cancel(timer);
    image.removeEventListener('load', loaded);
    image.removeEventListener('error', restore);
    // Keep the GIF underneath until the mounted portrait has painted.
    for (const { name, value } of image.attributes) {
      if (name !== 'src' && name !== 'alt') portrait.setAttribute(name, value);
    }
    portrait.alt = 'J.R. Bone facing the camera';
    portrait.setAttribute('data-hero-overlay', '');
    image.after(portrait);
    try {
      await portrait.decode();
      await paint();
      await paint();
    } catch {
      portrait.remove();
      restore();
      return;
    }
    if (cancelled || visible) { portrait.remove(); transitioning = false; return; }
    completed = true;
    stopObserving();
    image.remove();
    portrait.removeAttribute('data-hero-overlay');
    image = portrait;
  }
  async function play() {
    if (used) return;
    used = true;
    finalPortrait = prepareFinal().catch(() => null);
    image.setAttribute('aria-disabled', 'true');
    image.setAttribute('aria-label', 'Animated portrait already played; refresh to play again');
    image.addEventListener('load', loaded, { once: true });
    image.addEventListener('error', restore, { once: true });
    timer = schedule(restore, 30000);
    image.alt = 'Animated portrait of J.R. Bone';
    try {
      animationUrl = await prepareAnimation();
      if (!cancelled) image.setAttribute('src', animationUrl);
    } catch { restore(); }
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
  return () => {
    stopObserving();
    if (!completed) restore();
    if (animationUrl?.startsWith('blob:')) URL.revokeObjectURL(animationUrl);
  };
}

if (typeof document !== 'undefined') {
  const restore = setupHeroAnimation(document.querySelector('.hero-image-wrapper img'));
  if (restore) addEventListener('pagehide', restore);
}

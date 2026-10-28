// Preserve the original frames, removing only the instruction to loop playback.
export function singlePlayGif(bytes) {
  let cursor = 13 + (bytes[10] & 128 ? 3 * 2 ** ((bytes[10] & 7) + 1) : 0);
  let keepFrom = 0;
  const chunks = [];
  function skipBlocks() {
    while (cursor < bytes.length && bytes[cursor]) cursor += bytes[cursor] + 1;
    if (cursor >= bytes.length) throw new Error('Invalid GIF data');
    cursor++;
  }
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
      cursor += 11 + (packed & 128 ? 3 * 2 ** ((packed & 7) + 1) : 0);
      skipBlocks();
    } else throw new Error('Invalid GIF block');
  }
  chunks.push(bytes.subarray(keepFrom));
  const result = new Uint8Array(chunks.reduce((sum, chunk) => sum + chunk.length, 0));
  let offset = 0;
  for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.length; }
  return result;
}

export function setupHeroAnimation(image, {
  schedule = setTimeout, cancel = clearTimeout,
  prepareAnimation = async () => {
    const response = await fetch('/assets/hero.gif');
    if (!response.ok) throw new Error('Unable to load animation');
    return URL.createObjectURL(new Blob([singlePlayGif(new Uint8Array(await response.arrayBuffer()))], { type: 'image/gif' }));
  },
  prepareFinal = async () => {
    const portrait = new Image();
    portrait.src = '/assets/second_hero.jpg';
    await portrait.decode();
    return portrait;
  },
  observeVisibility = callback => {
    const observer = new IntersectionObserver(entries => callback(entries[0].isIntersecting));
    observer.observe(image);
    return () => observer.disconnect();
  },
} = {}) {
  if (!image) return;
  const original = image.getAttribute('src');
  const originalAlt = image.alt;
  let used = false, completed = false, cancelled = false, finished = false, visible = true;
  let timer, animationUrl, finalPortrait;
  const stopObserving = observeVisibility(value => {
    visible = value;
    if (!visible && finished) void showFace();
  });
  function restore() {
    cancelled = true;
    cancel(timer);
    image.removeEventListener('load', loaded);
    image.removeEventListener('error', restore);
    image.setAttribute('src', original);
    image.alt = originalAlt;
  }
  async function showFace() {
    if (visible || !finished || cancelled || completed) return;
    const portrait = await finalPortrait;
    if (visible || cancelled || completed) return;
    if (!portrait) { restore(); return; }
    // This synchronous replacement happens only outside the viewport. The fully
    // decoded portrait replaces the frozen GIF without an empty image slot.
    for (const { name, value } of image.attributes) {
      if (name !== 'src' && name !== 'alt') portrait.setAttribute(name, value);
    }
    portrait.alt = 'J.R. Bone facing the camera';
    completed = true;
    stopObserving();
    image.replaceWith(portrait);
  }
  function loaded() {
    cancel(timer);
    timer = schedule(() => {
      finished = true; // The 96-frame asset plays once for four seconds.
      if (!visible) return showFace();
    }, 4000);
  }
  async function play() {
    if (used) return;
    used = true;
    finalPortrait = prepareFinal().catch(() => null);
    image.setAttribute('aria-disabled', 'true');
    image.setAttribute('aria-label', 'Animated portrait already played; refresh to play again');
    timer = schedule(restore, 30000);
    try {
      animationUrl = await prepareAnimation();
      if (cancelled) { URL.revokeObjectURL(animationUrl); return; }
      image.addEventListener('load', loaded, { once: true });
      image.addEventListener('error', restore, { once: true });
      image.alt = 'Animated portrait of J.R. Bone';
      image.setAttribute('src', animationUrl);
    } catch { restore(); }
  }
  image.setAttribute('role', 'button');
  image.setAttribute('tabindex', '0');
  image.setAttribute('aria-label', 'Play animated portrait once');
  image.addEventListener('click', play);
  image.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); void play(); }
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

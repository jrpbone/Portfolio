// Buffer the seek-friendly video before scrubbing; retain the CSS poster while loading.
const body = document.body;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const video = document.createElement("video");
video.className = "scroll-background";
video.muted = true;
video.playsInline = true;
video.preload = "auto";
video.setAttribute("aria-hidden", "true");
video.setAttribute("tabindex", "-1");
video.disablePictureInPicture = true;
body.prepend(video);

const FRAME_TIME = 1 / 30;
let loading = false;
let ready = false;
let target = 0;
let position = 0;
let animation = 0;
let previousTime = 0;
let objectUrl;

async function loadVideo() {
  if (loading || ready || reducedMotion.matches) return;
  loading = true;
  try {
    const response = await fetch("assets/video/intro-scroll.mp4");
    if (!response.ok) throw new Error(`Video request failed: ${response.status}`);
    objectUrl = URL.createObjectURL(await response.blob());
    video.src = objectUrl;
    video.load();
  } catch {
    // The CSS poster remains visible if the video cannot load.
    loading = false;
  }
}

function updateTarget() {
  const range = document.documentElement.scrollHeight - window.innerHeight;
  const progress = range > 0 ? Math.min(1, Math.max(0, window.scrollY / range)) : 0;
  target = ready && !reducedMotion.matches
    ? progress * Math.max(0, video.duration - FRAME_TIME)
    : 0;
  wake();
}

function tick(time) {
  animation = 0;
  if (video.seeking) {
    previousTime = 0;
    return; // Resume on seeked instead of repeatedly cancelling a decode.
  }
  const elapsed = previousTime ? Math.min(time - previousTime, 32) : 16;
  previousTime = time;
  const delta = target - position;
  position = Math.abs(delta) < FRAME_TIME / 4
    ? target
    : position + delta * (1 - Math.exp(-elapsed / 110));
  if (Math.abs(video.currentTime - position) > 0.001) video.currentTime = position;
  if (position !== target) wake();
  else previousTime = 0;
}

function wake() {
  if (!animation && ready && !document.hidden && !reducedMotion.matches) {
    animation = requestAnimationFrame(tick);
  }
}

function stopAnimation() {
  cancelAnimationFrame(animation);
  animation = 0;
  previousTime = 0;
}

video.addEventListener("loadeddata", () => {
  ready = Number.isFinite(video.duration) && video.duration > 0;
  video.classList.toggle("is-ready", ready && !reducedMotion.matches);
  updateTarget();
});
video.addEventListener("seeked", () => {
  if (position !== target) wake();
});
video.addEventListener("error", () => {
  ready = false;
  loading = false;
  stopAnimation();
  video.classList.remove("is-ready");
  if (objectUrl) URL.revokeObjectURL(objectUrl);
});

window.addEventListener("scroll", updateTarget, { passive: true });
window.addEventListener("resize", updateTarget, { passive: true });
window.addEventListener("pageshow", updateTarget);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopAnimation();
  else updateTarget();
});
reducedMotion.addEventListener("change", () => {
  stopAnimation();
  video.classList.toggle("is-ready", ready && !reducedMotion.matches);
  if (reducedMotion.matches) {
    position = target = 0;
    if (ready) video.currentTime = 0;
  } else {
    loadVideo();
    updateTarget();
  }
});
new ResizeObserver(updateTarget).observe(body);
loadVideo();

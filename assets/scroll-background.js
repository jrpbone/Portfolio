// Scroll scrubs the sequence; two body pseudo-elements blend adjacent frames.
const FRAME_COUNT = 240;
const CACHE_SIZE = 24;
const body = document.body;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const frames = new Map();
const pending = new Set();
const failed = new Set();
let position = 0;
let target = 0;
let animation = 0;
let previousTime = 0;
let lastPair = "";

const frameUrl = (index) =>
  `assets/Images/ezgif-frame-${String(index + 1).padStart(3, "0")}.jpg`;

function requestFrame(index) {
  if (frames.has(index) || pending.has(index) || failed.has(index)) return;
  pending.add(index);
  const image = new Image();
  image.decoding = "async";
  image.src = frameUrl(index);
  image.decode().then(() => {
    frames.set(index, image);
    // Keep decoded memory bounded, retaining the frames nearest the playhead.
    while (frames.size > CACHE_SIZE) {
      let furthest;
      let distance = -1;
      for (const key of frames.keys()) {
        if (Math.abs(key - position) > distance) {
          furthest = key;
          distance = Math.abs(key - position);
        }
      }
      frames.delete(furthest);
    }
  }).catch(() => {
    failed.add(index);
  }).finally(() => {
    pending.delete(index);
    wake();
  });
}

function preload() {
  const center = Math.floor(position);
  const direction = target >= position ? 1 : -1;
  // Load the current pair first, then a small neighborhood in scroll direction.
  const wanted = [center, Math.min(FRAME_COUNT - 1, center + 1)];
  for (let offset = 1; offset <= 8; offset++) {
    wanted.push(center + direction * offset, center - direction * offset);
  }
  for (const index of wanted) {
    if (pending.size >= 6) break;
    if (index >= 0 && index < FRAME_COUNT) requestFrame(index);
  }
}

function draw() {
  const lower = Math.floor(position);
  const upper = Math.min(FRAME_COUNT - 1, lower + 1);
  // Keep the last complete frame on screen while a newly requested one decodes.
  if (!frames.has(lower)) return;
  const next = frames.has(upper) ? upper : lower;
  const pair = `${lower}:${next}`;
  if (pair !== lastPair) {
    body.style.setProperty("--sequence-frame", `url("${frameUrl(lower)}")`);
    body.style.setProperty("--sequence-next-frame", `url("${frameUrl(next)}")`);
    lastPair = pair;
  }
  body.style.setProperty("--sequence-blend", next === lower ? "0" : String(position - lower));
}

function tick(time) {
  animation = 0;
  const elapsed = previousTime ? Math.min(time - previousTime, 64) : 16;
  previousTime = time;
  // Time-based easing keeps the motion consistent at different refresh rates.
  position += (target - position) * (1 - Math.exp(-elapsed / 110));
  if (Math.abs(target - position) < 0.01) position = target;
  preload();
  draw();
  if (position !== target) wake();
  else previousTime = 0;
}

function wake() {
  if (!animation && !document.hidden && !reducedMotion.matches) {
    animation = requestAnimationFrame(tick);
  }
}

function updateTarget() {
  const range = document.documentElement.scrollHeight - window.innerHeight;
  target = reducedMotion.matches || range <= 0
    ? 0
    : Math.min(1, Math.max(0, window.scrollY / range)) * (FRAME_COUNT - 1);
  wake();
}

function updateMotionPreference() {
  cancelAnimationFrame(animation);
  animation = 0;
  previousTime = 0;
  if (reducedMotion.matches) {
    position = target = 0;
    body.style.removeProperty("--sequence-frame");
    body.style.removeProperty("--sequence-next-frame");
    body.style.removeProperty("--sequence-blend");
    lastPair = "";
    frames.clear();
  } else updateTarget();
}

window.addEventListener("scroll", updateTarget, { passive: true });
window.addEventListener("resize", updateTarget, { passive: true });
window.addEventListener("pageshow", updateTarget);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    cancelAnimationFrame(animation);
    animation = 0;
    previousTime = 0;
  } else updateTarget();
});
reducedMotion.addEventListener("change", updateMotionPreference);
new ResizeObserver(updateTarget).observe(body);
updateTarget();

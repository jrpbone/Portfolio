document.addEventListener("DOMContentLoaded", () => {
  const html = document.documentElement;
  const toggle = document.getElementById("theme-toggle");
  const menu = document.getElementById("mobile-menu-toggle");
  const navigation = document.getElementById("primary-navigation");
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
  let preference;
  try { preference = localStorage.getItem("theme"); } catch { /* Storage is optional. */ }
  if (preference !== "light" && preference !== "dark") preference = null;

  function setTheme(theme) {
    html.dataset.theme = theme;
    toggle?.setAttribute("aria-label", `Switch to ${theme === "dark" ? "light" : "dark"} mode`);
    toggle?.setAttribute("aria-pressed", String(theme === "dark"));
  }
  setTheme(preference || (systemTheme.matches ? "dark" : "light"));
  html.setAttribute("data-theme-ready", "");
  toggle?.addEventListener("click", () => {
    preference = html.dataset.theme === "dark" ? "light" : "dark";
    setTheme(preference);
    try { localStorage.setItem("theme", preference); } catch { /* Keep the in-memory choice. */ }
  });
  systemTheme.addEventListener("change", (event) => {
    if (!preference) setTheme(event.matches ? "dark" : "light");
  });

  if (menu && navigation) {
    function setMenu(open) {
      menu.setAttribute("aria-expanded", String(open));
      menu.setAttribute("aria-label", `${open ? "Close" : "Open"} navigation menu`);
      navigation.classList.toggle("is-open", open);
    }
    menu.setAttribute("aria-controls", navigation.id);
    setMenu(false);
    menu.addEventListener("click", () => setMenu(menu.getAttribute("aria-expanded") !== "true"));
    navigation.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setMenu(false)));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && menu.getAttribute("aria-expanded") === "true") {
        setMenu(false);
        menu.focus();
      }
    });
    document.addEventListener("click", (event) => {
      if (!navigation.contains(event.target) && !menu.contains(event.target)) setMenu(false);
    });
    document.addEventListener("focusin", (event) => {
      if (!navigation.contains(event.target) && !menu.contains(event.target)) setMenu(false);
    });
    window.matchMedia("(min-width: 961px)").addEventListener("change", (event) => {
      if (event.matches) setMenu(false);
    });
  }

  const hero = document.querySelector(".hero");

  if (hero && window.matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)").matches) {
    const tileSize = 48;
    let gridFrame;

    hero.addEventListener("pointerenter", () =>
      hero.classList.add("is-grid-active"),
    );
    hero.addEventListener("pointerleave", () =>
      hero.classList.remove("is-grid-active"),
    );
    hero.addEventListener("pointermove", (event) => {
      if (gridFrame) cancelAnimationFrame(gridFrame);

      gridFrame = requestAnimationFrame(() => {
        const bounds = hero.getBoundingClientRect();
        const x = event.clientX - bounds.left;
        const y = event.clientY - bounds.top;

        hero.style.setProperty("--grid-pointer-x", `${x}px`);
        hero.style.setProperty("--grid-pointer-y", `${y}px`);
        hero.style.setProperty(
          "--grid-tile-x",
          `${Math.floor(x / tileSize) * tileSize}px`,
        );
        hero.style.setProperty(
          "--grid-tile-y",
          `${Math.floor(y / tileSize) * tileSize}px`,
        );
      });
    });
  }


  const gsap = window.gsap;
  if (!gsap) return;
  gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
    const hero = document.querySelectorAll(".hero-label, .hero h1, .hero-intro, .hero-buttons, .hero-support, .hero-visual");
    if (hero.length) gsap.from(hero, {
      opacity: 0, y: 20, duration: 0.6, stagger: 0.08,
      ease: "power3.out", clearProps: "opacity,transform",
    });
    const reveals = [...document.querySelectorAll("[data-reveal]")].filter((element) =>
      !element.closest(".pitch-hero, .home-work-grid, .works-grid, .project-content"));
    const groups = document.querySelectorAll("[data-stagger]");
    const timelines = document.querySelectorAll("[data-timeline]");
    if (!window.ScrollTrigger || (!reveals.length && !groups.length && !timelines.length)) return;
    gsap.registerPlugin(window.ScrollTrigger);
    reveals.forEach((element) => gsap.from(element, {
      opacity: 0, y: 24, duration: 0.6, ease: "power3.out",
      clearProps: "opacity,transform",
      scrollTrigger: { trigger: element, start: "top 85%", once: true },
    }));
    groups.forEach((group) => gsap.from(group.children, {
      opacity: 0, y: 28, duration: 0.6, stagger: { each: 0.08, grid: "auto" },
      ease: "power3.out", clearProps: "opacity,transform",
      scrollTrigger: { trigger: group, start: "top 85%", once: true },
    }));

    // The rail fills with scroll; each entry slides in from its side as it arrives.
    timelines.forEach((timeline) => {
      const fill = timeline.querySelector(".xp-rail-fill");
      if (fill) gsap.fromTo(fill, { scaleY: 0 }, {
        scaleY: 1, ease: "none",
        scrollTrigger: { trigger: timeline, start: "top 70%", end: "bottom 55%", scrub: 0.6 },
      });
      const stacked = window.matchMedia("(max-width: 899px)").matches;
      timeline.querySelectorAll(".xp-item").forEach((item, index) => {
        const fromLeft = stacked || index % 2 === 0;
        const step = gsap.timeline({ scrollTrigger: { trigger: item, start: "top 82%", once: true } });
        step.from(item.querySelector(".xp-marker"), { scale: 0, duration: 0.45, ease: "back.out(2.5)", clearProps: "transform" })
          .from(item.querySelector(".xp-card"), {
            opacity: 0, x: fromLeft ? -36 : 36, duration: 0.65, ease: "power3.out", clearProps: "opacity,transform",
          }, "<0.05")
          .from(item.querySelectorAll(".xp-card .chip-list li"), {
            opacity: 0, y: 8, duration: 0.3, stagger: 0.05, ease: "power2.out", clearProps: "opacity,transform",
          }, "-=0.3");
      });
    });
  });
});

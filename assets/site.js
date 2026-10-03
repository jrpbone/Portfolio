document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("theme-toggle");
  const icon = toggleBtn.querySelector("span");
  const html = document.documentElement;
  const menuBtn = document.getElementById("mobile-menu-toggle");
  const navLinks = document.getElementById("primary-navigation");
  const hero = document.querySelector(".hero");
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  );
  const gsapAvailable = Boolean(window.gsap && window.ScrollTrigger);

  // Load saved theme
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    html.setAttribute("data-theme", savedTheme);
    updateIcon(savedTheme);
  } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    html.setAttribute("data-theme", "dark");
    updateIcon("dark");
  }

  // Toggle logic
  toggleBtn.addEventListener("click", () => {
    const changeTheme = () => {
      const currentTheme = html.getAttribute("data-theme");
      const newTheme = currentTheme === "light" ? "dark" : "light";

      html.setAttribute("data-theme", newTheme);
      localStorage.setItem("theme", newTheme);
      updateIcon(newTheme);
    };

    if (document.startViewTransition && !reduceMotion.matches) {
      document.startViewTransition(changeTheme);
    } else {
      changeTheme();
    }
  });

  menuBtn.addEventListener("click", () => {
    const isOpen = menuBtn.getAttribute("aria-expanded") === "true";
    setMenuState(!isOpen);
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMenuState(false));
  });

  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      menuBtn.getAttribute("aria-expanded") === "true"
    ) {
      setMenuState(false);
      menuBtn.focus();
    }
  });

  window
    .matchMedia("(min-width: 961px)")
    .addEventListener("change", (event) => {
      if (event.matches) setMenuState(false);
    });

  function setMenuState(isOpen) {
    menuBtn.setAttribute("aria-expanded", String(isOpen));
    menuBtn.setAttribute(
      "aria-label",
      isOpen ? "Close navigation menu" : "Open navigation menu",
    );
    navLinks.classList.toggle("is-open", isOpen);
    menuBtn.querySelector("span").textContent = isOpen
      ? "\u00d7"
      : "\u2630";
  }

  function updateIcon(theme) {
    if (theme === "dark") {
      icon.textContent = "\u2600";
      toggleBtn.setAttribute("aria-label", "Switch to light mode");
    } else {
      icon.textContent = "\u263e";
      toggleBtn.setAttribute("aria-label", "Switch to dark mode");
    }
  }

  // Turn the hero grid into a cursor-reactive signal surface.
  if (hero && window.matchMedia("(pointer: fine)").matches) {
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

  // Pair each case study with its project image before layout and reveal setup.
  const caseStudiesSection = document.getElementById("case-studies");

  document
    .querySelectorAll(".work-item[data-project]")
    .forEach((project) => {
      const projectKey = project.dataset.project;
      const imageStage = project.querySelector(".work-image");
      const caseStudy = document.querySelector(
        `[data-case-study="${projectKey}"]`,
      );

      if (!imageStage || !caseStudy) return;

      const mediaColumn = document.createElement("div");
      mediaColumn.className = "work-media";
      project.insertBefore(mediaColumn, imageStage);
      mediaColumn.append(imageStage, caseStudy);
      caseStudy.open = false;
    });

  caseStudiesSection?.remove();

  // Reveal supporting content once as it enters the viewport.
  const revealTargets = document.querySelectorAll(
    ".credibility-item, .about-layout, .services-heading, .service-card, .section-heading, .technology-card, .work-item, .contact-layout",
  );

  if (
    "IntersectionObserver" in window &&
    !reduceMotion.matches &&
    !gsapAvailable
  ) {
    html.classList.add("reveal-ready");

    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );

    revealTargets.forEach((target, index) => {
      target.classList.add("reveal");
      target.style.setProperty("--reveal-delay", `${(index % 4) * 65}ms`);
      revealObserver.observe(target);
    });
  }

  // Keep the navigation in sync with the section currently being read.
  const sectionLinks = new Map(
    [...navLinks.querySelectorAll('a[data-section]')].filter((link) => document.getElementById(link.dataset.section)).map((link) => [
      link.dataset.section,
      link,
    ]),
  );

  const setActiveSection = (sectionId) => {
    sectionLinks.forEach((link, id) => {
      const isActive = id === sectionId;
      link.classList.toggle("is-active", isActive);
      if (isActive) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  };

  if ("IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        const current = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (current) setActiveSection(current.target.id);
      },
      { threshold: [0.05, 0.25, 0.5], rootMargin: "-28% 0px -58% 0px" },
    );

    sectionLinks.forEach((link, sectionId) => {
      const section = document.getElementById(sectionId);
      if (section) sectionObserver.observe(section);
    });
  }

  // Adapt each project card to the aspect ratio of its screenshot.
  document.querySelectorAll(".work-item").forEach((project) => {
    const imageStage = project.querySelector(".work-image");
    const projectImage = imageStage?.querySelector("img");

    if (!projectImage) return;

    const fallbackSource = projectImage.dataset.fallbackSrc;

    if (fallbackSource) {
      projectImage.addEventListener(
        "error",
        () => {
          projectImage.src = fallbackSource;
        },
        { once: true },
      );
    }

    const setProjectOrientation = () => {
      const ratio =
        projectImage.naturalWidth / projectImage.naturalHeight;
      let orientation = "square";

      if (ratio > 1.05) orientation = "landscape";
      if (ratio < 0.95) orientation = "portrait";

      project.classList.remove(
        "project-landscape",
        "project-portrait",
        "project-square",
      );
      project.classList.add(`project-${orientation}`);
      project.dataset.orientation = orientation;
    };

    const setupProjectGallery = () => {
      const images =
        imageStage.dataset.gallery?.split("|").filter(Boolean) ?? [];

      if (images.length < 2 || reduceMotion.matches) return;

      const galleryImage = document.createElement("img");
      const galleryToggle = document.createElement("button");
      const projectName =
        project.querySelector("h3")?.textContent.trim() || "project";
      let activeImage = projectImage;
      let inactiveImage = galleryImage;
      let imageIndex = 0;
      let rotationTimer;
      let isVisible = false;
      let isPointerPaused = false;
      let isUserPaused = false;

      imageStage.style.setProperty(
        "--gallery-ratio",
        `${projectImage.naturalWidth} / ${projectImage.naturalHeight}`,
      );
      imageStage.classList.add("has-slideshow");
      projectImage.classList.add("is-active");
      galleryImage.alt = "";
      galleryImage.decoding = "async";
      galleryImage.setAttribute("aria-hidden", "true");
      imageStage.insertBefore(
        galleryImage,
        imageStage.querySelector(".project-number"),
      );
      galleryToggle.type = "button";
      galleryToggle.className = "gallery-toggle";
      galleryToggle.textContent = "Pause";
      galleryToggle.setAttribute(
        "aria-label",
        `Pause ${projectName} screenshot gallery`,
      );
      imageStage.append(galleryToggle);

      images.slice(1).forEach((source) => {
        const preloadImage = new Image();
        preloadImage.src = source;
      });

      const stopRotation = () => {
        window.clearTimeout(rotationTimer);
      };

      const scheduleRotation = () => {
        stopRotation();

        if (
          !isVisible ||
          isPointerPaused ||
          isUserPaused ||
          document.hidden
        )
          return;
        rotationTimer = window.setTimeout(showNextImage, 5200);
      };

      const showNextImage = async () => {
        imageIndex = (imageIndex + 1) % images.length;
        inactiveImage.src = images[imageIndex];

        try {
          await inactiveImage.decode();
        } catch {
          // The load event can still complete when decode is unavailable.
        }

        inactiveImage.classList.add("is-active");
        activeImage.classList.remove("is-active");
        [activeImage, inactiveImage] = [inactiveImage, activeImage];
        scheduleRotation();
      };

      imageStage.addEventListener("pointerenter", () => {
        isPointerPaused = true;
        stopRotation();
      });

      imageStage.addEventListener("pointerleave", () => {
        isPointerPaused = false;
        scheduleRotation();
      });

      galleryToggle.addEventListener("click", () => {
        isUserPaused = !isUserPaused;
        galleryToggle.textContent = isUserPaused ? "Play" : "Pause";
        galleryToggle.setAttribute(
          "aria-label",
          `${isUserPaused ? "Play" : "Pause"} ${projectName} screenshot gallery`,
        );
        scheduleRotation();
      });

      const galleryObserver = new IntersectionObserver(
        (entries) => {
          isVisible = entries[0].isIntersecting;
          scheduleRotation();
        },
        { threshold: 0.2, rootMargin: "120px 0px" },
      );

      galleryObserver.observe(imageStage);
      document.addEventListener("visibilitychange", scheduleRotation);
    };

    if (projectImage.complete && projectImage.naturalWidth) {
      setProjectOrientation();
      setupProjectGallery();
    } else {
      projectImage.addEventListener(
        "load",
        () => {
          setProjectOrientation();
          setupProjectGallery();
        },
        { once: true },
      );
    }
  });

  if (gsapAvailable && !reduceMotion.matches) {
    setupGsapAnimations();
  }

  function setupGsapAnimations() {
    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;
    const clearAnimatedProps = "transform,opacity,visibility";
    const useHorizontalMotion =
      window.matchMedia("(min-width: 901px)").matches;

    gsap.registerPlugin(ScrollTrigger);
    html.classList.add("gsap-enhanced");

    gsap.set(".scroll-progress", {
      scaleX: 0,
      transformOrigin: "left center",
    });
    gsap.to(".scroll-progress", {
      scaleX: 1,
      ease: "none",
      scrollTrigger: {
        start: 0,
        end: "max",
        scrub: 0.2,
      },
    });

    const introTimeline = gsap.timeline({
      defaults: { duration: 0.75, ease: "power3.out" },
    });

    introTimeline
      .from(".nav-brand, .nav-links, .nav-controls", {
        autoAlpha: 0,
        y: -18,
        stagger: 0.08,
        clearProps: clearAnimatedProps,
      })
      .from(
        ".hero-label",
        {
          autoAlpha: 0,
          x: -24,
          clearProps: clearAnimatedProps,
        },
        "-=0.38",
      )
      .from(
        ".hero h1",
        {
          autoAlpha: 0,
          y: 42,
          duration: 0.95,
          clearProps: clearAnimatedProps,
        },
        "-=0.48",
      )
      .from(
        ".hero-intro, .hero-buttons, .hero-support",
        {
          autoAlpha: 0,
          y: 26,
          stagger: 0.1,
          clearProps: clearAnimatedProps,
        },
        "-=0.5",
      )
      .from(
        ".hero-visual",
        {
          autoAlpha: 0,
          scale: 0.94,
          x: useHorizontalMotion ? 34 : 0,
          duration: 1.05,
          clearProps: clearAnimatedProps,
        },
        "-=0.9",
      );

    gsap.from(".credibility-item", {
      autoAlpha: 0,
      y: 26,
      duration: 0.75,
      stagger: 0.08,
      ease: "power3.out",
      clearProps: clearAnimatedProps,
      scrollTrigger: {
        trigger: ".credibility-strip",
        start: "top 90%",
        once: true,
      },
    });

    gsap.from(".about-layout > *", {
      autoAlpha: 0,
      y: 44,
      duration: 0.9,
      stagger: 0.14,
      ease: "power3.out",
      clearProps: clearAnimatedProps,
      scrollTrigger: {
        trigger: "#about",
        start: "top 76%",
        once: true,
      },
    });

    gsap.from(".services-heading > *", {
      autoAlpha: 0,
      y: 32,
      duration: 0.8,
      stagger: 0.08,
      ease: "power3.out",
      clearProps: clearAnimatedProps,
      scrollTrigger: {
        trigger: ".services-heading",
        start: "top 84%",
        once: true,
      },
    });

    gsap.from(".service-card", {
      autoAlpha: 0,
      y: 52,
      scale: 0.975,
      duration: 0.85,
      stagger: 0.1,
      ease: "power3.out",
      clearProps: clearAnimatedProps,
      scrollTrigger: {
        trigger: ".services-grid",
        start: "top 82%",
        once: true,
      },
    });

    gsap.from(".technologies-section .section-heading > *", {
      autoAlpha: 0,
      y: 30,
      duration: 0.8,
      stagger: 0.1,
      ease: "power3.out",
      clearProps: clearAnimatedProps,
      scrollTrigger: {
        trigger: ".technologies-section .section-heading",
        start: "top 84%",
        once: true,
      },
    });

    gsap.from(".technology-card", {
      autoAlpha: 0,
      y: 46,
      rotateX: 4,
      duration: 0.85,
      stagger: 0.09,
      ease: "power3.out",
      clearProps: clearAnimatedProps,
      scrollTrigger: {
        trigger: ".technologies-grid",
        start: "top 82%",
        once: true,
      },
    });

    if (document.querySelector("#work")) {
      gsap.from("#work > .container > .section-heading > *", {
        autoAlpha: 0,
        y: 30,
        duration: 0.8,
        stagger: 0.1,
        ease: "power3.out",
        clearProps: clearAnimatedProps,
        scrollTrigger: {
          trigger: "#work > .container > .section-heading",
          start: "top 84%",
          once: true,
        },
      });

    }

    gsap.utils.toArray(".work-item").forEach((project, index) => {
      const imageStage = project.querySelector(".work-image");

      gsap.from(project, {
        autoAlpha: 0,
        x: useHorizontalMotion ? (index % 2 === 0 ? -48 : 48) : 0,
        y: 26,
        duration: 0.95,
        ease: "power3.out",
        clearProps: clearAnimatedProps,
        scrollTrigger: {
          trigger: project,
          start: "top 84%",
          once: true,
        },
      });

      if (imageStage) {
        gsap.from(imageStage, {
          clipPath:
            index % 2 === 0 ? "inset(0 10% 0 0)" : "inset(0 0 0 10%)",
          duration: 1.15,
          ease: "power3.out",
          clearProps: "clipPath",
          scrollTrigger: {
            trigger: project,
            start: "top 84%",
            once: true,
          },
        });
      }
    });

    const contactTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: ".contact-layout",
        start: "top 82%",
        once: true,
      },
    });

    contactTimeline
      .from(".contact-info", {
        autoAlpha: 0,
        x: useHorizontalMotion ? -46 : 0,
        duration: 0.9,
        ease: "power3.out",
        clearProps: clearAnimatedProps,
      })
      .from(
        ".contact-form-wrapper",
        {
          autoAlpha: 0,
          x: useHorizontalMotion ? 46 : 0,
          duration: 0.9,
          ease: "power3.out",
          clearProps: clearAnimatedProps,
        },
        "-=0.68",
      )
      .from(
        ".contact-form .form-group, .form-submit",
        {
          autoAlpha: 0,
          y: 18,
          duration: 0.55,
          stagger: 0.07,
          ease: "power2.out",
          clearProps: clearAnimatedProps,
        },
        "-=0.45",
      );

    document.querySelectorAll(".case-study").forEach((caseStudy) => {
      caseStudy.addEventListener("toggle", () => {
        if (caseStudy.open) {
          const caseStudyTargets = caseStudy.querySelectorAll(
            ".architecture-heading, .architecture-node, .architecture-arrow, .architecture-support li, .case-study-body > div:not(.architecture-diagram)",
          );

          gsap.fromTo(
            caseStudyTargets,
            { autoAlpha: 0, y: 18, scale: 0.975 },
            {
              autoAlpha: 1,
              y: 0,
              scale: 1,
              duration: 0.55,
              stagger: 0.045,
              ease: "power3.out",
              clearProps: clearAnimatedProps,
              overwrite: "auto",
              onComplete: () => ScrollTrigger.refresh(),
            },
          );
        } else {
          requestAnimationFrame(() => ScrollTrigger.refresh());
        }
      });
    });

    window.addEventListener("load", () => ScrollTrigger.refresh(), {
      once: true,
    });
  }
});

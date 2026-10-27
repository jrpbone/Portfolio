# Add a project

1. Run `node tools/new-project.mjs <slug> "<Name>"` from the repository root. This creates `works/<slug>/` and an unpublished registry entry. Existing projects cannot be overwritten.
2. Fill in `works/<slug>/index.html`, add screenshots to `images/`, and update `works/projects.json`. Set the accurate `date` (`YYYY-MM`), status, platform (`Web`, `Mobile`, or `Desktop`), cover dimensions, role/team/timeline, repository, optional `result`, and optional `liveUrl`. Replace the temporary branding cover and profile repository. Update title, description, canonical URL, social image, and CreativeWork data. Shared layout lives in `/assets/project-page.css`, `/assets/pages.css`, and `/assets/project-page.js`; use the project's own `project.css` for one-off overrides.
3. Set `published: true` when ready, then run `npm run build:works` and `npm test`. For a homepage feature, set `featured: true`. The homepage shows up to three published features, newest first; KaraOK is the only published project for now.

## Project page order

1. Header: name, summary, status, and code/demo actions.
2. Five facts: Role, Team, Timeline, Platform, Year. Project type remains in the header.
3. Full-width, uncropped hero screenshot.
4. Problem: the context and constraint.
5. What I built: personal contribution, separated from teammates' work, then grouped technology tags.
6. How it works: approach, architecture, and 2–3 decisions with alternatives and trade-offs.
7. Result: verified numbers or a description of what shipped. Existing feature drafts remain marked for review here.
8. Gallery: uncropped screenshot links in figures with captions. The shared script adds a keyboard-accessible lightbox.
9. What I'd do next: 2–3 factual lines.
10. Previous/next project navigation and a Contact action.

Use `TODO(J.R.)` comments for missing source material. Do not invent metrics, trade-offs, testimonials, team ownership, or release dates. KaraOK stays In Development until complete.

## Shared site structure

The header and footer are static partials in `tools/partials/`. `tools/site-shell.mjs` writes them into every page between `site:header` and `site:footer` markers when `build:works` runs. Keep these markers. The builder also writes homepage cards and Work-index cards between `works:featured` / `works:index` markers, updates adjacent-project links, and regenerates the sitemap. No browser JavaScript is needed to render content.

Navigation: Home via the logo, then Work, About, Contact. The active destination receives `aria-current="page"`. All internal destinations are root-relative. Old homepage contact/about section URLs redirect to their new pages with JavaScript; the homepage retains an email/contact section as a native fallback.

The Work index shows at most nine entries per static page. Platform filters operate on the current page and preserve their URL query in pagination links. New projects start with `published: false` and carry noindex. Unpublished pages and screenshots remain accessible at direct URLs; publication flags control listings, adjacent navigation, and sitemap inclusion.

## Existing dates and held projects

KaraOK uses October 2026 (active), LnPulse August 2026, ApplianSys April 2026 (start), and Calcuoke/PyPOS January 2026 (start). These are portfolio ordering dates rather than release claims. The other four projects remain unpublished until J.R. reviews or imports them. Résumé experience and education dates are independent of project ordering dates.

# Add a project

1. Run `node tools/new-project.mjs <slug> "<Name>"` from the repository root. This creates `works/<slug>/` and adds an entry to `works/projects.json`. Existing projects cannot be overwritten.
2. Fill in `works/<slug>/index.html`, add screenshots to its `images/` folder, and update its registry entry. Set an accurate `date` (`YYYY-MM`), status, platform (`Web`, `Mobile`, or `Desktop`), cover dimensions, repository, and optional `liveUrl`. Replace the temporary branding cover and profile repository with project-specific links. Group the stack under Frontend, Backend, Data, and Tooling. Keep screenshots uncropped. The shared styles and behavior live in `/assets/project-page.css` and `/assets/project-page.js`; use `project.css` for project-specific overrides. Update the page's title, description, canonical URL, social image, and CreativeWork data to match. Keep `TODO(J.R.)` comments until J.R. has reviewed the draft.
3. Run `npm run build:works` to regenerate static homepage cards, Works pages, neighboring project links, and the sitemap. Then run `npm test` and preview the new page.

The builder orders projects by `date`, newest first, with slug as the tie-breaker. Only entries with `published` other than `false` appear in listings, neighboring links, and the sitemap. New projects start unpublished; set `published: true` when ready. The four migrated projects other than KaraOK remain unpublished at J.R.’s request. Their pages and images are preserved for later editing. Drafts carry `noindex` and have no public navigation links, but direct URLs remain accessible.

The homepage shows up to three newest eligible entries; `featured: false` excludes a draft. Omit `featured` or set it to `true` when a project is ready. The Works index shows nine entries per static page. Platform filters work on the current page and preserve their query parameter in pagination links.

Component vocabulary: `home-project` is the shared linked card, `project-hero-cover` is the uncropped hero image, `project-facts` is the facts row, `project-section-nav` is the reading navigation, and `project-gallery` holds screenshot links. Existing theme variables remain the color source; shared component tokens alias them.

Date policy for migrated projects: KaraOK uses its active October 2026 date; LnPulse uses August 2026; ApplianSys uses its April 2026 start date. Calcuoke and PyPOS use their January 2026 start dates. These are portfolio ordering dates, not claimed release dates.

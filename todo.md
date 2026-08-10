# Portfolio Improvement Roadmap

This document is a prioritized backlog for improving the portfolio at `https://jrpbone.vercel.app/`. It is intentionally broader than a launch checklist: some items are important before actively sharing the portfolio, while others are optional ideas for future growth.

## How to use this roadmap

- **Priority:** `P0` = launch-critical, `P1` = high impact, `P2` = useful polish, `P3` = optional.
- **Effort:** `S` = a few hours or less, `M` = roughly one to three focused days, `L` = a larger feature or continuing commitment.
- Complete the `P0` items first, then choose `P1` work based on whether the immediate goal is job applications, freelance clients, or academic presentation.
- Do not add features only to make the page busier. Every addition should improve credibility, clarity, accessibility, performance, or conversion.

## Current baseline

The portfolio already includes the following, so these are not backlog items:

- Responsive desktop and mobile layouts with horizontal-overflow safeguards.
- Light and dark themes with saved theme preference.
- GSAP-enhanced page, section, project, and contact animations.
- Reduced-motion support and keyboard-aware navigation.
- Animated service cards and interactive hero-grid effects.
- Five selected projects with uncropped screenshot galleries.
- Project metadata covering role, timeline, team size, project type, platform, and status.
- Collapsible case studies with system architecture diagrams.
- Technologies grouped by category and repeated per relevant project.
- A contact form and direct-email option.
- Page title, general meta description, canonical URL, Open Graph and Twitter preview data.
- Person structured data, `robots.txt`, `sitemap.xml`, and a web manifest.
- Portfolio-branded Open Graph preview and `JR` favicon assets.
- Optimized JPG versions of the largest project screenshots.

## Product decisions to preserve

- Project screenshots must remain fully visible and uncropped.
- KaraOK remains clearly labeled **In Development** until it is complete.
- Case studies remain closed by default.
- Technology tags stay directly below **What I Built**.
- Do not add demo videos unless this decision is intentionally revisited later.
- Animation must remain progressive enhancement: content must work without GSAP or JavaScript.
- Respect `prefers-reduced-motion` and avoid motion that interferes with reading or navigation.

---

## Phase 1 — Launch confidence

### Content and link verification

- [ ] **P0 · S — Verify every public link.**
  - Confirm that GitHub, LinkedIn, Facebook, Instagram, YouTube, and X profiles exist at the listed `jrpbone` URLs.
  - Remove social icons for accounts that are private, empty, or not intended for recruiters and clients.
  - Confirm every project repository link opens the correct repository and has suitable visibility.
  - Check that the résumé PDF opens in a new tab and is the latest version.
  - **Done when:** an automated link check and a manual click-through produce no broken, redirected-to-login, or unintended links.

- [ ] **P0 · S — Perform a final copy-edit.**
  - Standardize capitalization: `JR`, `KaraOK`, `PyPOS`, `ApplianSys`, and each technology name.
  - Check grammar, punctuation, spacing, tense, and role-title consistency.
  - Use first-person language consistently across About, Services, and case studies.
  - Replace vague claims such as “secure” or “fast” with evidence where possible.
  - **Done when:** every visible sentence has been reviewed on both desktop and mobile, including collapsed case-study content.

- [ ] **P0 · S — Verify public contact details and availability.**
  - Keep “Available for work” visible only when it is accurate.
  - Decide whether the preferred contact is email, LinkedIn, or the form and make that path visually primary.
  - Confirm `johnralphbone@gmail.com` is intentionally public because it also appears in structured data and page source.
  - **Done when:** availability and contact details are accurate and the primary action is unambiguous.

### Contact form reliability

- [ ] **P0 · S — Test the contact form end to end on production.**
  - Submit from Chrome, Firefox, Safari/iOS if available, and a mobile device.
  - Verify required fields, phone-number optionality, email formatting, submission delivery, and reply-to behavior.
  - Verify that FormSubmit does not expose an unexpected confirmation flow to visitors.
  - Test keyboard-only completion and screen-reader announcements.
  - **Done when:** a real production submission reaches the inbox with all fields and the sender sees a clear success state.

- [ ] **P1 · M — Add dedicated success and error states.**
  - Create a portfolio-styled thank-you state or `/thank-you.html` page.
  - Prevent duplicate submissions while a request is processing.
  - Preserve entered content when a network request fails.
  - Add a polite retry option and direct-email fallback.
  - **Done when:** success, validation failure, server failure, and offline behavior are understandable without relying on browser-native alerts.

- [ ] **P1 · S — Add spam protection without harming usability.**
  - Add a hidden honeypot field and basic submission throttling.
  - Use CAPTCHA only if real spam becomes a problem.
  - Do not block privacy tools or keyboard/screen-reader users.
  - **Done when:** obvious automated submissions are filtered and legitimate test submissions still work.

### Production verification

- [ ] **P0 · S — Verify the deployed SEO files and assets.**
  - Open `/robots.txt`, `/sitemap.xml`, `/site.webmanifest`, and `/assets/branding/og-preview.png` on the live Vercel URL.
  - Confirm the canonical URL and Open Graph image use HTTPS and return `200` responses.
  - Confirm the brown/black favicon appears after a fresh browser session.
  - Test the shared URL in the major platforms actually used for outreach.
  - **Done when:** crawlers can access every referenced file and the social card shows the intended title, description, and image.

- [ ] **P0 · S — Add a custom 404 page.**
  - Match the portfolio palette and typography.
  - Include a short explanation, a Home action, and a link to Selected Works.
  - Keep it lightweight and independent of JavaScript.
  - **Done when:** an invalid production URL returns a helpful branded page with the correct HTTP behavior.

---

## Phase 2 — Stronger positioning and credibility

### Clarify the professional direction

- [ ] **P1 · S — Make the hero positioning more specific.**
  - Choose the main audience: internship recruiters, junior developer roles, freelance clients, or a combination.
  - State what is built, for whom, and the quality brought to the work in one concise headline/subheading pair.
  - Keep the description general enough to grow beyond the current five projects.
  - Example structure: “Student developer building reliable web, mobile, and desktop products with thoughtful user experiences.”
  - **Done when:** a visitor can describe what JR does and what opportunity he wants after reading only the first screen.

- [ ] **P1 · S — Align service language with current experience.**
  - Distinguish confidently delivered capabilities from areas still being learned.
  - Avoid presenting every technology as an expert-level service.
  - Group related services so the list feels focused rather than broad.
  - **Done when:** the capabilities section is credible for a student developer and supports the target opportunities.

- [ ] **P2 · S — Add a short “Currently” line.**
  - Mention the current learning focus, capstone status, or kind of opportunity being sought.
  - Add a review date so stale status text is easy to identify.
  - **Done when:** the line adds current context without turning the hero into a résumé summary.

### Improve project evidence

- [ ] **P1 · M — Add measurable outcomes to every completed project.**
  - Use real numbers only: users tested, workflows supported, modules completed, response-time improvement, records handled, or manual steps removed.
  - If production metrics are unavailable, use verifiable scope metrics such as screens, roles, modules, endpoints, or test coverage.
  - Explain how the result was measured.
  - Never invent revenue, user, performance, or adoption figures.
  - **Done when:** each completed case study contains at least one concrete, defensible outcome.

- [ ] **P1 · M — Strengthen personal contribution statements.**
  - For team projects, separate “what the team built” from “what I personally owned.”
  - Describe the RBAC/security/department work for LnPulse with specific responsibilities.
  - Describe project-management and lead-programmer responsibilities for ApplianSys and KaraOK.
  - Mention meaningful tradeoffs or decisions personally made.
  - **Done when:** a reviewer can identify JR’s contribution without guessing from the overall project description.

- [ ] **P1 · M — Add one technical deep dive per project.**
  - Choose the most revealing engineering problem rather than listing all features.
  - Suggested topics: authorization boundaries, offline storage, database design, audio-analysis pipeline, inventory consistency, or API error handling.
  - Explain the constraint, considered options, selected solution, and consequence.
  - Keep sensitive credentials, private endpoints, and security implementation details out of public content.
  - **Done when:** every case study demonstrates reasoning, not only implementation scope.

- [ ] **P2 · S — Add project dates, not only durations.**
  - Add a year or month/year range alongside the existing timeline.
  - Keep durations for context.
  - **Done when:** visitors can understand how recent each project is without opening GitHub.

- [ ] **P2 · M — Add project permalinks.**
  - Give each work item a stable ID such as `#lnpulse`, `#calcuoke`, and `#karaok`.
  - Make copied links scroll to the correct project and optionally open its case study.
  - Preserve browser Back behavior and keyboard focus.
  - **Done when:** a recruiter can receive a URL that opens directly at one specific project.

### Add trust signals

- [ ] **P1 · M — Add two or three genuine recommendations.**
  - Request short quotes from a client, instructor, teammate, or project stakeholder.
  - Include the person’s name, relationship, and permission to publish.
  - Prefer specific observations about reliability, communication, ownership, or engineering judgment.
  - Do not use anonymous or fabricated testimonials.
  - **Done when:** each quote is verifiable, concise, and relevant to the opportunities being targeted.

- [ ] **P2 · S — Add relevant education context.**
  - Include program, institution, expected graduation year, and only relevant distinctions or coursework.
  - Keep it shorter than the Selected Works section.
  - **Done when:** recruiters can understand the “Student” title without needing to download the résumé.

- [ ] **P2 · S — Curate certifications and achievements.**
  - Add only active, relevant, and verifiable credentials.
  - Link to a credential URL when available.
  - Avoid decorative progress bars or self-assigned skill percentages.
  - **Done when:** every listed credential strengthens the target role.

---

## Phase 3 — Project-gallery and interaction improvements

- [ ] **P1 · M — Add an accessible full-screen screenshot viewer.**
  - Open the current image without cropping and preserve its aspect ratio.
  - Support Previous/Next buttons, arrow keys, Escape, touch swipes, and visible focus.
  - Trap focus only while the dialog is open, return focus to the trigger, and provide useful alt text.
  - Prevent the background page from scrolling without causing a mobile width jump.
  - **Done when:** all screenshots can be inspected at useful size with mouse, touch, and keyboard.

- [ ] **P1 · S — Improve gallery status communication.**
  - Show a visible `1 / 4` counter for multi-image projects.
  - Announce image changes with a restrained `aria-live` message.
  - Pause automatic rotation after manual interaction and preserve the existing pause control.
  - **Done when:** visitors always know which screenshot is displayed and galleries do not unexpectedly fight user input.

- [ ] **P2 · S — Add descriptive screenshot captions.**
  - Explain the workflow or engineering feature shown, not merely the page name.
  - Keep captions short and project-specific.
  - **Done when:** each image adds evidence even for a visitor unfamiliar with the product.

- [ ] **P2 · S — Add a compact active-section navigation indicator.**
  - Reuse the existing scroll-position logic and `aria-current` handling.
  - Ensure the indicator remains legible in both themes and does not cause layout shifts.
  - **Done when:** the nav accurately reflects the visible section during normal scrolling and anchor navigation.

- [ ] **P2 · S — Improve focus arrival after anchor navigation.**
  - Account for the sticky navigation height with `scroll-margin-top`.
  - Move focus only when it helps keyboard/screen-reader navigation.
  - **Done when:** section headings are never hidden behind the nav after clicking a link.

- [ ] **P3 · M — Add project filtering only if the portfolio grows.**
  - Possible filters: Web, Mobile, Desktop, Academic, Client, Personal, Completed, In Development.
  - Do not add filters while there are only five projects unless user testing shows a real need.
  - Keep all work visible when JavaScript is unavailable.
  - **Done when:** filtering reduces discovery time without making the page feel like a dashboard.

---

## Phase 4 — Accessibility hardening

- [ ] **P0 · M — Complete a keyboard-only audit.**
  - Test Tab, Shift+Tab, Enter, Space, Escape, and arrow-key behavior.
  - Check navigation, theme toggle, gallery controls, case studies, project links, social links, and form fields.
  - Ensure focus never becomes hidden, trapped, or lost after DOM changes.
  - **Done when:** every interactive feature can be discovered, understood, and operated without a pointer.

- [ ] **P0 · M — Complete a screen-reader audit.**
  - Test at least NVDA with Firefox or Chrome on Windows.
  - Confirm heading order, landmark names, link purpose, project metadata, case-study summaries, gallery status, and form errors.
  - Remove redundant announcements from decorative icons and duplicated image text.
  - **Done when:** the page has a logical reading order and controls announce their state and purpose.

- [ ] **P0 · S — Verify color contrast in both themes.**
  - Check body text, muted text, orange labels, tags, borders, buttons, form placeholders, focus rings, and status indicators.
  - Test normal, hover, focus, active, disabled, and visited states.
  - Target WCAG 2.2 AA contrast requirements.
  - **Done when:** automated checks pass and manually sampled colors meet the relevant contrast ratio.

- [ ] **P1 · S — Add a visible skip link.**
  - Provide “Skip to main content” as the first focusable control.
  - Reveal it on focus and place focus at the main content without obscuring it beneath the sticky nav.
  - **Done when:** keyboard users can bypass the entire navigation in one action.

- [ ] **P1 · M — Add accessible inline form validation.**
  - Associate errors with inputs using `aria-describedby`.
  - Use `aria-invalid` only after validation runs.
  - Provide a clear error summary after failed submission.
  - Do not rely on red alone to indicate errors.
  - **Done when:** errors are visible, announced, actionable, and cleared when corrected.

- [ ] **P1 · S — Test 200% and 400% zoom.**
  - Verify content reflows without horizontal scrolling at common desktop widths.
  - Check long technology names, project metadata, contact email, case-study controls, and navigation.
  - **Done when:** reading order and functionality remain intact at required zoom levels.

- [ ] **P2 · S — Support increased contrast and reduced transparency preferences.**
  - Review `prefers-contrast` and `prefers-reduced-transparency` where browser support makes them useful.
  - Simplify glow, blur, and translucent surfaces without removing essential boundaries.
  - **Done when:** enhanced accessibility preferences produce a calmer but complete experience.

---

## Phase 5 — Performance and resilience

- [ ] **P1 · M — Introduce responsive image formats.**
  - Produce WebP and, where practical, AVIF versions of project screenshots and the profile image.
  - Use `<picture>`, `srcset`, and `sizes` so mobile devices do not download desktop-sized images.
  - Retain an appropriate JPEG/PNG fallback.
  - Preserve the current uncropped presentation.
  - **Done when:** the browser selects an appropriately sized image for each viewport and visual quality remains acceptable.

- [ ] **P1 · S — Remove unneeded original screenshots from the deployed output.**
  - Keep source-quality originals in a development/source directory or separate archive.
  - Deploy only images referenced by the live page.
  - Do not delete originals until a recoverable source copy is confirmed.
  - **Done when:** Vercel output contains no redundant multi-megabyte image variants.

- [ ] **P1 · M — Reduce third-party front-end dependencies.**
  - Replace Font Awesome with a small set of local SVG icons or an optimized icon sprite.
  - Consider self-hosting fonts to reduce cross-origin requests and privacy exposure.
  - Keep GSAP only where it adds visible value; provide a no-GSAP fallback.
  - **Done when:** request count and transferred bytes decrease without losing the visual identity.

- [ ] **P1 · S — Add integrity and failure planning for remaining CDN assets.**
  - Add Subresource Integrity where supported and pin exact dependency versions.
  - Confirm that content and controls remain usable when a CDN request fails.
  - **Done when:** third-party script failure removes enhancement, not access to content.

- [ ] **P1 · S — Establish performance budgets.**
  - Suggested targets on a production mobile test: LCP under 2.5 seconds, CLS under 0.1, and INP under 200 milliseconds.
  - Set a total initial-transfer budget and a maximum per-image budget.
  - Measure on a throttled mobile profile, not only a local desktop connection.
  - **Done when:** targets are documented and checked before major releases.

- [ ] **P2 · M — Split and defer noncritical JavaScript.**
  - Move the large inline script into a versioned external module.
  - Separate essential navigation/theme behavior from galleries, case studies, and animations.
  - Load project-gallery logic only when the work section approaches the viewport if testing shows a benefit.
  - **Done when:** behavior remains identical and the browser can cache scripts independently of HTML.

- [ ] **P2 · S — Review long-page rendering cost.**
  - Profile animated shadows, filters, ripples, sticky elements, and ScrollTrigger work on mid-range phones.
  - Prefer transforms and opacity for animation.
  - Consider `content-visibility` for deep sections only after testing anchors and GSAP triggers.
  - **Done when:** scrolling remains smooth without overheating or persistent high CPU use.

- [ ] **P2 · S — Add a reduced-data mode.**
  - Respect `prefers-reduced-data` where supported.
  - Stop gallery autoplay, minimize decorative animation, and prioritize lighter image sources.
  - **Done when:** low-data visitors receive the complete content with fewer optional transfers.

---

## Phase 6 — SEO and discoverability after deployment

- [ ] **P1 · S — Register the site with search tools.**
  - Add the production site to Google Search Console and Bing Webmaster Tools.
  - Submit `https://jrpbone.vercel.app/sitemap.xml`.
  - Monitor indexing, mobile usability, and crawl errors.
  - **Done when:** ownership is verified and the home page is indexed under the canonical URL.

- [ ] **P1 · S — Validate structured data and social cards.**
  - Validate the Person JSON-LD syntax and confirm all `sameAs` URLs are real public profiles.
  - Test Open Graph and Twitter/X metadata after each major title, description, URL, or image change.
  - Increment the preview filename if a platform persistently serves a stale cached image.
  - **Done when:** validators read the intended identity, canonical URL, and preview image without errors.

- [ ] **P1 · M — Add unique metadata if project detail pages are introduced.**
  - Give each project a unique title, description, canonical URL, Open Graph card, and structured breadcrumb.
  - Do not create thin pages that simply duplicate the homepage card.
  - **Done when:** every indexable URL has distinct, useful content and metadata.

- [ ] **P2 · L — Publish occasional technical notes only if maintainable.**
  - Write about engineering decisions, lessons learned, accessibility, security, deployment, or audio processing.
  - Favor a few useful articles over a neglected high-volume blog.
  - Add RSS and Article structured data only after real articles exist.
  - **Done when:** each post provides original value and has an owner/review date.

- [ ] **P2 · M — Consider a custom domain.**
  - Choose a short professional domain and keep `jrpbone.vercel.app` as a redirect or fallback.
  - Update canonical, Open Graph, sitemap, robots, JSON-LD, email signature, résumé, and profiles together.
  - Configure one canonical host to prevent duplicate indexing.
  - **Done when:** HTTPS, redirects, canonical tags, and external profiles all use the same primary domain.

---

## Phase 7 — Security, privacy, and deployment

- [ ] **P1 · M — Add production security headers.**
  - Configure headers through `vercel.json` or the chosen hosting layer.
  - Start with `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and frame protection.
  - Add HSTS only after confirming HTTPS is permanent and all subdomain implications are understood.
  - **Done when:** headers are visible on production responses and do not break fonts, images, the contact form, or external links.

- [ ] **P1 · M — Introduce a practical Content Security Policy.**
  - Move inline JavaScript to an external file or use hashes/nonces.
  - Inventory Google Fonts, jsDelivr, cdnjs, FormSubmit, images, and mail actions before writing directives.
  - Begin with report-only mode, review violations, then enforce.
  - Avoid `unsafe-inline` unless there is a documented temporary reason.
  - **Done when:** an enforced CSP blocks unexpected scripts while all intended functionality works.

- [ ] **P1 · S — Review public personal data.**
  - Decide whether full email, location, school, résumé details, and social accounts should remain publicly crawlable.
  - Remove metadata fields that are not necessary for professional discovery.
  - Remember that HTML obfuscation does not provide meaningful privacy.
  - **Done when:** every public personal detail is intentional and appropriate for long-term indexing.

- [ ] **P2 · S — Add a short privacy note if analytics or expanded forms are added.**
  - State what is collected, why, where it is sent, and how long it is retained.
  - Avoid cookie banners when no nonessential cookies are used.
  - **Done when:** the disclosure accurately matches actual behavior.

- [ ] **P2 · M — Add automated deployment checks.**
  - Run HTML validation, CSS linting, JavaScript syntax/lint checks, broken-link checks, and a basic accessibility scan.
  - Run a production build/deploy preview before merging changes.
  - Keep checks fast enough that they are not routinely skipped.
  - **Done when:** invalid markup, missing assets, and broken links fail the deployment workflow.

---

## Phase 8 — Analytics and iteration

- [ ] **P1 · S — Add privacy-conscious analytics.**
  - Consider Vercel Web Analytics, Plausible, or another minimal tool.
  - Track page views and broad engagement without collecting unnecessary personal data.
  - Establish a reason for each event before implementing it.
  - **Done when:** analytics answer specific portfolio questions without degrading performance or privacy.

- [ ] **P1 · S — Track meaningful conversion events.**
  - Suggested events: résumé opened, project repository opened, case study expanded, contact email clicked, and form submitted successfully.
  - Do not treat hover, scroll depth, or every gallery transition as a success metric.
  - **Done when:** the data shows which content leads to genuine interest or contact.

- [ ] **P2 · M — Run lightweight user testing.**
  - Ask three to five people matching the target audience to review the site without guidance.
  - Ask what JR does, which project is strongest, what feels unclear, and what they would click next.
  - Record patterns rather than implementing every personal preference.
  - **Done when:** the next design decisions are supported by repeated observations.

- [ ] **P2 · S — Review analytics and content quarterly.**
  - Check broken links, stale availability, résumé age, project status, and form delivery.
  - Review top project interactions and contact conversions.
  - Remove features that add maintenance but no visitor value.
  - **Done when:** a recurring review date and owner are documented.

---

## Phase 9 — Maintainability

- [ ] **P1 · M — Separate HTML, behavior, and project data.**
  - Move JavaScript from `index.html` into `index.js` or focused modules.
  - Store repeated project metadata, technologies, image paths, and case-study content in a structured data file only if a reliable build/render step is introduced.
  - Avoid converting to a framework solely for component syntax; the current static architecture is valid.
  - **Done when:** adding a project does not require editing the same facts in multiple distant locations.

- [ ] **P1 · S — Document the project-content workflow.**
  - Update `README.md` with local preview instructions, asset directories, image requirements, favicon/OG generation notes, and deployment steps.
  - Document the rule that project images remain uncropped.
  - Include a checklist for adding a sixth project.
  - **Done when:** another developer can update content without reverse-engineering the page script.

- [ ] **P2 · M — Organize CSS by responsibility.**
  - Keep design tokens centralized.
  - Separate base, layout, components, animation, theme, and responsive rules or clearly label those regions.
  - Remove obsolete selectors only after verifying dynamic DOM relocation and animation hooks.
  - **Done when:** each major component has one clear source of styling truth.

- [ ] **P2 · S — Add formatting and lint rules.**
  - Add Prettier-compatible formatting and lightweight HTML/CSS/JS linting.
  - Keep generated or third-party assets excluded.
  - Use the same commands locally and in deployment checks.
  - **Done when:** formatting is deterministic and common mistakes are caught automatically.

- [ ] **P2 · S — Add a content freshness record.**
  - Record the last verified date for résumé, availability, social links, project status, and technology lists.
  - Review KaraOK’s “In Development” label whenever its status changes.
  - **Done when:** stale content can be identified without reading Git history.

---

## Optional enhancements

- [ ] **P3 · M — Create a printable portfolio or résumé stylesheet.**
  - Hide animation, navigation controls, and decorative backgrounds when printing.
  - Preserve project summaries, links, and contact information.
  - **Done when:** Print to PDF produces a clean, readable professional document.

- [ ] **P3 · M — Add an offline-capable shell only if installation is useful.**
  - Cache the page shell, essential styles, and a minimal offline page.
  - Avoid pre-caching every large project image.
  - Provide a safe update strategy so visitors do not remain on stale content.
  - **Done when:** offline behavior is intentional, storage use is reasonable, and updates are reliable.

- [ ] **P3 · L — Add a second language only with fully maintained translations.**
  - Translate navigation, metadata, forms, case studies, alt text, and validation messages.
  - Add `hreflang` and separate canonical URLs per language.
  - Do not mix partially translated sections on one page.
  - **Done when:** both versions are complete and updated together.

- [ ] **P3 · S — Add a subtle “last updated” indicator.**
  - Place it in the footer or résumé area rather than the hero.
  - Generate it from the deployment/build date if automation is introduced.
  - **Done when:** it builds confidence without looking like a blog timestamp.

---

## Testing matrix for major releases

### Viewports

- [ ] 320 × 568 — narrow phone.
- [ ] 360 × 800 — common Android phone.
- [ ] 390 × 844 — modern iPhone.
- [ ] 412 × 915 — larger Android phone.
- [ ] 768 × 1024 — portrait tablet.
- [ ] 1024 × 768 — landscape tablet/small laptop.
- [ ] 1366 × 768 — common laptop.
- [ ] 1440 × 900 — desktop.
- [ ] 1920 × 1080 — large desktop.
- [ ] 200% and 400% browser zoom.

### Browsers and input

- [ ] Latest Chrome/Chromium on Windows and Android.
- [ ] Latest Firefox on Windows.
- [ ] Safari on iOS/macOS when hardware is available.
- [ ] Edge on Windows.
- [ ] Mouse, touch, keyboard-only, and screen reader.
- [ ] Light theme, dark theme, reduced motion, and forced/high-contrast mode.
- [ ] Slow network, offline state, blocked CDN request, and JavaScript disabled.

### Critical journeys

- [ ] Arrive from a shared social link and understand the portfolio purpose.
- [ ] Navigate to Selected Works from the hero.
- [ ] Cycle and pause each screenshot gallery.
- [ ] Open and close every case study.
- [ ] Open each GitHub repository and the résumé.
- [ ] Complete and submit the contact form.
- [ ] Use browser Back after anchor and external-link navigation.
- [ ] Reload a direct project anchor on mobile and desktop.

---

## Recommended next five tasks

1. [ ] Run the full content/link/form production audit.
2. [ ] Add concrete outcomes and sharper personal-contribution statements to every case study.
3. [ ] Complete keyboard, screen-reader, contrast, and zoom testing.
4. [ ] Add responsive WebP/AVIF images and remove redundant deployment assets.
5. [ ] Add a custom 404 page, security headers, and automated validation checks.

These five tasks provide more portfolio value than adding another decorative effect. Revisit the optional section only after the content, accessibility, performance, and production checks are complete.

# Portfolio design system

## Direction and evidence

Keep the existing Commissioner font, JR monogram, and light/dark palette from `index.css`. Use a short introduction, featured work, supporting skills, dated experience, and a contact action on Home. About carries the full story; Contact carries the form. Project screenshots stay uncropped.

UI/UX Pro Max ran the requested developer-portfolio search with motion 5 and density 4. Its first design-system result matched documentation rather than portfolios. A narrower portfolio query matched Portfolio/Personal; the targeted `portfolio grid hero` landing search provided the useful structure. Palette and typography suggestions were not adopted. The existing brand and the user's requested page order take precedence. Standard GSAP stagger guidance is used with `power3.out`, small offsets, and no overshoot.

## Brand and copy

- Name: **J.R. Bone**.
- Role: **Full-Stack Developer**.
- Tagline: **I build web, mobile, and desktop apps for schools and small businesses.**
- Voice: first person, specific actions, short descriptions, no invented outcomes or performance claims.
- Calls to action: **See work**, **Get in touch**, **Read case study**, **View code**. Render **Live demo** only when the registry contains `liveUrl`.
- Availability retains the existing **Available for work** statement. KaraOK remains **In Development**.
- Other projects remain unpublished until J.R. imports or reviews them. Only published projects receive links in the About stack.

## Tokens

The existing palette is the primitive source. Semantic aliases in `assets/pages.css` inherit it; component tokens only define layout and behavior.

| Purpose | Source / token |
| --- | --- |
| Page background, text, muted text | `--bg-color`, `--text-main`, `--text-muted` |
| Accent, subtle accent, border, surface | `--accent-color`, `--accent-light`, `--border-color`, `--card-bg` |
| Type | `--font-site` (Commissioner), existing heading weights |
| Spacing scale | 4, 8, 12, 16, 24, 32, 48, 64, 96px; component gaps use the `--page-space-sm`, `--page-space-md`, `--page-space-lg`, and `--page-space-xl` tokens |
| Content measure | existing 1200px container; prose around 65–75 characters |
| Section spacing | responsive spacing in `--page-section-space` |
| Radius / motion | shared component radius and duration tokens in `assets/pages.css` |
| Focus | 2px accent outline with 4px offset; visible in either theme |

## Components

| Component | Structure and behavior |
| --- | --- |
| Header | Logo links Home; three text links: Work, About, Contact. Current destination uses `aria-current="page"`. Native links remain available without JS. Theme/menu controls use SVGs. |
| Footer | One static partial: GitHub, LinkedIn, email, copyright. |
| Featured card | Large horizontal screenshot/body layout, stacked on small screens. Screenshot uses `contain`; result, role, status, three tags, and separate case-study/code/demo actions. No nested links. |
| Work-index card | One linked card, fixed 16:10 uncropped cover, summary, status, year, tags. |
| Fact row | Role, Team, Timeline, Platform, Year; five columns wide, fewer columns on mobile. Project type remains in the header. |
| Timeline | Date, role/program, place, one factual line. DOM order is newest first. Decorative line draws once; content never depends on that animation. |
| Primary button | Existing `btn-cta`; one dominant action per group. |
| Secondary button | Existing `btn-outline`; bordered action such as Get in touch or Download résumé. |
| Text link | `text-link`; visible focus and underline affordance, no icon-only navigation. |
| Form | Existing labels, field constraints, honeypot, status region, disabled submit, Turnstile and email fallback. Submission script and API remain unchanged. |
| Project gallery | Figure, screenshot link, caption. Native image links remain available; shared native-dialog lightbox adds keyboard controls. |

## Page order

Home: pitch → featured work → what I do → experience → optional proof (currently a TODO comment only) → contact.

About: intro/photo → dated experience and education → grouped stack → beyond code → contact.

Project: header → facts → full-width screenshot → problem → personal contribution/stack → approach, architecture, decisions/trade-offs → result/feature notes → captioned gallery → next steps → previous/next → contact.

## Motion and accessibility

Use GSAP only inside `prefers-reduced-motion: no-preference`. Sections rise 16–24px once; grids stagger with `grid: 'auto'` and `power3.out`; cards lift 4px without scaling screenshots. Cross-document transitions retain the cover name. Timeline line draw runs once. Reduced motion shows final states. No parallax or scroll-scrubbed backgrounds.

Pre-delivery checks: native landmarks and heading order; keyboard focus and menu Escape; accessible form labels; dark/light contrast; 375/768/1440px layouts; no-JS navigation/content; reduced motion; complete local image and link targets. Contact delivery and Turnstile verification require the deployed environment.

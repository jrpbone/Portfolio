
This repository contains a collection of my academic and personal projects developed during my studies. It showcases my skills in programming, problem-solving, and software development across multiple languages and technologies.

The projects included demonstrate my understanding of object-oriented programming, database management, and web development, as well as my ability to design and implement functional, well-structured systems.

This portfolio serves as a record of my learning progress and a reference for future academic and professional opportunities.

## Local preview

The home page is `index.html`; Selected Works, its five galleries, and case studies
live in `works.html`. Both pages use `index.css` and `assets/site.js` for shared
styling, navigation, themes, and gallery behavior.

Section navigation uses `assets/navigation.js` to scroll and move keyboard focus
without adding fragments to the URL. Cross-page links use a temporary `section`
query parameter, removed on arrival. Old fragment bookmarks are also cleaned up.
Normal refresh and Back/Forward retain the browser's native scroll restoration.
Only `index.html` opts into the scrolling image sequence with `landing-page` and
`assets/scroll-background.js`; other pages keep a plain theme background.

Run `python -m http.server 8000 --bind 127.0.0.1` from this directory, then open
http://127.0.0.1:8000. This previews the portfolio and animations. A static server
does not run the contact API: the form stays disabled and offers a direct email
link instead. An HTML 404 response for `/api/contact-config` is expected in this
mode and must never appear as a raw JSON parsing error on the page.

To test real contact delivery, use a Vercel development environment that runs the
`api` handlers, with `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`,
`CONTACT_TO_EMAIL`, and `CONTACT_FROM_EMAIL` configured privately. Use a Turnstile
site key allowed for the test hostname and a verified sending domain. Never put
secret keys in client-side files. Actual message delivery requires these services;
the static preview does not simulate a successful send.

Run the regression checks with `npm test` (Node.js and Python required).

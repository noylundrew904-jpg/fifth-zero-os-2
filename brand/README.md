# Personal brand site

A one-page portfolio for your personal brand, written as plain HTML, CSS and JS with no build step.
It uses the same visual language as Fifth Zero OS: black, the lime `#DBFF6B` accent,
IBM Plex Mono and Newsreader italic.

It was designed as an improved take on jandzhem.com (a director/producer portfolio).

## What it fixes compared with the reference site
| Reference site issue | This version |
|---|---|
| WordPress leftovers indexed ("Hello world!", `/author/admin/`, "Uncategorized") | No placeholder pages; one clean URL |
| Role described differently on different pages (Marketing Manager vs freelancer vs Creative Producer) | One positioning line plus one dated career timeline |
| Generic `<title>` (just the name) and no clear offer | Title and description say what you do and for whom; there is a Services section |
| No clear next step for a visitor | "Start a project" call to action in the nav, hero and contact section, plus copy-email and a reply-time promise |
| Work list without context | Filterable work grid; every project shows your role and the result |
| No proof | Client strip, stats, testimonial |
| Weak sharing/SEO metadata | Open Graph, Twitter card, canonical and `Person` JSON-LD |

It also handles accessibility (skip link, focus rings, `aria-pressed` filters, reduced-motion support) and responsive layout down to 360px.

## Make it yours
1. Open `index.html` and search for `EDIT`. Each marked line is personal content: name, headline, stats, clients, projects, bio, timeline, testimonial, email, socials and the SEO tags.
2. Project thumbnails: put images in `brand/work/` and add `<img src="work/x.jpg" alt="...">` inside each `.thumb`. Until you do, the cards show gradient placeholders.
3. Portrait: replace the `YN` placeholder in `.about-photo` with an `<img>`.
4. Add a 1200×630 `og.jpg` and update the `og:image` URL.

## Deploy
Drag the `brand/` folder onto vercel.com/new or netlify.com/drop, or open `index.html` locally.

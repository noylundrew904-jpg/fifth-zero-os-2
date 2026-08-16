# Fifth & Zero — event film studio

A premium, cinematic, no-build static website for a creative studio that
makes event films, aftermovies and social-first content for event agencies,
brands and corporate teams. Plain HTML/CSS/JS — no framework, no build
step, no `npm install`.

## Structure

```
index.html            Homepage — hero, archive teaser, manifesto,
                       agency partnership, "things we don't do", services
                       teaser, about teaser, final CTA / contact
work.html              Full project archive (editorial asymmetric grid)
project.html           Dynamic case-study template — reads ?slug= and
                        renders from assets/js/data.js
about.html              Studio manifesto + team
services.html           Full services breakdown + process
assets/css/style.css    Entire design system (variables, type, motion,
                         the reusable "media-frame" video-placeholder
                         component, all sections, responsive rules)
assets/js/data.js       Single source of truth for every project — add a
                         new event film here and it appears in the
                         homepage teaser, the full archive, and gets its
                         own case-study page automatically
assets/js/main.js       Custom cursor, intro loader, nav, scroll reveals,
                         media-frame wiring, archive rendering
assets/js/project.js    Renders project.html from the slug in the URL
images/favicon.svg      Favicon / wordmark mark
```

## Adding a new event film

Open `assets/js/data.js` and append an object to `FZ_PROJECTS`:

```js
{
  id: '008',
  slug: 'your-event-slug',
  title: 'EVENT NAME',
  client: 'Client / Agency',
  event: 'What kind of event',
  location: 'City, Country',
  year: 2026,
  category: 'AFTERMOVIE', // or EVENT FILM / TEASER / RECAP FILM / EVENT CONTENT
  span: 6,          // grid width 1–12, controls the archive's editorial rhythm
  vertical: false,  // true = tall 4:5 frame instead of 16:10
  media: { mp4: '', webm: '', poster: '' }, // fill in to replace the placeholder
  stats: [{ label: 'Duration', value: '2 Days' }, /* … */],
  brief: '…', approach: '…', result: '…',
  gallery: [{ poster: '' }, /* … */],
  credits: [{ role: 'Director', name: '…' }, /* … */]
}
```

No other file needs to change — it shows up on the homepage, in
`work.html`, and at `project.html?slug=your-event-slug` immediately.

### Swapping in real footage

Every video placeholder is a `.media-frame` element built by
`FZ.mediaFrameHTML()` in `assets/js/main.js`. As soon as a project's
`media.mp4` / `media.webm` / `media.poster` fields are filled in, that
project's frames switch from the animated placeholder treatment to real
`<video>` playback (hover-to-play on archive cards, in-view autoplay on
the hero and case-study pages) — no markup changes required.

## Run locally

No build step — just serve the folder:

```bash
npx serve .
```

or open `index.html` directly in a browser.

## Deploy

Static files only, so any static host works: Vercel (drag-and-drop),
Netlify Drop, GitHub Pages, or any CDN/bucket that serves plain files.

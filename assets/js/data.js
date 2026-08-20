/**
 * Fifth & Zero — project data.
 * Single source of truth for the archive, the homepage teaser and the
 * case-study template. Add a new event film by appending an object here —
 * no other file needs to change, and the layout code never needs to touch
 * this file again as the archive grows past 50 projects.
 *
 * ------------------------------------------------------------------
 * PUBLISHING A NEW PROJECT (no coding required):
 *
 * 1. Make a folder for it:
 *      assets/media/projects/<slug>/
 *
 * 2. Drop files in using these exact names:
 *      hero.mp4          the main film (autoplays muted, loops)
 *      hero.webm         optional — smaller file size, used if the browser supports it
 *      hero-mobile.mp4   optional — a lighter/cropped cut served under 640px wide
 *      poster.jpg        shown while the video is loading or paused
 *      gallery-01.jpg     as many still frames as you like, numbered in order
 *      gallery-02.jpg
 *      ...
 *
 * 3. Copy one of the objects below, paste it above the closing `];`,
 *    and fill in the fields. Point `media.mp4` etc. at the files you
 *    just added, e.g. 'assets/media/projects/your-slug/hero.mp4'.
 *
 * 4. Leave any media field as '' (empty string) to keep the studio's
 *    animated placeholder for that spot instead — nothing breaks,
 *    nothing looks unfinished. The moment a real path is filled in,
 *    that placeholder is replaced by the real file automatically.
 * ------------------------------------------------------------------
 */
/**
 * Homepage hero showreel — separate from individual project media.
 * See assets/media/showreel/README.txt. Leave any field '' to keep
 * the studio's placeholder treatment in the hero.
 */
window.FZ_SHOWREEL = {
  mp4: '',        // assets/media/showreel/showreel.mp4
  webm: '',       // assets/media/showreel/showreel.webm
  mp4Mobile: '',  // assets/media/showreel/showreel-mobile.mp4
  poster: ''      // assets/media/showreel/poster.jpg
};

/**
 * Inquiry flow config — used by inquire.html.
 * Most of the archive is gated (see `gated: true` on projects below):
 * instead of a public case study, visiting a gated project redirects to
 * inquire.html, which offers a mailto and, once you have one, a link to
 * a Google Form. Paste the form's public "Send" link (the one ending in
 * /viewform, not /edit) into formUrl below to turn that button on —
 * until then it just stays hidden and the mailto option carries the page.
 */
window.FZ_INQUIRE = {
  email: 'hello@fifthandzero.studio',
  formUrl: '' // e.g. 'https://docs.google.com/forms/d/e/XXXXXXX/viewform'
};

/**
 * ------------------------------------------------------------------
 * NOTE ON THE PROJECTS BELOW: these are conceptual visual studies, not
 * case studies of real client work. There is no client, no real event,
 * no measured result behind any of them — they exist to demonstrate
 * how the archive, the case-study template and the design system feel
 * with content in them. See assets/media/STOCK-SOURCES.md for how to
 * source real (properly licensed) footage for these slots, and
 * replace title/event/brief/approach/result with real project
 * information once real client work exists. Never invent a client
 * name, a crew name, or a real-world outcome (attendance, reach,
 * business impact) for placeholder content.
 *
 * GATING: only THE REVEAL and FULL VOLUME are public right now — the
 * other five carry `gated: true`. Gated projects never appear in the
 * archive grid and are unreachable directly: visiting their slug
 * redirects to inquire.html instead of showing the case study. Flip
 * `gated` on any project to change what's public.
 * ------------------------------------------------------------------
 */
window.FZ_PROJECTS = [
  {
    id: '001',
    slug: 'the-reveal',
    title: 'THE REVEAL',
    event: 'Product Launch',
    location: 'Berlin, Germany',
    year: 2026,
    category: 'TEASER',
    description: 'A visual study in withholding — how long you can delay a reveal before anticipation becomes its own kind of energy.',
    span: 8,
    vertical: false,
    media: {
      mp4: '',        // assets/media/projects/the-reveal/hero.mp4
      webm: '',        // assets/media/projects/the-reveal/hero.webm
      mp4Mobile: '',   // assets/media/projects/the-reveal/hero-mobile.mp4
      poster: ''       // assets/media/projects/the-reveal/poster.jpg
    },
    stats: [
      { label: 'Format', value: 'Teaser' },
      { label: 'Treatment', value: 'Restraint' },
      { label: 'Palette', value: 'Low-Key' },
      { label: 'Mood', value: 'Anticipation' }
    ],
    brief: 'A study in withholding — how long you can delay a reveal before anticipation turns into energy of its own.',
    approach: 'Built entirely from the moments before: hands, light, hushed movement. The subject of the reveal barely appears — the room’s reaction does the telling.',
    result: 'A short cut built to run before the doors even open, on the idea that restraint can carry as much charge as spectacle.',
    gallery: [
      { image: '', alt: 'The Reveal — hands in low light' },
      { image: '', alt: 'The Reveal — crowd anticipation' },
      { image: '', alt: 'The Reveal — stage detail before reveal' },
      { image: '', alt: 'The Reveal — lighting rig' },
      { image: '', alt: 'The Reveal — countdown moment' },
      { image: '', alt: 'The Reveal — audience reaction' }
    ],
    credits: []
  },
  {
    id: '002',
    slug: 'after-dark',
    title: 'AFTER DARK',
    event: 'Night Event',
    location: 'Lisbon, Portugal',
    year: 2025,
    category: 'EVENT FILM',
    gated: true,
    description: 'A visual study in low light and proximity — what a night event feels like from inside the crowd, not from the photo pit.',
    span: 4,
    vertical: true,
    media: { mp4: '', webm: '', mp4Mobile: '', poster: '' },
    stats: [
      { label: 'Format', value: 'Event Film' },
      { label: 'Treatment', value: 'Handheld' },
      { label: 'Palette', value: 'Neon' },
      { label: 'Mood', value: 'Intimate' }
    ],
    brief: 'A study in low light and proximity — what a night event feels like from inside the crowd, not from the photo pit.',
    approach: 'Handheld throughout, shot at the same eye-level as the audience. No wide establishing shots — the scale comes from density, not distance.',
    result: 'A film built to feel like memory rather than documentation — fragments, not a timeline.',
    gallery: [
      { image: '', alt: 'After Dark — crowd at night' },
      { image: '', alt: 'After Dark — stage lighting' },
      { image: '', alt: 'After Dark — DJ booth' },
      { image: '', alt: 'After Dark — festival grounds' }
    ],
    credits: []
  },
  {
    id: '003',
    slug: 'in-motion',
    title: 'IN MOTION',
    event: 'Conference',
    location: 'Austin, USA',
    year: 2025,
    category: 'RECAP FILM',
    gated: true,
    description: 'A visual study in pace — how to cut a conference so it moves like a live show instead of a slideshow.',
    span: 6,
    vertical: false,
    media: { mp4: '', webm: '', mp4Mobile: '', poster: '' },
    stats: [
      { label: 'Format', value: 'Recap Film' },
      { label: 'Treatment', value: 'Wide & Low' },
      { label: 'Palette', value: 'Stage Light' },
      { label: 'Mood', value: 'Momentum' }
    ],
    brief: 'A study in pace — how to cut a conference so it moves like a live show instead of a slideshow.',
    approach: 'Wide lenses, low angles, a sound mix that leans into the room rather than the lapel mic — treating the stage like a set, not a podium.',
    result: 'Proof a keynote can carry the same energy as a headline act without losing the message.',
    gallery: [
      { image: '', alt: 'In Motion — keynote stage' },
      { image: '', alt: 'In Motion — audience wide shot' },
      { image: '', alt: 'In Motion — speaker detail' }
    ],
    credits: []
  },
  {
    id: '004',
    slug: 'the-main-event',
    title: 'THE MAIN EVENT',
    event: 'Brand Experience',
    location: 'Chamonix, France',
    year: 2025,
    category: 'AFTERMOVIE',
    gated: true,
    description: 'A visual study in scale — how a single activation can be cut to feel like the centre of the calendar, not one stop on it.',
    span: 4,
    vertical: true,
    media: { mp4: '', webm: '', mp4Mobile: '', poster: '' },
    stats: [
      { label: 'Format', value: 'Aftermovie' },
      { label: 'Treatment', value: 'Build & Release' },
      { label: 'Palette', value: 'Full Colour' },
      { label: 'Mood', value: 'Scale' }
    ],
    brief: 'A study in scale — how a single activation can be cut to feel like the centre of the calendar, not one stop on it.',
    approach: 'Wide establishing shots paired with tight production detail, cut to a rhythm that builds rather than recaps.',
    result: 'A short-form cut built for the feed, paced to make the next one feel inevitable.',
    gallery: [
      { image: '', alt: 'The Main Event — mountain venue wide shot' },
      { image: '', alt: 'The Main Event — production detail' }
    ],
    credits: []
  },
  {
    id: '005',
    slug: 'after-the-lights',
    title: 'AFTER THE LIGHTS',
    event: 'Corporate Event',
    location: 'Singapore',
    year: 2024,
    category: 'RECAP FILM',
    gated: true,
    description: 'A visual study in what’s left once the main stage empties — the parts of a corporate event that usually go uncut.',
    span: 7,
    vertical: false,
    media: { mp4: '', webm: '', mp4Mobile: '', poster: '' },
    stats: [
      { label: 'Format', value: 'Recap Film' },
      { label: 'Treatment', value: 'Observational' },
      { label: 'Palette', value: 'Warm' },
      { label: 'Mood', value: 'Quiet' }
    ],
    brief: 'A study in what’s left once the main stage empties — the parts of a corporate event that usually go uncut.',
    approach: 'Faces, tables, the walk out — detail over spectacle, on the theory that recognition reads stronger than scale.',
    result: 'A quieter cut than the format usually asks for, built on the idea that restraint reads as confidence.',
    gallery: [
      { image: '', alt: 'After the Lights — room wide shot' },
      { image: '', alt: 'After the Lights — guest table detail' },
      { image: '', alt: 'After the Lights — stage walk-out' }
    ],
    credits: []
  },
  {
    id: '006',
    slug: 'the-crowd',
    title: 'THE CROWD',
    event: 'Festival / Cultural Event',
    location: 'Manchester, UK',
    year: 2026,
    category: 'AFTERMOVIE',
    gated: true,
    description: 'A visual study in collective energy — how a crowd becomes the actual subject of an event film, not the backdrop to it.',
    span: 5,
    vertical: false,
    media: { mp4: '', webm: '', mp4Mobile: '', poster: '' },
    stats: [
      { label: 'Format', value: 'Aftermovie' },
      { label: 'Treatment', value: 'Crowd-Facing' },
      { label: 'Palette', value: 'Saturated' },
      { label: 'Mood', value: 'Collective' }
    ],
    brief: 'A study in collective energy — how a crowd becomes the actual subject of an event film, not the backdrop to it.',
    approach: 'No stage-forward shots, no headline names in frame — camera turned toward the audience for almost the entire cut.',
    result: 'A film that argues the crowd was always the real performance.',
    gallery: [
      { image: '', alt: 'The Crowd — festival audience wide shot' },
      { image: '', alt: 'The Crowd — close crowd detail' },
      { image: '', alt: 'The Crowd — hands and lights' },
      { image: '', alt: 'The Crowd — dusk atmosphere' },
      { image: '', alt: 'The Crowd — collective reaction' }
    ],
    credits: []
  },
  {
    id: '007',
    slug: 'full-volume',
    title: 'FULL VOLUME',
    event: 'Concert',
    location: 'Mexico City, Mexico',
    year: 2024,
    category: 'EVENT FILM',
    description: 'A visual study in peak energy — the few minutes of a live show where sound, light and crowd hit at the same time.',
    span: 12,
    vertical: false,
    media: { mp4: '', webm: '', mp4Mobile: '', poster: '' },
    stats: [
      { label: 'Format', value: 'Event Film' },
      { label: 'Treatment', value: 'Fast Cut' },
      { label: 'Palette', value: 'High Contrast' },
      { label: 'Mood', value: 'Peak Energy' }
    ],
    brief: 'A study in peak energy — the few minutes of a live show where sound, light and crowd hit at the same time.',
    approach: 'Full-colour, full-volume, cut fast — a visual language built entirely around the drop, not the build-up.',
    result: 'The loudest film in the archive, by design.',
    gallery: [
      { image: '', alt: 'Full Volume — stage wide shot' },
      { image: '', alt: 'Full Volume — performer close-up' },
      { image: '', alt: 'Full Volume — crowd under lights' },
      { image: '', alt: 'Full Volume — pyrotechnics / lighting burst' }
    ],
    credits: []
  }
];

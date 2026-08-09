/**
 * REPLAY — project data.
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
window.REPLAY_SHOWREEL = {
  mp4: '',        // assets/media/showreel/showreel.mp4
  webm: '',       // assets/media/showreel/showreel.webm
  mp4Mobile: '',  // assets/media/showreel/showreel-mobile.mp4
  poster: ''      // assets/media/showreel/poster.jpg
};

/**
 * ------------------------------------------------------------------
 * NOTE ON THE PROJECTS BELOW: these are demo/placeholder entries that
 * exist to prove out the layout and the copy voice — none of the
 * clients, credits, or results are real. Before this site goes to a
 * real event agency or client:
 *   - replace `client` with the real client/agency name (or delete
 *     the field to hide it)
 *   - replace `credits` with real names, or leave the array empty —
 *     never invent a crew member
 *   - rewrite brief/approach/result from the actual project, not
 *     this placeholder copy
 * Curating for real: pick 5-7 of your strongest projects rather than
 * publishing everything — lead with your best visual impact and
 * strongest brand credibility, and keep the rest as supporting work.
 * ------------------------------------------------------------------
 */
window.REPLAY_PROJECTS = [
  {
    id: '001',
    slug: 'ignite-summit',
    title: 'IGNITE SUMMIT',
    client: 'Placeholder Client',
    event: 'Global Brand Activation',
    location: 'Berlin, Germany',
    year: 2026,
    category: 'AFTERMOVIE',
    description: 'An aftermovie built to sell next year’s edition before this year’s stage lights were down.',
    span: 8,
    vertical: false,
    media: {
      mp4: '',        // assets/media/projects/ignite-summit/hero.mp4
      webm: '',        // assets/media/projects/ignite-summit/hero.webm
      mp4Mobile: '',   // assets/media/projects/ignite-summit/hero-mobile.mp4
      poster: ''       // assets/media/projects/ignite-summit/poster.jpg
    },
    stats: [
      { label: 'Duration', value: '3 Days' },
      { label: 'Attendance', value: '12,000' },
      { label: 'Footage Shot', value: '48 Hrs' },
      { label: 'Deliverables', value: '1 Film / 6 Cuts' }
    ],
    brief: 'A single film that could sell next year’s edition before this year’s stage lights were even down — something that captured scale without flattening it into another drone-and-crowd montage.',
    approach: 'We ran a five-camera unit across all three days, prioritising proximity over coverage: performer eyelines, crew radios, the second before a cue lands. The edit is built on rhythm, not chronology.',
    result: 'Cut and delivered inside 48 hours — the turnaround the format is actually built for.',
    gallery: [
      { image: '', alt: 'Ignite Summit — main stage wide shot' },
      { image: '', alt: 'Ignite Summit — crowd detail' },
      { image: '', alt: 'Ignite Summit — performer close-up' },
      { image: '', alt: 'Ignite Summit — production detail' },
      { image: '', alt: 'Ignite Summit — lighting rig' },
      { image: '', alt: 'Ignite Summit — audience reaction' }
    ],
    credits: []
  },
  {
    id: '002',
    slug: 'nightshift',
    title: 'NIGHTSHIFT',
    client: 'Placeholder Client',
    event: 'Music & Culture Festival',
    location: 'Lisbon, Portugal',
    year: 2025,
    category: 'EVENT FILM',
    description: 'A festival film shot entirely handheld, entirely at night, with no interviews and no cued branding.',
    span: 4,
    vertical: true,
    media: { mp4: '', webm: '', mp4Mobile: '', poster: '' },
    stats: [
      { label: 'Duration', value: '2 Nights' },
      { label: 'Attendance', value: '30,000' },
      { label: 'Footage Shot', value: '61 Hrs' },
      { label: 'Deliverables', value: '1 Film / 9 Cuts' }
    ],
    brief: 'A festival in its fourth year, competing for the same headline slots as events ten years older. They needed a film that made the lineup feel like the least interesting part.',
    approach: 'Shot entirely handheld, entirely at night. No interviews, no branding shots on cue — the sponsors appear because they were actually there, in frame, in the crowd.',
    result: 'The kind of film people forward on their own — no paid push behind it, none needed.',
    gallery: [
      { image: '', alt: 'Nightshift — crowd at night' },
      { image: '', alt: 'Nightshift — stage lighting' },
      { image: '', alt: 'Nightshift — DJ booth' },
      { image: '', alt: 'Nightshift — festival grounds' }
    ],
    credits: []
  },
  {
    id: '003',
    slug: 'summit-of-things',
    title: 'SUMMIT OF THINGS',
    client: 'Placeholder Client',
    event: 'Product Launch Conference',
    location: 'Austin, USA',
    year: 2025,
    category: 'RECAP FILM',
    description: 'A corporate keynote treated like a concert — wide lenses, low angles, a mix that leans into the room.',
    span: 6,
    vertical: false,
    media: { mp4: '', webm: '', mp4Mobile: '', poster: '' },
    stats: [
      { label: 'Duration', value: '1 Day' },
      { label: 'Attendance', value: '4,200' },
      { label: 'Footage Shot', value: '22 Hrs' },
      { label: 'Deliverables', value: '1 Film / 12 Social Cuts' }
    ],
    brief: 'A corporate keynote that needed to not look like a corporate keynote — without losing a single stakeholder’s trust in the process.',
    approach: 'We treated the main stage like a concert: wide lenses, low angles, and a sound mix that leaned into the room rather than the lapel mic.',
    result: 'Proof a keynote can be cut with the energy of a live show without losing the room.',
    gallery: [
      { image: '', alt: 'Summit of Things — keynote stage' },
      { image: '', alt: 'Summit of Things — audience wide shot' },
      { image: '', alt: 'Summit of Things — speaker detail' }
    ],
    credits: []
  },
  {
    id: '004',
    slug: 'the-drop',
    title: 'THE DROP',
    client: 'Placeholder Client',
    event: 'Product Reveal / Brand Activation',
    location: 'Chamonix, France',
    year: 2025,
    category: 'TEASER',
    description: 'A 90-second teaser cut and ready before the doors even opened.',
    span: 4,
    vertical: true,
    media: { mp4: '', webm: '', mp4Mobile: '', poster: '' },
    stats: [
      { label: 'Duration', value: '4 Hrs' },
      { label: 'Attendance', value: '800' },
      { label: 'Footage Shot', value: '9 Hrs' },
      { label: 'Deliverables', value: '1 Teaser / 3 Cuts' }
    ],
    brief: 'A 90-second teaser to run before the doors even opened — built from a tech scout and a promise, not a finished event.',
    approach: 'Pre-cut the rhythm before a single frame existed, then shot to the edit rather than editing to the footage.',
    result: 'Cut to the beat before the beat existed — live within hours of the reveal ending.',
    gallery: [
      { image: '', alt: 'The Drop — mountain reveal' },
      { image: '', alt: 'The Drop — product detail' }
    ],
    credits: []
  },
  {
    id: '005',
    slug: 'floor-eleven',
    title: 'FLOOR ELEVEN',
    client: 'Placeholder Client',
    event: 'Internal Company Gala',
    location: 'Singapore',
    year: 2024,
    category: 'AFTERMOVIE',
    description: 'An internal gala film shot for the room, not the reel — faces and detail over spectacle.',
    span: 7,
    vertical: false,
    media: { mp4: '', webm: '', mp4Mobile: '', poster: '' },
    stats: [
      { label: 'Duration', value: '1 Night' },
      { label: 'Attendance', value: '1,600' },
      { label: 'Footage Shot', value: '14 Hrs' },
      { label: 'Deliverables', value: '1 Film' }
    ],
    brief: 'An internal event, not a marketing asset — which meant the only audience that mattered was the room itself, a year later.',
    approach: 'We shot for recognition, not spectacle: faces, tables, the walk to the stage. The kind of detail only the people who were there will catch.',
    result: 'Built for a room of a few hundred, not a feed of a million — and it played like it.',
    gallery: [
      { image: '', alt: 'Floor Eleven — gala room wide shot' },
      { image: '', alt: 'Floor Eleven — guest table detail' },
      { image: '', alt: 'Floor Eleven — stage walk' }
    ],
    credits: []
  },
  {
    id: '006',
    slug: 'ground-control',
    title: 'GROUND CONTROL',
    client: 'Placeholder Client',
    event: 'Multi-City Brand Tour',
    location: 'Tokyo / Seoul / Sydney',
    year: 2026,
    category: 'EVENT CONTENT',
    description: 'One brand, three cities, a same-night turnaround workflow across the whole tour.',
    span: 5,
    vertical: false,
    media: { mp4: '', webm: '', mp4Mobile: '', poster: '' },
    stats: [
      { label: 'Duration', value: '9 Days' },
      { label: 'Cities', value: '3' },
      { label: 'Footage Shot', value: '90 Hrs' },
      { label: 'Deliverables', value: '3 Films / 24 Cuts' }
    ],
    brief: 'One brand, three cities, three very different crowds — and a single visual language that had to hold across all of them.',
    approach: 'A travelling two-person unit and a same-night turnaround workflow, cutting each city’s recap before the next load-in began.',
    result: 'The turnaround was the achievement as much as any single cut — three cities, no drop in pace.',
    gallery: [
      { image: '', alt: 'Ground Control — Tokyo leg' },
      { image: '', alt: 'Ground Control — Seoul leg' },
      { image: '', alt: 'Ground Control — Sydney leg' },
      { image: '', alt: 'Ground Control — load-in' },
      { image: '', alt: 'Ground Control — crew on the move' }
    ],
    credits: []
  },
  {
    id: '007',
    slug: 'wildhouse',
    title: 'WILDHOUSE',
    client: 'Placeholder Client',
    event: 'Warehouse Rave Series',
    location: 'Manchester, UK',
    year: 2024,
    category: 'EVENT FILM',
    description: 'No brief, no shot list — one camera, one operator, one open call from a promoter who said "just go".',
    span: 12,
    vertical: false,
    media: { mp4: '', webm: '', mp4Mobile: '', poster: '' },
    stats: [
      { label: 'Duration', value: '1 Night' },
      { label: 'Attendance', value: '2,300' },
      { label: 'Footage Shot', value: '18 Hrs' },
      { label: 'Deliverables', value: '1 Film' }
    ],
    brief: 'No brief. An open call from a promoter who’d seen our other work and said "just go".',
    approach: 'One camera, one operator, no shot list. The film that came back is the one we point to when a client asks what "no stock music" actually looks like.',
    result: 'No brief, no client, no safety net — the kind of film only that much trust makes possible.',
    gallery: [
      { image: '', alt: 'Wildhouse — warehouse crowd' },
      { image: '', alt: 'Wildhouse — DJ set' },
      { image: '', alt: 'Wildhouse — smoke and lights' },
      { image: '', alt: 'Wildhouse — exterior queue' }
    ],
    credits: []
  }
];

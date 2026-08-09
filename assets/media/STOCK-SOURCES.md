# Stock media sources

This file tracks every non-original (stock) video and image used on the
site, so every asset can be found, credited correctly, and swapped out
for real client work later. **Every stock asset is temporary** — treat
anything logged here as `TEMPORARY STOCK / REPLACE BEFORE CLIENT USE`.

## Current status: empty — no stock assets have been added yet

This build environment cannot reach external sites (Pexels, Pixabay,
Coverr, Mixkit, stock libraries, or general web browsing are all
blocked by network policy here), so no footage or images could
actually be sourced or downloaded from this session. Nothing in
`assets/media/` is a stock asset right now — every project still shows
the studio's animated placeholder treatment.

The rest of this file is a ready-to-use template and a concrete
shopping list so filling it in is quick once you're sourcing from a
machine with normal internet access.

---

## How to log an asset

One row per file, added the moment you download it — don't batch this
at the end, it's easy to lose track of which clip came from where.

| Filename | Source | Creator | URL | License | Date Accessed | Where Used |
|---|---|---|---|---|---|---|
| _(example)_ hero.mp4 | Pexels | Jane Doe | https://pexels.com/video/... | Pexels License (free, commercial use, no attribution required) | 2026-08-09 | the-reveal hero |

Fill in real rows above as you add files, in the same folders the site
already expects:

```
assets/media/showreel/showreel.mp4
assets/media/showreel/showreel.webm
assets/media/showreel/showreel-mobile.mp4
assets/media/showreel/poster.jpg

assets/media/projects/<slug>/hero.mp4
assets/media/projects/<slug>/hero.webm
assets/media/projects/<slug>/hero-mobile.mp4
assets/media/projects/<slug>/poster.jpg
assets/media/projects/<slug>/gallery-01.jpg
assets/media/projects/<slug>/gallery-02.jpg
...
```

No new folder structure is needed — this uses the same
`assets/media/projects/<slug>/` and `assets/media/showreel/` layout
the site already reads from `assets/js/data.js`. Once a file exists at
the path a project's `media.mp4` (etc.) points to, it replaces the
placeholder automatically.

---

## Where to look

All of these publish under licenses that are free for commercial use
without attribution (double-check the license on the specific clip
page before downloading — terms occasionally vary by asset):

- **Pexels Videos** (pexels.com/videos) — the strongest general
  source for event/concert/crowd footage; consistently well-lit,
  well-composed.
- **Coverr** (coverr.co) — smaller library, but curated toward
  cinematic/premium-feeling clips rather than generic corporate stock.
- **Mixkit** (mixkit.co/free-stock-video) — good for lighting,
  crowd and detail shots specifically.
- **Pixabay Videos** (pixabay.com/videos) — largest volume; quality is
  more variable, so filter hard.
- **Videvo** (videvo.net) — mixed free/paid, filter to the free,
  commercial-use tier.
- **Unsplash** / **Pexels Photos** — for gallery stills specifically.

**Reject on sight:** anything with a visible watermark, a logo that
isn't yours, an obvious "stock footage" look (flat corporate lighting,
posed smiles, handshake shots), or footage you can't find a clear
commercial license for. If a clip requires digging to find its license
terms, skip it — it's not worth the risk.

## What to search for, per project

Matches the conceptual project titles already in `data.js` — search
terms are starting points, not exact matches:

| Project | Search terms |
|---|---|
| **THE REVEAL** (product launch, teaser) | "product reveal stage", "spotlight reveal", "anticipation crowd", "countdown event" |
| **AFTER DARK** (night event) | "night club crowd", "concert low light", "neon crowd", "DJ booth night" |
| **IN MOTION** (conference) | "conference stage wide", "keynote speaker", "auditorium audience", "corporate stage lighting" |
| **THE MAIN EVENT** (brand experience) | "brand activation", "experiential event", "product showcase stage", "event production build" |
| **AFTER THE LIGHTS** (corporate event) | "gala dinner", "corporate event guests", "formal event tables", "event walkout" |
| **THE CROWD** (festival) | "festival crowd", "crowd hands up", "festival aerial", "audience reaction concert" |
| **FULL VOLUME** (concert) | "concert stage lights", "live performance crowd", "stage pyrotechnics", "concert wide shot" |
| **Showreel** (all of the above) | pull the single strongest 1-2 second moment from each clip above — see below |

## Assembling the showreel

`assets/media/showreel/` expects a single ~10-20 second cut. This
environment has no video-editing tool available (no ffmpeg, no video
library), so the montage itself has to be cut outside this session —
any free tool works (CapCut, DaVinci Resolve, even a phone editing
app). Suggested structure, matching the site's own manifesto beats
(`the build / anticipation / reveal / crowd / light / performance /
detail / aftermath`):

1. Quiet build (1-2s) — pre-event, empty space, hands, setup
2. Anticipation (1-2s) — crowd waiting, lights dimming
3. Reveal / drop (1-2s) — the peak moment, brightest cut in the reel
4. Crowd (2-3s) — wide shot, density, energy
5. Light (1-2s) — a purely visual/abstract beat, no people
6. Performance (2-3s) — a performer/speaker/stage moment
7. Detail (1-2s) — a close, tactile shot
8. Aftermath (1-2s) — quieter closing beat, confetti settling / lights coming up

Cut hard, no crossfades — matches the site's own "film, not slideshow"
editing language. Export an mp4 (H.264) and a webm if you can, plus a
`hero-mobile.mp4` cropped to a taller aspect ratio if the source
footage allows it, and a `poster.jpg` pulled from the strongest single
frame.

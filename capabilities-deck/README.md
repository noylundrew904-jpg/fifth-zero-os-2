# Fifth & Zero — Capabilities Deck

A 26-slide, 16:9 creative-services credentials deck: `Fifth-Zero-Capabilities-Deck.pptx`
(fully editable) and `Fifth-Zero-Capabilities-Deck.pdf` (same deck, flattened).

## Brand basis

No separate brand book was attached to this task, so the deck reuses the
identity already live in this repo's product (`style.css`, `images/logo.svg`):
black ground, `#DBFF6B` lime accent, IBM Plex Mono for system/label text,
Newsreader italic for headline accents, and the nested-square mark.

## Sample work

Every campaign, event, and brand referenced in the deck (MERIDIAN, NOCTURNE,
AERO, ORBIT CAPITAL, AFTERGLOW, FERRO COFFEE, AERO PAY) is fictional,
invented for this deck to demonstrate range — none of it depicts real client
work. All mockups (screens, posters, banners, storyboards, contact sheets)
are original vector/graphic compositions built from the brand's own visual
language, not photographs or AI-generated imagery.

## Regenerating

The deck is built programmatically (`src/`), so it can be edited and rebuilt
rather than hand-adjusted shape by shape.

```
cd src
npm install pptxgenjs sharp image-size   # first run only
node gen-assets.js     # rasterizes scene graphics to ../assets (SVG -> PNG via sharp)
node build-deck.js     # assembles the 26 slides with pptxgenjs -> ../out/*.pptx
```

- `scenes.js` — the SVG "scene" library (LED walls, tunnels, storyboards,
  contact sheets, poster/banner mockups, diagrams) in the brand's flat
  technical-cinematic style.
- `gen-assets.js` — renders every scene needed by the deck to PNG.
- `build-deck.js` — lays out all 26 slides (brand chrome, kicker/headline/body
  copy, image placement) and writes the `.pptx`.

To get a PDF from the `.pptx`, use LibreOffice headless:
`soffice --headless --convert-to pdf Fifth-Zero-Capabilities-Deck.pptx`.

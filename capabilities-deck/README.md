# Fifth & Zero — Capabilities Deck

A 26-slide, 16:9 creative-services credentials deck: `Fifth-Zero-Capabilities-Deck.pptx`
(fully editable) and `Fifth-Zero-Capabilities-Deck.pdf` (same deck, flattened).

## Brand basis

Built strictly to `brand/Fifth-and-Zero-Condensed-Guide.pdf`:

- **Colour**: black `#0A0A0A` (default), white `#FFFFFF` (max contrast),
  off-white `#F6F4EF` (long-read surfaces). Signal red `#E2361F` is worn
  **only by the dot** — never a background, button, headline colour, or
  block of colour.
- **Mark**: the "5" numeral with the red dot standing in for zero.
- **Type**: Poppins 700 for H1/hero headlines, Liberation Sans 400 for
  running copy, DejaVu Sans Mono for labels/metadata.
- **Voice**: short, cut not padded; confident, never boastful; plain about
  what's real. Never "end-to-end," "360-degree," "synergy."

Most slides sit on off-white (matching the guide's own pages); six hero/
cinematic moments (cover, main-stage LED, tunnel, skylight, AI-generated
content, close) run on black. Every "mockup" in the deck is a thin-bordered
flat-fill card system (echoing the guide's own colour-swatch and
application layouts) rather than photography — red appears only as an
isolated dot accent, never a fill.

## Sample work

Every campaign, event, and brand referenced in the deck (MERIDIAN, NOCTURNE,
AERO, ORBIT CAPITAL, AFTERGLOW, FERRO COFFEE, AERO PAY) is fictional,
invented for this deck to demonstrate range — none of it depicts real client
work.

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
  contact sheets, poster/banner mockups, diagrams) as monochrome
  thin-bordered cards with sparing red-dot accents.
- `gen-assets.js` — renders every scene needed by the deck to PNG, per
  slide's light/dark theme.
- `build-deck.js` — lays out all 26 slides (mark, kicker with dot bullet,
  Poppins headline, Liberation Sans body, image placement) and writes the
  `.pptx`.

Poppins isn't preinstalled on most Linux boxes (needed for accurate local
PDF/QA rendering via LibreOffice) — grab it if missing:
```
curl -sSL -o ~/.fonts/Poppins-Bold.ttf https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/Poppins-Bold.ttf
curl -sSL -o ~/.fonts/Poppins-Regular.ttf https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/Poppins-Regular.ttf
fc-cache -f ~/.fonts
```

To get a PDF from the `.pptx`, use LibreOffice headless:
`soffice --headless --convert-to pdf Fifth-Zero-Capabilities-Deck.pptx`.

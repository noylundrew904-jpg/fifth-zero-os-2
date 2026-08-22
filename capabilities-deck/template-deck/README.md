# Fifth & Zero — Template Deck

A lightweight 8-slide starter, same brand system as the full capabilities
deck (`../Fifth-Zero-Capabilities-Deck.pptx`), built for fast iteration:

- **Slides 1–5**: cover, "What We Do," Key Visuals (4-up), Event Screens,
  and close — each with a **dummy image placeholder** (dashed frame,
  picture icon, "IMAGE PLACEHOLDER — REPLACE WITH FINAL ART" label).
  To swap: select the placeholder group, delete it, then
  `Insert > Pictures` in its place — or just right-click an inserted
  picture and "Send to Back" over the placeholder, then delete the frame.
- **Slides 6–8**: "Video Templates," each with **two dummy video
  placeholders** side by side (dashed frame, play-button icon, label).
  To swap: `Insert > Media > Video`, then resize/position the video over
  the dashed frame, and delete the frame. Each of these 3 slides also
  carries a speaker note with the same instructions.

## Regenerating

```
cd capabilities-deck/template-deck
node template-deck.js    # requires pptxgenjs (npm install pptxgenjs)
```

Writes to `out/Fifth-Zero-Template-Deck.pptx` relative to wherever it's run
from — copy the result here after generating.

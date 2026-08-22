// Fifth & Zero — lightweight template deck.
// 5 content slides with clearly-marked DUMMY image placeholders, plus 3
// slides each carrying 2 DUMMY video placeholders to embed real video into
// later. Same brand system as the full capabilities deck: strict
// black/white/off-white, red #E2361F used only as the singular dot,
// Poppins headlines, Liberation Sans body, DejaVu Sans Mono labels.

const pptxgen = require('pptxgenjs');
const path = require('path');

const BLACK = '0A0A0A';
const WHITE = 'FFFFFF';
const OFFWHITE = 'F6F4EF';
const RED = 'E2361F';

const FONT_HEAD = 'Poppins';
const FONT_BODY = 'Liberation Sans';
const FONT_MONO = 'DejaVu Sans Mono';

const THEME = {
  dark: { bg: BLACK, ink: WHITE, inkDim: 'D8D8D8', inkFaint: '8A8A8A', line: '3A3A3A' },
  light: { bg: OFFWHITE, ink: BLACK, inkDim: '3A3A3A', inkFaint: '8C8C86', line: 'D8D5CC' },
};

const PW = 13.333, PH = 7.5;
const M = 0.55;
const TOTAL = 8;

const pres = new pptxgen();
pres.defineLayout({ name: 'FZ169', width: PW, height: PH });
pres.layout = 'FZ169';
pres.author = 'Fifth and Zero';
pres.company = 'Fifth and Zero';
pres.title = 'Fifth and Zero - Template Deck';

function setBg(slide, t) { slide.background = { color: THEME[t].bg }; }

function markLogo(slide, x, y, s, t) {
  const ink = THEME[t].ink;
  slide.addText('5', {
    x, y, w: s * 1.05, h: s * 1.25, fontFace: FONT_HEAD, bold: true,
    fontSize: s * 62, color: ink, margin: 0, align: 'left', valign: 'top',
  });
  const r = s * 0.16;
  slide.addShape('ellipse', {
    x: x + s * 0.62, y: y + s * 0.60, w: r * 2, h: r * 2,
    fill: { color: RED }, line: { type: 'none' },
  });
}

function chrome(slide, idx, t, tag) {
  const ink = THEME[t].ink, faint = THEME[t].inkFaint;
  markLogo(slide, M, 0.30, 0.19, t);
  slide.addText('FIFTH & ZERO', {
    x: M + 0.36, y: 0.30, w: 3.2, h: 0.26, fontFace: FONT_MONO, fontSize: 10.5,
    color: ink, charSpacing: 1.6, margin: 0, valign: 'middle',
  });
  slide.addText(`${String(idx).padStart(2, '0')} / ${TOTAL}`, {
    x: PW - M - 1.4, y: 0.30, w: 1.4, h: 0.26, fontFace: FONT_MONO, fontSize: 9.5,
    color: faint, charSpacing: 1.2, align: 'right', margin: 0, valign: 'middle',
  });
  if (tag) {
    slide.addText(tag.toUpperCase(), {
      x: M, y: PH - 0.42, w: 9, h: 0.24, fontFace: FONT_MONO, fontSize: 8.5,
      color: faint, charSpacing: 1.4, margin: 0,
    });
  }
}

function kicker(slide, num, title, x, y, w, t) {
  const ink = THEME[t].ink;
  const r = 0.045;
  slide.addShape('ellipse', { x, y: y + 0.075, w: r * 2, h: r * 2, fill: { color: RED }, line: { type: 'none' } });
  slide.addText(`${num} — ${title}`.toUpperCase(), {
    x: x + 0.20, y, w: w - 0.20, h: 0.3, fontFace: FONT_MONO, fontSize: 11.5,
    color: ink, charSpacing: 1.6, margin: 0,
  });
}
function headline(slide, text, x, y, w, opts, t) {
  const { size = 26, h = 1.1, lineSpacing = 1.04 } = opts;
  slide.addText(text, {
    x, y, w, h, fontFace: FONT_HEAD, bold: true, fontSize: size, color: THEME[t].ink,
    margin: 0, valign: 'top', lineSpacingMultiple: lineSpacing,
  });
}
function body(slide, text, x, y, w, opts, t) {
  const { size = 12.5, h = 0.6, align = 'left', color } = opts;
  slide.addText(text, {
    x, y, w, h, fontFace: FONT_BODY, fontSize: size, color: color || THEME[t].inkDim,
    margin: 0, align, lineSpacingMultiple: 1.32,
  });
}
function caption(slide, text, x, y, w, opts, t) {
  const { size = 9, align = 'left' } = opts;
  slide.addText(text.toUpperCase(), {
    x, y, w, h: 0.28, fontFace: FONT_MONO, fontSize: size, color: THEME[t].inkFaint,
    charSpacing: 0.6, align, margin: 0, valign: 'top',
  });
}

// DUMMY image placeholder: dashed frame + simple picture pictogram + label.
// Swap later: select this group, delete it, Insert > Pictures in its place.
function imagePlaceholder(slide, x, y, w, h, label, t) {
  const ink = THEME[t].inkFaint;
  const bgFill = t === 'dark' ? '141414' : 'FFFFFF';
  slide.addShape('rect', {
    x, y, w, h, fill: { color: bgFill }, line: { color: ink, width: 1.25, dashType: 'dash' },
  });
  const cx = x + w / 2, cy = y + h / 2;
  const icoS = Math.min(w, h) * 0.26;
  slide.addShape('rect', {
    x: cx - icoS * 0.55, y: cy - icoS * 0.42, w: icoS * 1.1, h: icoS * 0.82,
    fill: { type: 'none' }, line: { color: ink, width: 1.5 },
  });
  slide.addShape('ellipse', {
    x: cx - icoS * 0.35, y: cy - icoS * 0.28, w: icoS * 0.18, h: icoS * 0.18,
    fill: { type: 'none' }, line: { color: ink, width: 1.3 },
  });
  slide.addShape('triangle', {
    x: cx - icoS * 0.30, y: cy - icoS * 0.02, w: icoS * 0.62, h: icoS * 0.38,
    fill: { type: 'none' }, line: { color: ink, width: 1.3 },
  });
  slide.addText(label.toUpperCase(), {
    x: x + 0.15, y: y + h - 0.42, w: w - 0.3, h: 0.28, fontFace: FONT_MONO, fontSize: 9,
    color: ink, charSpacing: 0.8, align: 'center', margin: 0,
  });
  slide.addText('IMAGE PLACEHOLDER — REPLACE WITH FINAL ART', {
    x: x + 0.15, y: y + h - 0.66, w: w - 0.3, h: 0.2, fontFace: FONT_MONO, fontSize: 7,
    color: ink, charSpacing: 0.5, align: 'center', margin: 0,
  });
}

// DUMMY video placeholder: dashed frame + play button + label.
// Swap later: Insert > Media > Video, then resize/position over this frame
// (or delete the frame first and drop the video in its place).
function videoPlaceholder(slide, x, y, w, h, label, sublabel, t) {
  const ink = THEME[t].inkFaint;
  const bgFill = t === 'dark' ? '141414' : 'FFFFFF';
  slide.addShape('rect', {
    x, y, w, h, fill: { color: bgFill }, line: { color: ink, width: 1.25, dashType: 'dash' },
  });
  const cx = x + w / 2, cy = y + h / 2 - 0.15;
  const r = Math.min(w, h) * 0.16;
  slide.addShape('ellipse', {
    x: cx - r, y: cy - r, w: r * 2, h: r * 2, fill: { type: 'none' }, line: { color: ink, width: 1.5 },
  });
  slide.addShape('triangle', {
    x: cx - r * 0.32, y: cy - r * 0.4, w: r * 0.7, h: r * 0.8,
    fill: { color: ink }, line: { type: 'none' }, rotate: 90,
  });
  slide.addText(label.toUpperCase(), {
    x: x + 0.15, y: cy + r + 0.18, w: w - 0.3, h: 0.28, fontFace: FONT_MONO, fontSize: 11,
    bold: true, color: THEME[t].ink, charSpacing: 1, align: 'center', margin: 0,
  });
  slide.addText(sublabel, {
    x: x + 0.15, y: cy + r + 0.48, w: w - 0.3, h: 0.5, fontFace: FONT_MONO, fontSize: 7.5,
    color: ink, charSpacing: 0.3, align: 'center', margin: 0, lineSpacingMultiple: 1.25,
  });
}

let slide;

// ============================================================== 01 COVER
slide = pres.addSlide(); setBg(slide, 'dark');
markLogo(slide, M, 0.85, 0.62, 'dark');
slide.addText('FIFTH & ZERO', { x: M, y: 1.75, w: 10, h: 0.6, fontFace: FONT_HEAD, bold: true, fontSize: 34, color: WHITE, margin: 0 });
headline(slide, 'Creative intelligence.\nBuilt to move brands.', M, 2.35, 9.5, { size: 19, h: 0.9, lineSpacing: 1.12 }, 'dark');
imagePlaceholder(slide, M, 3.55, PW - 2 * M, PH - 3.55 - M, 'Hero Image — Cover', 'dark');
slide.addText('01 / 8', { x: PW - M - 1.4, y: 0.34, w: 1.4, h: 0.26, fontFace: FONT_MONO, fontSize: 9.5, color: '8A8A8A', charSpacing: 1.2, align: 'right', margin: 0 });

// ======================================================== 02 WHAT WE DO
slide = pres.addSlide(); setBg(slide, 'light'); chrome(slide, 2, 'light', 'Template Deck');
kicker(slide, '01', 'What We Do', M, 0.95, 6, 'light');
headline(slide, 'One creative direction.\nEvery screen. Every format.', M, 1.32, 5.4, { size: 23, h: 1.3 }, 'light');
body(slide, 'A single idea, art-directed once and engineered to hold its shape everywhere it lands.', M, 2.75, 5.2, { size: 12, h: 0.8 }, 'light');
{
  const steps = ['Key Visual', 'Digital', 'Print', 'Event', 'Motion', 'Film', 'AI'];
  let ty = 3.7;
  steps.forEach((s) => {
    slide.addText(s.toUpperCase(), { x: M, y: ty, w: 2.6, h: 0.28, fontFace: FONT_MONO, fontSize: 10.5, color: THEME.light.ink, charSpacing: 1, margin: 0 });
    ty += 0.32;
  });
}
imagePlaceholder(slide, 6.35, 0.95, PW - 6.35 - M, PH - 0.95 - M, 'Image — What We Do', 'light');

// ======================================================== 03 KEY VISUALS
slide = pres.addSlide(); setBg(slide, 'light'); chrome(slide, 3, 'light');
kicker(slide, '02', 'Key Visuals', M, 0.95, 6, 'light');
headline(slide, 'Big idea. Every format.', M, 1.28, 8, { size: 24, h: 0.6 }, 'light');
{
  const labels = ['KV 1', 'KV 2', 'KV 3', 'KV 4'];
  const gw = (PW - 2 * M - 3 * 0.28) / 4;
  const gy = 2.05, gh = 4.55;
  labels.forEach((lab, i) => {
    const gx = M + i * (gw + 0.28);
    imagePlaceholder(slide, gx, gy, gw, gh, lab, 'light');
  });
}
caption(slide, 'Drop final campaign artwork into each frame above.', M, PH - 0.4, 9, { size: 8.5 }, 'light');

// ======================================================== 04 EVENT SCREENS
slide = pres.addSlide(); setBg(slide, 'light'); chrome(slide, 4, 'light', 'Event Ecosystem');
kicker(slide, '03', 'Event Screens', M, 0.95, 6, 'light');
headline(slide, 'Every surface,\none system.', M, 1.28, 5, { size: 24, h: 1.1 }, 'light');
{
  const items = ['Stage LED', 'Walk-through screens', 'Skylight / ceiling', 'Multi-screen'];
  let ty = 2.55;
  items.forEach((t2) => { body(slide, '— ' + t2, M, ty, 4.6, { size: 12, h: 0.3, color: THEME.light.ink }, 'light'); ty += 0.34; });
}
imagePlaceholder(slide, 5.35, 1.9, PW - 5.35 - M, PH - 1.9 - M, 'Image — Event Screens', 'light');

// ============================================================== 05 CLOSE
slide = pres.addSlide(); setBg(slide, 'dark');
imagePlaceholder(slide, M, 0.95, PW - 2 * M, 4.05, 'Hero Image — Close', 'dark');
markLogo(slide, PW / 2 - 0.28, 5.25, 0.56, 'dark');
slide.addText("Let's make something\nworth remembering.", {
  x: 0, y: 6.0, w: PW, h: 0.9, fontFace: FONT_HEAD, bold: true, fontSize: 22, color: WHITE, align: 'center', margin: 0, lineSpacingMultiple: 1.08,
});
slide.addText('05 / 8', { x: PW - M - 1.4, y: 0.34, w: 1.4, h: 0.26, fontFace: FONT_MONO, fontSize: 9.5, color: '8A8A8A', charSpacing: 1.2, align: 'right', margin: 0 });

// ===================================================== 06 VIDEO — TEASER
slide = pres.addSlide(); setBg(slide, 'light'); chrome(slide, 6, 'light', 'Video Templates · 01');
kicker(slide, '04', 'Event Teaser · Opening Film', M, 0.95, 8, 'light');
headline(slide, 'From first tease to final frame.', M, 1.28, 9, { size: 23, h: 0.55 }, 'light');
{
  const gw = (PW - 2 * M - 0.4) / 2, gy = 2.1, gh = PH - gy - M - 0.1;
  videoPlaceholder(slide, M, gy, gw, gh, 'Video 1 — Teaser', 'Insert → Media → Video\nResize to fill this frame', 'light');
  videoPlaceholder(slide, M + gw + 0.4, gy, gw, gh, 'Video 2 — Opening Film', 'Insert → Media → Video\nResize to fill this frame', 'light');
}

// =================================================== 07 VIDEO — AFTERMOVIE
slide = pres.addSlide(); setBg(slide, 'light'); chrome(slide, 7, 'light', 'Video Templates · 02');
kicker(slide, '05', 'Aftermovie · Brand Film', M, 0.95, 8, 'light');
headline(slide, 'Every moment worth keeping.', M, 1.28, 9, { size: 23, h: 0.55 }, 'light');
{
  const gw = (PW - 2 * M - 0.4) / 2, gy = 2.1, gh = PH - gy - M - 0.1;
  videoPlaceholder(slide, M, gy, gw, gh, 'Video 1 — Aftermovie', 'Insert → Media → Video\nResize to fill this frame', 'light');
  videoPlaceholder(slide, M + gw + 0.4, gy, gw, gh, 'Video 2 — Brand Film', 'Insert → Media → Video\nResize to fill this frame', 'light');
}

// ======================================================= 08 VIDEO — AI
slide = pres.addSlide(); setBg(slide, 'light'); chrome(slide, 8, 'light', 'Video Templates · 03');
kicker(slide, '06', 'AI Video · Explainer', M, 0.95, 8, 'light');
headline(slide, 'Cinematic visuals, explained simply.', M, 1.28, 9, { size: 23, h: 0.55 }, 'light');
{
  const gw = (PW - 2 * M - 0.4) / 2, gy = 2.1, gh = PH - gy - M - 0.1;
  videoPlaceholder(slide, M, gy, gw, gh, 'Video 1 — AI Video', 'Insert → Media → Video\nResize to fill this frame', 'light');
  videoPlaceholder(slide, M + gw + 0.4, gy, gw, gh, 'Video 2 — Explainer', 'Insert → Media → Video\nResize to fill this frame', 'light');
}

pres.slides[5].addNotes('Placeholder frames — delete the dashed box, then Insert > Media > Video and position/resize to match.');
pres.slides[6].addNotes('Placeholder frames — delete the dashed box, then Insert > Media > Video and position/resize to match.');
pres.slides[7].addNotes('Placeholder frames — delete the dashed box, then Insert > Media > Video and position/resize to match.');

(async () => {
  const out = path.join(__dirname, 'out', 'Fifth-Zero-Template-Deck.pptx');
  await pres.writeFile({ fileName: out });
  console.log('wrote', out);
})();

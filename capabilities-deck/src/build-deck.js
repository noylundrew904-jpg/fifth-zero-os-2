const pptxgen = require('pptxgenjs');
const path = require('path');
const fs = require('fs');
const { imageSize: sizeOf } = require('image-size');

const A = (p) => path.join(__dirname, 'assets', p);

// ---------------------------------------------------------------- BRAND
const BG = '000000';
const PANEL = '0A0A0A';
const LINE = '242424';
const LINE_STRONG = '3A3A3A';
const WHITE = 'F2F2F0';
const DIM = '9A9A96';
const MUTED = '6F6F6B';
const LIME = 'DBFF6B';

const MONO = 'IBM Plex Mono';
const SERIF = 'Newsreader';

const PW = 13.333, PH = 7.5;
const M = 0.55; // outer margin
const TOTAL = 26;

function dims(file) {
  const d = sizeOf(fs.readFileSync(A(file)));
  return { w: d.width, h: d.height, ar: d.width / d.height };
}
// fit an image's native px aspect into a box, return {x,y,w,h} centered in box
function fitBox(file, bx, by, bw, bh, align = 'center') {
  const { ar } = dims(file);
  let w = bw, h = bw / ar;
  if (h > bh) { h = bh; w = bh * ar; }
  let x = bx + (bw - w) / 2;
  if (align === 'left') x = bx;
  if (align === 'right') x = bx + (bw - w);
  const y = by + (bh - h) / 2;
  return { x, y, w, h };
}

function newDeck() {
  const p = new pptxgen();
  p.defineLayout({ name: 'FZ169', width: PW, height: PH });
  p.layout = 'FZ169';
  return p;
}

function bg(slide) {
  slide.background = { color: BG };
}

// small nested-square brand mark (matches images/logo.svg) + wordmark + page index
function chrome(slide, idx, tag) {
  const lx = M, ly = 0.34;
  const s = 0.15, o = 0.05;
  [
    { dx: 0, dy: 0, color: WHITE, transparency: 55 },
    { dx: o, dy: o * 0.8, color: WHITE, transparency: 30 },
    { dx: o * 2, dy: o * 1.6, color: LIME, transparency: 0 },
  ].forEach((sq) => {
    slide.addShape('roundRect', {
      x: lx + sq.dx, y: ly + sq.dy, w: s, h: s, rectRadius: 0.02,
      fill: { type: 'none' }, line: { color: sq.color, width: 1.1, transparency: sq.transparency },
    });
  });
  slide.addText('FIFTH & ZERO', {
    x: lx + s + o * 2 + 0.14, y: ly - 0.03, w: 3.2, h: 0.26,
    fontFace: MONO, fontSize: 10.5, color: WHITE, charSpacing: 2, margin: 0, valign: 'middle',
  });
  slide.addText(`${String(idx).padStart(2, '0')} / ${TOTAL}`, {
    x: PW - M - 1.4, y: ly - 0.03, w: 1.4, h: 0.26,
    fontFace: MONO, fontSize: 9.5, color: MUTED, charSpacing: 1.5, align: 'right', margin: 0, valign: 'middle',
  });
  if (tag) {
    slide.addText(tag.toUpperCase(), {
      x: lx, y: PH - 0.42, w: 8, h: 0.24,
      fontFace: MONO, fontSize: 8.5, color: MUTED, charSpacing: 1.8, margin: 0,
    });
  }
}

function kicker(slide, text, x, y, w, color = LIME) {
  slide.addText(text.toUpperCase(), {
    x, y, w, h: 0.3, fontFace: MONO, fontSize: 12, color, charSpacing: 2.6, bold: false, margin: 0,
  });
}
function headline(slide, text, x, y, w, opts = {}) {
  const { size = 30, color = WHITE, h = 1.1, lineSpacing } = opts;
  slide.addText(text, {
    x, y, w, h, fontFace: SERIF, italic: true, fontSize: size, color, margin: 0,
    valign: 'top', lineSpacingMultiple: lineSpacing || 1.02,
  });
}
function body(slide, text, x, y, w, opts = {}) {
  const { size = 12, color = DIM, h = 0.6, align = 'left' } = opts;
  slide.addText(text, { x, y, w, h, fontFace: MONO, fontSize: size, color, margin: 0, align, lineSpacingMultiple: 1.35 });
}
function caption(slide, text, x, y, w, opts = {}) {
  const { size = 9.5, color = MUTED, align = 'left' } = opts;
  slide.addText(text.toUpperCase(), { x, y, w, h: 0.28, fontFace: MONO, fontSize: size, color, charSpacing: 0.6, align, margin: 0, valign: 'top' });
}
function panel(slide, x, y, w, h, opts = {}) {
  const { lineColor = LINE, fillTr = 100 } = opts;
  slide.addShape('roundRect', {
    x, y, w, h, rectRadius: 0.06,
    fill: fillTr < 100 ? { color: PANEL, transparency: fillTr } : { type: 'none' },
    line: { color: lineColor, width: 1 },
  });
}
function scrimCard(slide, x, y, w, h) {
  slide.addShape('roundRect', {
    x, y, w, h, rectRadius: 0.05,
    fill: { color: '000000', transparency: 12 },
    line: { color: LINE_STRONG, width: 1 },
  });
}
function fullBleed(slide, file) {
  slide.addImage({ path: A(file), x: 0, y: 0, w: PW, h: PH });
}
function dot(slide, x, y, r = 0.035, color = LIME) {
  slide.addShape('ellipse', { x: x - r, y: y - r, w: r * 2, h: r * 2, fill: { color }, line: { type: 'none' } });
}

// ================================================================
const pres = newDeck();
pres.author = 'Fifth and Zero';
pres.company = 'Fifth and Zero';
pres.title = 'Fifth and Zero - Capabilities';

let slide;

// ---------------------------------------------------------- 01 COVER
slide = pres.addSlide(); bg(slide);
fullBleed(slide, '01-cover.png');
slide.addShape('roundRect', {
  x: 0, y: 5.55, w: PW, h: 1.95, rectRadius: 0, fill: { color: '000000', transparency: 28 }, line: { type: 'none' },
});
slide.addText('FIFTH & ZERO', {
  x: M, y: 5.72, w: 9, h: 0.7, fontFace: MONO, fontSize: 40, bold: true, color: WHITE, charSpacing: 3, margin: 0,
});
slide.addText([
  { text: 'Creative Intelligence.', options: { fontFace: SERIF, italic: true, color: LIME, fontSize: 22 } },
  { text: '  Built to move brands.', options: { fontFace: SERIF, italic: true, color: WHITE, fontSize: 22 } },
], { x: M, y: 6.35, w: 11.5, h: 0.5, margin: 0 });
slide.addText('CREATIVE · MOTION · FILM · EXPERIENCES · AI', {
  x: M, y: 6.92, w: 10, h: 0.3, fontFace: MONO, fontSize: 11, color: DIM, charSpacing: 2.5, margin: 0,
});
slide.addText('01 / 26', {
  x: PW - M - 1.4, y: 0.34, w: 1.4, h: 0.26, fontFace: MONO, fontSize: 9.5, color: DIM, charSpacing: 1.5, align: 'right', margin: 0,
});
{
  const lx = M, ly = 0.34, s = 0.15, o = 0.05;
  [
    { dx: 0, dy: 0, color: WHITE, transparency: 55 },
    { dx: o, dy: o * 0.8, color: WHITE, transparency: 30 },
    { dx: o * 2, dy: o * 1.6, color: LIME, transparency: 0 },
  ].forEach((sq) => {
    slide.addShape('roundRect', {
      x: lx + sq.dx, y: ly + sq.dy, w: s, h: s, rectRadius: 0.02,
      fill: { type: 'none' }, line: { color: sq.color, width: 1.1, transparency: sq.transparency },
    });
  });
}

// ------------------------------------------------------ 02 WHAT WE DO
slide = pres.addSlide(); bg(slide); chrome(slide, 2, 'The System');
kicker(slide, 'What We Do', M, 1.0, 5);
headline(slide, 'One creative direction.\nEvery screen. Every format.', M, 1.34, 5.6, { size: 27, h: 1.5 });
body(slide, 'A single idea, art-directed once and engineered to hold its shape everywhere it lands — from a five-second story to a forty-metre stage.', M, 2.95, 5.4, { size: 12, h: 1.0 });
{
  const steps = ['KEY VISUAL', 'DIGITAL', 'PRINT', 'EVENT', 'MOTION', 'FILM', 'AI'];
  let ty = 4.15;
  steps.forEach((s, i) => {
    slide.addText(s, { x: M, y: ty, w: 2.6, h: 0.3, fontFace: MONO, fontSize: 11.5, color: i === 0 || i === 6 ? LIME : WHITE, charSpacing: 1.5, margin: 0 });
    ty += 0.36;
  });
}
{
  const ib = fitBox('02-ecosystem-web.png', 6.35, 0.95, PW - 6.35 - M, PH - 0.95 - M, 'center');
  slide.addImage({ path: A('02-ecosystem-web.png'), ...ib });
}

// -------------------------------------------------- 03 KEY VISUALS / KV
slide = pres.addSlide(); bg(slide); chrome(slide, 3);
kicker(slide, 'Key Visuals', M, 0.95, 6);
headline(slide, 'Big idea. Every format.', M, 1.24, 8, { size: 27, h: 0.6 });
{
  const files = ['03-kv-1.png', '03-kv-2.png', '03-kv-3.png', '03-kv-4.png'];
  const labels = [['NOCTURNE', 'Hero Campaign KV'], ['AERO', 'Product KV'], ['MERIDIAN', 'Event KV'], ['ORBIT CAPITAL', 'Corporate KV']];
  const gw = (PW - 2 * M - 3 * 0.28) / 4;
  const gy = 2.05, gh = 4.25;
  files.forEach((f, i) => {
    const gx = M + i * (gw + 0.28);
    const b = fitBox(f, gx, gy, gw, gh, 'center');
    slide.addImage({ path: A(f), ...b });
    slide.addText(labels[i][0], { x: gx, y: gy + gh + 0.10, w: gw, h: 0.24, fontFace: MONO, fontSize: 11, bold: true, color: LIME, charSpacing: 1, margin: 0 });
    slide.addText(labels[i][1], { x: gx, y: gy + gh + 0.34, w: gw, h: 0.22, fontFace: MONO, fontSize: 9, color: DIM, margin: 0 });
  });
}
caption(slide, 'Concept work for fictional brands, not prior client work.', M, PH - 0.4, 9, { size: 8.5 });

// ------------------------------------------------- 04 FLYERS / POSTERS
slide = pres.addSlide(); bg(slide); chrome(slide, 4, 'Brand & Campaign Creatives · 02');
kicker(slide, 'Flyers · Posters · Print', M, 0.95, 7);
headline(slide, 'Static when it needs\nto stop you.', M, 1.24, 6.2, { size: 27, h: 1.15 });
{
  const items = ['Event flyer — MERIDIAN', 'Promotional poster — AFTERGLOW', 'Corporate comms — ORBIT CAPITAL', 'Launch artwork — AERO 2', 'Invitation — NOCTURNE'];
  let ty = 2.55;
  items.forEach((t) => { body(slide, '— ' + t, M, ty, 5.7, { size: 11.5, h: 0.3, color: WHITE }); ty += 0.34; });
}
{
  const b = fitBox('04-print-salon.png', M, 4.35, PW - 2 * M, PH - 4.35 - M, 'center');
  slide.addImage({ path: A('04-print-salon.png'), ...b });
}

// --------------------------------------------- 05 BANNERS / LARGE FORMAT
slide = pres.addSlide(); bg(slide); chrome(slide, 5, 'Brand & Campaign Creatives · 03');
kicker(slide, 'Banners & Large Format', M, 0.95, 7);
headline(slide, 'Built for every screen\nin the room.', M, 1.24, 6.2, { size: 27, h: 1.15 });
{
  const items = ['Event banners', 'Venue branding', 'Backdrops', 'Hoardings', 'Standee systems', 'Directional signage'];
  let tx = M, ty = 2.6, col = 0;
  items.forEach((t, i) => {
    slide.addText('— ' + t, { x: M + (i % 2) * 2.9, y: 2.6 + Math.floor(i / 2) * 0.34, w: 2.7, h: 0.3, fontFace: MONO, fontSize: 11.5, color: WHITE, margin: 0 });
  });
}
{
  const b = fitBox('05-banner-scene.png', M, 3.85, PW - 2 * M, PH - 3.85 - M, 'center');
  slide.addImage({ path: A('05-banner-scene.png'), ...b });
}

// =========================================== 06 EVENT VISUAL IDENTITY
slide = pres.addSlide(); bg(slide); chrome(slide, 6, 'Event Creative Ecosystem · 01');
kicker(slide, 'Event Visual Identity', M, 0.95, 7);
headline(slide, 'From KV to curtain call.', M, 1.24, 6.2, { size: 27, h: 0.6 });
body(slide, 'MERIDIAN — an annual industry summit — built once as a visual language, then carried across every surface an attendee will stand in front of.', M, 1.95, 5.6, { size: 12, h: 0.9 });
slide.addText([
  { text: 'KV', options: { color: LIME } },
  { text: '  →  STAGE  →  SCREENS  →  SIGNAGE  →  DIGITAL  →  PRINT', options: { color: WHITE } },
], { x: M, y: 3.15, w: 5.7, h: 0.32, fontFace: MONO, fontSize: 11.5, charSpacing: 0.6, margin: 0 });
body(slide, 'Every touchpoint below reads at a glance as the same event — same mark, same grid, same restraint.', M, 3.7, 5.5, { size: 12.5, h: 0.9, color: WHITE });
{
  const ib = fitBox('06-ecosystem-web-2.png', 6.35, 0.95, PW - 6.35 - M, PH - 0.95 - M, 'center');
  slide.addImage({ path: A('06-ecosystem-web-2.png'), ...ib });
}

// =============================================== 07 MAIN STAGE LED
slide = pres.addSlide(); bg(slide);
fullBleed(slide, '07-stage-main.png');
chrome(slide, 7);
scrimCard(slide, M, 5.85, 6.4, 1.15);
slide.addText('MERIDIAN', { x: M + 0.24, y: 6.0, w: 6, h: 0.26, fontFace: MONO, fontSize: 11, bold: true, color: LIME, charSpacing: 2, margin: 0 });
headline(slide, 'Main Stage LED Content', M + 0.24, 6.27, 5.9, { size: 19, h: 0.42 });
caption(slide, 'Central LED · side screens · truss graphics', M + 0.24, 6.74, 5.9, { size: 8.5 });

// ========================================== 08 LED SCREEN CONTENT SYSTEMS
slide = pres.addSlide(); bg(slide); chrome(slide, 8, 'Event Creative Ecosystem · 03');
kicker(slide, 'LED Screen Content Systems', M, 0.95, 8);
headline(slide, 'One system. Every state on screen.', M, 1.24, 9, { size: 24, h: 0.5 });
{
  const labels = ['Welcome', 'Speaker Intro', 'Agenda', 'Session Title', 'Transition', 'Sponsor', 'Holding', 'Closing'];
  const cols = 4, rows = 2, gap = 0.26;
  const gw = (PW - 2 * M - (cols - 1) * gap) / cols;
  const gh = 1.62;
  const gy0 = 2.05;
  for (let i = 0; i < 8; i++) {
    const c = i % cols, r = Math.floor(i / cols);
    const gx = M + c * (gw + gap), gy = gy0 + r * (gh + 0.5);
    slide.addImage({ path: A(`08-tile-${i + 1}.png`), x: gx, y: gy, w: gw, h: gh });
    slide.addText(labels[i], { x: gx, y: gy + gh + 0.06, w: gw, h: 0.22, fontFace: MONO, fontSize: 9.5, color: WHITE, margin: 0 });
  }
}

// ===================================== 09 WALK-THROUGH / TUNNEL SCREENS
slide = pres.addSlide(); bg(slide);
fullBleed(slide, '09-tunnel.png');
chrome(slide, 9);
scrimCard(slide, PW - M - 5.6, PH - 1.75, 5.6, 1.25);
kicker(slide, 'Walk-Through · Tunnel Screens', PW - M - 5.35, PH - 1.62, 5.2);
headline(slide, 'A KV becomes a place you walk through.', PW - M - 5.35, PH - 1.32, 5.2, { size: 15.5, h: 0.75 });

// ===================================== 10 SKYLIGHT / CEILING SCREENS
slide = pres.addSlide(); bg(slide);
fullBleed(slide, '10-ceiling.png');
chrome(slide, 10);
scrimCard(slide, M, PH - 1.75, 5.8, 1.25);
kicker(slide, 'Skylight · Ceiling Screens', M + 0.22, PH - 1.62, 5.4);
headline(slide, 'The brand extends into the architecture.', M + 0.22, PH - 1.32, 5.3, { size: 15.5, h: 0.75 });

// ===================================== 11 MULTI-SCREEN EXPERIENCES
slide = pres.addSlide(); bg(slide); chrome(slide, 11, 'Event Creative Ecosystem · 06');
kicker(slide, 'Multi-Screen Experiences', M, 0.95, 8);
headline(slide, 'One story. Any canvas.', M, 1.24, 8, { size: 27, h: 0.6 });
body(slide, 'Panoramic LED, vertical drops, pillar wraps, digital walls — the same content system re-cut intelligently for whatever aspect ratio the venue gives us.', M, 1.95, PW - 2 * M, { size: 12, h: 0.6 });
{
  const b = fitBox('11-multiscreen.png', M, 2.75, PW - 2 * M, PH - 2.75 - M, 'center');
  slide.addImage({ path: A('11-multiscreen.png'), ...b });
}

// =========================================== 12 MOTION GRAPHICS
slide = pres.addSlide(); bg(slide); chrome(slide, 12, 'Motion + Video · 01');
kicker(slide, 'Motion Graphics', M, 0.95, 6);
headline(slide, 'Static, evolved.', M, 1.24, 6, { size: 27, h: 0.6 });
{
  const labels = ['Type Animation', 'Logo Animation', 'Transitions', 'Data Animation', 'Event Motion', 'Brand Film'];
  const gap = 0.22, cols = 6;
  const gw = (PW - 2 * M - (cols - 1) * gap) / cols;
  const gh = gw * (620 / 520);
  const gy = 3.05;
  for (let i = 0; i < 6; i++) {
    const gx = M + i * (gw + gap);
    slide.addImage({ path: A(`12-tile-${i + 1}.png`), x: gx, y: gy, w: gw, h: gh });
    slide.addText(labels[i], { x: gx - 0.05, y: gy + gh + 0.07, w: gw + 0.1, h: 0.4, fontFace: MONO, fontSize: 8.5, color: WHITE, align: 'center', margin: 0 });
  }
}

// =========================================== 13 EVENT TEASER FILMS
slide = pres.addSlide(); bg(slide); chrome(slide, 13, 'Motion + Video · 02');
kicker(slide, 'Event Teaser Films', M, 0.95, 6);
headline(slide, 'From first tease\nto final frame.', M, 1.24, 5, { size: 26, h: 1.1 });
body(slide, 'A five-beat teaser campaign for MERIDIAN, built to run identically across social and the venue\'s own screens.', M, 2.55, 4.6, { size: 11.5, h: 0.9 });
{
  const labels = ['SOMETHING\nIS COMING', '72 HOURS', '48 HOURS\nTO GO', 'THE NEXT\nCHAPTER BEGINS', 'SEE YOU\nAT MERIDIAN'];
  const gap = 0.2, n = 5;
  const startX = 5.55;
  const gw = (PW - M - startX - (n - 1) * gap) / n;
  const gh = gw * (700 / 560);
  const gy = 3.6;
  for (let i = 0; i < n; i++) {
    const gx = startX + i * (gw + gap);
    slide.addImage({ path: A(`13-tile-${i + 1}.png`), x: gx, y: gy, w: gw, h: gh });
    slide.addText(labels[i], { x: gx - 0.04, y: gy + gh + 0.08, w: gw + 0.08, h: 0.5, fontFace: MONO, fontSize: 7.8, color: i === n - 1 ? LIME : DIM, align: 'center', margin: 0, lineSpacingMultiple: 1.15 });
  }
}

// =========================================== 14 COUNTDOWN FILMS
slide = pres.addSlide(); bg(slide); chrome(slide, 14, 'Motion + Video · 03');
kicker(slide, 'Countdown Films', M, 0.95, 6);
headline(slide, 'Motion when it needs\nto move you.', M, 1.24, 5, { size: 26, h: 1.1 });
body(slide, 'One connected countdown, five drops, built once and scheduled to run across social and every screen in the building.', M, 2.55, 4.6, { size: 11.5, h: 0.9 });
{
  const labels = ['5 DAYS', '3 DAYS', '24 HOURS', 'TONIGHT', "WE'RE LIVE"];
  const gap = 0.2, n = 5;
  const startX = 5.55;
  const gw = (PW - M - startX - (n - 1) * gap) / n;
  const gh = gw * (700 / 560);
  const gy = 3.6;
  for (let i = 0; i < n; i++) {
    const gx = startX + i * (gw + gap);
    slide.addImage({ path: A(`14-tile-${i + 1}.png`), x: gx, y: gy, w: gw, h: gh });
    slide.addText(labels[i], { x: gx - 0.04, y: gy + gh + 0.08, w: gw + 0.08, h: 0.3, fontFace: MONO, fontSize: 9.5, bold: i >= n - 2, color: i >= n - 2 ? LIME : DIM, align: 'center', margin: 0 });
  }
}

// =========================================== 15 EVENT OPENING FILMS
slide = pres.addSlide(); bg(slide); chrome(slide, 15, 'Motion + Video · 04');
kicker(slide, 'Event Opening Films', M, 0.95, 6);
headline(slide, 'Brand storytelling,\nbuilt to a reveal.', M, 1.24, 4.9, { size: 24, h: 1.1 });
body(slide, 'Tension, build, reveal — the final frame flows straight into the physical main-stage LED, so the film and the room feel like one continuous shot.', M, 2.5, 4.5, { size: 11, h: 1.0 });
{
  const labels = ['BLACK', 'A SIGNAL', 'THE WORLD\nRESPONDS', 'TENSION\nBUILDS', 'REVEAL', 'LIVE ON\nMAIN STAGE'];
  const gap = 0.16, n = 6;
  const startX = 5.35;
  const gw = (PW - M - startX - (n - 1) * gap) / n;
  const gh = gw * (620 / 480);
  const gy = 3.65;
  for (let i = 0; i < n; i++) {
    const gx = startX + i * (gw + gap);
    slide.addImage({ path: A(`15-tile-${i + 1}.png`), x: gx, y: gy, w: gw, h: gh });
    slide.addText(labels[i], { x: gx - 0.04, y: gy + gh + 0.07, w: gw + 0.08, h: 0.42, fontFace: MONO, fontSize: 7.5, color: i === n - 1 ? LIME : DIM, align: 'center', margin: 0, lineSpacingMultiple: 1.1 });
  }
}

// =========================================== 16 HIGHLIGHT / AFTERMOVIES
slide = pres.addSlide(); bg(slide); chrome(slide, 16, 'Motion + Video · 05');
kicker(slide, 'Highlight · Aftermovies', M, 0.95, 6);
headline(slide, 'Every moment worth keeping, in ninety seconds.', M, 1.24, 8.5, { size: 24, h: 0.6 });
{
  const labels = ['Arrival', 'Crowd', 'Take the Stage', 'Performance', 'Brand Moments', 'Finale'];
  const gap = 0.22, cols = 6;
  const gw = (PW - 2 * M - (cols - 1) * gap) / cols;
  const gh = gw * (460 / 480);
  const gy = 2.9;
  for (let i = 0; i < 6; i++) {
    const gx = M + i * (gw + gap);
    slide.addImage({ path: A(`16-tile-${i + 1}.png`), x: gx, y: gy, w: gw, h: gh });
    slide.addText(labels[i], { x: gx - 0.05, y: gy + gh + 0.09, w: gw + 0.1, h: 0.24, fontFace: MONO, fontSize: 8.5, color: i === 5 ? LIME : WHITE, align: 'center', margin: 0 });
  }
  body(slide, 'Energetic, premium, cut to the room\'s own soundtrack — an aftermovie that gets forwarded, not just archived.', M, gy + gh + 0.5, PW - 2 * M, { size: 11, h: 0.5, color: DIM });
}

// =========================================== 17 EXPLAINER FILMS
slide = pres.addSlide(); bg(slide); chrome(slide, 17, 'Motion + Video · 06');
kicker(slide, 'Explainer Films', M, 0.95, 6);
headline(slide, 'Complicated ideas,\nmade obvious.', M, 1.24, 5, { size: 26, h: 1.1 });
body(slide, 'A fictional fintech product, AERO PAY, explained end to end — the pipeline stays sophisticated, never cartoonish.', M, 2.55, 4.6, { size: 11.5, h: 0.9 });
{
  const labels = ['SCRIPT', 'STORYBOARD', 'DESIGN', 'ANIMATION', 'FINAL FRAME'];
  const gap = 0.2, n = 5;
  const startX = 5.55;
  const gw = (PW - M - startX - (n - 1) * gap) / n;
  const gh = gw * (500 / 560);
  const gy = 3.8;
  for (let i = 0; i < n; i++) {
    const gx = startX + i * (gw + gap);
    slide.addImage({ path: A(`17-tile-${i + 1}.png`), x: gx, y: gy, w: gw, h: gh });
    slide.addText(labels[i], { x: gx - 0.04, y: gy + gh + 0.08, w: gw + 0.08, h: 0.3, fontFace: MONO, fontSize: 8.5, color: i === n - 1 ? LIME : DIM, align: 'center', margin: 0 });
  }
}

// =========================================== 18 BRAND / STORY FILMS
slide = pres.addSlide(); bg(slide); chrome(slide, 18, 'Motion + Video · 07');
kicker(slide, 'Brand · Story Films', M, 0.95, 6);
headline(slide, 'Every brand has a story worth thirty minutes of ours.', M, 1.24, 9, { size: 22, h: 0.6 });
{
  const labels = ['Founder Story\nFERRO COFFEE', 'Corporate Film\nORBIT CAPITAL', 'Brand Manifesto\nNOCTURNE', 'Product Story\nAERO', 'Human Story', 'Culture Film'];
  const gap = 0.22, cols = 6;
  const gw = (PW - 2 * M - (cols - 1) * gap) / cols;
  const gh = gw * (620 / 480);
  const gy = 2.85;
  for (let i = 0; i < 6; i++) {
    const gx = M + i * (gw + gap);
    slide.addImage({ path: A(`18-tile-${i + 1}.png`), x: gx, y: gy, w: gw, h: gh });
    slide.addText(labels[i], { x: gx - 0.05, y: gy + gh + 0.08, w: gw + 0.1, h: 0.5, fontFace: MONO, fontSize: 7.6, color: WHITE, align: 'center', margin: 0, lineSpacingMultiple: 1.15 });
  }
}

// ================================ 19 VIDEO EDITING & POST-PRODUCTION
slide = pres.addSlide(); bg(slide); chrome(slide, 19, 'Motion + Video · 08');
kicker(slide, 'Video Editing & Post-Production', M, 0.95, 8);
headline(slide, 'Raw becomes final — six disciplines, one pipeline.', M, 1.24, 9.5, { size: 22, h: 0.6 });
{
  const b = fitBox('19-postprod.png', M, 2.55, PW - 2 * M, PH - 2.55 - M - 0.35, 'center');
  slide.addImage({ path: A('19-postprod.png'), ...b });
}
body(slide, 'Editing · colour grading · sound design · motion graphics · compositing · cleanup — finished to broadcast and social spec alike.', M, 6.75, PW - 2 * M, { size: 10.5, h: 0.24, color: DIM, align: 'left' });

// =========================================== 20 ANIMATION
slide = pres.addSlide(); bg(slide); chrome(slide, 20, 'Motion + Video · 09');
kicker(slide, 'Animation', M, 0.95, 6);
headline(slide, 'Drawn to move.', M, 1.24, 6, { size: 27, h: 0.6 });
{
  const labels = ['2D Animation', 'Typography', 'Product Animation', 'Logo Animation', 'UI Animation', 'Event Screens'];
  const gap = 0.22, cols = 6;
  const gw = (PW - 2 * M - (cols - 1) * gap) / cols;
  const gh = gw * (460 / 480);
  const gy = 3.5;
  for (let i = 0; i < 6; i++) {
    const gx = M + i * (gw + gap);
    slide.addImage({ path: A(`20-tile-${i + 1}.png`), x: gx, y: gy, w: gw, h: gh });
    slide.addText(labels[i], { x: gx - 0.05, y: gy + gh + 0.09, w: gw + 0.1, h: 0.36, fontFace: MONO, fontSize: 8, color: WHITE, align: 'center', margin: 0, lineSpacingMultiple: 1.1 });
  }
}

// =========================================== 21 PHOTOGRAPHY
slide = pres.addSlide(); bg(slide); chrome(slide, 21, 'Photography');
kicker(slide, 'Photography', M, 0.95, 6);
headline(slide, 'Shot to be used, not just admired.', M, 1.24, 6, { size: 24, h: 0.55 });
{
  const items = ['Products', 'Food', 'Corporate', 'People', 'Events', 'Lifestyle', 'Detail Shots'];
  let ty = 2.15;
  items.forEach((t) => { slide.addText('— ' + t, { x: M, y: ty, w: 3.6, h: 0.28, fontFace: MONO, fontSize: 11, color: WHITE, margin: 0 }); ty += 0.32; });
}
{
  const b = fitBox('21-contact-sheet.png', 4.15, 1.95, PW - 4.15 - M, PH - 1.95 - M, 'center');
  slide.addImage({ path: A('21-contact-sheet.png'), ...b });
}

// =========================================== 22 AI-GENERATED CONTENT
slide = pres.addSlide(); bg(slide);
fullBleed(slide, '22-ai-hero.png');
chrome(slide, 22);
scrimCard(slide, M, 5.4, 7.6, 1.45);
kicker(slide, 'AI-Generated Content', M + 0.24, 5.55, 6.6);
headline(slide, 'Imagination without\nproduction limits.', M + 0.24, 5.82, 7.1, { size: 18, h: 0.7 });
caption(slide, 'Impossible locations · virtual sets · hyper-real product worlds.', M + 0.24, 6.60, 7.1, { size: 8.5 });

// =========================================== 23 AI VIDEO
slide = pres.addSlide(); bg(slide); chrome(slide, 23, 'AI Creative Studio · 02');
kicker(slide, 'AI Video', M, 0.95, 6);
headline(slide, 'Cinematic visuals,\nwithout the shoot.', M, 1.24, 4.7, { size: 25, h: 1.1 });
body(slide, 'A storyboard from an AI-generated commercial for AERO — full cinematic craft without a traditional-scale production.', M, 2.55, 4.4, { size: 11.5, h: 1.0 });
{
  const labels = ['CONCEPT', 'FRAME', 'MOTION', 'FILM'];
  const gap = 0.28, n = 4;
  const startX = 5.35;
  const gw = (PW - M - startX - (n - 1) * gap) / n;
  const gh = gw * (700 / 560);
  const gy = 3.7;
  for (let i = 0; i < n; i++) {
    const gx = startX + i * (gw + gap);
    slide.addImage({ path: A(`23-tile-${i + 1}.png`), x: gx, y: gy, w: gw, h: gh });
    slide.addText(labels[i], { x: gx - 0.04, y: gy + gh + 0.08, w: gw + 0.08, h: 0.3, fontFace: MONO, fontSize: 9.5, color: i === n - 1 ? LIME : DIM, align: 'center', margin: 0 });
    if (i < n - 1) slide.addText('→', { x: gx + gw + 0.02, y: gy + gh / 2 - 0.12, w: 0.24, h: 0.24, fontFace: MONO, fontSize: 12, color: MUTED, margin: 0 });
  }
}

// =========================================== 24 AI + TRADITIONAL CREATIVE
slide = pres.addSlide(); bg(slide); chrome(slide, 24, 'AI Creative Studio · 03');
kicker(slide, 'AI + Traditional Creative', M, 0.95, 8);
headline(slide, 'AI accelerates production.\nCreative direction keeps it human.', M, 1.24, 10, { size: 22, h: 0.9 });
{
  const imgY = 2.85;
  const b = fitBox('24-pipeline.png', M, imgY, PW - 2 * M, PH - imgY - M - 0.4, 'center');
  slide.addImage({ path: A('24-pipeline.png'), ...b, y: imgY });
  // label centers follow the same normalized node math as workflowPipeline() (pad=60 of 1920px canvas width)
  const padFrac = 60 / 1920;
  const startX = b.x + padFrac * b.w;
  const endX = b.x + b.w - padFrac * b.w;
  const labels = ['IDEA', 'AI\nCONCEPTING', 'ART\nDIRECTION', 'DESIGN', 'MOTION', 'EDIT', 'FINAL\nCAMPAIGN'];
  const n = labels.length;
  const stepX = (endX - startX) / (n - 1);
  for (let i = 0; i < n; i++) {
    const cx = startX + i * stepX;
    slide.addText(labels[i], { x: cx - 0.55, y: imgY + b.h * 0.5 + 0.32, w: 1.1, h: 0.44, fontFace: MONO, fontSize: 8, color: i === 0 || i === n - 1 ? LIME : DIM, align: 'center', margin: 0, lineSpacingMultiple: 1.1 });
  }
}

// =========================================== 25 THE FULL ECOSYSTEM
slide = pres.addSlide(); bg(slide); chrome(slide, 25, 'One Campaign — Everything Connected');
kicker(slide, 'The Full Ecosystem', M, 0.95, 8);
headline(slide, 'One creative partner. The entire visual journey.', M, 1.24, 10, { size: 22, h: 0.55 });
{
  const b = fitBox('25-full-ecosystem.png', M, 1.95, 7.55, PH - 1.95 - M, 'left');
  slide.addImage({ path: A('25-full-ecosystem.png'), ...b });
}
{
  const items = ['KV', 'Poster', 'Social', 'Stage LED', 'Walk-through Screen', 'Skylight', 'Motion Graphics', 'Teaser', 'Countdown', 'Opening Film', 'Aftermovie', 'Photography', 'AI Content'];
  const cols = [items.slice(0, 7), items.slice(7)];
  cols.forEach((colItems, ci) => {
    let ty = 2.05;
    colItems.forEach((t) => {
      slide.addText('— ' + t, { x: 7.95 + ci * 2.55, y: ty, w: 2.4, h: 0.26, fontFace: MONO, fontSize: 9.5, color: WHITE, margin: 0 });
      ty += 0.315;
    });
  });
}
body(slide, 'MERIDIAN, one campaign — every deliverable in this deck, produced from a single creative direction.', 7.95, 5.65, 4.85, { size: 10, h: 0.7, color: DIM });

// =========================================== 26 CLOSE
slide = pres.addSlide(); bg(slide);
fullBleed(slide, '26-close.png');
{
  const lx = PW / 2, ly = 3.15;
  const s = 0.22, o = 0.075;
  [
    { dx: -s, dy: -s, color: WHITE, transparency: 55 },
    { dx: -s + o, dy: -s + o * 0.8, color: WHITE, transparency: 30 },
    { dx: -s + o * 2, dy: -s + o * 1.6, color: LIME, transparency: 0 },
  ].forEach((sq) => {
    slide.addShape('roundRect', {
      x: lx + sq.dx, y: ly + sq.dy, w: s, h: s, rectRadius: 0.03,
      fill: { type: 'none' }, line: { color: sq.color, width: 1.4, transparency: sq.transparency },
    });
  });
}
slide.addText("Let's make something\nworth remembering.", {
  x: 0, y: 3.75, w: PW, h: 1.1, fontFace: SERIF, italic: true, fontSize: 30, color: WHITE, align: 'center', margin: 0, lineSpacingMultiple: 1.05,
});
slide.addText('FIFTH & ZERO', {
  x: 0, y: 4.95, w: PW, h: 0.5, fontFace: MONO, fontSize: 22, bold: true, color: LIME, charSpacing: 4, align: 'center', margin: 0,
});
slide.addText('26 / 26', {
  x: PW - M - 1.4, y: 0.34, w: 1.4, h: 0.26, fontFace: MONO, fontSize: 9.5, color: DIM, charSpacing: 1.5, align: 'right', margin: 0,
});

// ================================================================ SAVE
(async () => {
  const out = path.join(__dirname, 'out', 'Fifth-Zero-Capabilities-Deck.pptx');
  await pres.writeFile({ fileName: out });
  console.log('wrote', out);
})();

const pptxgen = require('pptxgenjs');
const path = require('path');
const fs = require('fs');
const { imageSize: sizeOf } = require('image-size');

const A = (p) => path.join(__dirname, 'assets', p);

// ---------------------------------------------------------------- BRAND
// Per the real Fifth & Zero brand guide: strict black/white/off-white
// system. Signal red is worn ONLY by the dot — never a background, button,
// headline colour, or block of colour.
const BLACK = '0A0A0A';
const WHITE = 'FFFFFF';
const OFFWHITE = 'F6F4EF';
const RED = 'E2361F';

const FONT_HEAD = 'Poppins';        // H1 / hero headline, 700
const FONT_BODY = 'Liberation Sans'; // running copy, 400
const FONT_MONO = 'DejaVu Sans Mono'; // labels / metadata, 500

const THEME = {
  dark: { bg: BLACK, ink: WHITE, inkDim: 'D8D8D8', inkFaint: '8A8A8A', line: '333333' },
  light: { bg: OFFWHITE, ink: BLACK, inkDim: '3A3A3A', inkFaint: '8C8C86', line: 'D8D5CC' },
};

const PW = 13.333, PH = 7.5;
const M = 0.55; // outer margin
const TOTAL = 26;

function dims(file) {
  const d = sizeOf(fs.readFileSync(A(file)));
  return { w: d.width, h: d.height, ar: d.width / d.height };
}
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

function setBg(slide, t) { slide.background = { color: THEME[t].bg }; }

// small "5" + red dot mark, always red on the dot, ink for the numeral
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

// running header: mark + wordmark left, page index right, optional tag
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

// eyebrow: "● 01 — SECTION NAME" — the dot is the brand's one licensed accent
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
  const { size = 28, h = 1.1, lineSpacing = 1.04 } = opts;
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
function fullBleed(slide, file) {
  slide.addImage({ path: A(file), x: 0, y: 0, w: PW, h: PH });
}
function divider(slide, x, y, w, t) {
  slide.addShape('line', { x, y, w, h: 0, line: { color: THEME[t].line, width: 0.75 } });
}

// ================================================================
const pres = newDeck();
pres.author = 'Fifth and Zero';
pres.company = 'Fifth and Zero';
pres.title = 'Fifth and Zero - Capabilities';

let slide;

// ---------------------------------------------------------- 01 COVER
slide = pres.addSlide(); setBg(slide, 'dark');
fullBleed(slide, '01-cover.png');
markLogo(slide, M, 0.85, 0.62, 'dark');
slide.addText('FIFTH & ZERO', {
  x: M, y: 3.55, w: 10, h: 0.7, fontFace: FONT_HEAD, bold: true, fontSize: 40,
  color: WHITE, margin: 0,
});
headline(slide, 'Creative intelligence.\nBuilt to move brands.', M, 4.25, 9.5, { size: 22, h: 1.0, lineSpacing: 1.12 }, 'dark');
slide.addText('CREATIVE · MOTION · FILM · EXPERIENCES · AI', {
  x: M, y: 5.35, w: 10, h: 0.3, fontFace: FONT_MONO, fontSize: 11, color: 'ABABAB', charSpacing: 2.2, margin: 0,
});
slide.addText('01 / 26', {
  x: PW - M - 1.4, y: 0.34, w: 1.4, h: 0.26, fontFace: FONT_MONO, fontSize: 9.5, color: '8A8A8A', charSpacing: 1.2, align: 'right', margin: 0,
});

// ------------------------------------------------------ 02 WHAT WE DO
slide = pres.addSlide(); setBg(slide, 'light'); chrome(slide, 2, 'light', 'The System');
kicker(slide, '02', 'What We Do', M, 0.98, 5.2, 'light');
headline(slide, 'One creative direction.\nEvery screen. Every format.', M, 1.34, 5.6, { size: 25, h: 1.4 }, 'light');
body(slide, 'A single idea, art-directed once and engineered to hold its shape everywhere it lands — from a five-second story to a forty-metre stage.', M, 2.85, 5.4, { size: 12, h: 1.0 }, 'light');
{
  const steps = ['Key Visual', 'Digital', 'Print', 'Event', 'Motion', 'Film', 'AI'];
  let ty = 4.05;
  steps.forEach((s, i) => {
    slide.addText(s.toUpperCase(), { x: M, y: ty, w: 2.6, h: 0.3, fontFace: FONT_MONO, fontSize: 11.5, color: THEME.light.ink, charSpacing: 1.2, margin: 0 });
    ty += 0.34;
  });
}
{
  const ib = fitBox('02-ecosystem-web.png', 6.35, 0.95, PW - 6.35 - M, PH - 0.95 - M, 'center');
  slide.addImage({ path: A('02-ecosystem-web.png'), ...ib });
}

// -------------------------------------------------- 03 KEY VISUALS / KV
slide = pres.addSlide(); setBg(slide, 'light'); chrome(slide, 3, 'light');
kicker(slide, '03', 'Key Visuals', M, 0.95, 6, 'light');
headline(slide, 'Big idea. Every format.', M, 1.28, 8, { size: 25, h: 0.6 }, 'light');
{
  const files = ['03-kv-1.png', '03-kv-2.png', '03-kv-3.png', '03-kv-4.png'];
  const labels = [['NOCTURNE', 'Hero Campaign KV'], ['AERO', 'Product KV'], ['MERIDIAN', 'Event KV'], ['ORBIT CAPITAL', 'Corporate KV']];
  const gw = (PW - 2 * M - 3 * 0.28) / 4;
  const gy = 2.05, gh = 4.25;
  files.forEach((f, i) => {
    const gx = M + i * (gw + 0.28);
    const b = fitBox(f, gx, gy, gw, gh, 'center');
    slide.addImage({ path: A(f), ...b });
    slide.addText(labels[i][0], { x: gx, y: gy + gh + 0.10, w: gw, h: 0.24, fontFace: FONT_MONO, fontSize: 10.5, bold: true, color: THEME.light.ink, charSpacing: 0.8, margin: 0 });
    slide.addText(labels[i][1], { x: gx, y: gy + gh + 0.34, w: gw, h: 0.22, fontFace: FONT_BODY, fontSize: 10, color: THEME.light.inkDim, margin: 0 });
  });
}
caption(slide, 'Concept work for fictional brands, not prior client work.', M, PH - 0.4, 9, { size: 8.5 }, 'light');

// ------------------------------------------------- 04 FLYERS / POSTERS
slide = pres.addSlide(); setBg(slide, 'light'); chrome(slide, 4, 'light', 'Brand & Campaign Creatives · 02');
kicker(slide, '04', 'Flyers · Posters · Print', M, 0.95, 7, 'light');
headline(slide, 'Static when it needs\nto stop you.', M, 1.28, 6.2, { size: 25, h: 1.15 }, 'light');
{
  const items = ['Event flyer — MERIDIAN', 'Promotional poster — AFTERGLOW', 'Corporate comms — ORBIT CAPITAL', 'Launch artwork — AERO 2', 'Invitation — NOCTURNE'];
  let ty = 2.55;
  items.forEach((t2) => { body(slide, '— ' + t2, M, ty, 5.7, { size: 11.5, h: 0.3, color: THEME.light.ink }, 'light'); ty += 0.34; });
}
{
  const b = fitBox('04-print-salon.png', M, 4.35, PW - 2 * M, PH - 4.35 - M, 'center');
  slide.addImage({ path: A('04-print-salon.png'), ...b });
}

// --------------------------------------------- 05 BANNERS / LARGE FORMAT
slide = pres.addSlide(); setBg(slide, 'light'); chrome(slide, 5, 'light', 'Brand & Campaign Creatives · 03');
kicker(slide, '05', 'Banners & Large Format', M, 0.95, 7, 'light');
headline(slide, 'Built for every screen\nin the room.', M, 1.28, 6.2, { size: 25, h: 1.15 }, 'light');
{
  const items = ['Event banners', 'Venue branding', 'Backdrops', 'Hoardings', 'Standee systems', 'Directional signage'];
  items.forEach((t2, i) => {
    slide.addText('— ' + t2, { x: M + (i % 2) * 2.9, y: 2.6 + Math.floor(i / 2) * 0.34, w: 2.7, h: 0.3, fontFace: FONT_BODY, fontSize: 11.5, color: THEME.light.ink, margin: 0 });
  });
}
{
  const b = fitBox('05-banner-scene.png', M, 3.85, PW - 2 * M, PH - 3.85 - M, 'center');
  slide.addImage({ path: A('05-banner-scene.png'), ...b });
}

// =========================================== 06 EVENT VISUAL IDENTITY
slide = pres.addSlide(); setBg(slide, 'light'); chrome(slide, 6, 'light', 'Event Creative Ecosystem · 01');
kicker(slide, '06', 'Event Visual Identity', M, 0.95, 7, 'light');
headline(slide, 'From KV to curtain call.', M, 1.28, 6.2, { size: 25, h: 0.6 }, 'light');
body(slide, 'MERIDIAN — an annual industry summit — built once as a visual language, then carried across every surface an attendee will stand in front of.', M, 1.98, 5.6, { size: 12, h: 0.9 }, 'light');
slide.addText([
  { text: 'KV', options: { bold: true } },
  { text: ' → STAGE → SCREENS → SIGNAGE → DIGITAL → PRINT' },
], { x: M, y: 3.15, w: 6.2, h: 0.32, fontFace: FONT_MONO, fontSize: 10.5, color: THEME.light.ink, charSpacing: 0.2, margin: 0 });
body(slide, 'Every touchpoint below reads at a glance as the same event — same mark, same grid, same restraint.', M, 3.7, 5.5, { size: 12.5, h: 0.9, color: THEME.light.ink }, 'light');
{
  const ib = fitBox('06-ecosystem-web-2.png', 6.35, 0.95, PW - 6.35 - M, PH - 0.95 - M, 'center');
  slide.addImage({ path: A('06-ecosystem-web-2.png'), ...ib });
}

// =============================================== 07 MAIN STAGE LED
slide = pres.addSlide(); setBg(slide, 'dark');
fullBleed(slide, '07-stage-main.png');
chrome(slide, 7, 'dark');
slide.addText('MERIDIAN', { x: M, y: 5.9, w: 6, h: 0.26, fontFace: FONT_MONO, fontSize: 11, bold: true, color: WHITE, charSpacing: 1.6, margin: 0 });
headline(slide, 'Main Stage LED Content', M, 6.16, 6.2, { size: 19, h: 0.42 }, 'dark');
caption(slide, 'Central LED · side screens · truss graphics', M, 6.62, 6, { size: 9 }, 'dark');

// ========================================== 08 LED SCREEN CONTENT SYSTEMS
slide = pres.addSlide(); setBg(slide, 'light'); chrome(slide, 8, 'light', 'Event Creative Ecosystem · 03');
kicker(slide, '08', 'LED Screen Content Systems', M, 0.95, 8, 'light');
headline(slide, 'One system. Every state on screen.', M, 1.28, 9, { size: 22, h: 0.5 }, 'light');
{
  const labels = ['Welcome', 'Speaker Intro', 'Agenda', 'Session Title', 'Transition', 'Sponsor', 'Holding', 'Closing'];
  const cols = 4, rows = 2, gap = 0.26;
  const gw = (PW - 2 * M - (cols - 1) * gap) / cols;
  const gh = 1.62, gy0 = 2.05;
  for (let i = 0; i < 8; i++) {
    const c = i % cols, r = Math.floor(i / cols);
    const gx = M + c * (gw + gap), gy = gy0 + r * (gh + 0.5);
    slide.addImage({ path: A(`08-tile-${i + 1}.png`), x: gx, y: gy, w: gw, h: gh });
    slide.addText(labels[i], { x: gx, y: gy + gh + 0.06, w: gw, h: 0.22, fontFace: FONT_BODY, fontSize: 10.5, color: THEME.light.ink, margin: 0 });
  }
}

// ===================================== 09 WALK-THROUGH / TUNNEL SCREENS
slide = pres.addSlide(); setBg(slide, 'dark');
fullBleed(slide, '09-tunnel.png');
chrome(slide, 9, 'dark');
kicker(slide, '09', 'Walk-Through · Tunnel Screens', PW - M - 5.6, 5.75, 5.6, 'dark');
headline(slide, 'A KV becomes a place you walk through.', PW - M - 5.6, 6.08, 5.6, { size: 16, h: 0.75 }, 'dark');

// ===================================== 10 SKYLIGHT / CEILING SCREENS
slide = pres.addSlide(); setBg(slide, 'dark');
fullBleed(slide, '10-ceiling.png');
chrome(slide, 10, 'dark');
kicker(slide, '10', 'Skylight · Ceiling Screens', M, 5.75, 5.6, 'dark');
headline(slide, 'The brand extends into the architecture.', M, 6.08, 5.4, { size: 16, h: 0.75 }, 'dark');

// ===================================== 11 MULTI-SCREEN EXPERIENCES
slide = pres.addSlide(); setBg(slide, 'light'); chrome(slide, 11, 'light', 'Event Creative Ecosystem · 06');
kicker(slide, '11', 'Multi-Screen Experiences', M, 0.95, 8, 'light');
headline(slide, 'One story. Any canvas.', M, 1.28, 8, { size: 25, h: 0.6 }, 'light');
body(slide, 'Panoramic LED, vertical drops, pillar wraps, digital walls — the same content system re-cut intelligently for whatever aspect ratio the venue gives us.', M, 1.98, PW - 2 * M, { size: 12, h: 0.6 }, 'light');
{
  const b = fitBox('11-multiscreen.png', M, 2.75, PW - 2 * M, PH - 2.75 - M, 'center');
  slide.addImage({ path: A('11-multiscreen.png'), ...b });
}

// =========================================== 12 MOTION GRAPHICS
slide = pres.addSlide(); setBg(slide, 'light'); chrome(slide, 12, 'light', 'Motion + Video · 01');
kicker(slide, '12', 'Motion Graphics', M, 0.95, 6, 'light');
headline(slide, 'Static, evolved.', M, 1.28, 6, { size: 25, h: 0.6 }, 'light');
{
  const labels = ['Type Animation', 'Logo Animation', 'Transitions', 'Data Animation', 'Event Motion', 'Brand Film'];
  const gap = 0.22, cols = 6;
  const gw = (PW - 2 * M - (cols - 1) * gap) / cols;
  const gh = gw * (620 / 520);
  const gy = 3.05;
  for (let i = 0; i < 6; i++) {
    const gx = M + i * (gw + gap);
    slide.addImage({ path: A(`12-tile-${i + 1}.png`), x: gx, y: gy, w: gw, h: gh });
    slide.addText(labels[i], { x: gx - 0.05, y: gy + gh + 0.07, w: gw + 0.1, h: 0.4, fontFace: FONT_BODY, fontSize: 8.5, color: THEME.light.ink, align: 'center', margin: 0 });
  }
}

// =========================================== 13 EVENT TEASER FILMS
slide = pres.addSlide(); setBg(slide, 'light'); chrome(slide, 13, 'light', 'Motion + Video · 02');
kicker(slide, '13', 'Event Teaser Films', M, 0.95, 6, 'light');
headline(slide, 'From first tease\nto final frame.', M, 1.28, 5, { size: 24, h: 1.1 }, 'light');
body(slide, 'A five-beat teaser campaign for MERIDIAN, built to run identically across social and the venue\'s own screens.', M, 2.55, 4.6, { size: 11.5, h: 0.9 }, 'light');
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
    slide.addText(labels[i], { x: gx - 0.04, y: gy + gh + 0.08, w: gw + 0.08, h: 0.5, fontFace: FONT_MONO, fontSize: 7.6, color: i === n - 1 ? THEME.light.ink : THEME.light.inkFaint, align: 'center', margin: 0, lineSpacingMultiple: 1.15 });
  }
}

// =========================================== 14 COUNTDOWN FILMS
slide = pres.addSlide(); setBg(slide, 'light'); chrome(slide, 14, 'light', 'Motion + Video · 03');
kicker(slide, '14', 'Countdown Films', M, 0.95, 6, 'light');
headline(slide, 'Motion when it needs\nto move you.', M, 1.28, 5, { size: 24, h: 1.1 }, 'light');
body(slide, 'One connected countdown, five drops, built once and scheduled to run across social and every screen in the building.', M, 2.55, 4.6, { size: 11.5, h: 0.9 }, 'light');
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
    slide.addText(labels[i], { x: gx - 0.04, y: gy + gh + 0.08, w: gw + 0.08, h: 0.3, fontFace: FONT_MONO, fontSize: 9.5, bold: i >= n - 2, color: THEME.light.ink, align: 'center', margin: 0 });
  }
}

// =========================================== 15 EVENT OPENING FILMS
slide = pres.addSlide(); setBg(slide, 'light'); chrome(slide, 15, 'light', 'Motion + Video · 04');
kicker(slide, '15', 'Event Opening Films', M, 0.95, 6, 'light');
headline(slide, 'Brand storytelling,\nbuilt to a reveal.', M, 1.28, 4.9, { size: 22, h: 1.1 }, 'light');
body(slide, 'Tension, build, reveal — the final frame flows straight into the physical main-stage LED, so the film and the room feel like one continuous shot.', M, 2.5, 4.5, { size: 11, h: 1.0 }, 'light');
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
    slide.addText(labels[i], { x: gx - 0.04, y: gy + gh + 0.07, w: gw + 0.08, h: 0.42, fontFace: FONT_MONO, fontSize: 7.3, color: i === n - 1 ? THEME.light.ink : THEME.light.inkFaint, align: 'center', margin: 0, lineSpacingMultiple: 1.1 });
  }
}

// =========================================== 16 HIGHLIGHT / AFTERMOVIES
slide = pres.addSlide(); setBg(slide, 'light'); chrome(slide, 16, 'light', 'Motion + Video · 05');
kicker(slide, '16', 'Highlight · Aftermovies', M, 0.95, 6, 'light');
headline(slide, 'Every moment worth keeping, in ninety seconds.', M, 1.28, 8.5, { size: 22, h: 0.6 }, 'light');
{
  const labels = ['Arrival', 'Crowd', 'Take the Stage', 'Performance', 'Brand Moments', 'Finale'];
  const gap = 0.22, cols = 6;
  const gw = (PW - 2 * M - (cols - 1) * gap) / cols;
  const gh = gw * (460 / 480);
  const gy = 2.9;
  for (let i = 0; i < 6; i++) {
    const gx = M + i * (gw + gap);
    slide.addImage({ path: A(`16-tile-${i + 1}.png`), x: gx, y: gy, w: gw, h: gh });
    slide.addText(labels[i], { x: gx - 0.05, y: gy + gh + 0.09, w: gw + 0.1, h: 0.24, fontFace: FONT_BODY, fontSize: 8.5, color: THEME.light.ink, align: 'center', margin: 0 });
  }
  body(slide, 'Energetic, premium, cut to the room\'s own soundtrack — an aftermovie that gets forwarded, not just archived.', M, gy + gh + 0.5, PW - 2 * M, { size: 11, h: 0.5, color: THEME.light.inkDim }, 'light');
}

// =========================================== 17 EXPLAINER FILMS
slide = pres.addSlide(); setBg(slide, 'light'); chrome(slide, 17, 'light', 'Motion + Video · 06');
kicker(slide, '17', 'Explainer Films', M, 0.95, 6, 'light');
headline(slide, 'Complicated ideas,\nmade obvious.', M, 1.28, 5, { size: 24, h: 1.1 }, 'light');
body(slide, 'A fictional fintech product, AERO PAY, explained end to end — the pipeline stays sophisticated, never cartoonish.', M, 2.55, 4.6, { size: 11.5, h: 0.9 }, 'light');
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
    slide.addText(labels[i], { x: gx - 0.04, y: gy + gh + 0.08, w: gw + 0.08, h: 0.3, fontFace: FONT_MONO, fontSize: 8.5, color: i === n - 1 ? THEME.light.ink : THEME.light.inkFaint, align: 'center', margin: 0 });
  }
}

// =========================================== 18 BRAND / STORY FILMS
slide = pres.addSlide(); setBg(slide, 'light'); chrome(slide, 18, 'light', 'Motion + Video · 07');
kicker(slide, '18', 'Brand · Story Films', M, 0.95, 6, 'light');
headline(slide, 'Every brand has a story worth thirty minutes of ours.', M, 1.28, 9, { size: 20, h: 0.6 }, 'light');
{
  const labels = ['Founder Story\nFERRO COFFEE', 'Corporate Film\nORBIT CAPITAL', 'Brand Manifesto\nNOCTURNE', 'Product Story\nAERO', 'Human Story', 'Culture Film'];
  const gap = 0.22, cols = 6;
  const gw = (PW - 2 * M - (cols - 1) * gap) / cols;
  const gh = gw * (620 / 480);
  const gy = 2.85;
  for (let i = 0; i < 6; i++) {
    const gx = M + i * (gw + gap);
    slide.addImage({ path: A(`18-tile-${i + 1}.png`), x: gx, y: gy, w: gw, h: gh });
    slide.addText(labels[i], { x: gx - 0.05, y: gy + gh + 0.08, w: gw + 0.1, h: 0.5, fontFace: FONT_MONO, fontSize: 7.4, color: THEME.light.ink, align: 'center', margin: 0, lineSpacingMultiple: 1.15 });
  }
}

// ================================ 19 VIDEO EDITING & POST-PRODUCTION
slide = pres.addSlide(); setBg(slide, 'light'); chrome(slide, 19, 'light', 'Motion + Video · 08');
kicker(slide, '19', 'Video Editing & Post-Production', M, 0.95, 8, 'light');
headline(slide, 'Raw becomes final — six disciplines, one pipeline.', M, 1.28, 9.5, { size: 20, h: 0.6 }, 'light');
{
  const b = fitBox('19-postprod.png', M, 2.55, PW - 2 * M, PH - 2.55 - M - 0.35, 'center');
  slide.addImage({ path: A('19-postprod.png'), ...b });
}
body(slide, 'Editing · colour grading · sound design · motion graphics · compositing · cleanup — finished to broadcast and social spec alike.', M, 6.75, PW - 2 * M, { size: 10.5, h: 0.24, color: THEME.light.inkDim, align: 'left' }, 'light');

// =========================================== 20 ANIMATION
slide = pres.addSlide(); setBg(slide, 'light'); chrome(slide, 20, 'light', 'Motion + Video · 09');
kicker(slide, '20', 'Animation', M, 0.95, 6, 'light');
headline(slide, 'Drawn to move.', M, 1.28, 6, { size: 25, h: 0.6 }, 'light');
{
  const labels = ['2D Animation', 'Typography', 'Product Animation', 'Logo Animation', 'UI Animation', 'Event Screens'];
  const gap = 0.22, cols = 6;
  const gw = (PW - 2 * M - (cols - 1) * gap) / cols;
  const gh = gw * (460 / 480);
  const gy = 3.5;
  for (let i = 0; i < 6; i++) {
    const gx = M + i * (gw + gap);
    slide.addImage({ path: A(`20-tile-${i + 1}.png`), x: gx, y: gy, w: gw, h: gh });
    slide.addText(labels[i], { x: gx - 0.05, y: gy + gh + 0.09, w: gw + 0.1, h: 0.36, fontFace: FONT_BODY, fontSize: 8, color: THEME.light.ink, align: 'center', margin: 0, lineSpacingMultiple: 1.1 });
  }
}

// =========================================== 21 PHOTOGRAPHY
slide = pres.addSlide(); setBg(slide, 'light'); chrome(slide, 21, 'light', 'Photography');
kicker(slide, '21', 'Photography', M, 0.95, 6, 'light');
headline(slide, 'Shot to be used, not just admired.', M, 1.28, 6, { size: 22, h: 0.55 }, 'light');
{
  const items = ['Products', 'Food', 'Corporate', 'People', 'Events', 'Lifestyle', 'Detail Shots'];
  let ty = 2.15;
  items.forEach((t2) => { slide.addText('— ' + t2, { x: M, y: ty, w: 3.6, h: 0.28, fontFace: FONT_BODY, fontSize: 11, color: THEME.light.ink, margin: 0 }); ty += 0.32; });
}
{
  const b = fitBox('21-contact-sheet.png', 4.15, 1.95, PW - 4.15 - M, PH - 1.95 - M, 'center');
  slide.addImage({ path: A('21-contact-sheet.png'), ...b });
}

// =========================================== 22 AI-GENERATED CONTENT
slide = pres.addSlide(); setBg(slide, 'dark');
fullBleed(slide, '22-ai-hero.png');
chrome(slide, 22, 'dark');
kicker(slide, '22', 'AI-Generated Content', M, 5.55, 6.6, 'dark');
headline(slide, 'Imagination without\nproduction limits.', M, 5.88, 7.1, { size: 20, h: 0.7 }, 'dark');
caption(slide, 'Impossible locations · virtual sets · hyper-real product worlds.', M, 6.66, 7.1, { size: 9 }, 'dark');

// =========================================== 23 AI VIDEO
slide = pres.addSlide(); setBg(slide, 'light'); chrome(slide, 23, 'light', 'AI Creative Studio · 02');
kicker(slide, '23', 'AI Video', M, 0.95, 6, 'light');
headline(slide, 'Cinematic visuals,\nwithout the shoot.', M, 1.28, 4.7, { size: 23, h: 1.1 }, 'light');
body(slide, 'A storyboard from an AI-generated commercial for AERO — full cinematic craft without a traditional-scale production.', M, 2.55, 4.4, { size: 11.5, h: 1.0 }, 'light');
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
    slide.addText(labels[i], { x: gx - 0.04, y: gy + gh + 0.08, w: gw + 0.08, h: 0.3, fontFace: FONT_MONO, fontSize: 9.5, color: i === n - 1 ? THEME.light.ink : THEME.light.inkFaint, align: 'center', margin: 0 });
    if (i < n - 1) slide.addText('→', { x: gx + gw + 0.02, y: gy + gh / 2 - 0.12, w: 0.24, h: 0.24, fontFace: FONT_MONO, fontSize: 12, color: THEME.light.inkFaint, margin: 0 });
  }
}

// =========================================== 24 AI + TRADITIONAL CREATIVE
slide = pres.addSlide(); setBg(slide, 'light'); chrome(slide, 24, 'light', 'AI Creative Studio · 03');
kicker(slide, '24', 'AI + Traditional Creative', M, 0.95, 8, 'light');
headline(slide, 'AI accelerates production.\nCreative direction keeps it human.', M, 1.28, 10, { size: 20, h: 0.9 }, 'light');
{
  const imgY = 2.85;
  const b = fitBox('24-pipeline.png', M, imgY, PW - 2 * M, PH - imgY - M - 0.4, 'center');
  slide.addImage({ path: A('24-pipeline.png'), ...b, y: imgY });
  const padFrac = 60 / 1920;
  const startX = b.x + padFrac * b.w;
  const endX = b.x + b.w - padFrac * b.w;
  const labels = ['IDEA', 'AI\nCONCEPTING', 'ART\nDIRECTION', 'DESIGN', 'MOTION', 'EDIT', 'FINAL\nCAMPAIGN'];
  const n = labels.length;
  const stepX = (endX - startX) / (n - 1);
  for (let i = 0; i < n; i++) {
    const cx = startX + i * stepX;
    slide.addText(labels[i], { x: cx - 0.55, y: imgY + b.h * 0.5 + 0.32, w: 1.1, h: 0.44, fontFace: FONT_MONO, fontSize: 8, color: (i === 0 || i === n - 1) ? THEME.light.ink : THEME.light.inkFaint, align: 'center', margin: 0, lineSpacingMultiple: 1.1 });
  }
}

// =========================================== 25 THE FULL ECOSYSTEM
slide = pres.addSlide(); setBg(slide, 'light'); chrome(slide, 25, 'light', 'One Campaign — Everything Connected');
kicker(slide, '25', 'The Full Ecosystem', M, 0.95, 8, 'light');
headline(slide, 'One creative partner. The entire visual journey.', M, 1.28, 10, { size: 20, h: 0.55 }, 'light');
{
  const b = fitBox('25-full-ecosystem.png', M, 1.95, 7.55, PH - 1.95 - M, 'left');
  slide.addImage({ path: A('25-full-ecosystem.png'), ...b });
}
{
  const items = ['KV', 'Poster', 'Social', 'Stage LED', 'Walk-through Screen', 'Skylight', 'Motion Graphics', 'Teaser', 'Countdown', 'Opening Film', 'Aftermovie', 'Photography', 'AI Content'];
  const cols = [items.slice(0, 7), items.slice(7)];
  cols.forEach((colItems, ci) => {
    let ty = 2.05;
    colItems.forEach((t2) => {
      slide.addText('— ' + t2, { x: 7.95 + ci * 2.55, y: ty, w: 2.4, h: 0.26, fontFace: FONT_BODY, fontSize: 9.5, color: THEME.light.ink, margin: 0 });
      ty += 0.315;
    });
  });
}
body(slide, 'MERIDIAN, one campaign — every deliverable in this deck, produced from a single creative direction.', 7.95, 5.65, 4.85, { size: 10, h: 0.7, color: THEME.light.inkDim }, 'light');

// =========================================== 26 CLOSE
slide = pres.addSlide(); setBg(slide, 'dark');
fullBleed(slide, '26-close.png');
markLogo(slide, PW / 2 - 0.35, 2.85, 0.7, 'dark');
slide.addText("Let's make something\nworth remembering.", {
  x: 0, y: 3.85, w: PW, h: 1.1, fontFace: FONT_HEAD, bold: true, fontSize: 28, color: WHITE, align: 'center', margin: 0, lineSpacingMultiple: 1.08,
});
slide.addText('FIFTH & ZERO', {
  x: 0, y: 5.05, w: PW, h: 0.5, fontFace: FONT_MONO, fontSize: 18, bold: true, color: WHITE, charSpacing: 3, align: 'center', margin: 0,
});
slide.addText('26 / 26', {
  x: PW - M - 1.4, y: 0.34, w: 1.4, h: 0.26, fontFace: FONT_MONO, fontSize: 9.5, color: '8A8A8A', charSpacing: 1.2, align: 'right', margin: 0,
});

// ================================================================ SAVE
(async () => {
  const out = path.join(__dirname, 'out', 'Fifth-Zero-Capabilities-Deck.pptx');
  await pres.writeFile({ fileName: out });
  console.log('wrote', out);
})();

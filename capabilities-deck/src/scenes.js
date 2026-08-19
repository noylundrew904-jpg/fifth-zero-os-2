// Fifth & Zero capabilities deck — SVG scene library.
// Brand rule (from the real brand guide): strict black/white/off-white
// system. Signal red (#E2361F) is worn ONLY by a singular dot — never a
// fill, background, block, or stripe. So every scene here is monochrome
// (thin-bordered flat cards, echoing the guide's own colour-swatch and
// application layouts) with red used sparingly as an isolated dot accent.
// No brand headline copy is baked into these rasters — only short
// technical numerals/tags in DejaVu Sans Mono (the brand's own mono face,
// installed locally), so all real headline/body typography stays native,
// editable PPTX text laid on top in build-deck.js.

const RED = '#E2361F';

const THEME = {
  dark: {
    bg: '#0A0A0A',
    ink: '#FFFFFF',
    inkDim: 'rgba(255,255,255,0.62)',
    inkFaint: 'rgba(255,255,255,0.20)',
    inkGhost: 'rgba(255,255,255,0.08)',
    panel: '#141414',
    line: 'rgba(255,255,255,0.24)',
    lineSoft: 'rgba(255,255,255,0.10)',
  },
  light: {
    bg: '#F6F4EF',
    ink: '#0A0A0A',
    inkDim: 'rgba(10,10,10,0.60)',
    inkFaint: 'rgba(10,10,10,0.22)',
    inkGhost: 'rgba(10,10,10,0.08)',
    panel: '#FFFFFF',
    line: 'rgba(10,10,10,0.26)',
    lineSoft: 'rgba(10,10,10,0.12)',
  },
};

function svgDoc(w, h, body, bg) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect x="0" y="0" width="${w}" height="${h}" fill="${bg}"/>
  ${body}
</svg>`;
}

// Recurring motif: corner registration crosshairs (print/production marks)
function regMarks(x, y, w, h, color, size = 16) {
  const c = [[x, y], [x + w, y], [x, y + h], [x + w, y + h]];
  return c.map(([cx, cy]) => `
    <line x1="${cx - size}" y1="${cy}" x2="${cx + size}" y2="${cy}" stroke="${color}" stroke-width="1"/>
    <line x1="${cx}" y1="${cy - size}" x2="${cx}" y2="${cy + size}" stroke="${color}" stroke-width="1"/>
    <circle cx="${cx}" cy="${cy}" r="2.5" fill="none" stroke="${color}" stroke-width="1"/>
  `).join('');
}
function techLabel(x, y, text, color, opts = {}) {
  const { size = 11, anchor = 'start', tracking = 1.2, weight = 400 } = opts;
  return `<text x="${x}" y="${y}" font-family="'DejaVu Sans Mono', monospace" font-weight="${weight}" font-size="${size}" fill="${color}" letter-spacing="${tracking}" text-anchor="${anchor}">${text}</text>`;
}
function dotGrid(x, y, w, h, color, gap = 30, r = 1) {
  let out = '';
  for (let gx = x; gx <= x + w; gx += gap) {
    for (let gy = y; gy <= y + h; gy += gap) {
      out += `<circle cx="${gx}" cy="${gy}" r="${r}" fill="${color}"/>`;
    }
  }
  return out;
}
// the singular brand accent — always red, always alone
function redDot(cx, cy, r = 5) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${RED}"/>`;
}
// a thin-bordered flat card, filled black / white / off-white / theme-panel
function card(x, y, w, h, fill, borderColor, strokeW = 1.4) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${borderColor}" stroke-width="${strokeW}"/>`;
}
// simple "5" + dot mark, for baking into scenes that need it inline
function fiveMark(cx, cy, s, ink) {
  const fs = s * 1.9;
  return `
    <text x="${cx - s * 0.55}" y="${cy + s * 0.62}" font-family="'Poppins','DejaVu Sans',sans-serif" font-weight="700" font-size="${fs}" fill="${ink}" text-anchor="middle">5</text>
    ${redDot(cx + s * 0.62, cy + s * 0.46, s * 0.16)}
  `;
}

let _uid = 0;
const uid = (p) => `${p}${_uid++}`;

// ---------------------------------------------------------------- COVER
function coverHero(w, h, { theme = 'dark', tag = '5.0 / 001', cy: cyFrac = 0.42 } = {}) {
  const T = THEME[theme];
  const cx = w * 0.5, cy = h * cyFrac;
  let rings = '';
  for (let i = 0; i < 4; i++) {
    rings += `<circle cx="${cx}" cy="${cy}" r="${150 + i * 120}" fill="none" stroke="${T.lineSoft}" stroke-width="1" opacity="${0.9 - i * 0.16}"/>`;
  }
  const body = `
    ${dotGrid(0, 0, w, h, T.inkGhost, 38, 1)}
    ${rings}
    ${regMarks(48, 48, w - 96, h - 96, T.inkFaint)}
    ${techLabel(48, h - 30, tag, T.inkFaint)}
    ${techLabel(w - 48, h - 30, 'EST. INTELLIGENCE', T.inkFaint, { anchor: 'end' })}
  `;
  return svgDoc(w, h, body, T.bg);
}

// ------------------------------------------------------------ AI WORLD
function aiWorld(w, h, { theme = 'dark', seed = 1 } = {}) {
  const T = THEME[theme];
  const cx = w * 0.5, cy = h * 0.46;
  let rings = '';
  for (let i = 0; i < 7; i++) {
    const r = 60 + i * 68 + (seed * 13) % 20;
    rings += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${T.lineSoft}" stroke-width="1" opacity="${Math.max(0.85 - i * 0.1, 0.12)}"/>`;
  }
  let particles = '';
  let s = seed * 9301 + 49297;
  for (let i = 0; i < 90; i++) {
    s = (s * 9301 + 49297) % 233280;
    const rnd = s / 233280;
    let s2 = (s * 233 + 71) % 233280; const rnd2 = s2 / 233280;
    const ang = rnd * Math.PI * 2;
    const rad = 40 + rnd2 * w * 0.46;
    const px = cx + Math.cos(ang) * rad;
    const py = cy + Math.sin(ang) * rad * 0.6;
    if (px < 0 || px > w || py < 0 || py > h) continue;
    particles += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="1" fill="${T.inkFaint}"/>`;
  }
  const body = `
    ${rings}
    ${particles}
    ${redDot(cx, cy, 5)}
    ${regMarks(48, 48, w - 96, h - 96, T.inkFaint)}
    ${techLabel(48, h - 30, '5.0 / AI.GEN', T.inkFaint)}
  `;
  return svgDoc(w, h, body, T.bg);
}

// -------------------------------------------------------- STAGE / LED
function screenWall(w, h, { theme = 'dark', label = 'MAIN STAGE' } = {}) {
  const T = THEME[theme];
  const floorY = h * 0.86;
  const stageX = w * 0.10, stageW = w * 0.80;
  const screenX = w * 0.20, screenY = h * 0.12, screenW = w * 0.60, screenH = h * 0.50;
  const sideW = w * 0.13, sideH = screenH * 0.86;
  let interior = `<rect x="${screenX}" y="${screenY}" width="${screenW}" height="${screenH}" fill="${T.bg}"/>`;
  interior += fiveMark(screenX + screenW / 2, screenY + screenH / 2, screenH * 0.16, T.ink);
  const body = `
    <rect x="0" y="0" width="${w}" height="${floorY}" fill="${T.bg}"/>
    <rect x="0" y="${floorY}" width="${w}" height="${h - floorY}" fill="${theme === 'dark' ? '#050505' : '#EDEBE4'}"/>
    <rect x="0" y="${floorY - 1}" width="${w}" height="1" fill="${T.line}"/>
    <line x1="${stageX}" y1="${h * 0.06}" x2="${stageX + stageW}" y2="${h * 0.06}" stroke="${T.line}" stroke-width="2"/>
    ${Array.from({ length: 9 }).map((_, i) => `<line x1="${stageX + i * stageW / 8}" y1="${h * 0.06}" x2="${stageX + i * stageW / 8}" y2="${h * 0.10}" stroke="${T.lineSoft}" stroke-width="1.5"/>`).join('')}
    <polygon points="${screenX - sideW - 14},${screenY + (screenH - sideH) / 2 + 10} ${screenX - 14},${screenY + (screenH - sideH) / 2} ${screenX - 14},${screenY + (screenH - sideH) / 2 + sideH} ${screenX - sideW - 14},${screenY + (screenH - sideH) / 2 + sideH - 10}" fill="${T.panel}" stroke="${T.line}" stroke-width="1"/>
    <polygon points="${screenX + screenW + 14},${screenY + (screenH - sideH) / 2} ${screenX + screenW + sideW + 14},${screenY + (screenH - sideH) / 2 + 10} ${screenX + screenW + sideW + 14},${screenY + (screenH - sideH) / 2 + sideH - 10} ${screenX + screenW + 14},${screenY + (screenH - sideH) / 2 + sideH}" fill="${T.panel}" stroke="${T.line}" stroke-width="1"/>
    <rect x="${screenX - 6}" y="${screenY - 6}" width="${screenW + 12}" height="${screenH + 12}" fill="none" stroke="${T.line}" stroke-width="2"/>
    ${interior}
    <rect x="${screenX}" y="${screenY}" width="${screenW}" height="${screenH}" fill="none" stroke="${T.lineSoft}" stroke-width="1"/>
    ${redDot(screenX + screenW - 26, screenY + 24, 4)}
    ${Array.from({ length: 26 }).map((_, i) => {
      const cx = stageX - 20 + (i * (stageW + 40)) / 25 + (i % 3) * 3;
      const r = 9 + (i % 4) * 2;
      const cy = floorY - r + 2;
      return `<circle cx="${cx.toFixed(1)}" cy="${cy}" r="${r}" fill="${T.bg}" stroke="${T.lineSoft}" stroke-width="1"/><rect x="${(cx - r * 0.55).toFixed(1)}" y="${cy + r * 0.3}" width="${r * 1.1}" height="${r * 1.6}" fill="${T.bg}" stroke="${T.lineSoft}" stroke-width="1"/>`;
    }).join('')}
    ${regMarks(48, 48, w - 96, h - 96, T.inkFaint)}
    ${techLabel(48, h - 30, `5.0 / STAGE — ${label}`, T.inkFaint)}
  `;
  return svgDoc(w, h, body, T.bg);
}

// single monitor/bezel tile, for grids with native pptx captions below
function screenTile(w, h, { theme = 'dark', icon = 'dot', dotAccent = false } = {}) {
  const T = THEME[theme];
  const ix = w / 2, iy = h / 2;
  let inner = '';
  if (icon === 'ring') inner = `<circle cx="${ix}" cy="${iy}" r="${w * 0.15}" fill="none" stroke="${T.ink}" stroke-width="2.5"/>`;
  else if (icon === 'bars') inner = [0, 1, 2, 3].map(i => `<rect x="${ix - w * 0.22 + i * w * 0.14}" y="${iy - h * 0.16 + i * 8}" width="${w * 0.08}" height="${h * 0.32 - i * 8}" fill="${T.ink}" opacity="${0.9 - i * 0.15}"/>`).join('');
  else if (icon === 'cross') inner = `<line x1="${ix - w * 0.16}" y1="${iy}" x2="${ix + w * 0.16}" y2="${iy}" stroke="${T.ink}" stroke-width="2.5"/><line x1="${ix}" y1="${iy - w * 0.16}" x2="${ix}" y2="${iy + w * 0.16}" stroke="${T.ink}" stroke-width="2.5"/>`;
  else if (icon === 'tri') inner = `<polygon points="${ix},${iy - w * 0.16} ${ix + w * 0.16},${iy + h * 0.12} ${ix - w * 0.16},${iy + h * 0.12}" fill="none" stroke="${T.ink}" stroke-width="2.5"/>`;
  else if (icon === 'grid') inner = dotGrid(ix - w * 0.18, iy - h * 0.18, w * 0.36, h * 0.36, T.ink, w * 0.09, 2);
  else if (icon === 'arrow') inner = `<line x1="${ix - w * 0.18}" y1="${iy}" x2="${ix + w * 0.1}" y2="${iy}" stroke="${T.ink}" stroke-width="2.5"/><polygon points="${ix + w * 0.18},${iy} ${ix + w * 0.06},${iy - h * 0.08} ${ix + w * 0.06},${iy + h * 0.08}" fill="${T.ink}"/>`;
  else if (icon === 'lines') inner = [0, 1, 2].map(i => `<line x1="${ix - w * 0.2}" y1="${iy - h * 0.12 + i * h * 0.12}" x2="${ix + w * 0.2 - i * w * 0.05}" y2="${iy - h * 0.12 + i * h * 0.12}" stroke="${T.ink}" stroke-width="${i === 0 ? 2.5 : 1.4}" opacity="${i === 0 ? 0.85 : 0.4}"/>`).join('');
  else inner = `<circle cx="${ix}" cy="${iy}" r="${w * 0.09}" fill="${T.ink}"/>`;
  const body = `
    ${card(0, 0, w, h, T.bg, T.line, 1.6)}
    <rect x="6" y="6" width="${w - 12}" height="${h - 12}" fill="none" stroke="${T.lineSoft}" stroke-width="1"/>
    ${inner}
    ${dotAccent ? redDot(w - 18, 18, 4) : ''}
  `;
  return svgDoc(w, h, body, T.bg);
}

function tunnel(w, h, { theme = 'dark', n = 7 } = {}) {
  const T = THEME[theme];
  const cx = w * 0.5, cy = h * 0.5;
  let panels = '';
  for (let i = n; i >= 1; i--) {
    const t = i / n;
    const pw = w * 0.9 * t, ph = h * 0.86 * t;
    const x = cx - pw / 2, y = cy - ph / 2;
    panels += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${pw.toFixed(1)}" height="${ph.toFixed(1)}" fill="${i === n ? T.panel : 'none'}" stroke="${T.line}" stroke-width="1.2" opacity="${0.35 + (1 - t) * 0.55}"/>`;
  }
  const corners = [[0.05, 0.07], [0.95, 0.07], [0.05, 0.93], [0.95, 0.93]];
  const rails = corners.map(([fx, fy]) => `<line x1="${w * fx}" y1="${h * fy}" x2="${cx}" y2="${cy}" stroke="${T.lineSoft}" stroke-width="1"/>`).join('');
  const body = `
    ${rails}
    ${panels}
    ${redDot(cx, cy, 4)}
    ${regMarks(48, 48, w - 96, h - 96, T.inkFaint)}
    ${techLabel(48, h - 30, '5.0 / TUNNEL.SEQ', T.inkFaint)}
  `;
  return svgDoc(w, h, body, T.bg);
}

function ceilingGrid(w, h, { theme = 'dark' } = {}) {
  const T = THEME[theme];
  const vx = w * 0.5, vy = h * -0.15;
  let lines = '';
  for (let i = 0; i <= 12; i++) {
    const bx = (i / 12) * w;
    lines += `<line x1="${bx}" y1="${h}" x2="${vx}" y2="${vy}" stroke="${T.lineSoft}" stroke-width="1"/>`;
  }
  for (let j = 1; j <= 6; j++) {
    const t = j / 6, y = h - t * h * 0.9, spread = 1 - t * 0.7;
    lines += `<line x1="${w * 0.5 - w * 0.5 * spread}" y1="${y}" x2="${w * 0.5 + w * 0.5 * spread}" y2="${y}" stroke="${T.lineSoft}" stroke-width="1"/>`;
  }
  const panels = [[0.28, 0.30], [0.5, 0.20], [0.72, 0.32]];
  const skylights = panels.map(([fx, fy], i) => {
    const px = w * fx, py = h * fy, pw = 150, ph = 90;
    return `${card(px - pw / 2, py - ph / 2, pw, ph, T.panel, T.line, 1.6)}${i === 1 ? redDot(px, py, 3.5) : ''}`;
  }).join('');
  const body = `
    ${lines}
    ${skylights}
    ${regMarks(48, 48, w - 96, h - 96, T.inkFaint)}
    ${techLabel(48, h - 30, '5.0 / CEILING.SYS', T.inkFaint)}
  `;
  return svgDoc(w, h, body, T.bg);
}

function multiScreenCluster(w, h, { theme = 'light' } = {}) {
  const T = THEME[theme];
  const frames = [
    { x: 0.06, y: 0.14, w: 0.42, h: 0.28, label: 'PANORAMIC' },
    { x: 0.52, y: 0.10, w: 0.16, h: 0.60, label: 'VERTICAL' },
    { x: 0.72, y: 0.14, w: 0.09, h: 0.52, label: 'PILLAR' },
    { x: 0.84, y: 0.18, w: 0.09, h: 0.44, label: 'PILLAR' },
    { x: 0.06, y: 0.50, w: 0.42, h: 0.22, label: 'DIGITAL WALL' },
  ];
  let out = '';
  frames.forEach((f, i) => {
    const x = f.x * w, y = f.y * h, fw = f.w * w, fh = f.h * h;
    const fillDark = i % 2 === 0;
    out += card(x, y, fw, fh, fillDark ? T.panel : T.bg, T.line, 1.5);
    for (let s = 0; s < 3; s++) {
      out += `<rect x="${x + 10 + s * (fw - 20) / 3}" y="${y + 10}" width="${(fw - 20) / 3 - 6}" height="${fh - 20}" fill="${T.ink}" opacity="${s === 1 ? 0.16 : 0.06}"/>`;
    }
    if (i === 0) out += redDot(x + fw - 20, y + 18, 4);
    out += techLabel(x + 8, y + fh - 8, f.label, T.inkFaint, { size: 9.5 });
  });
  return svgDoc(w, h, `${out}${regMarks(48, 48, w - 96, h - 96, T.inkFaint)}`, T.bg);
}

// ------------------------------------------------------------- PRINT
function posterMockup(w, h, { theme = 'light', variant = 'title', dark = false, dotAccent = false } = {}) {
  const T = THEME[theme];
  const pw = w * 0.86, ph = h * 0.86;
  const px = w * 0.5 - pw / 2, py = h * 0.5 - ph / 2;
  const fill = dark ? '#0A0A0A' : '#FFFFFF';
  const ink = dark ? '#FFFFFF' : '#0A0A0A';
  const inkDim = dark ? 'rgba(255,255,255,0.55)' : 'rgba(10,10,10,0.5)';
  const body = `
    ${card(px, py, pw, ph, fill, T.line, 1.6)}
    ${variant === 'title' ? `
      <rect x="${px + pw * 0.1}" y="${py + ph * 0.12}" width="${pw * 0.8}" height="2" fill="${ink}" opacity="0.8"/>
      <rect x="${px + pw * 0.1}" y="${py + ph * 0.20}" width="${pw * 0.5}" height="${ph * 0.34}" fill="none" stroke="${ink}" stroke-width="1.4" opacity="0.85"/>
      <rect x="${px + pw * 0.1}" y="${py + ph * 0.62}" width="${pw * 0.65}" height="10" fill="${ink}" opacity="0.55"/>
      <rect x="${px + pw * 0.1}" y="${py + ph * 0.70}" width="${pw * 0.4}" height="6" fill="${inkDim}"/>
      <rect x="${px + pw * 0.1}" y="${py + ph * 0.86}" width="${pw * 0.3}" height="6" fill="${inkDim}"/>
    ` : `
      <circle cx="${px + pw / 2}" cy="${py + ph * 0.36}" r="${pw * 0.28}" fill="none" stroke="${ink}" stroke-width="1.4" opacity="0.85"/>
      <rect x="${px + pw * 0.14}" y="${py + ph * 0.68}" width="${pw * 0.72}" height="8" fill="${ink}" opacity="0.55"/>
      <rect x="${px + pw * 0.14}" y="${py + ph * 0.78}" width="${pw * 0.5}" height="5" fill="${inkDim}"/>
    `}
    ${dotAccent ? redDot(px + pw - 18, py + 18, 4.5) : ''}
    ${regMarks(px, py, pw, ph, T.inkFaint, 12)}
    ${regMarks(48, 48, w - 96, h - 96, T.inkFaint)}
  `;
  return svgDoc(w, h, body, T.bg);
}

function printSalon(w, h, { theme = 'light', count = 5 } = {}) {
  const T = THEME[theme];
  const items = [
    { x: 0.06, y: 0.16, w: 0.16, h: 0.62, rot: -2, dark: true },
    { x: 0.24, y: 0.08, w: 0.19, h: 0.80, rot: 1.5, dark: false },
    { x: 0.45, y: 0.14, w: 0.17, h: 0.66, rot: -1, dark: true },
    { x: 0.64, y: 0.06, w: 0.19, h: 0.84, rot: 2, dark: false },
    { x: 0.85, y: 0.18, w: 0.13, h: 0.56, rot: -1.5, dark: true },
  ].slice(0, count);
  let out = '';
  items.forEach((it, i) => {
    const x = it.x * w, y = it.y * h, iw = it.w * w, ih = it.h * h;
    const cx = x + iw / 2, cy = y + ih / 2;
    const fill = it.dark ? '#0A0A0A' : '#FFFFFF';
    const ink = it.dark ? '#FFFFFF' : '#0A0A0A';
    out += `<g transform="rotate(${it.rot} ${cx} ${cy})">
      <rect x="${x - 3}" y="${y - 3}" width="${iw + 6}" height="${ih + 6}" fill="${theme === 'dark' ? '#000' : '#00000018'}" opacity="0.35"/>
      ${card(x, y, iw, ih, fill, T.line, 1.5)}
      <rect x="${x + iw * 0.14}" y="${y + ih * 0.12}" width="${iw * 0.72}" height="${ih * 0.30}" fill="none" stroke="${ink}" stroke-width="1.2" opacity="0.85"/>
      <rect x="${x + iw * 0.14}" y="${y + ih * 0.58}" width="${iw * 0.6}" height="6" fill="${ink}" opacity="0.55"/>
      <rect x="${x + iw * 0.14}" y="${y + ih * 0.68}" width="${iw * 0.4}" height="4" fill="${ink}" opacity="0.35"/>
      ${i === 1 ? redDot(x + iw - 14, y + 14, 4) : ''}
      ${techLabel(x + 8, y + ih - 8, `PR.0${i + 1}`, ink === '#FFFFFF' ? 'rgba(255,255,255,0.5)' : 'rgba(10,10,10,0.4)', { size: 9 })}
    </g>`;
  });
  return svgDoc(w, h, `${out}${regMarks(48, 48, w - 96, h - 96, T.inkFaint)}`, T.bg);
}

function bannerScene(w, h, { theme = 'light' } = {}) {
  const T = THEME[theme];
  const bx = w * 0.30, by = h * 0.08, bw = w * 0.16, bh = h * 0.72;
  const standeeX = w * 0.55, standeeY = h * 0.24, standeeW = w * 0.13, standeeH = h * 0.56;
  const signX = w * 0.75, signY = h * 0.58, signW = w * 0.16, signH = h * 0.10;
  const body = `
    <line x1="0" y1="${h * 0.82}" x2="${w}" y2="${h * 0.82}" stroke="${T.lineSoft}" stroke-width="1"/>
    <ellipse cx="${bx + bw / 2}" cy="${by + bh + 10}" rx="${bw * 0.55}" ry="8" fill="${T.inkGhost}"/>
    ${card(bx, by, bw, bh, T.panel, T.line, 1.6)}
    <circle cx="${bx + 8}" cy="${by + 8}" r="3" fill="none" stroke="${T.inkFaint}" stroke-width="1"/>
    <circle cx="${bx + bw - 8}" cy="${by + 8}" r="3" fill="none" stroke="${T.inkFaint}" stroke-width="1"/>
    <rect x="${bx + bw * 0.16}" y="${by + bh * 0.10}" width="${bw * 0.68}" height="${bh * 0.22}" fill="none" stroke="${T.ink}" stroke-width="1.4" opacity="0.85"/>
    <rect x="${bx + bw * 0.16}" y="${by + bh * 0.42}" width="${bw * 0.68}" height="4" fill="${T.ink}" opacity="0.55"/>
    <rect x="${bx + bw * 0.16}" y="${by + bh * 0.50}" width="${bw * 0.4}" height="3" fill="${T.ink}" opacity="0.35"/>
    ${card(standeeX, standeeY, standeeW, standeeH, T.bg, T.line, 1.6)}
    <circle cx="${standeeX + standeeW / 2}" cy="${standeeY + standeeH * 0.32}" r="${standeeW * 0.28}" fill="none" stroke="${T.ink}" stroke-width="1.2" opacity="0.75"/>
    <rect x="${standeeX + standeeW * 0.5 - 2}" y="${standeeY + standeeH}" width="4" height="18" fill="${T.line}"/>
    ${card(signX, signY, signW, signH, T.panel, T.line, 1.4)}
    <line x1="${signX + 10}" y1="${signY + signH / 2}" x2="${signX + signW - 18}" y2="${signY + signH / 2}" stroke="${T.ink}" stroke-width="2"/>
    <polygon points="${signX + signW - 10},${signY + signH / 2} ${signX + signW - 22},${signY + signH / 2 - 7} ${signX + signW - 22},${signY + signH / 2 + 7}" fill="${T.ink}"/>
    ${redDot(signX + signW - 8, signY - 8, 4)}
    ${regMarks(48, 48, w - 96, h - 96, T.inkFaint)}
    ${techLabel(48, h - 30, '5.0 / ENV.LARGE-FORMAT', T.inkFaint)}
  `;
  return svgDoc(w, h, body, T.bg);
}

// ------------------------------------------------------------ FILM
// single storyboard/film frame tile, for filmstrips with native pptx captions
function frameTile(w, h, { theme = 'light', idx = 0, n = 6, accentOn = false } = {}) {
  const T = THEME[theme];
  const alt = idx % 2 === 0;
  const fill = alt ? T.panel : T.bg;
  const ink = T.ink;
  const cx = w / 2, cy = h / 2;
  let subject = '';
  if (accentOn) {
    subject = `<circle cx="${cx}" cy="${cy}" r="${w * 0.18}" fill="none" stroke="${ink}" stroke-width="2"/>${redDot(cx, cy, 4)}`;
  } else {
    subject = `<circle cx="${cx}" cy="${cy - h * 0.05}" r="${w * 0.13}" fill="none" stroke="${ink}" stroke-width="1.4" opacity="0.5"/>
      <line x1="${cx - w * 0.2}" y1="${cy + h * 0.2}" x2="${cx + w * 0.2}" y2="${cy + h * 0.2}" stroke="${ink}" stroke-width="1" opacity="0.32"/>`;
  }
  const body = `
    ${card(0, 0, w, h, fill, T.line, 1.4)}
    <circle cx="${w / 2}" cy="10" r="3" fill="none" stroke="${T.inkFaint}" stroke-width="1"/>
    <circle cx="${w / 2}" cy="${h - 10}" r="3" fill="none" stroke="${T.inkFaint}" stroke-width="1"/>
    ${subject}
    ${techLabel(10, h - 10, `${String(idx + 1).padStart(2, '0')}/${String(n).padStart(2, '0')}`, T.inkFaint, { size: 9 })}
  `;
  return svgDoc(w, h, body, T.bg);
}

function postProdStrip(w, h, { theme = 'light' } = {}) {
  const T = THEME[theme];
  const steps = ['RAW', 'EDIT', 'GRADE', 'SOUND', 'MOTION', 'FINAL'];
  const pad = 48, gap = 14, n = steps.length;
  const fw = (w - pad * 2 - gap * (n - 1)) / n;
  const fh = h * 0.5, y = h * 0.5 - fh / 2;
  let out = '';
  for (let i = 0; i < n; i++) {
    const x = pad + i * (fw + gap);
    const t = i / (n - 1);
    out += card(x, y, fw, fh, i === 0 ? T.panel : T.bg, i === n - 1 ? T.ink : T.line, i === n - 1 ? 1.8 : 1.3);
    for (let s = 0; s < 5; s++) {
      const swx = x + 10 + s * (fw - 20) / 5;
      const op = Math.min(0.12 + t * 0.75 + s * 0.02, 0.95);
      out += `<rect x="${swx}" y="${y + fh - 24}" width="${(fw - 20) / 5 - 4}" height="14" fill="${T.ink}" opacity="${op.toFixed(2)}"/>`;
    }
    if (i >= 3) {
      for (let wv = 0; wv < 5; wv++) {
        const wx = x + 14 + wv * (fw - 28) / 4;
        const wh = 8 + ((wv * 7 + i * 3) % 5) * 5;
        out += `<rect x="${wx}" y="${y + fh * 0.36 - wh / 2}" width="4" height="${wh}" fill="${T.ink}" opacity="0.5"/>`;
      }
    }
    if (i === n - 1) out += redDot(x + fw - 16, y + 16, 4.5);
    out += techLabel(x + fw / 2, y - 14, steps[i], i === n - 1 ? T.ink : T.inkFaint, { size: 12, anchor: 'middle', tracking: 2, weight: i === n - 1 ? 700 : 400 });
    if (i < n - 1) out += `<polygon points="${x + fw + 3},${y + fh / 2} ${x + fw + 11},${y + fh / 2 - 5} ${x + fw + 11},${y + fh / 2 + 5}" fill="${T.inkFaint}"/>`;
  }
  return svgDoc(w, h, `${out}${regMarks(48, 48, w - 96, h - 96, T.inkFaint)}`, T.bg);
}

// -------------------------------------------------------- PHOTOGRAPHY
function contactSheet(w, h, { theme = 'light', rows = 3, cols = 6 } = {}) {
  const T = THEME[theme];
  const pad = 40, gap = 10;
  const cw = (w - pad * 2 - gap * (cols - 1)) / cols;
  const ch = (h - pad * 2 - gap * (rows - 1)) / rows;
  const kinds = ['ring', 'grid', 'diag', 'dot', 'bars', 'tri', 'cross', 'blank'];
  let out = '';
  let idx = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = pad + c * (cw + gap), y = pad + r * (ch + gap);
      const kind = kinds[(idx * 3) % kinds.length];
      const isPick = idx % 7 === 3;
      const alt = idx % 5 === 0;
      out += card(x, y, cw, ch, alt ? T.panel : T.bg, isPick ? T.ink : T.line, isPick ? 1.8 : 1);
      const ix = x + cw / 2, iy = y + ch / 2;
      if (kind === 'ring') out += `<circle cx="${ix}" cy="${iy}" r="${Math.min(cw, ch) * 0.24}" fill="none" stroke="${T.ink}" stroke-width="1.2" opacity="0.7"/>`;
      else if (kind === 'grid') out += dotGrid(x + 6, y + 6, cw - 12, ch - 12, 'rgba(128,128,128,0.35)', 12, 1);
      else if (kind === 'diag') out += `<line x1="${x + 6}" y1="${y + ch - 6}" x2="${x + cw - 6}" y2="${y + 6}" stroke="${T.ink}" stroke-width="1" opacity="0.5"/>`;
      else if (kind === 'dot') out += `<circle cx="${ix}" cy="${iy}" r="4" fill="${T.ink}" opacity="0.6"/>`;
      else if (kind === 'bars') out += [0, 1, 2].map(i => `<rect x="${ix - 14 + i * 10}" y="${iy - 10 + i * 4}" width="6" height="${20 - i * 4}" fill="${T.ink}" opacity="0.55"/>`).join('');
      else if (kind === 'tri') out += `<polygon points="${ix},${iy - 12} ${ix + 12},${iy + 8} ${ix - 12},${iy + 8}" fill="none" stroke="${T.ink}" stroke-width="1" opacity="0.6"/>`;
      else if (kind === 'cross') out += `<line x1="${ix - 10}" y1="${iy}" x2="${ix + 10}" y2="${iy}" stroke="${T.ink}" stroke-width="1.4" opacity="0.7"/><line x1="${ix}" y1="${iy - 10}" x2="${ix}" y2="${iy + 10}" stroke="${T.ink}" stroke-width="1.4" opacity="0.7"/>`;
      out += techLabel(x + 5, y + ch - 6, `${String(idx + 1).padStart(2, '0')}`, T.inkFaint, { size: 8, tracking: 0.3 });
      if (isPick) out += redDot(x + cw - 10, y + 10, 3.5);
      idx++;
    }
  }
  return svgDoc(w, h, `${out}${regMarks(48, 48, w - 96, h - 96, T.inkFaint)}`, T.bg);
}

// -------------------------------------------------------------- FLOWS
function workflowPipeline(w, h, { theme = 'light', n = 7 } = {}) {
  const T = THEME[theme];
  const pad = 60, y = h * 0.5;
  const step = (w - pad * 2) / (n - 1);
  let out = `<line x1="${pad}" y1="${y}" x2="${w - pad}" y2="${y}" stroke="${T.lineSoft}" stroke-width="1"/>`;
  for (let i = 0; i < n; i++) {
    const x = pad + i * step;
    const isEdge = i === 0 || i === n - 1;
    out += `<circle cx="${x}" cy="${y}" r="${isEdge ? 24 : 20}" fill="${T.bg}" stroke="${T.ink}" stroke-width="1.6" opacity="${isEdge ? 1 : 0.65}"/>`;
    if (isEdge) out += redDot(x, y, 4);
    else out += `<circle cx="${x}" cy="${y}" r="3" fill="${T.inkFaint}"/>`;
    if (i < n - 1) out += `<polygon points="${x + step - 34},${y} ${x + step - 44},${y - 5} ${x + step - 44},${y + 5}" fill="${T.inkFaint}"/>`;
  }
  return svgDoc(w, h, `${out}${regMarks(48, 48, w - 96, h - 96, T.inkFaint)}`, T.bg);
}

function ecosystemWeb(w, h, { theme = 'light', n = 6 } = {}) {
  const T = THEME[theme];
  const cx = w * 0.5, cy = h * 0.52, R = h * 0.34;
  let out = '';
  const pts = [];
  for (let i = 0; i < n; i++) {
    const ang = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const px = cx + Math.cos(ang) * R, py = cy + Math.sin(ang) * R * 0.92;
    pts.push([px, py]);
    out += `<line x1="${cx}" y1="${cy}" x2="${px.toFixed(1)}" y2="${py.toFixed(1)}" stroke="${T.lineSoft}" stroke-width="1"/>`;
  }
  out += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${T.lineSoft}" stroke-width="1" stroke-dasharray="2 6"/>`;
  pts.forEach(([px, py], i) => {
    out += card(px - 26, py - 26, 52, 52, T.bg, i === 0 ? T.ink : T.line, i === 0 ? 1.8 : 1.3);
    out += `<circle cx="${px}" cy="${py}" r="3" fill="${T.inkFaint}"/>`;
  });
  out += card(cx - 30, cy - 30, 60, 60, T.bg, T.ink, 2);
  out += redDot(cx, cy, 4.5);
  return svgDoc(w, h, `${out}${regMarks(48, 48, w - 96, h - 96, T.inkFaint)}`, T.bg);
}

function fullEcosystemWall(w, h, { theme = 'light' } = {}) {
  const T = THEME[theme];
  const tiles = [
    { x: 0.05, y: 0.10, w: 0.20, h: 0.34 }, { x: 0.27, y: 0.06, w: 0.14, h: 0.42 },
    { x: 0.43, y: 0.12, w: 0.22, h: 0.24 }, { x: 0.67, y: 0.06, w: 0.13, h: 0.30 },
    { x: 0.82, y: 0.10, w: 0.13, h: 0.40 }, { x: 0.05, y: 0.48, w: 0.15, h: 0.28 },
    { x: 0.22, y: 0.52, w: 0.19, h: 0.22 }, { x: 0.43, y: 0.40, w: 0.22, h: 0.36 },
    { x: 0.67, y: 0.40, w: 0.13, h: 0.22 }, { x: 0.67, y: 0.64, w: 0.13, h: 0.14 },
    { x: 0.82, y: 0.54, w: 0.13, h: 0.24 }, { x: 0.05, y: 0.80, w: 0.15, h: 0.14 },
    { x: 0.22, y: 0.78, w: 0.19, h: 0.16 },
  ];
  let out = '';
  const dotIdx = [2, 7, 10];
  tiles.forEach((t, i) => {
    const x = t.x * w, y = t.y * h, tw = t.w * w, th = t.h * h;
    const alt = i % 3 === 0;
    out += card(x, y, tw, th, alt ? T.panel : T.bg, T.line, alt ? 1.6 : 1);
    const ix = x + tw / 2, iy = y + th / 2;
    if (i % 4 === 0) out += `<circle cx="${ix}" cy="${iy}" r="${Math.min(tw, th) * 0.18}" fill="none" stroke="${T.ink}" stroke-width="1" opacity="0.6"/>`;
    else if (i % 4 === 1) out += `<line x1="${x + 8}" y1="${y + th - 8}" x2="${x + tw - 8}" y2="${y + 8}" stroke="${T.ink}" stroke-width="1" opacity="0.4"/>`;
    else if (i % 4 === 2) out += `<rect x="${ix - 12}" y="${iy - 12}" width="24" height="24" fill="none" stroke="${T.ink}" stroke-width="1.2" opacity="0.7"/>`;
    if (dotIdx.includes(i)) out += redDot(x + tw - 12, y + 12, 3.5);
    out += techLabel(x + 6, y + th - 6, `EC.${String(i + 1).padStart(2, '0')}`, T.inkFaint, { size: 8.5, tracking: 0.3 });
  });
  return svgDoc(w, h, `${out}${regMarks(48, 48, w - 96, h - 96, T.inkFaint)}`, T.bg);
}

module.exports = {
  RED, THEME, svgDoc, redDot, coverHero, aiWorld, screenWall, screenTile, tunnel,
  ceilingGrid, multiScreenCluster, posterMockup, printSalon, bannerScene,
  frameTile, postProdStrip, contactSheet, workflowPipeline, ecosystemWeb,
  fullEcosystemWall,
};

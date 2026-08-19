// Fifth & Zero capabilities deck — SVG scene library.
// Flat/graphic "technical-cinematic" system: dark ground, lime glow, thin
// registration frames + crosshairs as the recurring motif. No brand
// headline copy is baked into these rasters — only generic technical
// numerals/coordinates (rendered in a system monospace), so all real
// brand typography (IBM Plex Mono / Newsreader) stays native, editable
// PPTX text laid on top in build-deck.js.

const C = {
  bg: '#000000',
  panel: '#0A0A0A',
  panel2: '#111111',
  line: 'rgba(255,255,255,0.14)',
  lineSoft: 'rgba(255,255,255,0.07)',
  lineStrong: 'rgba(255,255,255,0.30)',
  white: '#F2F2F0',
  dim: '#9A9A96',
  muted: '#4A4A46',
  lime: '#DBFF6B',
  limeSoft: 'rgba(219,255,107,0.35)',
  limeDim: 'rgba(219,255,107,0.10)',
};

let _uid = 0;
const uid = (p) => `${p}${_uid++}`;

function svgDoc(w, h, body, bg = C.bg) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect x="0" y="0" width="${w}" height="${h}" fill="${bg}"/>
  ${body}
</svg>`;
}

function radialDef(id, cx, cy, r, stops) {
  const s = stops.map(([off, col, op]) => `<stop offset="${off}" stop-color="${col}" stop-opacity="${op}"/>`).join('');
  return `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}" gradientUnits="userSpaceOnUse">${s}</radialGradient>`;
}
function linearDef(id, x1, y1, x2, y2, stops) {
  const s = stops.map(([off, col, op]) => `<stop offset="${off}" stop-color="${col}" stop-opacity="${op}"/>`).join('');
  return `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" gradientUnits="userSpaceOnUse">${s}</linearGradient>`;
}

// Recurring motif: corner registration crosshairs (like print/production marks)
function regMarks(x, y, w, h, size = 16, color = C.lineStrong) {
  const c = [[x, y], [x + w, y], [x, y + h], [x + w, y + h]];
  return c.map(([cx, cy]) => `
    <line x1="${cx - size}" y1="${cy}" x2="${cx + size}" y2="${cy}" stroke="${color}" stroke-width="1"/>
    <line x1="${cx}" y1="${cy - size}" x2="${cx}" y2="${cy + size}" stroke="${color}" stroke-width="1"/>
    <circle cx="${cx}" cy="${cy}" r="2.5" fill="none" stroke="${color}" stroke-width="1"/>
  `).join('');
}
function techLabel(x, y, text, opts = {}) {
  const { size = 11, color = C.dim, anchor = 'start', tracking = 1.5 } = opts;
  return `<text x="${x}" y="${y}" font-family="'IBM Plex Mono', 'Courier New', monospace" font-size="${size}" fill="${color}" letter-spacing="${tracking}" text-anchor="${anchor}">${text}</text>`;
}
function dotGrid(x, y, w, h, gap = 28, r = 1, color = 'rgba(255,255,255,0.08)') {
  let out = '';
  for (let gx = x; gx <= x + w; gx += gap) {
    for (let gy = y; gy <= y + h; gy += gap) {
      out += `<circle cx="${gx}" cy="${gy}" r="${r}" fill="${color}"/>`;
    }
  }
  return out;
}

// ---------------------------------------------------------------- HERO
function heroGradient(w, h, { pos = 'center', tone = 'lime', dense = true } = {}) {
  const id = uid('g');
  const cx = pos === 'left' ? w * 0.28 : pos === 'right' ? w * 0.72 : w * 0.5;
  const cy = h * 0.42;
  const col = tone === 'lime' ? C.lime : C.white;
  const body = `
    <defs>
      ${radialDef(id, cx, cy, w * 0.62, [[0, col, tone === 'lime' ? 0.22 : 0.10], [0.45, col, 0.06], [1, col, 0]])}
    </defs>
    <rect x="0" y="0" width="${w}" height="${h}" fill="url(#${id})"/>
    ${dense ? dotGrid(40, 40, w - 80, h - 80, 34, 1, 'rgba(255,255,255,0.06)') : ''}
    <line x1="0" y1="${h * 0.5}" x2="${w}" y2="${h * 0.5}" stroke="${C.lineSoft}" stroke-width="1"/>
    <line x1="${w * 0.5}" y1="0" x2="${w * 0.5}" y2="${h}" stroke="${C.lineSoft}" stroke-width="1"/>
    <circle cx="${cx}" cy="${cy}" r="1.5" fill="${C.lime}"/>
    <circle cx="${cx}" cy="${cy}" r="120" fill="none" stroke="${C.limeSoft}" stroke-width="1" opacity="0.5"/>
    <circle cx="${cx}" cy="${cy}" r="260" fill="none" stroke="${C.lineSoft}" stroke-width="1"/>
    ${regMarks(48, 48, w - 96, h - 96)}
    ${techLabel(48, h - 30, 'F+Z / SYS.00', { color: C.muted })}
    ${techLabel(w - 48, h - 30, `${w}×${h}`, { anchor: 'end', color: C.muted })}
  `;
  return svgDoc(w, h, body);
}

// ------------------------------------------------------------ AI WORLD
function aiWorld(w, h, { seed = 1 } = {}) {
  const id = uid('g');
  const cx = w * 0.5, cy = h * 0.46;
  let rings = '';
  for (let i = 0; i < 7; i++) {
    const r = 60 + i * 70 + (seed * 13) % 20;
    const op = 0.5 - i * 0.06;
    const strokeCol = i % 3 === 0 ? C.lime : C.line;
    rings += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${strokeCol}" stroke-width="${i % 3 === 0 ? 1.4 : 0.8}" opacity="${Math.max(op, 0.08)}"/>`;
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
    const isLime = i % 11 === 0;
    particles += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${isLime ? 2 : 1}" fill="${isLime ? C.lime : C.dim}" opacity="${isLime ? 0.9 : 0.45}"/>`;
  }
  const body = `
    <defs>${radialDef(id, cx, cy, w * 0.7, [[0, C.lime, 0.16], [0.5, C.lime, 0.04], [1, C.lime, 0]])}</defs>
    <rect x="0" y="0" width="${w}" height="${h}" fill="url(#${id})"/>
    ${rings}
    ${particles}
    <rect x="${cx - 22}" y="${cy - 22}" width="44" height="44" rx="4" fill="none" stroke="${C.lime}" stroke-width="1.6"/>
    <rect x="${cx - 34}" y="${cy - 10}" width="44" height="44" rx="4" fill="none" stroke="${C.white}" stroke-width="1.2" opacity="0.55"/>
    ${regMarks(48, 48, w - 96, h - 96)}
    ${techLabel(48, h - 30, 'F+Z / AI.GEN', { color: C.muted })}
  `;
  return svgDoc(w, h, body);
}

// -------------------------------------------------------- STAGE / LED
function screenWall(w, h, { content = 'bars', label = 'MAIN LED' } = {}) {
  const floorY = h * 0.86;
  const stageX = w * 0.10, stageW = w * 0.80;
  const screenX = w * 0.20, screenY = h * 0.12, screenW = w * 0.60, screenH = h * 0.50;
  const sideW = w * 0.13, sideH = screenH * 0.86;
  const gId = uid('g'), fId = uid('g'), spotId = uid('g');
  let interior = '';
  if (content === 'bars') {
    for (let i = 0; i < 6; i++) {
      const bx = screenX + 20 + i * ((screenW - 40) / 6);
      interior += `<rect x="${bx}" y="${screenY + 20}" width="${(screenW - 40) / 6 - 8}" height="${screenH - 40}" fill="${i % 2 === 0 ? C.lime : C.white}" opacity="${i % 2 === 0 ? 0.85 : 0.10}"/>`;
    }
  } else if (content === 'wordmark') {
    interior += `<rect x="${screenX + screenW * 0.5 - 60}" y="${screenY + screenH * 0.5 - 60}" width="120" height="120" rx="6" fill="none" stroke="${C.lime}" stroke-width="2"/>`;
    interior += `<rect x="${screenX + screenW * 0.5 - 40}" y="${screenY + screenH * 0.5 - 30}" width="120" height="120" rx="6" fill="none" stroke="${C.white}" stroke-width="1.4" opacity="0.6"/>`;
  } else if (content === 'agenda') {
    for (let i = 0; i < 4; i++) {
      const ly = screenY + 34 + i * 40;
      interior += `<line x1="${screenX + 30}" y1="${ly}" x2="${screenX + screenW - 30}" y2="${ly}" stroke="${C.white}" stroke-width="${i === 0 ? 2 : 1}" opacity="${i === 0 ? 0.7 : 0.25}"/>`;
    }
  }
  const body = `
    <defs>
      ${linearDef(gId, 0, screenY, 0, screenY + screenH, [[0, '#1a1f0a', 1], [1, '#05060a', 1]])}
      ${radialDef(spotId, w * 0.5, 0, w * 0.5, [[0, C.white, 0.10], [1, C.white, 0]])}
      ${linearDef(fId, 0, floorY, 0, h, [[0, '#0d0d0d', 1], [1, '#000000', 1]])}
    </defs>
    <rect x="0" y="0" width="${w}" height="${floorY}" fill="#020202"/>
    <rect x="0" y="${floorY}" width="${w}" height="${h - floorY}" fill="url(#${fId})"/>
    <rect x="0" y="${floorY - 2}" width="${w}" height="2" fill="${C.lineSoft}"/>
    <rect x="0" y="0" width="${w}" height="${h}" fill="url(#${spotId})"/>
    <!-- truss -->
    <line x1="${stageX}" y1="${h * 0.06}" x2="${stageX + stageW}" y2="${h * 0.06}" stroke="${C.lineStrong}" stroke-width="2"/>
    ${Array.from({ length: 9 }).map((_, i) => `<line x1="${stageX + i * stageW / 8}" y1="${h * 0.06}" x2="${stageX + i * stageW / 8}" y2="${h * 0.10}" stroke="${C.line}" stroke-width="1.5"/>`).join('')}
    <!-- side screens (trapezoid perspective) -->
    <polygon points="${screenX - sideW - 14},${screenY + (screenH - sideH) / 2 + 10} ${screenX - 14},${screenY + (screenH - sideH) / 2} ${screenX - 14},${screenY + (screenH - sideH) / 2 + sideH} ${screenX - sideW - 14},${screenY + (screenH - sideH) / 2 + sideH - 10}" fill="#0c0f06" stroke="${C.line}" stroke-width="1"/>
    <polygon points="${screenX + screenW + 14},${screenY + (screenH - sideH) / 2} ${screenX + screenW + sideW + 14},${screenY + (screenH - sideH) / 2 + 10} ${screenX + screenW + sideW + 14},${screenY + (screenH - sideH) / 2 + sideH - 10} ${screenX + screenW + 14},${screenY + (screenH - sideH) / 2 + sideH}" fill="#0c0f06" stroke="${C.line}" stroke-width="1"/>
    <!-- main LED -->
    <rect x="${screenX - 6}" y="${screenY - 6}" width="${screenW + 12}" height="${screenH + 12}" fill="none" stroke="${C.lineStrong}" stroke-width="2"/>
    <rect x="${screenX}" y="${screenY}" width="${screenW}" height="${screenH}" fill="url(#${gId})"/>
    ${interior}
    <rect x="${screenX}" y="${screenY}" width="${screenW}" height="${screenH}" fill="none" stroke="${C.lime}" stroke-width="1" opacity="0.4"/>
    <!-- crowd silhouette -->
    ${Array.from({ length: 26 }).map((_, i) => {
      const cx = stageX - 20 + (i * (stageW + 40)) / 25 + (i % 3) * 3;
      const r = 9 + (i % 4) * 2;
      const cy = floorY - r + 2;
      return `<circle cx="${cx.toFixed(1)}" cy="${cy}" r="${r}" fill="#000" stroke="${C.lineSoft}" stroke-width="1"/><rect x="${(cx - r * 0.55).toFixed(1)}" y="${cy + r * 0.3}" width="${r * 1.1}" height="${r * 1.6}" fill="#000" stroke="${C.lineSoft}" stroke-width="1"/>`;
    }).join('')}
    ${regMarks(48, 48, w - 96, h - 96)}
    ${techLabel(48, h - 30, `F+Z / STAGE — ${label}`, { color: C.muted })}
  `;
  return svgDoc(w, h, body);
}

function screenGrid(w, h, { cols = 4, rows = 2, pad = 44, gap = 22 } = {}) {
  const cw = (w - pad * 2 - gap * (cols - 1)) / cols;
  const ch = (h - pad * 2 - gap * (rows - 1)) / rows;
  const icons = ['dot', 'ring', 'bars', 'cross', 'tri', 'grid', 'arrow', 'diag'];
  let cells = '';
  let idx = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = pad + c * (cw + gap), y = pad + r * (ch + gap);
      const icon = icons[idx % icons.length];
      let inner = '';
      const ix = x + cw / 2, iy = y + ch / 2;
      if (icon === 'dot') inner = `<circle cx="${ix}" cy="${iy}" r="10" fill="${C.lime}"/>`;
      else if (icon === 'ring') inner = `<circle cx="${ix}" cy="${iy}" r="18" fill="none" stroke="${C.white}" stroke-width="2"/>`;
      else if (icon === 'bars') inner = [0, 1, 2].map(i => `<rect x="${ix - 24 + i * 18}" y="${iy - 16 + i * 6}" width="10" height="${32 - i * 6}" fill="${C.white}" opacity="${0.9 - i * 0.2}"/>`).join('');
      else if (icon === 'cross') inner = `<line x1="${ix - 18}" y1="${iy}" x2="${ix + 18}" y2="${iy}" stroke="${C.lime}" stroke-width="2"/><line x1="${ix}" y1="${iy - 18}" x2="${ix}" y2="${iy + 18}" stroke="${C.lime}" stroke-width="2"/>`;
      else if (icon === 'tri') inner = `<polygon points="${ix},${iy - 18} ${ix + 18},${iy + 14} ${ix - 18},${iy + 14}" fill="none" stroke="${C.white}" stroke-width="2"/>`;
      else if (icon === 'grid') inner = dotGrid(ix - 22, iy - 22, 44, 44, 11, 1.6, C.white);
      else if (icon === 'arrow') inner = `<line x1="${ix - 20}" y1="${iy}" x2="${ix + 14}" y2="${iy}" stroke="${C.lime}" stroke-width="2"/><polygon points="${ix + 20},${iy} ${ix + 8},${iy - 8} ${ix + 8},${iy + 8}" fill="${C.lime}"/>`;
      else inner = `<line x1="${ix - 20}" y1="${iy - 20}" x2="${ix + 20}" y2="${iy + 20}" stroke="${C.white}" stroke-width="2" opacity="0.7"/>`;
      cells += `
        <rect x="${x}" y="${y}" width="${cw}" height="${ch}" fill="${C.panel}" stroke="${C.line}" stroke-width="1.5"/>
        <rect x="${x + 6}" y="${y + 6}" width="${cw - 12}" height="${ch - 12}" fill="none" stroke="${C.lineSoft}" stroke-width="1"/>
        ${inner}
        ${techLabel(x + 10, y + ch - 10, `0${idx + 1}`, { size: 9.5, color: C.muted, tracking: 1 })}
      `;
      idx++;
    }
  }
  return svgDoc(w, h, `${cells}${regMarks(48, 48, w - 96, h - 96)}`);
}

// single monitor/bezel tile, for grids with native pptx captions placed below
function screenTile(w, h, { icon = 'dot', lime = false } = {}) {
  const id = uid('g');
  const ix = w / 2, iy = h / 2;
  let inner = '';
  if (icon === 'dot') inner = `<circle cx="${ix}" cy="${iy}" r="${w * 0.1}" fill="${C.lime}"/>`;
  else if (icon === 'ring') inner = `<circle cx="${ix}" cy="${iy}" r="${w * 0.16}" fill="none" stroke="${C.white}" stroke-width="2.5"/>`;
  else if (icon === 'bars') inner = [0, 1, 2, 3].map(i => `<rect x="${ix - w * 0.22 + i * w * 0.14}" y="${iy - h * 0.16 + i * 8}" width="${w * 0.08}" height="${h * 0.32 - i * 8}" fill="${C.white}" opacity="${0.9 - i * 0.15}"/>`).join('');
  else if (icon === 'cross') inner = `<line x1="${ix - w * 0.16}" y1="${iy}" x2="${ix + w * 0.16}" y2="${iy}" stroke="${C.lime}" stroke-width="2.5"/><line x1="${ix}" y1="${iy - w * 0.16}" x2="${ix}" y2="${iy + w * 0.16}" stroke="${C.lime}" stroke-width="2.5"/>`;
  else if (icon === 'tri') inner = `<polygon points="${ix},${iy - w * 0.16} ${ix + w * 0.16},${iy + h * 0.12} ${ix - w * 0.16},${iy + h * 0.12}" fill="none" stroke="${C.white}" stroke-width="2.5"/>`;
  else if (icon === 'grid') inner = dotGrid(ix - w * 0.18, iy - h * 0.18, w * 0.36, h * 0.36, w * 0.09, 2, C.white);
  else if (icon === 'arrow') inner = `<line x1="${ix - w * 0.18}" y1="${iy}" x2="${ix + w * 0.1}" y2="${iy}" stroke="${C.lime}" stroke-width="2.5"/><polygon points="${ix + w * 0.18},${iy} ${ix + w * 0.06},${iy - h * 0.08} ${ix + w * 0.06},${iy + h * 0.08}" fill="${C.lime}"/>`;
  else if (icon === 'lines') inner = [0, 1, 2].map(i => `<line x1="${ix - w * 0.2}" y1="${iy - h * 0.12 + i * h * 0.12}" x2="${ix + w * 0.2 - i * w * 0.05}" y2="${iy - h * 0.12 + i * h * 0.12}" stroke="${C.white}" stroke-width="${i === 0 ? 2.5 : 1.4}" opacity="${i === 0 ? 0.8 : 0.35}"/>`).join('');
  else inner = `<line x1="${ix - w * 0.18}" y1="${iy - h * 0.18}" x2="${ix + w * 0.18}" y2="${iy + h * 0.18}" stroke="${C.white}" stroke-width="2" opacity="0.7"/>`;
  const body = `
    <defs>${linearDef(id, 0, 0, 0, h, [[0, lime ? '#141d08' : '#111111', 1], [1, '#010101', 1]])}</defs>
    <rect x="0" y="0" width="${w}" height="${h}" fill="url(#${id})"/>
    <rect x="6" y="6" width="${w - 12}" height="${h - 12}" fill="none" stroke="${C.lineSoft}" stroke-width="1"/>
    ${inner}
    <rect x="0" y="0" width="${w}" height="${h}" fill="none" stroke="${lime ? C.lime : C.lineStrong}" stroke-width="${lime ? 1.6 : 1.2}" opacity="${lime ? 0.65 : 1}"/>
    <circle cx="16" cy="16" r="2.5" fill="${C.lime}" opacity="0.8"/>
  `;
  return svgDoc(w, h, body);
}

// single storyboard/film frame tile, for filmstrips with native pptx captions
function frameTile(w, h, { mood = 'build', idx = 0, n = 6, accentOn = false } = {}) {
  const t = n > 1 ? idx / (n - 1) : 0;
  let stop0;
  if (mood === 'build') stop0 = idx === n - 1 ? '#141d08' : '#0d0d0d';
  else if (mood === 'countdown') stop0 = t > 0.7 ? '#141d06' : '#0a0a0a';
  else if (mood === 'energy') stop0 = idx % 2 === 0 ? '#141d06' : '#101010';
  else stop0 = idx === Math.floor((n - 1) / 2) ? '#121a08' : '#0c0c0c';
  const id = uid('g');
  const cx = w / 2, cy = h / 2;
  let subject = '';
  if (accentOn) {
    subject = `<circle cx="${cx}" cy="${cy}" r="${w * 0.2}" fill="none" stroke="${C.lime}" stroke-width="2.4"/><circle cx="${cx}" cy="${cy}" r="3" fill="${C.lime}"/>`;
  } else {
    subject = `<circle cx="${cx}" cy="${cy - h * 0.05}" r="${w * 0.13}" fill="none" stroke="${C.white}" stroke-width="1.4" opacity="0.45"/>
      <line x1="${cx - w * 0.2}" y1="${cy + h * 0.2}" x2="${cx + w * 0.2}" y2="${cy + h * 0.2}" stroke="${C.white}" stroke-width="1" opacity="0.3"/>`;
  }
  const body = `
    <defs>${linearDef(id, 0, 0, 0, h, [[0, stop0, 1], [1, '#000000', 1]])}</defs>
    <rect x="0" y="0" width="${w}" height="${h}" fill="url(#${id})"/>
    <circle cx="${w / 2}" cy="10" r="3" fill="none" stroke="${C.muted}" stroke-width="1"/>
    <circle cx="${w / 2}" cy="${h - 10}" r="3" fill="none" stroke="${C.muted}" stroke-width="1"/>
    ${subject}
    <rect x="0" y="0" width="${w}" height="${h}" fill="none" stroke="${accentOn ? C.lime : C.lineStrong}" stroke-width="${accentOn ? 1.8 : 1.2}" opacity="${accentOn ? 0.75 : 1}"/>
    ${techLabel(10, h - 10, `${String(idx + 1).padStart(2, '0')}/${String(n).padStart(2, '0')}`, { size: 9, color: C.muted, tracking: 0.4 })}
  `;
  return svgDoc(w, h, body);
}

function tunnel(w, h, { n = 7 } = {}) {
  const cx = w * 0.5, cy = h * 0.5;
  const id = uid('g');
  let panels = '';
  for (let i = n; i >= 1; i--) {
    const t = i / n;
    const pw = w * 0.9 * t, ph = h * 0.86 * t;
    const x = cx - pw / 2, y = cy - ph / 2;
    const op = 0.15 + (1 - t) * 0.5;
    const isLime = i % 3 === 0;
    panels += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${pw.toFixed(1)}" height="${ph.toFixed(1)}" fill="none" stroke="${isLime ? C.lime : C.white}" stroke-width="${isLime ? 1.6 : 1}" opacity="${op}"/>`;
    if (i === n) panels += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${pw.toFixed(1)}" height="${ph.toFixed(1)}" fill="${C.panel}"/>`;
  }
  // connecting rails
  const corners = [[0.05, 0.07], [0.95, 0.07], [0.05, 0.93], [0.95, 0.93]];
  let rails = corners.map(([fx, fy]) => {
    const ex = w * fx, ey = h * fy;
    return `<line x1="${ex}" y1="${ey}" x2="${cx}" y2="${cy}" stroke="${C.lineSoft}" stroke-width="1"/>`;
  }).join('');
  const body = `
    <defs>${radialDef(id, cx, cy, w * 0.5, [[0, C.lime, 0.30], [0.4, C.lime, 0.06], [1, C.lime, 0]])}</defs>
    <rect width="${w}" height="${h}" fill="url(#${id})"/>
    ${rails}
    ${panels}
    <circle cx="${cx}" cy="${cy}" r="3" fill="${C.lime}"/>
    ${regMarks(48, 48, w - 96, h - 96)}
    ${techLabel(48, h - 30, 'F+Z / TUNNEL.SEQ', { color: C.muted })}
  `;
  return svgDoc(w, h, body);
}

function ceilingGrid(w, h) {
  const vx = w * 0.5, vy = h * -0.15;
  let lines = '';
  for (let i = 0; i <= 12; i++) {
    const fx = i / 12;
    const bx = fx * w;
    lines += `<line x1="${bx}" y1="${h}" x2="${vx}" y2="${vy}" stroke="${C.lineSoft}" stroke-width="1"/>`;
  }
  for (let j = 1; j <= 6; j++) {
    const t = j / 6;
    const y = h - t * h * 0.9;
    const spread = 1 - t * 0.7;
    lines += `<line x1="${w * 0.5 - w * 0.5 * spread}" y1="${y}" x2="${w * 0.5 + w * 0.5 * spread}" y2="${y}" stroke="${C.lineSoft}" stroke-width="1"/>`;
  }
  // glowing skylight panels
  const panels = [[0.28, 0.30], [0.5, 0.20], [0.72, 0.32]];
  const glows = panels.map(([fx, fy], i) => {
    const id = uid('g');
    const px = w * fx, py = h * fy, pw = 150, ph = 90;
    return `<defs>${radialDef(id, px, py, 160, [[0, C.lime, 0.4], [1, C.lime, 0]])}</defs>
      <rect x="${px - pw / 2}" y="${py - ph / 2}" width="${pw}" height="${ph}" fill="url(#${id})"/>
      <rect x="${px - pw / 2}" y="${py - ph / 2}" width="${pw}" height="${ph}" fill="none" stroke="${C.lime}" stroke-width="1.4" opacity="0.7"/>`;
  }).join('');
  const body = `
    ${lines}
    ${glows}
    ${regMarks(48, 48, w - 96, h - 96)}
    ${techLabel(48, h - 30, 'F+Z / CEILING.SYS', { color: C.muted })}
  `;
  return svgDoc(w, h, body);
}

function multiScreenCluster(w, h) {
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
    const id = uid('g');
    const isLime = i % 2 === 0;
    out += `<defs>${linearDef(id, x, y, x, y + fh, [[0, isLime ? '#1a2109' : '#141414', 1], [1, '#040404', 1]])}</defs>`;
    out += `<rect x="${x}" y="${y}" width="${fw}" height="${fh}" fill="url(#${id})" stroke="${C.lineStrong}" stroke-width="1.5"/>`;
    for (let s = 0; s < 3; s++) {
      out += `<rect x="${x + 10 + s * (fw - 20) / 3}" y="${y + 10}" width="${(fw - 20) / 3 - 6}" height="${fh - 20}" fill="${isLime ? C.lime : C.white}" opacity="${0.06 + (s === 1 ? 0.14 : 0)}"/>`;
    }
    out += techLabel(x + 8, y + fh - 8, f.label, { size: 9.5, color: C.muted, tracking: 1 });
  });
  return svgDoc(w, h, `${out}${regMarks(48, 48, w - 96, h - 96)}`);
}

// ------------------------------------------------------------- PRINT
function posterMockup(w, h, { tone = 'lime', variant = 'title', standalone = false } = {}) {
  const pw = standalone ? w * 0.86 : w * 0.42, ph = standalone ? h * 0.86 : h * 0.82;
  const px = w * 0.5 - pw / 2, py = h * 0.5 - ph / 2;
  const id = uid('g'), shId = uid('g');
  const accent = tone === 'lime' ? C.lime : C.white;
  const body = `
    <defs>
      ${linearDef(id, px, py, px, py + ph, [[0, tone === 'lime' ? '#161d09' : '#161616', 1], [0.6, '#060706', 1], [1, '#000000', 1]])}
      ${radialDef(shId, px + pw / 2, py + ph + 30, pw * 0.7, [[0, '#000000', 0.55], [1, '#000000', 0]])}
    </defs>
    <rect x="0" y="0" width="${w}" height="${h}" fill="#050505"/>
    ${dotGrid(0, 0, w, h, 40, 1, 'rgba(255,255,255,0.03)')}
    <ellipse cx="${px + pw / 2}" cy="${py + ph + 26}" rx="${pw * 0.55}" ry="18" fill="url(#${shId})"/>
    <rect x="${px}" y="${py}" width="${pw}" height="${ph}" fill="url(#${id})"/>
    <rect x="${px}" y="${py}" width="${pw}" height="${ph}" fill="none" stroke="${C.lineStrong}" stroke-width="1.5"/>
    ${variant === 'title' ? `
      <rect x="${px + pw * 0.1}" y="${py + ph * 0.12}" width="${pw * 0.8}" height="2" fill="${accent}" opacity="0.7"/>
      <rect x="${px + pw * 0.1}" y="${py + ph * 0.20}" width="${pw * 0.5}" height="${ph * 0.34}" fill="none" stroke="${accent}" stroke-width="1.4" opacity="0.8"/>
      <rect x="${px + pw * 0.1}" y="${py + ph * 0.62}" width="${pw * 0.65}" height="10" fill="${C.white}" opacity="0.5"/>
      <rect x="${px + pw * 0.1}" y="${py + ph * 0.70}" width="${pw * 0.4}" height="6" fill="${C.dim}" opacity="0.5"/>
      <rect x="${px + pw * 0.1}" y="${py + ph * 0.86}" width="${pw * 0.3}" height="6" fill="${C.dim}" opacity="0.4"/>
    ` : `
      <circle cx="${px + pw / 2}" cy="${py + ph * 0.36}" r="${pw * 0.28}" fill="none" stroke="${accent}" stroke-width="1.4"/>
      <rect x="${px + pw * 0.14}" y="${py + ph * 0.68}" width="${pw * 0.72}" height="8" fill="${C.white}" opacity="0.5"/>
      <rect x="${px + pw * 0.14}" y="${py + ph * 0.78}" width="${pw * 0.5}" height="5" fill="${C.dim}" opacity="0.5"/>
    `}
    ${regMarks(px, py, pw, ph, 12)}
    ${regMarks(48, 48, w - 96, h - 96)}
    ${techLabel(48, h - 30, 'F+Z / PRINT.PROOF', { color: C.muted })}
  `;
  return svgDoc(w, h, body);
}

function printSalon(w, h, { count = 5 } = {}) {
  const items = [
    { x: 0.06, y: 0.16, w: 0.16, h: 0.62, rot: -2 },
    { x: 0.24, y: 0.08, w: 0.19, h: 0.80, rot: 1.5 },
    { x: 0.45, y: 0.14, w: 0.17, h: 0.66, rot: -1 },
    { x: 0.64, y: 0.06, w: 0.19, h: 0.84, rot: 2 },
    { x: 0.85, y: 0.18, w: 0.13, h: 0.56, rot: -1.5 },
  ].slice(0, count);
  let out = '';
  items.forEach((it, i) => {
    const x = it.x * w, y = it.y * h, iw = it.w * w, ih = it.h * h;
    const cx = x + iw / 2, cy = y + ih / 2;
    const id = uid('g');
    const lime = i % 2 === 0;
    out += `<g transform="rotate(${it.rot} ${cx} ${cy})">
      <defs>${linearDef(id, x, y, x, y + ih, [[0, lime ? '#151d09' : '#151515', 1], [1, '#020202', 1]])}</defs>
      <rect x="${x - 4}" y="${y - 4}" width="${iw + 8}" height="${ih + 8}" fill="#000" opacity="0.5"/>
      <rect x="${x}" y="${y}" width="${iw}" height="${ih}" fill="url(#${id})" stroke="${C.lineStrong}" stroke-width="1.5"/>
      <rect x="${x + iw * 0.14}" y="${y + ih * 0.12}" width="${iw * 0.72}" height="${ih * 0.30}" fill="none" stroke="${lime ? C.lime : C.white}" stroke-width="1.2" opacity="0.85"/>
      <rect x="${x + iw * 0.14}" y="${y + ih * 0.58}" width="${iw * 0.6}" height="6" fill="${C.white}" opacity="0.5"/>
      <rect x="${x + iw * 0.14}" y="${y + ih * 0.68}" width="${iw * 0.4}" height="4" fill="${C.dim}" opacity="0.45"/>
      ${techLabel(x + 8, y + ih - 8, `PR.0${i + 1}`, { size: 9, color: C.muted, tracking: 0.5 })}
    </g>`;
  });
  return svgDoc(w, h, `${dotGrid(0, 0, w, h, 44, 1, 'rgba(255,255,255,0.03)')}${out}${regMarks(48, 48, w - 96, h - 96)}`);
}

function bannerScene(w, h) {
  const id = uid('g'), shId = uid('g');
  const bx = w * 0.30, by = h * 0.08, bw = w * 0.16, bh = h * 0.72;
  const standeeX = w * 0.55, standeeY = h * 0.24, standeeW = w * 0.13, standeeH = h * 0.56;
  const signX = w * 0.75, signY = h * 0.58, signW = w * 0.16, signH = h * 0.10;
  const body = `
    <defs>
      ${linearDef(id, 0, 0, 0, h, [[0, '#0c0f06', 1], [0.6, '#040404', 1], [1, '#000000', 1]])}
      ${radialDef(shId, bx + bw / 2, by + bh + 14, bw, [[0, '#000', 0.6], [1, '#000', 0]])}
    </defs>
    <rect width="${w}" height="${h}" fill="url(#${id})"/>
    <line x1="0" y1="${h * 0.82}" x2="${w}" y2="${h * 0.82}" stroke="${C.lineSoft}" stroke-width="1"/>
    <!-- tall banner -->
    <ellipse cx="${bx + bw / 2}" cy="${by + bh + 10}" rx="${bw * 0.6}" ry="10" fill="url(#${shId})"/>
    <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="#0a0d05" stroke="${C.lineStrong}" stroke-width="1.5"/>
    <circle cx="${bx + 8}" cy="${by + 8}" r="3" fill="none" stroke="${C.dim}" stroke-width="1"/>
    <circle cx="${bx + bw - 8}" cy="${by + 8}" r="3" fill="none" stroke="${C.dim}" stroke-width="1"/>
    <rect x="${bx + bw * 0.16}" y="${by + bh * 0.10}" width="${bw * 0.68}" height="${bh * 0.22}" fill="none" stroke="${C.lime}" stroke-width="1.4"/>
    <rect x="${bx + bw * 0.16}" y="${by + bh * 0.42}" width="${bw * 0.68}" height="4" fill="${C.white}" opacity="0.5"/>
    <rect x="${bx + bw * 0.16}" y="${by + bh * 0.50}" width="${bw * 0.4}" height="3" fill="${C.dim}" opacity="0.5"/>
    <!-- standee -->
    <rect x="${standeeX}" y="${standeeY}" width="${standeeW}" height="${standeeH}" rx="4" fill="#0a0a0a" stroke="${C.lineStrong}" stroke-width="1.5"/>
    <circle cx="${standeeX + standeeW / 2}" cy="${standeeY + standeeH * 0.32}" r="${standeeW * 0.28}" fill="none" stroke="${C.white}" stroke-width="1.2" opacity="0.7"/>
    <rect x="${standeeX + standeeW * 0.5 - 2}" y="${standeeY + standeeH}" width="4" height="18" fill="${C.lineStrong}"/>
    <!-- directional sign -->
    <rect x="${signX}" y="${signY}" width="${signW}" height="${signH}" fill="#0a0d05" stroke="${C.lime}" stroke-width="1.2"/>
    <line x1="${signX + 10}" y1="${signY + signH / 2}" x2="${signX + signW - 18}" y2="${signY + signH / 2}" stroke="${C.lime}" stroke-width="2"/>
    <polygon points="${signX + signW - 10},${signY + signH / 2} ${signX + signW - 22},${signY + signH / 2 - 7} ${signX + signW - 22},${signY + signH / 2 + 7}" fill="${C.lime}"/>
    ${regMarks(48, 48, w - 96, h - 96)}
    ${techLabel(48, h - 30, 'F+Z / ENV.LARGE-FORMAT', { color: C.muted })}
  `;
  return svgDoc(w, h, body);
}

// ------------------------------------------------------------ FILM
function filmstrip(w, h, { n = 6, mood = 'build' } = {}) {
  const pad = 40, gap = 16;
  const fw = (w - pad * 2 - gap * (n - 1)) / n;
  const fh = h * 0.62;
  const y = h * 0.5 - fh / 2;
  let out = '';
  for (let i = 0; i < n; i++) {
    const x = pad + i * (fw + gap);
    const t = i / (n - 1);
    let stop0, stop1, accentOn;
    if (mood === 'build') { stop0 = shade(0.05 + t * 0.02); stop1 = '#000'; accentOn = i === n - 1; }
    else if (mood === 'countdown') { stop0 = t > 0.7 ? '#141d06' : '#0a0a0a'; stop1 = '#000'; accentOn = i >= n - 2; }
    else if (mood === 'energy') { stop0 = i % 2 === 0 ? '#141d06' : '#111'; stop1 = '#000'; accentOn = i % 2 === 0; }
    else { stop0 = '#0d0d0d'; stop1 = '#000'; accentOn = i === Math.floor(n / 2); }
    const id = uid('g');
    out += `<defs>${linearDef(id, x, y, x, y + fh, [[0, stop0, 1], [1, stop1, 1]])}</defs>`;
    out += `<rect x="${x}" y="${y}" width="${fw}" height="${fh}" fill="url(#${id})" stroke="${C.lineStrong}" stroke-width="1.5"/>`;
    // sprocket holes
    out += `<circle cx="${x + fw / 2}" cy="${y - 14}" r="3" fill="none" stroke="${C.dim}" stroke-width="1"/>`;
    out += `<circle cx="${x + fw / 2}" cy="${y + fh + 14}" r="3" fill="none" stroke="${C.dim}" stroke-width="1"/>`;
    // simple abstract subject per mood
    const cx = x + fw / 2, cy = y + fh / 2;
    if (accentOn) {
      out += `<circle cx="${cx}" cy="${cy}" r="${fw * 0.22}" fill="none" stroke="${C.lime}" stroke-width="1.6"/>`;
      out += `<circle cx="${cx}" cy="${cy}" r="2" fill="${C.lime}"/>`;
    } else {
      out += `<line x1="${cx - fw * 0.2}" y1="${cy + fh * 0.18}" x2="${cx + fw * 0.2}" y2="${cy + fh * 0.18}" stroke="${C.white}" stroke-width="1" opacity="0.35"/>`;
      out += `<circle cx="${cx}" cy="${cy - fh * 0.05}" r="${fw * 0.14}" fill="none" stroke="${C.white}" stroke-width="1" opacity="0.4"/>`;
    }
    out += `<line x1="${x}" y1="${y + fh * 0.78}" x2="${x + fw}" y2="${y + fh * 0.78}" stroke="${C.lineSoft}" stroke-width="1"/>`;
    out += techLabel(x + 8, y + fh - 10, `${String(i + 1).padStart(2, '0')} / ${String(n).padStart(2, '0')}`, { size: 9.5, color: C.muted, tracking: 0.5 });
  }
  return svgDoc(w, h, `${out}${regMarks(48, 48, w - 96, h - 96)}`);
}
function shade(op) { return `rgba(219,255,107,${op})`; }

function postProdStrip(w, h) {
  const steps = ['RAW', 'EDIT', 'GRADE', 'SOUND', 'MOTION', 'FINAL'];
  const pad = 48, gap = 14;
  const n = steps.length;
  const fw = (w - pad * 2 - gap * (n - 1)) / n;
  const fh = h * 0.5;
  const y = h * 0.5 - fh / 2;
  let out = '';
  for (let i = 0; i < n; i++) {
    const x = pad + i * (fw + gap);
    const t = i / (n - 1);
    const id = uid('g');
    const gray = 12 + Math.round(t * 4);
    const c0 = i === 0 ? '#1a1a1a' : `rgba(219,255,107,${0.04 + t * 0.16})`;
    out += `<defs>${linearDef(id, x, y, x + fw, y + fh, [[0, i === 0 ? '#1a1a1a' : '#0c0c0c', 1], [1, '#020202', 1]])}</defs>`;
    out += `<rect x="${x}" y="${y}" width="${fw}" height="${fh}" fill="url(#${id})" stroke="${i === n - 1 ? C.lime : C.lineStrong}" stroke-width="${i === n - 1 ? 1.8 : 1.3}"/>`;
    // grading swatch bar increasing contrast/saturation left to right
    for (let s = 0; s < 5; s++) {
      const swx = x + 10 + s * (fw - 20) / 5;
      const op = i === 0 ? 0.15 : Math.min(0.15 + t * 0.7 + s * 0.03, 0.95);
      out += `<rect x="${swx}" y="${y + fh - 24}" width="${(fw - 20) / 5 - 4}" height="14" fill="${i >= 2 ? C.lime : C.white}" opacity="${op.toFixed(2)}"/>`;
    }
    if (i >= 3) {
      // waveform-ish lines for sound/motion/final
      for (let wv = 0; wv < 5; wv++) {
        const wx = x + 14 + wv * (fw - 28) / 4;
        const wh = 8 + ((wv * 7 + i * 3) % 5) * 5;
        out += `<rect x="${wx}" y="${y + fh * 0.36 - wh / 2}" width="4" height="${wh}" fill="${C.white}" opacity="0.5"/>`;
      }
    }
    out += techLabel(x + fw / 2, y - 14, steps[i], { size: 12, color: i === n - 1 ? C.lime : C.dim, anchor: 'middle', tracking: 2 });
    if (i < n - 1) out += `<polygon points="${x + fw + 3},${y + fh / 2} ${x + fw + 11},${y + fh / 2 - 5} ${x + fw + 11},${y + fh / 2 + 5}" fill="${C.muted}"/>`;
  }
  return svgDoc(w, h, `${out}${regMarks(48, 48, w - 96, h - 96)}`);
}

// -------------------------------------------------------- PHOTOGRAPHY
function contactSheet(w, h, { rows = 3, cols = 6 } = {}) {
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
      const isPick = idx % 7 === 0;
      const id = uid('g');
      out += `<defs>${linearDef(id, x, y, x, y + ch, [[0, isPick ? '#141d08' : '#101010', 1], [1, '#020202', 1]])}</defs>`;
      out += `<rect x="${x}" y="${y}" width="${cw}" height="${ch}" fill="url(#${id})" stroke="${isPick ? C.lime : C.lineStrong}" stroke-width="${isPick ? 1.6 : 1}"/>`;
      const ix = x + cw / 2, iy = y + ch / 2;
      if (kind === 'ring') out += `<circle cx="${ix}" cy="${iy}" r="${Math.min(cw, ch) * 0.24}" fill="none" stroke="${C.white}" stroke-width="1.2" opacity="0.7"/>`;
      else if (kind === 'grid') out += dotGrid(x + 6, y + 6, cw - 12, ch - 12, 12, 1, 'rgba(255,255,255,0.18)');
      else if (kind === 'diag') out += `<line x1="${x + 6}" y1="${y + ch - 6}" x2="${x + cw - 6}" y2="${y + 6}" stroke="${C.white}" stroke-width="1" opacity="0.5"/>`;
      else if (kind === 'dot') out += `<circle cx="${ix}" cy="${iy}" r="4" fill="${C.lime}"/>`;
      else if (kind === 'bars') out += [0, 1, 2].map(i => `<rect x="${ix - 14 + i * 10}" y="${iy - 10 + i * 4}" width="6" height="${20 - i * 4}" fill="${C.white}" opacity="0.6"/>`).join('');
      else if (kind === 'tri') out += `<polygon points="${ix},${iy - 12} ${ix + 12},${iy + 8} ${ix - 12},${iy + 8}" fill="none" stroke="${C.white}" stroke-width="1" opacity="0.6"/>`;
      else if (kind === 'cross') out += `<line x1="${ix - 10}" y1="${iy}" x2="${ix + 10}" y2="${iy}" stroke="${C.lime}" stroke-width="1.4"/><line x1="${ix}" y1="${iy - 10}" x2="${ix}" y2="${iy + 10}" stroke="${C.lime}" stroke-width="1.4"/>`;
      out += techLabel(x + 5, y + ch - 6, `${String(idx + 1).padStart(2, '0')}`, { size: 8, color: C.muted, tracking: 0.3 });
      if (isPick) out += `<circle cx="${x + cw - 10}" cy="${y + 10}" r="3" fill="${C.lime}"/>`;
      idx++;
    }
  }
  return svgDoc(w, h, `${out}${regMarks(48, 48, w - 96, h - 96)}`);
}

// -------------------------------------------------------------- FLOWS
function workflowPipeline(w, h, { n = 7 } = {}) {
  const pad = 60;
  const y = h * 0.5;
  const step = (w - pad * 2) / (n - 1);
  let out = `<line x1="${pad}" y1="${y}" x2="${w - pad}" y2="${y}" stroke="${C.lineSoft}" stroke-width="1"/>`;
  for (let i = 0; i < n; i++) {
    const x = pad + i * step;
    const isEdge = i === 0 || i === n - 1;
    out += `<circle cx="${x}" cy="${y}" r="${isEdge ? 24 : 20}" fill="${C.panel}" stroke="${isEdge ? C.lime : C.lineStrong}" stroke-width="1.6"/>`;
    out += `<circle cx="${x}" cy="${y}" r="3" fill="${isEdge ? C.lime : C.dim}"/>`;
    out += techLabel(x, y + 46, `0${i + 1}`, { size: 10.5, color: C.muted, anchor: 'middle' });
    if (i < n - 1) out += `<polygon points="${x + step - 34},${y} ${x + step - 44},${y - 5} ${x + step - 44},${y + 5}" fill="${C.muted}"/>`;
  }
  return svgDoc(w, h, `${out}${regMarks(48, 48, w - 96, h - 96)}`);
}

function ecosystemWeb(w, h, { n = 6 } = {}) {
  const cx = w * 0.5, cy = h * 0.52, R = h * 0.34;
  let out = '';
  const pts = [];
  for (let i = 0; i < n; i++) {
    const ang = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const px = cx + Math.cos(ang) * R, py = cy + Math.sin(ang) * R * 0.92;
    pts.push([px, py]);
    out += `<line x1="${cx}" y1="${cy}" x2="${px.toFixed(1)}" y2="${py.toFixed(1)}" stroke="${C.lineSoft}" stroke-width="1"/>`;
  }
  out += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${C.lineSoft}" stroke-width="1" stroke-dasharray="2 6"/>`;
  pts.forEach(([px, py], i) => {
    out += `<rect x="${px - 26}" y="${py - 26}" width="52" height="52" rx="6" fill="${C.panel}" stroke="${i === 0 ? C.lime : C.lineStrong}" stroke-width="1.6"/>`;
    out += `<circle cx="${px}" cy="${py}" r="3" fill="${i === 0 ? C.lime : C.dim}"/>`;
  });
  out += `<rect x="${cx - 30}" y="${cy - 30}" width="60" height="60" rx="6" fill="${C.bg}" stroke="${C.lime}" stroke-width="2"/>`;
  out += `<rect x="${cx - 18}" y="${cy - 12}" width="60" height="60" rx="6" fill="none" stroke="${C.white}" stroke-width="1.3" opacity="0.55"/>`;
  return svgDoc(w, h, `${dotGrid(0, 0, w, h, 46, 1, 'rgba(255,255,255,0.03)')}${out}${regMarks(48, 48, w - 96, h - 96)}`);
}

function fullEcosystemWall(w, h) {
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
  tiles.forEach((t, i) => {
    const x = t.x * w, y = t.y * h, tw = t.w * w, th = t.h * h;
    const id = uid('g');
    const lime = i % 3 === 0;
    out += `<defs>${linearDef(id, x, y, x, y + th, [[0, lime ? '#151d09' : '#101010', 1], [1, '#020202', 1]])}</defs>`;
    out += `<rect x="${x}" y="${y}" width="${tw}" height="${th}" fill="url(#${id})" stroke="${lime ? C.lime : C.lineStrong}" stroke-width="${lime ? 1.5 : 1}"/>`;
    const ix = x + tw / 2, iy = y + th / 2;
    if (i % 4 === 0) out += `<circle cx="${ix}" cy="${iy}" r="${Math.min(tw, th) * 0.18}" fill="none" stroke="${C.white}" stroke-width="1" opacity="0.6"/>`;
    else if (i % 4 === 1) out += `<line x1="${x + 8}" y1="${y + th - 8}" x2="${x + tw - 8}" y2="${y + 8}" stroke="${C.white}" stroke-width="1" opacity="0.4"/>`;
    else if (i % 4 === 2) out += `<rect x="${ix - 12}" y="${iy - 12}" width="24" height="24" fill="none" stroke="${C.lime}" stroke-width="1.2" opacity="0.7"/>`;
    out += techLabel(x + 6, y + th - 6, `EC.${String(i + 1).padStart(2, '0')}`, { size: 8.5, color: C.muted, tracking: 0.3 });
  });
  return svgDoc(w, h, `${out}${regMarks(48, 48, w - 96, h - 96)}`);
}

function coverHero(w, h) {
  const cx = w * 0.5, cy = h * 0.46;
  const id = uid('g');
  let rings = '';
  for (let i = 0; i < 5; i++) {
    rings += `<circle cx="${cx}" cy="${cy}" r="${140 + i * 110}" fill="none" stroke="${i === 2 ? C.lime : C.lineSoft}" stroke-width="${i === 2 ? 1.4 : 1}" opacity="${0.5 - i * 0.07}"/>`;
  }
  const body = `
    <defs>${radialDef(id, cx, cy, w * 0.65, [[0, C.lime, 0.20], [0.5, C.lime, 0.05], [1, C.lime, 0]])}</defs>
    <rect width="${w}" height="${h}" fill="url(#${id})"/>
    ${dotGrid(0, 0, w, h, 36, 1, 'rgba(255,255,255,0.05)')}
    ${rings}
    <rect x="${cx - 46}" y="${cy - 46}" width="88" height="88" rx="8" fill="none" stroke="${C.white}" stroke-width="1.4" opacity="0.45"/>
    <rect x="${cx - 30}" y="${cy - 30}" width="88" height="88" rx="8" fill="none" stroke="${C.white}" stroke-width="1.4" opacity="0.65"/>
    <rect x="${cx - 14}" y="${cy - 14}" width="88" height="88" rx="8" fill="none" stroke="${C.lime}" stroke-width="1.8"/>
    ${regMarks(48, 48, w - 96, h - 96)}
    ${techLabel(48, h - 30, 'F+Z / 001', { color: C.muted })}
    ${techLabel(w - 48, h - 30, 'EST. INTELLIGENCE', { anchor: 'end', color: C.muted })}
  `;
  return svgDoc(w, h, body);
}

module.exports = {
  C, svgDoc, heroGradient, aiWorld, screenWall, screenGrid, tunnel, ceilingGrid,
  multiScreenCluster, posterMockup, printSalon, bannerScene, filmstrip,
  postProdStrip, contactSheet, workflowPipeline, ecosystemWeb, fullEcosystemWall,
  coverHero, screenTile, frameTile,
};

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const S = require('./scenes');

const OUT = path.join(__dirname, 'assets');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const FW = 1920, FH = 1080; // full-bleed 16:9 @144dpi = 13.33x7.5in

async function save(name, svg) {
  await sharp(Buffer.from(svg)).png().toFile(path.join(OUT, name));
}

async function tiles(prefix, n, w, h, fn) {
  for (let i = 0; i < n; i++) await save(`${prefix}-${i + 1}.png`, fn(i));
}

async function main() {
  await save('01-cover.png', S.coverHero(FW, FH));
  await save('02-ecosystem-web.png', S.ecosystemWeb(1500, 1150, { n: 7 }));
  await save('03-kv-1.png', S.posterMockup(760, 1040, { tone: 'lime', variant: 'title', standalone: true }));
  await save('03-kv-2.png', S.posterMockup(760, 1040, { tone: 'white', variant: 'circle', standalone: true }));
  await save('03-kv-3.png', S.posterMockup(760, 1040, { tone: 'lime', variant: 'circle', standalone: true }));
  await save('03-kv-4.png', S.posterMockup(760, 1040, { tone: 'white', variant: 'title', standalone: true }));
  await save('04-print-salon.png', S.printSalon(1920, 460, { count: 5 }));
  await save('05-banner-scene.png', S.bannerScene(1920, 460));
  await save('06-ecosystem-web-2.png', S.ecosystemWeb(1500, 1150, { n: 6 }));
  await save('07-stage-main.png', S.screenWall(1920, 1200, { content: 'bars', label: 'MAIN STAGE' }));

  // 08 — LED screen states: 8 individual tiles
  const icons08 = ['lines', 'ring', 'bars', 'cross', 'arrow', 'grid', 'dot', 'tri'];
  await tiles('08-tile', 8, 480, 460, (i) => S.screenTile(480, 460, { icon: icons08[i], lime: i === 0 || i === 6 }));

  await save('09-tunnel.png', S.tunnel(1920, 1200, { n: 7 }));
  await save('10-ceiling.png', S.ceilingGrid(1920, 1200));
  await save('11-multiscreen.png', S.multiScreenCluster(1920, 1200));

  // 12 Motion graphics — 6 tiles
  await tiles('12-tile', 6, 520, 620, (i) => S.frameTile(520, 620, { mood: 'mixed', idx: i, n: 6, accentOn: i === 4 }));
  // 13 Teaser films — 5 tiles
  await tiles('13-tile', 5, 560, 700, (i) => S.frameTile(560, 700, { mood: 'build', idx: i, n: 5, accentOn: i === 4 }));
  // 14 Countdown — 5 tiles
  await tiles('14-tile', 5, 560, 700, (i) => S.frameTile(560, 700, { mood: 'countdown', idx: i, n: 5, accentOn: i >= 3 }));
  // 15 Opening film — 6 tiles
  await tiles('15-tile', 6, 480, 620, (i) => S.frameTile(480, 620, { mood: 'build', idx: i, n: 6, accentOn: i === 5 }));
  // 16 Aftermovie — 6 tiles
  await tiles('16-tile', 6, 480, 460, (i) => S.frameTile(480, 460, { mood: 'energy', idx: i, n: 6, accentOn: i === 5 }));
  // 17 Explainer — 5 tiles
  await tiles('17-tile', 5, 560, 500, (i) => S.frameTile(560, 500, { mood: 'mixed', idx: i, n: 5, accentOn: i === 4 }));
  // 18 Brand/story films — 6 tiles
  await tiles('18-tile', 6, 480, 620, (i) => S.frameTile(480, 620, { mood: 'mixed', idx: i, n: 6, accentOn: i % 2 === 0 }));

  await save('19-postprod.png', S.postProdStrip(1920, 1000));

  // 20 Animation — 6 tiles
  await tiles('20-tile', 6, 480, 460, (i) => S.frameTile(480, 460, { mood: 'mixed', idx: i, n: 6, accentOn: i === 3 }));

  await save('21-contact-sheet.png', S.contactSheet(1920, 1150, { rows: 3, cols: 7 }));
  await save('22-ai-hero.png', S.aiWorld(1920, 1200, { seed: 3 }));
  await save('22-ai-hero-2.png', S.aiWorld(1300, 1300, { seed: 7 }));

  // 23 AI video — 4 tiles
  await tiles('23-tile', 4, 560, 700, (i) => S.frameTile(560, 700, { mood: 'build', idx: i, n: 4, accentOn: i === 3 }));

  await save('24-pipeline.png', S.workflowPipeline(1920, 700, { n: 7 }));
  await save('25-full-ecosystem.png', S.fullEcosystemWall(1920, 1200));
  await save('26-close.png', S.heroGradient(1920, 1080, { pos: 'center', tone: 'lime', dense: true }));
  console.log('done');
}
main().catch(e => { console.error(e); process.exit(1); });

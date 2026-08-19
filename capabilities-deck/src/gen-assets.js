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
  await save('01-cover.png', S.coverHero(FW, FH, { theme: 'dark', tag: '5.0 / 001' }));
  await save('02-ecosystem-web.png', S.ecosystemWeb(1500, 1150, { theme: 'light', n: 7 }));

  await save('03-kv-1.png', S.posterMockup(760, 1040, { theme: 'light', variant: 'title', dark: false }));
  await save('03-kv-2.png', S.posterMockup(760, 1040, { theme: 'light', variant: 'circle', dark: true }));
  await save('03-kv-3.png', S.posterMockup(760, 1040, { theme: 'light', variant: 'circle', dark: false, dotAccent: true }));
  await save('03-kv-4.png', S.posterMockup(760, 1040, { theme: 'light', variant: 'title', dark: true }));

  await save('04-print-salon.png', S.printSalon(1920, 460, { theme: 'light', count: 5 }));
  await save('05-banner-scene.png', S.bannerScene(1920, 460, { theme: 'light' }));
  await save('06-ecosystem-web-2.png', S.ecosystemWeb(1500, 1150, { theme: 'light', n: 6 }));
  await save('07-stage-main.png', S.screenWall(1920, 1200, { theme: 'dark', label: 'MAIN STAGE' }));

  const icons08 = ['lines', 'ring', 'bars', 'cross', 'arrow', 'grid', 'dot', 'tri'];
  await tiles('08-tile', 8, 480, 460, (i) => S.screenTile(480, 460, { theme: 'dark', icon: icons08[i], dotAccent: i === 6 }));

  await save('09-tunnel.png', S.tunnel(1920, 1200, { theme: 'dark', n: 7 }));
  await save('10-ceiling.png', S.ceilingGrid(1920, 1200, { theme: 'dark' }));
  await save('11-multiscreen.png', S.multiScreenCluster(1920, 1200, { theme: 'light' }));

  await tiles('12-tile', 6, 520, 620, (i) => S.frameTile(520, 620, { theme: 'light', idx: i, n: 6, accentOn: i === 4 }));
  await tiles('13-tile', 5, 560, 700, (i) => S.frameTile(560, 700, { theme: 'light', idx: i, n: 5, accentOn: i === 4 }));
  await tiles('14-tile', 5, 560, 700, (i) => S.frameTile(560, 700, { theme: 'light', idx: i, n: 5, accentOn: i >= 3 }));
  await tiles('15-tile', 6, 480, 620, (i) => S.frameTile(480, 620, { theme: 'light', idx: i, n: 6, accentOn: i === 5 }));
  await tiles('16-tile', 6, 480, 460, (i) => S.frameTile(480, 460, { theme: 'light', idx: i, n: 6, accentOn: i === 5 }));
  await tiles('17-tile', 5, 560, 500, (i) => S.frameTile(560, 500, { theme: 'light', idx: i, n: 5, accentOn: i === 4 }));
  await tiles('18-tile', 6, 480, 620, (i) => S.frameTile(480, 620, { theme: 'light', idx: i, n: 6, accentOn: i % 2 === 0 }));

  await save('19-postprod.png', S.postProdStrip(1920, 1000, { theme: 'light' }));

  await tiles('20-tile', 6, 480, 460, (i) => S.frameTile(480, 460, { theme: 'light', idx: i, n: 6, accentOn: i === 3 }));

  await save('21-contact-sheet.png', S.contactSheet(1920, 1150, { theme: 'light', rows: 3, cols: 7 }));
  await save('22-ai-hero.png', S.aiWorld(1920, 1200, { theme: 'dark', seed: 3 }));

  await tiles('23-tile', 4, 560, 700, (i) => S.frameTile(560, 700, { theme: 'light', idx: i, n: 4, accentOn: i === 3 }));

  await save('24-pipeline.png', S.workflowPipeline(1920, 700, { theme: 'light', n: 7 }));
  await save('25-full-ecosystem.png', S.fullEcosystemWall(1920, 1200, { theme: 'light' }));
  await save('26-close.png', S.coverHero(FW, FH, { theme: 'dark', tag: '5.0 / 026' }));
  console.log('done');
}
main().catch(e => { console.error(e); process.exit(1); });

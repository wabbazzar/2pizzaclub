// render-logo.mjs — render a logo animation preset to transparent PNG frames.
//   node render-logo.mjs <preset> [--probe] [--dur 3.4] [--logo path] [--out dir]
// presets: bounce spray wipe iris drop spin glitch stamp
import { chromium } from 'playwright';
import { readFileSync, mkdirSync, rmSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const a = process.argv.slice(2);
const preset = a.find(x => !x.startsWith('--')) || 'spray';
const probe = a.includes('--probe');
const arg = (k, d) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : d; };
const FPS = 30, DUR = parseFloat(arg('--dur', '3.4'));
const logoPath = arg('--logo', join(__dir, 'logo.png'));
const outDir = arg('--out', join(__dir, 'frames', preset));
const logo = `data:image/png;base64,${readFileSync(logoPath).toString('base64')}`;
const html = readFileSync(join(__dir, 'logo-scene.html'), 'utf8').replaceAll('%%LOGO%%', logo);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1080 }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForFunction(() => window.__ready === true);
await page.evaluate((p) => window.setPreset(p), preset);

if (probe) {
  const dir = join(__dir, 'work/probe'); rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
  for (const t of [0.25, 0.6, 1.0, 1.8, 3.2]) {
    await page.evaluate((tt) => window.render(tt), t); await page.waitForTimeout(20);
    await page.screenshot({ path: join(dir, `${preset}_${String(t).replace('.', '_')}.png`), omitBackground: true });
  }
  console.log('probe', preset);
} else {
  rmSync(outDir, { recursive: true, force: true }); mkdirSync(outDir, { recursive: true });
  const N = Math.round(DUR * FPS);
  for (let f = 0; f < N; f++) {
    await page.evaluate((tt) => window.render(tt), f / FPS);
    await page.screenshot({ path: join(outDir, `f${String(f).padStart(4, '0')}.png`), omitBackground: true });
  }
  console.log('done', preset, N, 'frames ->', outDir);
}
await browser.close();

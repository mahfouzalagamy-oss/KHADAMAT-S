// يحوّل صور src/assets/images من JPG/PNG إلى WebP بحجم أصغر، ويحدّث المراجع في الكود.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const dir = 'src/assets/images';
const files = fs.readdirSync(dir).filter((f) => /\.(jpe?g|png)$/i.test(f));
let before = 0;
let after = 0;
for (const f of files) {
  const src = path.join(dir, f);
  const out = path.join(dir, f.replace(/\.(jpe?g|png)$/i, '.webp'));
  before += fs.statSync(src).size;
  await sharp(src).resize({ width: 1280, withoutEnlargement: true }).webp({ quality: 78 }).toFile(out);
  after += fs.statSync(out).size;
  fs.unlinkSync(src);
  for (const root of ['src', 'index.html']) {
    const walk = (p) => {
      if (fs.statSync(p).isDirectory()) return fs.readdirSync(p).forEach((n) => walk(path.join(p, n)));
      if (!/\.(tsx?|html|css)$/.test(p)) return;
      const text = fs.readFileSync(p, 'utf-8');
      if (text.includes(f)) fs.writeFileSync(p, text.split(f).join(path.basename(out)));
    };
    if (fs.existsSync(root)) walk(root);
  }
}
console.log(`${files.length} صور: ${(before / 1048576).toFixed(1)}MB → ${(after / 1048576).toFixed(1)}MB`);

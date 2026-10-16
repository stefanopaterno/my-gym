// Genera le icone PNG da public/icon.svg:  node scripts/icons.mjs
import sharp from 'sharp';
const svg = 'public/icon.svg';
for (const [name, size] of [['icon-v2-192', 192], ['icon-v2-512', 512], ['apple-touch-icon-v2', 180]]) {
  await sharp(svg, { density: 300 }).resize(size, size).png().toFile(`public/${name}.png`);
}

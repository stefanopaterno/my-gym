// Genera le icone PNG da public/icon.svg:  node scripts/icons.mjs
import sharp from 'sharp';
const svg = 'public/icon.svg';
for (const [name, size] of [['icon-v3-192', 192], ['icon-v3-512', 512], ['apple-touch-icon-v3', 180]]) {
  await sharp(svg, { density: 300 }).resize(size, size).png().toFile(`public/${name}.png`);
}

// Genera le icone PNG da public/icon.svg:  node scripts/icons.mjs
import sharp from 'sharp';
const svg = 'public/icon.svg';
for (const [name, size] of [['icon-192', 192], ['icon-512', 512], ['apple-touch-icon', 180]]) {
  await sharp(svg, { density: 300 }).resize(size, size).png().toFile(`public/${name}.png`);
}

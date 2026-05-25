const sharp = require('sharp');
const path = require('path');
const publicDir = path.join(process.cwd(), 'public');

const svgSource = `<svg width="192" height="192" xmlns="http://www.w3.org/2000/svg">
  <rect width="192" height="192" fill="#FBFaf7" rx="40"/>
  <circle cx="96" cy="96" r="56" fill="none" stroke="#E5DED4" stroke-width="2"/>
  <circle cx="96" cy="96" r="6" fill="#CC6543"/>
  <line x1="96" y1="40" x2="96" y2="90" stroke="#CC6543" stroke-width="4" stroke-linecap="round"/>
  <line x1="96" y1="102" x2="96" y2="152" stroke="#6B6661" stroke-width="3" stroke-linecap="round"/>
  <line x1="40" y1="96" x2="90" y2="96" stroke="#6B6661" stroke-width="3" stroke-linecap="round"/>
  <line x1="102" y1="96" x2="152" y2="96" stroke="#6B6661" stroke-width="3" stroke-linecap="round"/>
  <polygon points="96,34 91,50 96,44 101,50" fill="#CC6543"/>
</svg>`;

sharp(Buffer.from(svgSource))
  .resize(192, 192)
  .png()
  .toFile(path.join(publicDir, 'icon-192.png'))
  .then(() => console.log('icon-192.png OK'))
  .catch(e => console.error('192 error:', e));

sharp(Buffer.from(svgSource))
  .resize(512, 512)
  .png()
  .toFile(path.join(publicDir, 'icon-512.png'))
  .then(() => console.log('icon-512.png OK'))
  .catch(e => console.error('512 error:', e));

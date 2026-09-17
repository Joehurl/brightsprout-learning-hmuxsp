const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

function flattenAlpha(inputPath) {
  const data = fs.readFileSync(inputPath);
  const png = PNG.sync.read(data);

  if (!png.alpha) {
    console.log(`${inputPath}: no alpha channel, skipping`);
    return;
  }

  console.log(`${inputPath}: flattening alpha onto white background (${png.width}x${png.height})`);

  // Composite onto white background
  for (let i = 0; i < png.data.length; i += 4) {
    const a = png.data[i + 3] / 255;
    png.data[i]     = Math.round(png.data[i]     * a + 255 * (1 - a)); // R
    png.data[i + 1] = Math.round(png.data[i + 1] * a + 255 * (1 - a)); // G
    png.data[i + 2] = Math.round(png.data[i + 2] * a + 255 * (1 - a)); // B
    png.data[i + 3] = 255; // A = fully opaque
  }

  // Write back without alpha
  const out = PNG.sync.write(png, { colorType: 2 }); // colorType 2 = RGB (no alpha)
  fs.writeFileSync(inputPath, out);
  console.log(`${inputPath}: saved as fully opaque PNG`);
}

// eslint-disable-next-line no-undef
const ROOT = typeof __dirname !== 'undefined' ? path.join(__dirname, '..') : process.cwd();

const assets = [
  path.join(ROOT, 'assets', 'icon.png'),
  path.join(ROOT, 'assets', 'splash-icon.png'),
];

for (const asset of assets) {
  if (fs.existsSync(asset)) {
    flattenAlpha(asset);
  } else {
    console.log(`${asset}: file not found, skipping`);
  }
}

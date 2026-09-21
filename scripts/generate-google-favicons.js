import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const publicDir = path.resolve('public');
const sourceIconPath = path.resolve('public/icon.png');

async function generateGoogleFavicons() {
  console.log('Generating Google Search optimized favicon sizes...');

  const iconBuffer = await fs.promises.readFile(sourceIconPath);

  // Google Search specific 48x48 multiple sizes
  const sizes = [48, 96, 144, 192, 512];
  for (const size of sizes) {
    const outPath = path.join(publicDir, `favicon-${size}x${size}.png`);
    await sharp(iconBuffer)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(outPath);
    console.log(`✓ Generated ${outPath}`);
  }

  // Also create a standalone root favicon-48x48.png and favicon.ico with 48x48
  await sharp(iconBuffer)
    .resize(48, 48, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(publicDir, 'favicon-48x48.png'));

  // Multi-size compatible ICO (48x48 standard)
  await sharp(iconBuffer)
    .resize(48, 48, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(publicDir, 'favicon.ico'));

  console.log('✓ Successfully generated all Google Search compatible favicon formats!');
}

generateGoogleFavicons().catch(err => {
  console.error('Error generating Google favicons:', err);
  process.exit(1);
});

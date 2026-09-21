import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const publicDir = path.resolve('public');
const sourceIconPath = path.resolve('icon.png');

async function processUserIcon() {
  console.log('Processing real user icon from', sourceIconPath);

  if (!fs.existsSync(sourceIconPath)) {
    throw new Error('icon.png does not exist at root');
  }

  // 1. Create a high quality trimmed or padded square icon (512x512)
  const trimmed = sharp(sourceIconPath).trim();

  // Create square 512x512 with transparent background
  const square512Buffer = await trimmed
    .resize(512, 512, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toBuffer();

  // Save public/icon.png
  await fs.promises.writeFile(path.join(publicDir, 'icon.png'), square512Buffer);
  console.log('✓ public/icon.png (512x512 square) generated');

  // 2. Generate Favicon variants
  // 192x192
  await sharp(square512Buffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));
  console.log('✓ public/favicon.png (192x192) generated');

  // 180x180 Apple Touch Icon (rounded dark slate bg for iOS)
  const appleTouchBuffer = await sharp({
    create: {
      width: 180,
      height: 180,
      channels: 4,
      background: { r: 11, g: 17, b: 32, alpha: 1 }
    }
  })
    .composite([
      {
        input: await sharp(square512Buffer).resize(140, 140, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer(),
        gravity: 'center'
      }
    ])
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('✓ public/apple-touch-icon.png (180x180) generated');

  // 32x32 Favicon
  await sharp(square512Buffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon-32x32.png'));
  console.log('✓ public/favicon-32x32.png generated');

  // 16x16 Favicon
  await sharp(square512Buffer)
    .resize(16, 16)
    .png()
    .toFile(path.join(publicDir, 'favicon-16x16.png'));
  console.log('✓ public/favicon-16x16.png generated');

  // favicon.ico
  await sharp(square512Buffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon.ico'));
  console.log('✓ public/favicon.ico generated');

  // 3. Generate high-res 1200x630 OpenGraph / Social Share Logo (public/logo.png)
  const base64Icon = square512Buffer.toString('base64');
  const logoSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <radialGradient id="logoBg" cx="50%" cy="40%" r="75%">
      <stop offset="0%" stop-color="#111B30" />
      <stop offset="65%" stop-color="#080D18" />
      <stop offset="100%" stop-color="#03060B" />
    </radialGradient>

    <linearGradient id="logoNeon" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00F2FE" />
      <stop offset="50%" stop-color="#28B9FF" />
      <stop offset="100%" stop-color="#0D6EFD" />
    </linearGradient>

    <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="70%" stop-color="#F1F5F9" />
      <stop offset="100%" stop-color="#CBD5E1" />
    </linearGradient>

    <linearGradient id="badgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0D6EFD" stop-opacity="0.35" />
      <stop offset="100%" stop-color="#28B9FF" stop-opacity="0.1" />
    </linearGradient>

    <filter id="logoGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="16" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>

    <filter id="iconShadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="12" stdDeviation="24" flood-color="#0D6EFD" flood-opacity="0.6" />
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#logoBg)" />

  <!-- Ambient Light Orbs -->
  <circle cx="280" cy="315" r="240" fill="#0D6EFD" opacity="0.18" filter="blur(70px)" />
  <circle cx="950" cy="220" r="200" fill="#00F2FE" opacity="0.12" filter="blur(60px)" />

  <!-- Real Icon Visual Container -->
  <g transform="translate(100, 145)" filter="url(#iconShadow)">
    <rect width="340" height="340" rx="48" fill="#0B1120" stroke="url(#logoNeon)" stroke-width="3" fill-opacity="0.8" />
    <image href="data:image/png;base64,${base64Icon}" x="25" y="25" width="290" height="290" preserveAspectRatio="xMidYMid meet" />
  </g>

  <!-- Brand Typography & Copy -->
  <g transform="translate(480, 235)">
    <!-- Pill Tag -->
    <rect x="0" y="-70" width="210" height="36" rx="18" fill="url(#badgeGrad)" stroke="#28B9FF" stroke-opacity="0.5" stroke-width="1.5" />
    <text x="105" y="-46" fill="#38BDF8" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="800" text-anchor="middle" letter-spacing="2">OFFICIAL STORE</text>

    <!-- Main Name -->
    <text x="0" y="30" fill="url(#textGrad)" font-family="system-ui, -apple-system, sans-serif" font-size="64" font-weight="900" letter-spacing="-1">
      Zohaib <tspan fill="url(#logoNeon)">DigiForge</tspan>
    </text>

    <!-- Tagline -->
    <text x="0" y="82" fill="#94A3B8" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="500" letter-spacing="0.2">
      Digital Resources, Courses &amp; Pro Tools — Flat Rs. 279 / $1
    </text>

    <!-- Trust Badges -->
    <g transform="translate(0, 125)">
      <rect x="0" y="0" width="165" height="36" rx="10" fill="#1E293B" stroke="#334155" stroke-width="1" />
      <text x="82" y="23" fill="#38BDF8" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="700" text-anchor="middle">⚡ Instant Delivery</text>

      <rect x="180" y="0" width="180" height="36" rx="10" fill="#1E293B" stroke="#334155" stroke-width="1" />
      <text x="270" y="23" fill="#4ADE80" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="700" text-anchor="middle">✓ Verified &amp; Tested</text>

      <rect x="375" y="0" width="190" height="36" rx="10" fill="#1E293B" stroke="#334155" stroke-width="1" />
      <text x="470" y="23" fill="#F472B6" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="700" text-anchor="middle">🔒 JazzCash &amp; Crypto</text>
    </g>
  </g>
</svg>
`;

  await sharp(Buffer.from(logoSvg))
    .resize(1200, 630)
    .png()
    .toFile(path.join(publicDir, 'logo.png'));
  console.log('✓ public/logo.png (1200x630 OpenGraph card) generated with real icon');

  console.log('🎉 All assets successfully updated with real user icon!');
}

processUserIcon().catch(err => {
  console.error('Error applying user icon:', err);
  process.exit(1);
});

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const publicDir = path.resolve('public');
const sourceLogoPath = path.resolve('Logo.png');

async function processUserLogo() {
  console.log('Processing real user logo from', sourceLogoPath);

  if (!fs.existsSync(sourceLogoPath)) {
    throw new Error('Logo.png does not exist at root');
  }

  // 1. Generate 1200x1200 high-res crisp circular Logo.png & logo.png
  const logoBuffer = await sharp(sourceLogoPath)
    .resize(1200, 1200, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  await fs.promises.writeFile(path.join(publicDir, 'Logo.png'), logoBuffer);
  await fs.promises.writeFile(path.join(publicDir, 'logo.png'), logoBuffer);
  console.log('✓ public/Logo.png and public/logo.png (1200x1200) generated');

  // 2. Generate 512x512 square logo badge
  const logo512Buffer = await sharp(sourceLogoPath)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  await fs.promises.writeFile(path.join(publicDir, 'logo-512.png'), logo512Buffer);
  console.log('✓ public/logo-512.png generated');

  // 3. Generate Social OpenGraph Card (1200x630) with the new official Logo Badge
  const base64Logo = logo512Buffer.toString('base64');
  const ogCardSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <radialGradient id="ogBg" cx="50%" cy="40%" r="75%">
      <stop offset="0%" stop-color="#111B30" />
      <stop offset="65%" stop-color="#080D18" />
      <stop offset="100%" stop-color="#03060B" />
    </radialGradient>

    <linearGradient id="neonCyan" x1="0%" y1="0%" x2="100%" y2="100%">
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

    <filter id="logoShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="28" flood-color="#0D6EFD" flood-opacity="0.65" />
    </filter>
  </defs>

  <!-- Background Canvas -->
  <rect width="1200" height="630" fill="url(#ogBg)" />

  <!-- Ambient Light Orbs -->
  <circle cx="280" cy="315" r="260" fill="#0D6EFD" opacity="0.22" filter="blur(80px)" />
  <circle cx="980" cy="220" r="220" fill="#00F2FE" opacity="0.14" filter="blur(70px)" />

  <!-- Official Logo Badge -->
  <g transform="translate(80, 105)" filter="url(#logoShadow)">
    <image href="data:image/png;base64,${base64Logo}" x="0" y="0" width="420" height="420" preserveAspectRatio="xMidYMid meet" />
  </g>

  <!-- Typography & Store Features -->
  <g transform="translate(540, 215)">
    <!-- Pill Tag -->
    <rect x="0" y="-55" width="220" height="38" rx="19" fill="url(#badgeGrad)" stroke="#28B9FF" stroke-opacity="0.5" stroke-width="1.5" />
    <text x="110" y="-31" fill="#38BDF8" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="800" text-anchor="middle" letter-spacing="2">OFFICIAL STORE</text>

    <!-- Main Title -->
    <text x="0" y="45" fill="url(#textGrad)" font-family="system-ui, -apple-system, sans-serif" font-size="64" font-weight="900" letter-spacing="-1">
      Zohaib <tspan fill="url(#neonCyan)">DigiForge</tspan>
    </text>

    <!-- Subtitle / Tagline -->
    <text x="0" y="98" fill="#94A3B8" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="500" letter-spacing="0.2">
      Empowering Learning. Powering Success.
    </text>
    <text x="0" y="132" fill="#38BDF8" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="700">
      Flat Rs. 279 / $1 per Digital Resource &amp; Pro Tool
    </text>

    <!-- Trust Badges -->
    <g transform="translate(0, 170)">
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

  await sharp(Buffer.from(ogCardSvg))
    .resize(1200, 630)
    .png()
    .toFile(path.join(publicDir, 'og-card.png'));
  console.log('✓ public/og-card.png (1200x630) generated with official circular Logo');

  console.log('🎉 Official Logo.png and all related brand graphics successfully updated!');
}

processUserLogo().catch(err => {
  console.error('Error applying user logo:', err);
  process.exit(1);
});

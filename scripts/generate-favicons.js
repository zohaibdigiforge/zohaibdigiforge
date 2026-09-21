import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Vector SVG for Icon / Favicon (512x512)
const iconSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Background Gradient -->
    <radialGradient id="bgGrad" cx="50%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#141E33" />
      <stop offset="60%" stop-color="#0B1120" />
      <stop offset="100%" stop-color="#050811" />
    </radialGradient>

    <!-- Electric Cyan Gradient -->
    <linearGradient id="neonCyan" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00F2FE" />
      <stop offset="45%" stop-color="#28B9FF" />
      <stop offset="100%" stop-color="#0D6EFD" />
    </linearGradient>

    <!-- Spark Flame Gradient -->
    <linearGradient id="sparkGrad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0D6EFD" />
      <stop offset="50%" stop-color="#28B9FF" />
      <stop offset="100%" stop-color="#FFFFFF" />
    </linearGradient>

    <!-- Border Stroke Gradient -->
    <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#28B9FF" stop-opacity="0.8" />
      <stop offset="50%" stop-color="#0D6EFD" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#28B9FF" stop-opacity="0.6" />
    </linearGradient>

    <!-- Ambient Glow Filter -->
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="16" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>

    <!-- Soft Drop Shadow -->
    <filter id="shadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#0D6EFD" flood-opacity="0.45" />
    </filter>
  </defs>

  <!-- Base Squircle Container -->
  <rect x="20" y="20" width="472" height="472" rx="128" fill="url(#bgGrad)" stroke="url(#borderGrad)" stroke-width="6" />

  <!-- Inner Ambient Glow Circle -->
  <circle cx="256" cy="256" r="160" fill="#0D6EFD" opacity="0.12" filter="blur(40px)" />
  <circle cx="256" cy="220" r="90" fill="#28B9FF" opacity="0.18" filter="blur(30px)" />

  <!-- Main DigiForge "D" & Cyber Anvil / Spark Symbol -->
  <g filter="url(#shadow)">
    <!-- Outer Arc of "D" -->
    <path d="M 170 120 
             L 260 120 
             C 345 120, 395 170, 395 256 
             C 395 342, 345 392, 260 392 
             L 170 392 
             Z" 
          fill="none" 
          stroke="url(#neonCyan)" 
          stroke-width="36" 
          stroke-linecap="round" 
          stroke-linejoin="round" />

    <!-- Center Forge Anvil / Cyber Energy Core -->
    <path d="M 170 190 
             L 245 190 
             C 285 190, 315 215, 315 256 
             C 315 297, 285 322, 245 322 
             L 170 322 
             Z" 
          fill="none" 
          stroke="url(#borderGrad)" 
          stroke-width="14" 
          stroke-opacity="0.6" />

    <!-- Central Glowing Forge Spark & Lightning Diamond -->
    <path d="M 235 150 
             L 275 256 
             L 230 256 
             L 260 350 
             L 210 270 
             L 245 270 
             Z" 
          fill="url(#sparkGrad)" 
          filter="url(#glow)" />

    <!-- Forge Spark Accents -->
    <circle cx="340" cy="180" r="8" fill="#00F2FE" filter="url(#glow)" />
    <circle cx="360" cy="310" r="6" fill="#28B9FF" filter="url(#glow)" />
    <polygon points="256,92 262,108 278,114 262,120 256,136 250,120 234,114 250,108" fill="#FFFFFF" opacity="0.9" />
  </g>
</svg>
`;

// 2. Full Horizontal Brand Logo SVG (1200x630) for /logo.png & OpenGraph
const logoSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <radialGradient id="logoBg" cx="50%" cy="40%" r="70%">
      <stop offset="0%" stop-color="#111A2E" />
      <stop offset="70%" stop-color="#090E1A" />
      <stop offset="100%" stop-color="#04070D" />
    </radialGradient>

    <linearGradient id="logoNeon" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00F2FE" />
      <stop offset="50%" stop-color="#28B9FF" />
      <stop offset="100%" stop-color="#0D6EFD" />
    </linearGradient>

    <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="70%" stop-color="#E2E8F0" />
      <stop offset="100%" stop-color="#94A3B8" />
    </linearGradient>

    <linearGradient id="badgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0D6EFD" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#28B9FF" stop-opacity="0.1" />
    </linearGradient>

    <filter id="logoShadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#0D6EFD" flood-opacity="0.5" />
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#logoBg)" />

  <!-- Ambient Light Orb -->
  <circle cx="280" cy="315" r="220" fill="#0D6EFD" opacity="0.15" filter="blur(60px)" />
  <circle cx="950" cy="200" r="180" fill="#28B9FF" opacity="0.1" filter="blur(50px)" />

  <!-- Left Icon Mark -->
  <g transform="translate(140, 155) scale(0.62)" filter="url(#logoShadow)">
    <rect x="20" y="20" width="472" height="472" rx="120" fill="#0B1120" stroke="url(#logoNeon)" stroke-width="8" />
    <path d="M 170 120 L 260 120 C 345 120, 395 170, 395 256 C 395 342, 345 392, 260 392 L 170 392 Z" 
          fill="none" stroke="url(#logoNeon)" stroke-width="36" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M 235 150 L 275 256 L 230 256 L 260 350 L 210 270 L 245 270 Z" fill="#00F2FE" />
  </g>

  <!-- Brand Typography -->
  <g transform="translate(500, 245)">
    <!-- Pre-tag Pill -->
    <rect x="0" y="-80" width="220" height="38" rx="19" fill="url(#badgeGrad)" stroke="#28B9FF" stroke-opacity="0.4" stroke-width="1.5" />
    <text x="110" y="-55" fill="#28B9FF" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="800" text-anchor="middle" letter-spacing="2">DIGITAL STORE</text>

    <!-- Main Title -->
    <text x="0" y="20" fill="url(#textGrad)" font-family="system-ui, -apple-system, sans-serif" font-size="68" font-weight="900" letter-spacing="-1">
      Zohaib <tspan fill="url(#logoNeon)">DigiForge</tspan>
    </text>

    <!-- Subtitle / Tagline -->
    <text x="0" y="75" fill="#94A3B8" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="500" letter-spacing="0.5">
      Premium Digital Resources &amp; Pro Tools — Flat Rs. 279 / $1
    </text>

    <!-- Trust Badges -->
    <g transform="translate(0, 115)">
      <rect x="0" y="0" width="160" height="34" rx="8" fill="#1E293B" />
      <text x="80" y="22" fill="#38BDF8" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="700" text-anchor="middle">⚡ Instant Delivery</text>

      <rect x="175" y="0" width="180" height="34" rx="8" fill="#1E293B" />
      <text x="265" y="22" fill="#4ADE80" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="700" text-anchor="middle">✓ Verified &amp; Tested</text>

      <rect x="370" y="0" width="180" height="34" rx="8" fill="#1E293B" />
      <text x="460" y="22" fill="#F472B6" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="700" text-anchor="middle">🔒 JazzCash &amp; Crypto</text>
    </g>
  </g>
</svg>
`;

async function generateAssets() {
  console.log('Generating vector and high-res image assets...');

  // Save SVGs
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), iconSvg);
  fs.writeFileSync(path.join(publicDir, 'logo.svg'), logoSvg);
  console.log('✓ favicon.svg and logo.svg created');

  const iconBuffer = Buffer.from(iconSvg);
  const logoBuffer = Buffer.from(logoSvg);

  // 1. /icon.png (512x512)
  await sharp(iconBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon.png'));
  console.log('✓ icon.png (512x512) generated');

  // 2. /logo.png (1200x630)
  await sharp(logoBuffer)
    .resize(1200, 630)
    .png()
    .toFile(path.join(publicDir, 'logo.png'));
  console.log('✓ logo.png (1200x630) generated');

  // 3. /favicon.png & sizes
  await sharp(iconBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));

  await sharp(iconBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  await sharp(iconBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon-32x32.png'));

  await sharp(iconBuffer)
    .resize(16, 16)
    .png()
    .toFile(path.join(publicDir, 'favicon-16x16.png'));

  // Also create favicon.ico from 32x32
  await sharp(iconBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon.ico'));

  console.log('✓ All favicon variations generated successfully!');
}

generateAssets().catch(err => {
  console.error('Error generating favicons:', err);
  process.exit(1);
});

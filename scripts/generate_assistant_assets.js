import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// 1. Icon Only SVG (Emblem with Sparkle & Pixels)
const iconSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Background Gradient for rounded squircle container -->
    <radialGradient id="cardGlow" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#0b1329" />
      <stop offset="60%" stop-color="#050814" />
      <stop offset="100%" stop-color="#02040a" />
    </radialGradient>

    <!-- Top Blue Chevron Gradient -->
    <linearGradient id="topChevronGrad" x1="0%" y1="0%" x2="100%" y2="80%">
      <stop offset="0%" stop-color="#00F0FF" />
      <stop offset="35%" stop-color="#00A2FF" />
      <stop offset="100%" stop-color="#005BFF" />
    </linearGradient>

    <!-- Top Specular Highlight -->
    <linearGradient id="topHighlightGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#80F7FF" stop-opacity="0.9" />
      <stop offset="70%" stop-color="#00C8FF" stop-opacity="0.4" />
      <stop offset="100%" stop-color="#0070FF" stop-opacity="0" />
    </linearGradient>

    <!-- Bottom Blue Chevron Gradient -->
    <linearGradient id="bottomChevronGrad" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#005BFF" />
      <stop offset="50%" stop-color="#0044E0" />
      <stop offset="100%" stop-color="#002DB3" />
    </linearGradient>

    <!-- Inner White Arrow Gradient -->
    <linearGradient id="whiteArrowGrad" x1="0%" y1="0%" x2="100%" y2="80%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="60%" stop-color="#F8FAFC" />
      <stop offset="100%" stop-color="#CBD5E1" />
    </linearGradient>

    <!-- Sparkle Radial Glow Filter -->
    <filter id="starGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="8" result="blur1" />
      <feGaussianBlur stdDeviation="18" result="blur2" />
      <feMerge>
        <feMergeNode in="blur2" />
        <feMergeNode in="blur1" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>

    <!-- Pixel Glow Filter -->
    <filter id="pixelGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="#00E5FF" flood-opacity="0.5" />
    </filter>

    <filter id="greenPixelGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="#00E699" flood-opacity="0.6" />
    </filter>
  </defs>

  <!-- Deep Obsidian Rounded Background -->
  <rect width="512" height="512" rx="110" fill="url(#cardGlow)" />
  <rect width="510" height="510" x="1" y="1" rx="109" fill="none" stroke="#1E293B" stroke-width="2" stroke-opacity="0.5" />

  <!-- Ambient Blue Core Glow -->
  <circle cx="260" cy="245" r="140" fill="#0066FF" opacity="0.18" filter="blur(40px)" />
  <circle cx="340" cy="195" r="90" fill="#00F0FF" opacity="0.15" filter="blur(30px)" />

  <!-- EMBLEM GROUP (Centered) -->
  <g transform="translate(10, 15)">
    <!-- 1. Top Blue Arm / Upper Chevron of D -->
    <path 
      d="M 130 100 
         L 265 100 
         C 272 100, 278 103, 283 107
         L 375 195
         L 300 195
         L 230 142
         C 225 138, 218 136, 212 136
         L 130 136
         Z" 
      fill="url(#topChevronGrad)" 
    />
    
    <!-- Top arm subtle bevel edge -->
    <path 
      d="M 130 100 L 265 100 L 375 195 L 360 195 L 260 108 L 130 108 Z" 
      fill="url(#topHighlightGrad)" 
    />

    <!-- 2. Bottom Blue Arm / Lower Fold of D -->
    <path 
      d="M 375 195 
         L 283 283
         C 278 287, 272 290, 265 290
         L 165 290
         L 125 342
         C 120 348, 126 354, 134 354
         L 270 354
         C 285 354, 300 348, 310 338
         L 395 240
         C 404 230, 404 215, 395 205
         Z" 
      fill="url(#bottomChevronGrad)" 
    />

    <!-- Diagonal Shadow Line at fold intersection -->
    <line x1="300" y1="195" x2="385" y2="200" stroke="#001866" stroke-width="3" stroke-opacity="0.7" />

    <!-- 3. Inner White Forward Arrow (Nested inside D) -->
    <path 
      d="M 175 160 
         L 242 160 
         C 248 160, 254 163, 258 167
         L 298 205
         C 303 210, 303 218, 298 223
         L 175 348
         C 168 355, 156 350, 156 340
         L 156 300
         C 156 295, 159 290, 163 286
         L 245 214
         L 175 214
         C 167 214, 160 207, 160 199
         L 160 175
         C 160 167, 167 160, 175 160
         Z" 
      fill="url(#whiteArrowGrad)" 
    />

    <!-- 4. Floating Digital Pixel Cubes (Ascending upper-right) -->
    <!-- Cube 1: Lowest cyan/blue -->
    <rect x="326" y="152" width="22" height="22" rx="3" fill="#00A2FF" filter="url(#pixelGlow)" />
    <!-- Cube 2: Middle azure -->
    <rect x="352" y="140" width="24" height="24" rx="3" fill="#0072FF" />
    <!-- Cube 3: Bright Cyan -->
    <rect x="348" y="102" width="24" height="24" rx="3" fill="#00F0FF" filter="url(#pixelGlow)" />
    <!-- Cube 4: Electric Blue high -->
    <rect x="378" y="74" width="26" height="26" rx="4" fill="#0066FF" />
    <!-- Cube 5: Deep Blue accent -->
    <rect x="368" y="172" width="18" height="18" rx="2.5" fill="#0044E0" />
    <!-- Cube 6: VIBRANT EMERALD GREEN SIGNATURE CUBE -->
    <rect x="396" y="116" width="24" height="24" rx="3.5" fill="#00E699" filter="url(#greenPixelGlow)" />

    <!-- 5. Brilliant 4-Point Star Sparkle at Apex (x=375, y=195) -->
    <g transform="translate(375, 195)" filter="url(#starGlow)">
      <!-- Soft Cyan Halo -->
      <circle cx="0" cy="0" r="28" fill="#00F0FF" opacity="0.3" filter="blur(6px)" />
      
      <!-- Primary Horizontal Beam -->
      <path d="M -44 0 Q 0 -3, 44 0 Q 0 3, -44 0 Z" fill="#FFFFFF" />
      
      <!-- Primary Vertical Beam -->
      <path d="M 0 -44 Q -3 0, 0 44 Q 3 0, 0 -44 Z" fill="#FFFFFF" />
      
      <!-- Diagonal Secondary Flares -->
      <path d="M -18 -18 Q 0 0, 18 18 Q 0 0, -18 -18 Z" fill="#80F7FF" opacity="0.9" />
      <path d="M -18 18 Q 0 0, 18 -18 Q 0 0, -18 18 Z" fill="#80F7FF" opacity="0.9" />
      
      <!-- Intense White Center Core -->
      <circle cx="0" cy="0" r="5" fill="#FFFFFF" />
    </g>
  </g>
</svg>`;

// 2. Full Horizontal / Card Logo SVG with Typography
const fullLogoSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
  <defs>
    <radialGradient id="fullBg" cx="50%" cy="40%" r="70%">
      <stop offset="0%" stop-color="#0a1228" />
      <stop offset="50%" stop-color="#040816" />
      <stop offset="100%" stop-color="#02040a" />
    </radialGradient>

    <linearGradient id="topChevronGrad" x1="0%" y1="0%" x2="100%" y2="80%">
      <stop offset="0%" stop-color="#00F0FF" />
      <stop offset="35%" stop-color="#00A2FF" />
      <stop offset="100%" stop-color="#005BFF" />
    </linearGradient>

    <linearGradient id="topHighlightGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#80F7FF" stop-opacity="0.9" />
      <stop offset="70%" stop-color="#00C8FF" stop-opacity="0.4" />
      <stop offset="100%" stop-color="#0070FF" stop-opacity="0" />
    </linearGradient>

    <linearGradient id="bottomChevronGrad" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#005BFF" />
      <stop offset="50%" stop-color="#0044E0" />
      <stop offset="100%" stop-color="#002DB3" />
    </linearGradient>

    <linearGradient id="whiteArrowGrad" x1="0%" y1="0%" x2="100%" y2="80%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="60%" stop-color="#F8FAFC" />
      <stop offset="100%" stop-color="#CBD5E1" />
    </linearGradient>

    <linearGradient id="forgeTextGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0066FF" />
      <stop offset="50%" stop-color="#00A2FF" />
      <stop offset="100%" stop-color="#00F0FF" />
    </linearGradient>

    <linearGradient id="lineGradLeft" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0066FF" stop-opacity="0.1" />
      <stop offset="100%" stop-color="#00F0FF" />
    </linearGradient>

    <linearGradient id="lineGradRight" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00F0FF" />
      <stop offset="100%" stop-color="#00E699" />
    </linearGradient>

    <filter id="starGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="8" result="blur1" />
      <feGaussianBlur stdDeviation="18" result="blur2" />
      <feMerge>
        <feMergeNode in="blur2" />
        <feMergeNode in="blur1" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>

    <filter id="pixelGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="#00E5FF" flood-opacity="0.5" />
    </filter>

    <filter id="greenPixelGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="#00E699" flood-opacity="0.6" />
    </filter>
  </defs>

  <!-- Deep Obsidian Background -->
  <rect width="600" height="600" fill="url(#fullBg)" />

  <!-- Ambient Glow Behind Logo -->
  <circle cx="300" cy="230" r="160" fill="#0066FF" opacity="0.15" filter="blur(50px)" />
  <circle cx="390" cy="180" r="100" fill="#00F0FF" opacity="0.15" filter="blur(35px)" />

  <!-- EMBLEM SCALED (Centered above text) -->
  <g transform="translate(60, 40) scale(0.9)">
    <!-- Top Blue Arm -->
    <path 
      d="M 140 90 
         L 275 90 
         C 282 90, 288 93, 293 97
         L 385 185
         L 310 185
         L 240 132
         C 235 128, 228 126, 222 126
         L 140 126
         Z" 
      fill="url(#topChevronGrad)" 
    />
    <path 
      d="M 140 90 L 275 90 L 385 185 L 370 185 L 270 98 L 140 98 Z" 
      fill="url(#topHighlightGrad)" 
    />

    <!-- Bottom Blue Arm -->
    <path 
      d="M 385 185 
         L 293 273
         C 288 277, 282 280, 275 280
         L 175 280
         L 135 332
         C 130 338, 136 344, 144 344
         L 280 344
         C 295 344, 310 338, 320 328
         L 405 230
         C 414 220, 414 205, 405 195
         Z" 
      fill="url(#bottomChevronGrad)" 
    />
    <line x1="310" y1="185" x2="395" y2="190" stroke="#001866" stroke-width="3" stroke-opacity="0.7" />

    <!-- Inner White Arrow -->
    <path 
      d="M 185 150 
         L 252 150 
         C 258 150, 264 153, 268 157
         L 308 195
         C 313 200, 313 208, 308 213
         L 185 338
         C 178 345, 166 340, 166 330
         L 166 290
         C 166 285, 169 280, 173 276
         L 255 204
         L 185 204
         C 177 204, 170 197, 170 189
         L 170 165
         C 170 157, 177 150, 185 150
         Z" 
      fill="url(#whiteArrowGrad)" 
    />

    <!-- Digital Pixel Blocks -->
    <rect x="336" y="142" width="22" height="22" rx="3" fill="#00A2FF" filter="url(#pixelGlow)" />
    <rect x="362" y="130" width="24" height="24" rx="3" fill="#0072FF" />
    <rect x="358" y="92" width="24" height="24" rx="3" fill="#00F0FF" filter="url(#pixelGlow)" />
    <rect x="388" y="64" width="26" height="26" rx="4" fill="#0066FF" />
    <rect x="378" y="162" width="18" height="18" rx="2.5" fill="#0044E0" />
    <rect x="406" y="106" width="24" height="24" rx="3.5" fill="#00E699" filter="url(#greenPixelGlow)" />

    <!-- Sparkle Flare at Apex -->
    <g transform="translate(385, 185)" filter="url(#starGlow)">
      <circle cx="0" cy="0" r="28" fill="#00F0FF" opacity="0.3" filter="blur(6px)" />
      <path d="M -44 0 Q 0 -3, 44 0 Q 0 3, -44 0 Z" fill="#FFFFFF" />
      <path d="M 0 -44 Q -3 0, 0 44 Q 3 0, 0 -44 Z" fill="#FFFFFF" />
      <path d="M -18 -18 Q 0 0, 18 18 Q 0 0, -18 -18 Z" fill="#80F7FF" opacity="0.9" />
      <path d="M -18 18 Q 0 0, 18 -18 Q 0 0, -18 18 Z" fill="#80F7FF" opacity="0.9" />
      <circle cx="0" cy="0" r="5" fill="#FFFFFF" />
    </g>
  </g>

  <!-- BRAND TYPOGRAPHY -->
  <g transform="translate(300, 420)" text-anchor="middle">
    <!-- "DigiForge" with green accent square dot on 'i' -->
    <text y="0" font-family="system-ui, -apple-system, sans-serif" font-size="64" font-weight="900" letter-spacing="-1">
      <tspan fill="#FFFFFF">Dig</tspan>
      <tspan fill="#FFFFFF">i</tspan>
      <tspan fill="url(#forgeTextGrad)">Forge</tspan>
    </text>

    <!-- Custom Glowing Dot on First i (Cyan) and Second i (Emerald Green) -->
    <!-- First dot -->
    <rect x="-173" y="-56" width="10" height="10" rx="2" fill="#00E5FF" filter="url(#pixelGlow)" />
    <!-- Second dot -->
    <rect x="-103" y="-56" width="10" height="10" rx="2" fill="#00E699" filter="url(#greenPixelGlow)" />

    <!-- Sleek Neon Accent Rule Flanking AI ASSISTANT -->
    <line x1="-220" y1="36" x2="-105" y2="36" stroke="url(#lineGradLeft)" stroke-width="3" stroke-linecap="round" />
    
    <!-- AI ASSISTANT Text -->
    <text x="0" y="42" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="800" letter-spacing="7" text-anchor="middle">
      AI ASSISTANT
    </text>
    
    <line x1="105" y1="36" x2="220" y2="36" stroke="url(#lineGradRight)" stroke-width="3" stroke-linecap="round" />
  </g>
</svg>`;

async function main() {
  const publicDir = path.resolve('public');
  const srcAssetsDir = path.resolve('src/assets');

  // Write SVGs
  fs.writeFileSync(path.join(publicDir, 'digiforge-ai-assistant-icon.svg'), iconSvg, 'utf8');
  fs.writeFileSync(path.join(publicDir, 'digiforge-ai-assistant-logo.svg'), fullLogoSvg, 'utf8');
  console.log('SVGs created successfully.');

  // Render PNGs via sharp
  const iconBuffer = Buffer.from(iconSvg);
  const fullLogoBuffer = Buffer.from(fullLogoSvg);

  await sharp(iconBuffer)
    .resize(512, 512)
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'digiforge-ai-assistant-icon.png'));

  await sharp(iconBuffer)
    .resize(512, 512)
    .png({ quality: 100 })
    .toFile(path.join(srcAssetsDir, 'digiforge-ai-assistant-icon.png'));

  await sharp(fullLogoBuffer)
    .resize(1024, 1024)
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'digiforge-ai-assistant-logo.png'));

  console.log('PNGs generated successfully via sharp.');
}

main().catch(console.error);

/**
 * Icon & OG Image Generator
 *
 * Generates:
 *   - favicon-32x32.png, favicon-16x16.png (dark background)
 *   - apple-touch-icon.png (180x180, dark background)
 *   - og-image.png (1200x630, branded OG image)
 *   - PWA icons (all sizes, dark background, no transparency)
 *   - PWA maskable icons (with safe zone padding)
 *
 * Run: node scripts/generate-icons.js
 */

const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const PUBLIC = path.join(__dirname, "..", "public");
const ICONS_DIR = path.join(PUBLIC, "icons");
const LOGO_PATH = path.join(PUBLIC, "logo.png");

const BG_COLOR = "#0a0a0a"; // matches the app's background
const ACCENT_COLOR = "#1e40af"; // theme blue

const PWA_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/**
 * Composite logo on a solid-color square background, output PNG.
 */
async function createIcon(size, outputPath, { padding = 0.15, bg = BG_COLOR } = {}) {
  const logoSize = Math.round(size * (1 - padding * 2));
  const logo = await sharp(LOGO_PATH)
    .resize(logoSize, logoSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: bg,
    },
  })
    .composite([{ input: logo, gravity: "centre" }])
    .flatten({ background: bg })
    .png()
    .toFile(outputPath);
}

/**
 * Maskable icons need a larger safe-zone (at least 10% on each side, we use 20%).
 */
async function createMaskableIcon(size, outputPath) {
  return createIcon(size, outputPath, { padding: 0.2, bg: BG_COLOR });
}

/**
 * Create a 1200x630 OG image with logo centered on dark bg with accent gradient.
 */
async function createOGImage(outputPath) {
  const width = 1200;
  const height = 630;
  const logoSize = 280;

  const logo = await sharp(LOGO_PATH)
    .resize(logoSize, logoSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  // Create a gradient overlay SVG for visual interest
  const gradientSvg = `<svg width="${width}" height="${height}">
    <defs>
      <radialGradient id="g" cx="50%" cy="50%" r="70%">
        <stop offset="0%" stop-color="${ACCENT_COLOR}" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="${BG_COLOR}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#g)"/>
  </svg>`;

  // Site name text rendered as SVG
  const textSvg = `<svg width="${width}" height="60">
    <text x="${width / 2}" y="45" text-anchor="middle"
      font-family="Arial, Helvetica, sans-serif" font-size="36" font-weight="bold"
      fill="white" letter-spacing="4">RestAL</text>
  </svg>`;

  // Tagline
  const taglineSvg = `<svg width="${width}" height="40">
    <text x="${width / 2}" y="28" text-anchor="middle"
      font-family="Arial, Helvetica, sans-serif" font-size="20"
      fill="#94a3b8" letter-spacing="1">Турагенція</text>
  </svg>`;

  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: BG_COLOR,
    },
  })
    .composite([
      { input: Buffer.from(gradientSvg), gravity: "centre" },
      { input: logo, top: Math.round((height - logoSize - 80) / 2), left: Math.round((width - logoSize) / 2) },
      { input: Buffer.from(textSvg), top: Math.round((height - logoSize - 80) / 2) + logoSize + 10, left: 0 },
      { input: Buffer.from(taglineSvg), top: Math.round((height - logoSize - 80) / 2) + logoSize + 60, left: 0 },
    ])
    .flatten({ background: BG_COLOR })
    .png()
    .toFile(outputPath);
}

async function main() {
  await ensureDir(ICONS_DIR);

  console.log("Generating favicons...");
  await createIcon(16, path.join(PUBLIC, "favicon-16x16.png"), { padding: 0.05 });
  await createIcon(32, path.join(PUBLIC, "favicon-32x32.png"), { padding: 0.1 });
  await createIcon(180, path.join(PUBLIC, "apple-touch-icon.png"), { padding: 0.12 });
  console.log("  ✓ favicon-16x16.png, favicon-32x32.png, apple-touch-icon.png");

  console.log("Generating OG image...");
  await createOGImage(path.join(PUBLIC, "og-image.png"));
  console.log("  ✓ og-image.png (1200x630)");

  console.log("Generating PWA icons...");
  for (const size of PWA_SIZES) {
    await createIcon(size, path.join(ICONS_DIR, `icon-${size}x${size}.png`));
    await createMaskableIcon(size, path.join(ICONS_DIR, `icon-maskable-${size}x${size}.png`));
    console.log(`  ✓ icon-${size}x${size}.png + maskable`);
  }

  // Also create a 512x512 version to use as the main favicon for browsers
  await createIcon(512, path.join(PUBLIC, "icon-512.png"), { padding: 0.1 });
  console.log("  ✓ icon-512.png");

  console.log("\nDone! All icons have solid backgrounds (no transparency).");
}

main().catch((err) => {
  console.error("Error generating icons:", err);
  process.exit(1);
});

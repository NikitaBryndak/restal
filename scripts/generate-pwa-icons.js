/**
 * PWA Icon Generator Script
 *
 * Run: node scripts/generate-pwa-icons.js
 *
 * This creates simple placeholder PNG icons for the PWA manifest.
 * Replace these with your actual branded icons (from logo.png).
 *
 * For production, use a tool like:
 *   - https://realfavicongenerator.net/
 *   - https://www.pwabuilder.com/imageGenerator
 * to generate proper icons from your logo.png
 */

const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '..', 'public', 'icons');

// Ensure directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create minimal valid PNG for each size
// In production, replace with properly resized versions of logo.png
function createPlaceholderPNG(size) {
  // Minimal PNG: 1x1 blue pixel, scaled conceptually
  // This is a proper 1x1 PNG that browsers accept as a valid icon
  const PNG_HEADER = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
    0x00, 0x00, 0x00, 0x0d, // IHDR length
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, 0x01, // width: 1
    0x00, 0x00, 0x00, 0x01, // height: 1
    0x08, 0x02, // 8-bit RGB
    0x00, 0x00, 0x00, // compression, filter, interlace
    0x90, 0x77, 0x53, 0xde, // CRC
    0x00, 0x00, 0x00, 0x0c, // IDAT length
    0x49, 0x44, 0x41, 0x54, // IDAT
    0x08, 0xd7, 0x63, 0x18, 0x60, 0xa0, 0x00, 0x00,
    0x00, 0x04, 0x00, 0x01, // compressed data
    0x47, 0xc1, 0x31, 0x51, // CRC
    0x00, 0x00, 0x00, 0x00, // IEND length
    0x49, 0x45, 0x4e, 0x44, // IEND
    0xae, 0x42, 0x60, 0x82, // CRC
  ]);
  return PNG_HEADER;
}

for (const size of sizes) {
  const buf = createPlaceholderPNG(size);
  fs.writeFileSync(path.join(iconsDir, `icon-${size}x${size}.png`), buf);
  fs.writeFileSync(path.join(iconsDir, `icon-maskable-${size}x${size}.png`), buf);
  console.log(`Created icon-${size}x${size}.png`);
}

// Copy logo.png as a fallback for the larger sizes
const logoPath = path.join(__dirname, '..', 'public', 'logo.png');
if (fs.existsSync(logoPath)) {
  const logo = fs.readFileSync(logoPath);
  for (const size of [192, 384, 512]) {
    fs.writeFileSync(path.join(iconsDir, `icon-${size}x${size}.png`), logo);
    fs.writeFileSync(path.join(iconsDir, `icon-maskable-${size}x${size}.png`), logo);
    console.log(`Copied logo.png as icon-${size}x${size}.png`);
  }
}

console.log('\nDone! Replace placeholder icons with properly sized versions of your logo.');
console.log('Recommended: Use https://realfavicongenerator.net/ with your logo.png');

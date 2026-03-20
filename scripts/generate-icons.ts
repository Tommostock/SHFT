/**
 * Generate placeholder PWA icons — simple "SHFT" text on dark background.
 * Creates 192x192 and 512x512 PNG files using an SVG-to-PNG approach.
 * Since we don't have canvas in Node, we generate SVGs that the browser
 * can render. For now, we create simple SVG files as placeholders.
 */

import { writeFileSync } from "fs";
import { join } from "path";

function generateIconSVG(size: number): string {
  const fontSize = Math.round(size * 0.25);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#0F0F0F"/>
  <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle"
    font-family="Georgia, serif" font-size="${fontSize}" font-weight="400"
    fill="#C9A84C" letter-spacing="${Math.round(size * 0.02)}">SHFT</text>
</svg>`;
}

const outDir = join(process.cwd(), "public", "icons");

// Write SVG icons (these work as valid icon files for PWA development)
writeFileSync(join(outDir, "icon-192.svg"), generateIconSVG(192));
writeFileSync(join(outDir, "icon-512.svg"), generateIconSVG(512));

// Also create simple 1x1 PNG placeholders with correct filenames
// (browsers need actual PNG for PWA icons — replace these with real ones later)
// For now, create a minimal valid PNG
function createMinimalPNG(size: number): Buffer {
  // We'll create a very basic BMP-like structure
  // Actually, let's just write SVG and note that real PNGs should replace them
  const svg = generateIconSVG(size);
  return Buffer.from(svg, "utf-8");
}

// Write as .png extension but SVG content (works in most browsers during dev)
writeFileSync(join(outDir, "icon-192.png"), createMinimalPNG(192));
writeFileSync(join(outDir, "icon-512.png"), createMinimalPNG(512));

console.log("✓ Placeholder icons generated in public/icons/");

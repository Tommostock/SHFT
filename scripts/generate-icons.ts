/**
 * Generate PWA icons — "SHFT" text centered on dark background.
 * Uses node-canvas to render proper PNG files with serif font.
 *
 * Usage: npx tsx scripts/generate-icons.ts
 */

import { createCanvas } from "canvas";
import { writeFileSync } from "fs";
import { join } from "path";

const ICONS_DIR = join(process.cwd(), "public", "icons");

function generateIcon(size: number, fontSize: number): Buffer {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  // Dark background (full square — PWA handles rounding)
  ctx.fillStyle = "#0F0F0F";
  ctx.fillRect(0, 0, size, size);

  // SHFT text in serif font, centered
  ctx.fillStyle = "#F5F3EE";
  ctx.font = `400 ${fontSize}px "Georgia"`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Measure and center precisely
  const metrics = ctx.measureText("SHFT");
  const ascent = metrics.actualBoundingBoxAscent || fontSize * 0.7;
  const descent = metrics.actualBoundingBoxDescent || fontSize * 0.1;
  const textHeight = ascent + descent;

  // Center vertically — shift up slightly to account for visual weight
  const y = (size + ascent - descent) / 2;

  ctx.fillText("SHFT", size / 2, y);

  return canvas.toBuffer("image/png");
}

// Generate both sizes
const icon192 = generateIcon(192, 52);
writeFileSync(join(ICONS_DIR, "icon-192.png"), icon192);
console.log(`Generated icon-192.png (${icon192.length} bytes)`);

const icon512 = generateIcon(512, 138);
writeFileSync(join(ICONS_DIR, "icon-512.png"), icon512);
console.log(`Generated icon-512.png (${icon512.length} bytes)`);

console.log("Done!");

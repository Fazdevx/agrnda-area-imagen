/**
 * Generador de íconos PNG para PWA
 * Crea iconos 192x192 y 512x512 (normales y maskable) usando zlib (sin dependencias externas).
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ICONS_DIR = path.join(__dirname, 'icons');

// --- CRC-32 para PNG ---
const CRC_TABLE = (function () {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xEDB88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function pngCRC(chunkType, data) {
  let c = 0xFFFFFFFF;
  const bytes = Buffer.concat([chunkType, data]);
  for (let i = 0; i < bytes.length; i++) {
    c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
  }
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const chunkType = Buffer.from(type, 'ascii');
  const chunkData = Buffer.concat([chunkType, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(pngCRC(chunkType, data) >>> 0, 0);
  return Buffer.concat([len, chunkData, crc]);
}

function createPNG(width, height, pixelData) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (width * 4 + 1);
    raw[rowStart] = 0;
    const srcStart = y * width * 4;
    pixelData.copy(raw, rowStart + 1, srcStart, srcStart + width * 4);
  }
  const idat = zlib.deflateSync(raw);
  return Buffer.concat([sig, pngChunk('IHDR', ihdr), pngChunk('IDAT', idat), pngChunk('IEND', Buffer.alloc(0))]);
}

// --- Drawing helpers ---
function makeCanvas(width, height, bg) {
  const px = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    px[i * 4] = bg[0]; px[i * 4 + 1] = bg[1]; px[i * 4 + 2] = bg[2]; px[i * 4 + 3] = bg[3];
  }
  return px;
}

function setPixel(px, width, height, x, y, color) {
  if (x < 0 || x >= width || y < 0 || y >= height) return;
  const idx = (y * width + x) * 4;
  px[idx] = color[0]; px[idx + 1] = color[1]; px[idx + 2] = color[2]; px[idx + 3] = color[3];
}

function fillRect(px, width, height, x0, y0, w, h, color) {
  for (let y = y0; y < y0 + h; y++)
    for (let x = x0; x < x0 + w; x++)
      setPixel(px, width, height, x, y, color);
}

function fillRoundedRect(px, width, height, x, y, w, h, r, color) {
  fillRect(px, width, height, x + r, y, w - r * 2, h, color);
  fillRect(px, width, height, x, y + r, r, h - r * 2, color);
  fillRect(px, width, height, x + w - r, y + r, r, h - r * 2, color);
  for (let cy = 0; cy < r; cy++) {
    for (let cx = 0; cx < r; cx++) {
      const dx = cx - r, dy = cy - r;
      if (dx * dx + dy * dy <= r * r) {
        setPixel(px, width, height, x + cx, y + cy, color);
        setPixel(px, width, height, x + w - r + cx, y + cy, color);
        setPixel(px, width, height, x + cx, y + h - r + cy, color);
        setPixel(px, width, height, x + w - r + cx, y + h - r + cy, color);
      }
    }
  }
}

function fillLine(px, width, height, x0, y0, len, thickness, color) {
  const half = Math.floor(thickness / 2);
  for (let y = y0 - half; y <= y0 + half; y++)
    for (let x = x0; x < x0 + len; x++)
      setPixel(px, width, height, x, y, color);
}

// --- Icon drawing logic ---
const BLUE = [59, 130, 246, 255];
const WHITE = [255, 255, 255, 255];
const GRAY_LINE = [224, 224, 224, 255];
const BLUE_ACCENT = [59, 130, 246, 128];

function drawIcon(size) {
  const px = makeCanvas(size, size, BLUE);
  const docX = Math.floor(size * 0.25);
  const docY = Math.floor(size * 0.18);
  const docW = Math.floor(size * 0.50);
  const docH = Math.floor(size * 0.64);
  const radius = Math.floor(size * 0.04);
  fillRoundedRect(px, size, size, docX, docY, docW, docH, radius, WHITE);
  const lineY1 = docY + Math.floor(size * 0.13);
  const lineX1 = docX + Math.floor(size * 0.08);
  const lineLen1 = Math.floor(size * 0.42);
  const lineY2 = docY + Math.floor(size * 0.27);
  const lineLen2 = Math.floor(size * 0.35);
  const lineY3 = docY + Math.floor(size * 0.41);
  const lineY4 = docY + Math.floor(size * 0.55);
  const lineLen4 = Math.floor(size * 0.30);
  const lineY5 = docY + Math.floor(size * 0.69);
  const lineLen5 = Math.floor(size * 0.40);
  const thickness = Math.floor(size * 0.013);
  fillLine(px, size, size, lineX1, lineY1, lineLen1, thickness, GRAY_LINE);
  fillLine(px, size, size, lineX1, lineY2, lineLen2, thickness, GRAY_LINE);
  fillLine(px, size, size, lineX1, lineY3, lineLen1, thickness, BLUE_ACCENT);
  fillLine(px, size, size, lineX1, lineY4, lineLen4, thickness, GRAY_LINE);
  fillLine(px, size, size, lineX1, lineY5, lineLen5, thickness, GRAY_LINE);
  return px;
}

// --- Generate icons ---
const sizes = [192, 512];
for (const size of sizes) {
  const px = drawIcon(size);
  const png = createPNG(size, size, px);
  fs.writeFileSync(path.join(ICONS_DIR, `icon-${size}.png`), png);
  fs.writeFileSync(path.join(ICONS_DIR, `maskable-${size}.png`), png);
  console.log(`✓ Creado: icon-${size}.png y maskable-${size}.png (${size}x${size})`);
}
console.log('\nTodos los íconos han sido generados.');


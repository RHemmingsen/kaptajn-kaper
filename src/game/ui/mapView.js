// Drawing the sea map: water, grid, land, ports and the ship.
import { Bitmap } from '../../engine/Bitmap.js';
import { COLORS } from '../palette.js';
import { CITIES, COLS, ROWS, CELL, drawLand } from '../map.js';
import { label } from './draw.js';

// One map cell on screen. Not square: the original ran on CGA screens whose
// pixels were taller than wide, so its square 10x10 cells looked about 10x12.
const TILE_W = 19;
const TILE_H = 22;

// Where the top-left corner of the map is drawn on the canvas.
const MAP_X = 35;
const MAP_Y = 32;
const MAP_W = COLS * TILE_W;
const MAP_H = ROWS * TILE_H;

export function drawMap(ctx) {
  // 1. Water.
  ctx.fillStyle = COLORS.blue;
  ctx.fillRect(MAP_X, MAP_Y, MAP_W, MAP_H);

  // 2. Grid lines: one per cell, and a stronger one every 5 cells.
  ctx.lineWidth = 1;
  for (const [step, color] of [[1, COLORS.cyan], [5, COLORS.salmon]]) {
    ctx.strokeStyle = color;
    ctx.beginPath();
    for (let col = step; col < COLS; col += step) {
      const x = MAP_X + col * TILE_W + 0.5; // +0.5 keeps 1px lines sharp
      ctx.moveTo(x, MAP_Y);
      ctx.lineTo(x, MAP_Y + MAP_H);
    }
    for (let row = step; row < ROWS; row += step) {
      const y = MAP_Y + row * TILE_H + 0.5;
      ctx.moveTo(MAP_X, y);
      ctx.lineTo(MAP_X + MAP_W, y);
    }
    ctx.stroke();
  }

  // 3. Land on top, which hides the grid on land.
  ctx.drawImage(landImage(), MAP_X, MAP_Y);
}

// The land is drawn pixel by pixel from the original's DRAW commands, which
// is too slow to do 60 times a second. So we do it once, keep the result in an
// off-screen canvas, and just copy that onto the screen each frame.
let cachedLand = null;

function landImage() {
  if (cachedLand) return cachedLand;

  const bitmap = new Bitmap(MAP_W, MAP_H);
  drawLand(bitmap, TILE_W / CELL, TILE_H / CELL, 1);

  const canvas = document.createElement('canvas');
  canvas.width = MAP_W;
  canvas.height = MAP_H;
  const ctx = canvas.getContext('2d');
  const image = ctx.createImageData(MAP_W, MAP_H);
  const [r, g, b] = hexToRgb(COLORS.brown);
  bitmap.pixels.forEach((pixel, i) => {
    if (!pixel) return; // leave water transparent
    image.data[i * 4] = r;
    image.data[i * 4 + 1] = g;
    image.data[i * 4 + 2] = b;
    image.data[i * 4 + 3] = 255;
  });
  ctx.putImageData(image, 0, 0);

  cachedLand = canvas;
  return cachedLand;
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function drawCities(ctx) {
  ctx.fillStyle = COLORS.red;
  for (const city of CITIES) {
    const [x, y] = cellCenter(city.col, city.row);
    ctx.beginPath();
    ctx.arc(x, y, city.big ? 8 : 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawCityName(ctx, city) {
  const [x, y] = cellCenter(city.col, city.row);
  label(ctx, city.name, x - 20, y - 20, COLORS.white);
}

export function drawShip(ctx, ship) {
  // Our ship sprite is 16x16; centre it in the cell.
  const [cx, cy] = cellCenter(ship.col, ship.row);
  const x = Math.round(cx - 8);
  const y = Math.round(cy - 8);

  // Hull.
  ctx.fillStyle = COLORS.red;
  ctx.beginPath();
  ctx.moveTo(x + 1, y + 10);
  ctx.lineTo(x + 15, y + 10);
  ctx.lineTo(x + 12, y + 14);
  ctx.lineTo(x + 4, y + 14);
  ctx.closePath();
  ctx.fill();

  // Sail and pennant.
  ctx.fillStyle = COLORS.white;
  ctx.beginPath();
  ctx.moveTo(x + 8, y + 2);
  ctx.lineTo(x + 8, y + 9);
  ctx.lineTo(x + 3, y + 9);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(x + 8, y + 2, 1, 8);
  ctx.fillStyle = COLORS.green;
  ctx.fillRect(x + 9, y + 2, 4, 3);
}

// Pixel position of the middle of a map cell. Cells are numbered from 1, as
// in the original.
function cellCenter(col, row) {
  return [MAP_X + (col - 0.5) * TILE_W, MAP_Y + (row - 0.5) * TILE_H];
}

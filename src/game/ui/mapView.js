// Drawing the sea map: tiles, ports and the ship.
import { COLORS } from '../palette.js';
import { CITIES } from '../map.js';
import { label } from './draw.js';

// Size of one tile in pixels. Not square: the original ran on screens whose
// pixels were taller than wide, so its square cells looked about this shape.
const TILE_W = 19;
const TILE_H = 22;

// Where the top-left corner of the map is drawn on the canvas.
const MAP_X = 35;
const MAP_Y = 32;

export function drawMap(ctx, map) {
  const w = map.width * TILE_W;
  const h = map.height * TILE_H;

  // 1. Fill the whole map area with water.
  ctx.fillStyle = COLORS.blue;
  ctx.fillRect(MAP_X, MAP_Y, w, h);

  // 2. Draw grid lines over all of it.
  ctx.strokeStyle = COLORS.cyan;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let col = 0; col <= map.width; col++) {
    const x = MAP_X + col * TILE_W + 0.5; // +0.5 keeps 1px lines sharp
    ctx.moveTo(x, MAP_Y);
    ctx.lineTo(x, MAP_Y + h);
  }
  for (let row = 0; row <= map.height; row++) {
    const y = MAP_Y + row * TILE_H + 0.5;
    ctx.moveTo(MAP_X, y);
    ctx.lineTo(MAP_X + w, y);
  }
  ctx.stroke();

  // 3. Paint land tiles on top, which hides the grid on land. The TileMap
  // counts from 0, the map cells from 1, hence the + 1.
  ctx.fillStyle = COLORS.brown;
  for (let row = 0; row < map.height; row++) {
    for (let col = 0; col < map.width; col++) {
      if (map.get(col, row) === '#') {
        const [x, y] = cellCorner(col + 1, row + 1);
        ctx.fillRect(x, y, TILE_W, TILE_H);
      }
    }
  }
}

export function drawCities(ctx) {
  ctx.fillStyle = COLORS.red;
  for (const city of CITIES) {
    const [x, y] = tileCenter(city.col, city.row);
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawCityName(ctx, city) {
  const [x, y] = tileCenter(city.col, city.row);
  label(ctx, city.name, x - 20, y - 18, COLORS.white);
}

export function drawShip(ctx, ship) {
  // The ship sprite is 16x16; centre it in the cell.
  const [cx, cy] = tileCenter(ship.col, ship.row);
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

// Pixel position of the top-left corner of a map cell (numbered from 1).
function cellCorner(col, row) {
  return [MAP_X + (col - 1) * TILE_W, MAP_Y + (row - 1) * TILE_H];
}

// Pixel position of the middle of a map cell (numbered from 1).
function tileCenter(col, row) {
  const [x, y] = cellCorner(col, row);
  return [x + TILE_W / 2, y + TILE_H / 2];
}

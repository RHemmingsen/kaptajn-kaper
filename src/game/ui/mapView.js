// Drawing the sea map: tiles, ports and the ship.
import { COLORS } from '../palette.js';
import { CITIES } from '../map.js';
import { label } from './draw.js';

// Size of one tile in pixels, and where the top-left corner of the map is
// drawn on the canvas.
const TILE = 16;
const MAP_X = 30;
const MAP_Y = 26;

export function drawMap(ctx, map) {
  const w = map.width * TILE;
  const h = map.height * TILE;

  // 1. Fill the whole map area with water.
  ctx.fillStyle = COLORS.blue;
  ctx.fillRect(MAP_X, MAP_Y, w, h);

  // 2. Draw grid lines over all of it.
  ctx.strokeStyle = COLORS.cyan;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let col = 0; col <= map.width; col++) {
    const x = MAP_X + col * TILE + 0.5; // +0.5 keeps 1px lines sharp
    ctx.moveTo(x, MAP_Y);
    ctx.lineTo(x, MAP_Y + h);
  }
  for (let row = 0; row <= map.height; row++) {
    const y = MAP_Y + row * TILE + 0.5;
    ctx.moveTo(MAP_X, y);
    ctx.lineTo(MAP_X + w, y);
  }
  ctx.stroke();

  // 3. Paint land tiles on top, which hides the grid on land.
  ctx.fillStyle = COLORS.brown;
  for (let row = 0; row < map.height; row++) {
    for (let col = 0; col < map.width; col++) {
      if (map.get(col, row) === '#') {
        ctx.fillRect(MAP_X + col * TILE, MAP_Y + row * TILE, TILE, TILE);
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
  const x = MAP_X + ship.col * TILE;
  const y = MAP_Y + ship.row * TILE;

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

// Pixel position of the middle of a tile.
function tileCenter(col, row) {
  return [MAP_X + col * TILE + TILE / 2, MAP_Y + row * TILE + TILE / 2];
}

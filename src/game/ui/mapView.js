// Drawing the sea map: its frame, tiles, ports and the ship.
import { COLORS } from '../palette.js';
import { IMAGES } from '../assets.js';
import { label } from './draw.js';

// Size of one tile in pixels. Not square: the original ran on screens whose
// pixels were taller than wide, so its square cells looked about this shape.
const TILE_W = 19;
const TILE_H = 22;

// Where the top-left corner of the map is drawn on the canvas.
const MAP_X = 35;
const MAP_Y = 32;

// The green border around the map, with the score, the goal and the keys on
// it, and whether the sound is on.
export function drawMapFrame(ctx, state, soundOn) {
  ctx.strokeStyle = COLORS.green;
  ctx.lineWidth = 12;
  ctx.strokeRect(23, 19, 574, 335);

  label(ctx, `Point: ${state.points}`, 44, 19);
  label(ctx, `Mål: ${state.goal} på ${state.maxMoves} træk`, 262, 19);
  label(ctx, 'F1:Hjælp', 44, 354);
  label(ctx, `F2:lyd ${soundOn ? 'til' : 'fra'}`, 262, 354);
  label(ctx, 'Esc:Slut', 466, 354);
}

export function drawMap(ctx, chart) {
  const w = chart.width * TILE_W;
  const h = chart.height * TILE_H;

  // 1. Fill the whole map area with water.
  ctx.fillStyle = COLORS.blue;
  ctx.fillRect(MAP_X, MAP_Y, w, h);

  // 2. Draw grid lines over all of it.
  ctx.strokeStyle = COLORS.cyan;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let col = 0; col <= chart.width; col++) {
    const x = MAP_X + col * TILE_W + 0.5; // +0.5 keeps 1px lines sharp
    ctx.moveTo(x, MAP_Y);
    ctx.lineTo(x, MAP_Y + h);
  }
  for (let row = 0; row <= chart.height; row++) {
    const y = MAP_Y + row * TILE_H + 0.5;
    ctx.moveTo(MAP_X, y);
    ctx.lineTo(MAP_X + w, y);
  }
  ctx.stroke();

  // 3. The land picture on top, which hides the grid on land. It's only for
  // looks: where the ship can sail is decided by the text grid in map.js.
  ctx.drawImage(IMAGES.kattegat, MAP_X, MAP_Y, w, h);
}

// Debug view: a see-through red box on every cell the ship can't sail into,
// so you can check that the picture and the collision grid agree. It asks
// the chart the sailing rules use, so it shows exactly what the ship will hit.
export function drawCollisionOverlay(ctx, chart) {
  ctx.fillStyle = 'rgba(255, 0, 0, 0.35)';
  ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
  ctx.lineWidth = 1;
  for (let row = 1; row <= chart.height; row++) {
    for (let col = 1; col <= chart.width; col++) {
      if (chart.canSailTo(col, row)) continue;
      const [x, y] = cellCorner(col, row);
      ctx.fillRect(x, y, TILE_W, TILE_H);
      ctx.strokeRect(x + 0.5, y + 0.5, TILE_W - 1, TILE_H - 1);
    }
  }

  const bottom = MAP_Y + chart.height * TILE_H;
  label(ctx, 'DEBUG: kollision (G)', MAP_X + 8, bottom - 14, COLORS.white);
}

export function drawCities(ctx, chart) {
  ctx.fillStyle = COLORS.red;
  for (const city of chart.cities) {
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

// Pixel position of the top-left corner of a map cell. Cells are numbered
// from 1 (see SeaChart), so cell 1 starts at the map's left edge: the - 1
// is drawing arithmetic, not a second coordinate system.
function cellCorner(col, row) {
  return [MAP_X + (col - 1) * TILE_W, MAP_Y + (row - 1) * TILE_H];
}

// Pixel position of the middle of a map cell (numbered from 1).
function tileCenter(col, row) {
  const [x, y] = cellCorner(col, row);
  return [x + TILE_W / 2, y + TILE_H / 2];
}

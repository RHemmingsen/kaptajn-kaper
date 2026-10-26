// Drawing the harbor minigame: walls, docks, anchored ships and our ship.
import { COLORS, FONT } from '../palette.js';
import { LAYOUT, DOCKS, WIND_MAX } from '../rules/harbor.js';

// Where the wind indicator sits: below the left dock.
const WIND_X = 40;
const WIND_Y = 446;
const WIND_ARROW_CENTER = 170;
const WIND_ARROW_MAX = 60; // half-length of the arrow at the strongest wind

export function drawHarbor(ctx, harbor) {
  drawWind(ctx, harbor.wind);
  drawWall(ctx, LAYOUT.wallLeft - 14);
  drawWall(ctx, LAYOUT.wallRight + 2);

  ctx.fillStyle = COLORS.brown;
  for (const dock of DOCKS) ctx.fillRect(dock.x, dock.y, dock.w, dock.h);

  for (const obstacle of harbor.obstacles) drawAnchoredShip(ctx, obstacle);
  drawOurShip(ctx, harbor.ship);
}

// "Vind" and an arrow pointing the way the wind blows. The stronger the wind,
// the longer the arrow.
function drawWind(ctx, wind) {
  ctx.fillStyle = COLORS.white;
  ctx.font = `bold 20px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('Vind', WIND_X, WIND_Y);

  const half = (Math.abs(wind) / WIND_MAX) * WIND_ARROW_MAX;
  const dir = Math.sign(wind);
  const tail = WIND_ARROW_CENTER - dir * half;
  const tip = WIND_ARROW_CENTER + dir * half;

  ctx.strokeStyle = COLORS.white;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(tail, WIND_Y);
  ctx.lineTo(tip, WIND_Y);
  ctx.moveTo(tip - dir * 10, WIND_Y - 7); // arrowhead
  ctx.lineTo(tip, WIND_Y);
  ctx.lineTo(tip - dir * 10, WIND_Y + 7);
  ctx.stroke();
}

// A column of magenta and cyan dots, like the original's harbor walls.
function drawWall(ctx, x) {
  for (let y = 16; y < LAYOUT.dockTop + LAYOUT.dockHeight; y += 4) {
    ctx.fillStyle = COLORS.magenta;
    ctx.fillRect(x, y, 2, 2);
    ctx.fillRect(x + 8, y + 2, 2, 2);
    ctx.fillStyle = COLORS.cyan;
    ctx.fillRect(x + 4, y + 2, 2, 2);
    ctx.fillRect(x + 10, y, 2, 2);
  }
}

// Two masts on a red hull. Drawn to fill the obstacle's collision box.
function drawAnchoredShip(ctx, { x, y, w, h }) {
  ctx.fillStyle = COLORS.red;
  ctx.fillRect(x, y + h - 6, w, 6);
  ctx.fillStyle = COLORS.cyan;
  ctx.fillRect(x + 3, y + 2, 3, h - 8);
  ctx.fillRect(x + w - 6, y + 2, 3, h - 8);
  ctx.fillStyle = COLORS.green;
  ctx.fillRect(x + 3, y, 3, 3);
  ctx.fillRect(x + w - 6, y, 3, 3);
}

function drawOurShip(ctx, { x, y, w, h }) {
  ctx.fillStyle = COLORS.cyan;
  ctx.fillRect(x, y + h - 6, w, 6);
  ctx.fillStyle = COLORS.red;
  ctx.fillRect(x + 4, y, w - 8, h - 6);
  ctx.fillStyle = COLORS.green;
  ctx.fillRect(x + 2, y + h - 3, w - 4, 3);
}

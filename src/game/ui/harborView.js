// Drawing the harbor minigame: walls, docks, anchored ships and our ship.
import { COLORS } from '../palette.js';
import { LAYOUT, DOCKS } from '../rules/harbor.js';

export function drawHarbor(ctx, harbor) {
  drawWall(ctx, LAYOUT.wallLeft - 14);
  drawWall(ctx, LAYOUT.wallRight + 2);

  ctx.fillStyle = COLORS.brown;
  for (const dock of DOCKS) ctx.fillRect(dock.x, dock.y, dock.w, dock.h);

  for (const obstacle of harbor.obstacles) drawAnchoredShip(ctx, obstacle);
  drawOurShip(ctx, harbor.ship);
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

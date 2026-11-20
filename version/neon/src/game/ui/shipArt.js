// A three-masted ship seen from the side, as on the original's battle and
// boarding screens.
import { COLORS } from '../palette.js';

// The drawing's size at scale 1, in pixels.
export const SIDE_VIEW_SIZE = { w: 156, h: 158 };

// Draw the ship with its top-left corner at (x, y), at `scale` times its
// normal size. translate and scale move the canvas's coordinate system, so
// the drawing below can use fixed numbers whatever the position and size.
export function drawSideViewShip(ctx, x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Hull.
  ctx.fillStyle = COLORS.magenta;
  ctx.beginPath();
  ctx.moveTo(0, 126);
  ctx.lineTo(156, 126);
  ctx.lineTo(138, 158);
  ctx.lineTo(18, 158);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = COLORS.white;
  ctx.fillRect(8, 136, 140, 3);

  // Masts and sails, smaller towards the top.
  for (const mx of [38, 78, 118]) {
    ctx.fillStyle = COLORS.white;
    ctx.fillRect(mx - 1, 6, 3, 120);
    for (const [sy, half] of [[22, 12], [48, 16], [78, 20]]) {
      ctx.fillRect(mx - half, sy, half * 2, 22);
    }
  }
  ctx.fillStyle = COLORS.cyan;
  ctx.fillRect(79, 0, 12, 8); // flag

  ctx.restore();
}

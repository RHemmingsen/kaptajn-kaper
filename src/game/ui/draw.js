// Small drawing helpers shared by all scenes.
import { COLORS, FONT } from '../palette.js';

export function clearScreen(ctx, color = COLORS.blue) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

// Fill a shape given as a list of [x, y] corners.
export function polygon(ctx, points) {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (const [x, y] of points.slice(1)) ctx.lineTo(x, y);
  ctx.closePath();
  ctx.fill();
}

// Text on a blue background patch, so it stays readable on top of anything.
export function label(ctx, text, x, y, color = COLORS.salmon) {
  ctx.font = `bold 20px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const w = ctx.measureText(text).width;
  ctx.fillStyle = COLORS.blue;
  ctx.fillRect(x - 4, y - 11, w + 8, 22);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

// Same as label(), centred horizontally on the screen.
export function centeredLabel(ctx, text, y, color = COLORS.salmon) {
  ctx.font = `bold 20px ${FONT}`;
  const w = ctx.measureText(text).width;
  label(ctx, text, (ctx.canvas.width - w) / 2, y, color);
}

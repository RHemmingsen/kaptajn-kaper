// Small drawing helpers shared by all of ui/.
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

// Text in the game's font, at (x, y). Options, all optional:
//   color     salmon, the game's usual text colour, unless told otherwise
//   size      in pixels; 20 for almost everything
//   align     where x is: 'left' (the default), 'center' or 'right'
//   baseline  where y is: 'middle' of the letters (the default), or
//             'alphabetic', the line they stand on
export function text(ctx, string, x, y, options = {}) {
  const { color = COLORS.salmon, size = 20, align = 'left', baseline = 'middle' } = options;
  ctx.font = font(size);
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillText(string, x, y);
}

// How wide `string` is in the game's font, in pixels.
export function textWidth(ctx, string, size = 20) {
  ctx.font = font(size);
  return ctx.measureText(string).width;
}

function font(size) {
  return `bold ${size}px ${FONT}`;
}

// Text on a blue background patch, so it stays readable on top of anything.
export function label(ctx, string, x, y, color = COLORS.salmon) {
  ctx.fillStyle = COLORS.blue;
  ctx.fillRect(x - 4, y - 11, textWidth(ctx, string) + 8, 22);
  text(ctx, string, x, y, { color });
}

// Same as label(), centred horizontally on the screen.
export function centeredLabel(ctx, string, y, color = COLORS.salmon) {
  label(ctx, string, (ctx.canvas.width - textWidth(ctx, string)) / 2, y, color);
}

// The 3x2 table of ship stats at the bottom of the screen.
import { COLORS, FONT } from '../palette.js';

const LEFT = 16;
const RIGHT = 612;
const TOP = 388;
const BOTTOM = 472;
const COLUMNS = [LEFT, 208, 424, RIGHT];

// What the table shows. At sea and in port it has grain; while boarding it
// has points instead, as in the original.
const LAYOUTS = {
  // Grain can be a fraction (the crew eats half sacks); show whole sacks, as
  // the original did.
  sailing: (state) => [
    [`Træk: ${state.moves}`, `Rgsdl: ${state.money}`, `Korn: ${Math.floor(state.grain)}`],
    [`Mænd: ${state.men}`, `Skyts: ${state.guns}`, `Rep: ${state.repair}`],
  ],
  boarding: (state) => [
    [`Træk: ${state.moves}`, `Rgsdl: ${state.money}`, `Skyts: ${state.guns}`],
    [`Mænd: ${state.men}`, `Point: ${state.points}`, `Rep: ${state.repair}`],
  ],
};

export function drawStatusPanel(ctx, state, layout = 'sailing') {
  const mid = (TOP + BOTTOM) / 2;

  ctx.strokeStyle = COLORS.salmon;
  ctx.lineWidth = 2;
  ctx.strokeRect(LEFT, TOP, RIGHT - LEFT, BOTTOM - TOP);
  ctx.beginPath();
  ctx.moveTo(LEFT, mid);
  ctx.lineTo(RIGHT, mid);
  for (const x of COLUMNS.slice(1, -1)) {
    ctx.moveTo(x, TOP);
    ctx.lineTo(x, BOTTOM);
  }
  ctx.stroke();

  const cells = LAYOUTS[layout](state);
  ctx.fillStyle = COLORS.salmon;
  ctx.font = `bold 20px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  cells.forEach((rowCells, r) => {
    rowCells.forEach((text, c) => {
      ctx.fillText(text, COLUMNS[c] + 14, TOP + (r + 0.5) * (mid - TOP));
    });
  });
}

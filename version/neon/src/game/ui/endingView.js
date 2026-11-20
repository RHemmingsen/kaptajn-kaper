// Drawing the end of the game, in the original's words.
import { COLORS } from '../palette.js';
import { text } from './draw.js';
import { recordLine } from './recordText.js';
import { drawShade } from './synthwave.js';
import { TEXTS } from '../texts.js';

const LEFT = 40;
const TOP = 60;
const LINE = 28; // pixels between lines

// `view` is { ending, sunkBy, name, points, money, men, repair, record, isNew },
// where record is { points, name }, or null if there's none yet.
export function drawEnding(ctx, view) {
  const words = TEXTS.ending;
  const why = view.sunkBy ? [words.tooHeavy[view.sunkBy], words.sankTheShip] : [];
  const lines = [
    ...words.headlines[view.ending],
    ...why,
    '',
    words.result(view.points, view.money),
    words.endedWith(view.men, view.repair),
    '',
    view.isNew ? TEXTS.record.newOne(view.record.points) : recordLine(view.record),
    '',
    TEXTS.common.pressAnyKey,
  ];

  // The ending sits on the synthwave sunset: a dark panel behind the text
  // keeps it readable where it crosses the sun.
  drawShade(ctx, LEFT - 20, TOP - LINE, 640 - 2 * (LEFT - 20), (lines.length + 1) * LINE);
  lines.forEach((line, i) => {
    text(ctx, line, LEFT, TOP + i * LINE, { color: i === 0 ? COLORS.white : COLORS.salmon });
  });
}

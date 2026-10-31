// Drawing the end of the game, in the original's words.
import { COLORS } from '../palette.js';
import { text } from './draw.js';
import { recordLine } from './recordText.js';
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

  lines.forEach((line, i) => {
    text(ctx, line, LEFT, TOP + i * LINE, { color: i === 0 ? COLORS.white : COLORS.salmon });
  });
}

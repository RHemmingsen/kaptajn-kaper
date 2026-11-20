// Drawing a promotion, in the original's words.
import { COLORS } from '../palette.js';
import { text } from './draw.js';
import { TEXTS } from '../texts.js';

const LEFT = 40;
const TOP = 40;
const LINE = 26; // pixels between lines

// `view` is what the scene wants shown: { won, rank, title, name, goal, maxMoves }.
export function drawPromotion(ctx, view) {
  linesFor(view).forEach((line, i) => {
    text(ctx, line, LEFT, TOP + i * LINE, { color: i === 0 ? COLORS.white : COLORS.salmon });
  });
}

function linesFor({ won, rank, title, name, goal, maxMoves }) {
  const words = TEXTS.promotion;
  // "BARON Ronnie", as the original wrote it.
  const titled = [title.toUpperCase(), name].filter(Boolean).join(' ');
  const news = [words.congratulations, '', ...words.news];

  if (won) {
    return [
      ...news,
      '',
      words.julieAwaits,
      '',
      ...words.allDone(titled),
      '',
      TEXTS.common.pressAnyKey,
    ];
  }
  return [
    ...news,
    words.youAreNow(rank),
    '',
    words.julieAwaits,
    '',
    ...words.nextGoal(titled, goal, maxMoves),
    '',
    TEXTS.common.pressAnyKey,
  ];
}

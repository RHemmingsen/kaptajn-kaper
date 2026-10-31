// Drawing a victory, in the original's words.
import { COLORS } from '../palette.js';
import { text } from './draw.js';
import { TEXTS } from '../texts.js';

const LEFT = 40;
const TOP = 50;
const LINE = 28; // pixels between lines

// `view` is what the scene wants shown: { step, spoils, sinking, men }.
export function drawVictory(ctx, view) {
  linesFor(view).forEach((line, i) => {
    text(ctx, line, LEFT, TOP + i * LINE, { color: i === 0 ? COLORS.white : COLORS.salmon });
  });
}

function linesFor({ step, spoils, sinking, men }) {
  const words = TEXTS.victory;
  const pressAnyKey = TEXTS.common.pressAnyKey;

  if (step === 'sunk') {
    const lines = [words.sank];
    if (sinking.joined > 0) lines.push(words.survivorsJoin(sinking.joined));
    if (sinking.toTheSharks > 0) lines.push(words.toTheSharks(sinking.toTheSharks));
    return [...lines, '', pressAnyKey];
  }
  if (step === 'prize') {
    return [words.onItsWay, '', pressAnyKey];
  }
  return [
    words.surrender,
    words.moneyAboard(spoils.money),
    spoils.survivors > 0 ? words.survivors(spoils.survivors) : words.noSurvivors,
    words.grainAboard(spoils.grain),
    '',
    ...words.prizeCrew(spoils.prizeCrew, men),
    ...words.sinkOrTake,
  ];
}

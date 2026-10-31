// Drawing a boarding fight, in the original's words, with the enemy ship in
// the top right corner.
import { COLORS } from '../palette.js';
import { text } from './draw.js';
import { drawSideViewShip } from './shipArt.js';
import { TEXTS } from '../texts.js';

const LEFT = 16;
const TOP = 170;
const LINE = 26; // pixels between lines

// `view` is { enemy, round }: the enemy ship and the last round's result.
export function drawBoarding(ctx, { enemy, round }) {
  drawSideViewShip(ctx, 470, 16, 0.85);

  linesFor(enemy, round).forEach((line, i) => {
    text(ctx, line, LEFT, TOP + i * LINE, { color: COLORS.white });
  });
}

function linesFor(enemy, { enemyLosses, ownLosses, outcome }) {
  const fight = [
    'Kampen raser ombord på',
    enemy.type.pirate ? 'sørøverskibet!' : `den engelske ${TEXTS.ships[enemy.type.id]}!`,
    `Fjenden har ${enemyLosses} faldne,`,
  ];
  if (outcome === 'surrender') {
    return [
      ...fight,
      `og han har kun ${enemy.men} mand igen.`,
      `Du har mistet ${ownLosses} af dine tapre mænd.`,
      '',
      'Hun stryger flaget!',
      'Tryk på en tast.',
    ];
  }
  return [
    ...fight,
    `men han har ${enemy.men} igen.`,
    `Du har mistet ${ownLosses} af dine tapre mænd.`,
    '',
    'Vil du kæmpe videre (k)',
    'eller vende tilbage til dit skib (t)?',
  ];
}

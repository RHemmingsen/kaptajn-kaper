// Drawing a boarding fight, in the original's words, with the enemy ship in
// the top right corner.
import { COLORS, FONT } from '../palette.js';
import { drawSideViewShip } from './shipArt.js';

const LEFT = 16;
const TOP = 170;
const LINE = 26; // pixels between lines

// `view` is { enemy, round }: the enemy ship and the last round's result.
export function drawBoarding(ctx, { enemy, round }) {
  drawSideViewShip(ctx, 470, 16, 0.85);

  linesFor(enemy, round).forEach((line, i) => {
    ctx.font = `bold 20px ${FONT}`;
    ctx.fillStyle = COLORS.white;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(line, LEFT, TOP + i * LINE);
  });
}

function linesFor(enemy, { enemyLosses, ownLosses, outcome }) {
  const fight = [
    'Kampen raser ombord på',
    enemy.type.pirate ? 'sørøverskibet!' : `den engelske ${enemy.type.name}!`,
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

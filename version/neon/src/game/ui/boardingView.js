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
  const words = TEXTS.boarding;
  const fight = [
    words.ragingAboard,
    enemy.type.pirate ? words.thePirateShip : words.theEnglish(TEXTS.ships[enemy.type.id]),
    words.enemyFallen(enemyLosses),
  ];
  if (outcome === 'surrender') {
    return [
      ...fight,
      words.enemyOnlyLeft(enemy.men),
      words.youLost(ownLosses),
      '',
      TEXTS.battle.strikesHerFlag,
      TEXTS.common.pressAnyKey,
    ];
  }
  return [
    ...fight,
    words.enemyLeft(enemy.men),
    words.youLost(ownLosses),
    '',
    ...words.fightOrReturn,
  ];
}

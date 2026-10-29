// Drawing the help: the topic menu, and a topic's pages. Pages are drawn
// like the original's 40-column text screens, a little smaller than the
// rest of the game's text so 23 lines fit.
import { BATTLE_PICTURE } from '../helpText.js';
import { COLORS, FONT } from '../palette.js';
import { drawBattle } from './battleView.js';

const LEFT = 90;
const TOP = 24;
const LINE = 19; // pixels between lines on a page
const PRESS_ANY_KEY_Y = 466;

// The original's example battle, shown where its help said "Se lige på
// billedet": your ship and the enemy's, the distance, and the wind.
const EXAMPLE_BATTLE = {
  battle: {
    enemy: { distance: 520, guns: 12, men: 36, repair: 72 },
    wind: { side: 1, length: 1, strength: 4 },
    aim: { elevation: 0, side: 0 },
  },
  state: { guns: 17, men: 97, repair: 142 },
  step: 'aim',
  result: null,
};

export function drawHelpMenu(ctx, topics) {
  text(ctx, 'Hvilket emne ønsker du at høre om:', LEFT - 50, 50, COLORS.white, 20);
  topics.forEach((topic, i) => {
    text(ctx, `${topic.key}: ${topic.title}`, LEFT - 30, 100 + i * 28, COLORS.salmon, 20);
  });
  text(ctx, 'Vælg 0-9, eller Esc for at lukke hjælpen.', LEFT - 50, 100 + topics.length * 28 + 30, COLORS.white, 20);
}

export function drawHelpPage(ctx, page) {
  if (page === BATTLE_PICTURE) {
    drawBattle(ctx, EXAMPLE_BATTLE);
    text(ctx, 'Tryk på en tast.', 24, 316, COLORS.white, 20);
    return;
  }
  page.forEach((line, i) => text(ctx, line, LEFT, TOP + i * LINE, COLORS.salmon, 18));
  text(ctx, 'Tryk på en tast for at fortsætte!', LEFT, PRESS_ANY_KEY_Y, COLORS.white, 18);
}

function text(ctx, string, x, y, color, size) {
  ctx.font = `bold ${size}px ${FONT}`;
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(string, x, y);
}

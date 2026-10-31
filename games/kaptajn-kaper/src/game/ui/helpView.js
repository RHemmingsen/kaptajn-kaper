// Drawing the help: the topic menu, and a topic's pages. Pages are drawn
// like the original's 40-column text screens, a little smaller than the
// rest of the game's text so 23 lines fit.
import { BATTLE_PICTURE } from '../helpText.js';
import { COLORS } from '../palette.js';
import { text } from './draw.js';
import { drawBattle } from './battleView.js';
import { TEXTS } from '../texts.js';

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
  text(ctx, TEXTS.help.whichTopic, LEFT - 50, 50, { color: COLORS.white });
  topics.forEach((topic, i) => {
    text(ctx, TEXTS.help.topic(topic.key, topic.title), LEFT - 30, 100 + i * 28);
  });
  const bottom = 100 + topics.length * 28 + 30;
  text(ctx, TEXTS.help.chooseOrClose, LEFT - 50, bottom, { color: COLORS.white });
}

export function drawHelpPage(ctx, page) {
  if (page === BATTLE_PICTURE) {
    drawBattle(ctx, EXAMPLE_BATTLE);
    text(ctx, TEXTS.common.pressAnyKey, 24, 316, { color: COLORS.white });
    return;
  }
  page.forEach((line, i) => text(ctx, line, LEFT, TOP + i * LINE, { size: 18 }));
  text(ctx, TEXTS.common.pressAnyKeyToContinue, LEFT, PRESS_ANY_KEY_Y, { color: COLORS.white, size: 18 });
}


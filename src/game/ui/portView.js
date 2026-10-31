// Drawing a port: the trading menu, in the original's words.
import { COLORS } from '../palette.js';
import { text } from './draw.js';
import { TEXTS } from '../texts.js';

const LEFT = 40;
const LINE = 28; // pixels between lines

// `view` is what the scene wants shown:
//   { city, prices, step, trade, amountText, cursorOn, message, jewels, prizes }
export function drawPort(ctx, view) {
  const { prices } = view;

  if (view.step === 'prizes') {
    drawPrizes(ctx, view.city, view.prizes);
    return;
  }

  const words = TEXTS.port;
  text(ctx, words.welcome(view.city.name), LEFT, 50, { color: COLORS.white, size: 26 });
  text(ctx, words.whatNow, LEFT, 100);

  const menu = words.menu(prices);
  menu.forEach((line, i) => text(ctx, line, LEFT, 140 + i * LINE));

  const y = 140 + menu.length * LINE + 20;
  if (view.step === 'sellWhat') {
    text(ctx, words.sellWhat, LEFT, y, { color: COLORS.white });
    text(ctx, words.jewelsAndBack(view.jewels), LEFT, y + LINE);
  } else if (view.step === 'amount') {
    const question = words.howMany[view.trade.action][view.trade.good];
    const cursor = view.cursorOn ? '_' : ' ';
    text(ctx, `${question} ${view.amountText}${cursor}`, LEFT, y, { color: COLORS.white });
    text(ctx, words.tradeKeys, LEFT, y + LINE);
  } else if (view.message) {
    text(ctx, messageText(view.message), LEFT, y, { color: COLORS.white });
  }
}

// The prize crews and prize money waiting in the prize port.
function drawPrizes(ctx, city, { men, money, leftBehind }) {
  text(ctx, TEXTS.port.hurray, LEFT, 50, { color: COLORS.white, size: 26 });
  TEXTS.port.prizesWaiting(city.name, men, money).forEach((line, i) => text(ctx, line, LEFT, 100 + i * LINE));
  let y = 100 + 5 * LINE;
  if (leftBehind > 0) {
    TEXTS.port.leftBehind(leftBehind).forEach((line, i) => text(ctx, line, LEFT, y + i * LINE));
    y += 3 * LINE;
  }
  text(ctx, TEXTS.common.pressAnyKey, LEFT, y, { color: COLORS.white });
}

function messageText({ action, result }) {
  const words = TEXTS.port;
  if (!result.ok) return words.refused[result.reason] ?? words.cantDoThat;
  return action === 'buy' ? words.cost(result.total) : words.earned(result.total);
}


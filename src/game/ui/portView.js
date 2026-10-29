// Drawing a port: the trading menu, in the original's words.
import { COLORS, FONT } from '../palette.js';

const LEFT = 40;
const LINE = 28; // pixels between lines

const QUESTIONS = {
  buy: {
    men: 'Hvor mange mænd vil du hyre?',
    repair: 'Hvor mange point vil du reparere?',
    guns: 'Hvor mange kanoner vil du købe?',
    grain: 'Hvor mange sække korn vil du købe?',
  },
  sell: {
    grain: 'Hvor mange sække korn vil du sælge?',
    guns: 'Hvor mange kanoner vil du sælge?',
    jewels: 'Hvor mange juveler vil du sælge?',
  },
};

const REFUSALS = {
  cantAfford: 'Det har du ikke råd til!',
  tooMany: 'Det er for mange!',
  notEnough: 'Så mange har du ikke!',
};

// `view` is what the scene wants shown:
//   { city, prices, step, trade, amountText, cursorOn, message, jewels }
export function drawPort(ctx, view) {
  const { prices } = view;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  text(ctx, `Velkommen til ${view.city.name}`, 50, COLORS.white, 26);
  text(ctx, 'Hvad vil du?', 100);

  const menu = [
    `1: Hyre flere mænd (${prices.men} rgsd pr. mand)`,
    `2: Reparere skibet (${prices.repair} rgsd pr. point)`,
    `3: Købe kanoner (${prices.guns} rgsd pr. stk)`,
    `4: Købe korn (${prices.grain} rgsd pr. sæk)`,
    '5: Sælge noget',
    '6: Stå til søs igen',
  ];
  menu.forEach((line, i) => text(ctx, line, 140 + i * LINE));

  const y = 140 + menu.length * LINE + 20;
  if (view.step === 'sellWhat') {
    text(ctx, 'Korn (k), skyts (s) eller juveler (j)?', y, COLORS.white);
    text(ctx, `Du har ${view.jewels} juveler.  Esc: tilbage`, y + LINE);
  } else if (view.step === 'amount') {
    const question = QUESTIONS[view.trade.action][view.trade.good];
    const cursor = view.cursorOn ? '_' : ' ';
    text(ctx, `${question} ${view.amountText}${cursor}`, y, COLORS.white);
    text(ctx, 'Enter: handl  Esc: fortryd', y + LINE);
  } else if (view.message) {
    text(ctx, messageText(view.message), y, COLORS.white);
  }
}

function messageText({ action, result }) {
  if (!result.ok) return REFUSALS[result.reason] ?? 'Det kan du ikke!';
  return action === 'buy'
    ? `Det kostede ${result.total} rigsdaler.`
    : `Du fik ${result.total} rigsdaler.`;
}

function text(ctx, string, y, color = COLORS.salmon, size = 20) {
  ctx.font = `bold ${size}px ${FONT}`;
  ctx.fillStyle = color;
  ctx.fillText(string, LEFT, y);
}

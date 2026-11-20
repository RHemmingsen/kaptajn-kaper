// Drawing what the lookout spotted, in the original's words.
import { COLORS } from '../palette.js';
import { text } from './draw.js';
import { TEXTS } from '../texts.js';

const LEFT = 40;
const TOP = 50;
const LINE = 28; // pixels between lines

// `view` is what the scene wants shown: { step, ship, outcome, addressedAs }.
export function drawSeaEvent(ctx, view) {
  linesFor(view).forEach((line, i) => {
    text(ctx, line, LEFT, TOP + i * LINE, { color: i === 0 ? COLORS.white : COLORS.salmon });
  });
}

function linesFor({ step, ship, outcome, addressedAs }) {
  const words = TEXTS.sea;
  const choose = words.youMustChoose(addressedAs);

  switch (step) {
    case 'ship':
      return [
        words.lookoutReports,
        words.shipAhoy,
        words.inSight(shipName(ship)),
        '',
        choose,
        '',
        words.attackOrFlee,
      ];
    case 'attackHow':
      return [
        words.inSight(shipName(ship)),
        '',
        ...words.boardOrShoot,
      ];
    case 'fog':
      return [
        words.lookoutReports,
        words.ahoy,
        ...words.fogBank,
        '',
        choose,
        '',
        words.investigate,
      ];
    case 'outcome':
      return [...outcomeLines(outcome), '', TEXTS.common.pressAnyKey];
    default:
      throw new Error(`Unknown sea event step '${step}'`);
  }
}

// What was in the fog bank. Anything else is nothing.
function outcomeLines(outcome) {
  const found = TEXTS.sea.found[outcome.kind] ?? TEXTS.sea.found.nothing;
  return found(outcome);
}

// "Engelsk galease", or the pirate ship, which isn't English.
function shipName(ship) {
  if (ship.type.pirate) return TEXTS.sea.pirateShip;
  return TEXTS.sea.english(TEXTS.ships[ship.type.id]);
}

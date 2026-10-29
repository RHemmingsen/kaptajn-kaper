// Drawing what the lookout spotted, in the original's words.
import { COLORS, FONT } from '../palette.js';

const LEFT = 40;
const TOP = 50;
const LINE = 28; // pixels between lines

// `view` is what the screen wants shown: { step, ship, outcome, rank }.
export function drawSeaEvent(ctx, view) {
  linesFor(view).forEach((line, i) => {
    ctx.font = `bold 20px ${FONT}`;
    ctx.fillStyle = i === 0 ? COLORS.white : COLORS.salmon;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(line, LEFT, TOP + i * LINE);
  });
}

function linesFor({ step, ship, outcome, rank }) {
  const choose = `Nå ${rank}, nu må du vælge:`;
  const pressAnyKey = 'Tryk på en tast.';

  switch (step) {
    case 'ship':
      return [
        'Udkiggen melder:',
        'Ship ohøj!',
        `${shipName(ship)} i sigte!`,
        '',
        choose,
        '',
        'Vil du angribe (a) eller flygte (f)?',
      ];
    case 'attackHow':
      return [
        `${shipName(ship)} i sigte!`,
        '',
        'Vil du borde hende (b) eller',
        'vil du skyde (s) på hende?',
      ];
    case 'fog':
      return [
        'Udkiggen melder:',
        'Ohøj!',
        'Der er en underlig tågebanke 2 sømil',
        'til styrbord. Det ser ud til,',
        'at der er noget inde i den.',
        '',
        choose,
        '',
        'Vil du undersøge det (j/n)?',
      ];
    case 'outcome':
      return [...outcomeLines(outcome), '', pressAnyKey];
    default:
      throw new Error(`Unknown sea event step '${step}'`);
  }
}

function outcomeLines(outcome) {
  switch (outcome.kind) {
    case 'ship':
      return ['Der dukker af disen', 'et væmmeligt skib!'];
    case 'treasure':
      return ['Du finder en ø', 'med en skattekiste,', `der indeholder ${outcome.money} rigsdaler!`];
    case 'jewels':
      return ['Du finder en ø', `med ${outcome.count} juveler!`];
    case 'gun':
      return ['Du finder en ø,', 'hvor der ligger en kanon,', 'som du tager ombord på dit skib!'];
    case 'castaways':
      return [
        'Du finder en ø',
        `med en flok på ${outcome.count} skibbrudne,`,
        'som tager hyre på dit skib!',
      ];
    case 'grain':
      return ['Du finder en ø', `med ${outcome.count} sække korn!`];
    case 'plague':
      return [
        'Du finder en ø',
        'med en pestsyg skibbruden!',
        'Han smitter din besætning, og',
        `en trediedel af dit mandskab dør (${outcome.count} mand)!`,
        'Resten er ikke alt for begejstrede',
        'for dit lederskab!',
      ];
    default:
      return ['Næh!', 'Der var alligevel ikke noget.'];
  }
}

// "Engelsk galease", or the pirate ship, which isn't English.
function shipName(ship) {
  if (ship.type.pirate) return 'Sørøverskib';
  return `Engelsk ${ship.type.name}`;
}

// Drawing a victory, in the original's words.
import { COLORS, FONT } from '../palette.js';

const LEFT = 40;
const TOP = 50;
const LINE = 28; // pixels between lines

// `view` is what the scene wants shown: { step, spoils, sinking, men }.
export function drawVictory(ctx, view) {
  linesFor(view).forEach((line, i) => {
    ctx.font = `bold 20px ${FONT}`;
    ctx.fillStyle = i === 0 ? COLORS.white : COLORS.salmon;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(line, LEFT, TOP + i * LINE);
  });
}

function linesFor({ step, spoils, sinking, men }) {
  const pressAnyKey = 'Tryk på en tast.';

  if (step === 'sunk') {
    const lines = ['Den sank!!'];
    if (sinking.joined > 0) lines.push(`Hendes ${sinking.joined} overlevende går over til dig.`);
    if (sinking.toTheSharks > 0) lines.push(`Du smider ${sinking.toTheSharks} mand ud til hajerne!`);
    return [...lines, '', pressAnyKey];
  }
  if (step === 'prize') {
    return ['OK, de er på vej til København.', '', pressAnyKey];
  }
  return [
    'De overgiver sig!!',
    `Der er ${spoils.money} rigsdaler ombord.`,
    spoils.survivors > 0 ? `Der er ${spoils.survivors} overlevende.` : 'Det flyder med lig på dækket.',
    `Der er ${spoils.grain} sække korn ombord. Dem tager du!`,
    '',
    'Dette skib behøver et prisemandskab',
    `på ${spoils.prizeCrew} mand! Du har ${men} mand.`,
    'Vil du sænke det (s)',
    'eller tage det som prise (p)?',
  ];
}

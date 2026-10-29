// Drawing the name question before a new game, and the greeting after it.
import { COLORS, FONT } from '../palette.js';
import { recordLine } from './recordText.js';

const LEFT = 40;
const TOP = 60;
const LINE = 28; // pixels between lines

// `view` is what the scene wants shown:
//   { step, text, cursorOn, name, record }, where record is { points, name } or null
export function drawName(ctx, { step, text, cursorOn, name, record }) {
  const lines = step === 'greeting'
    ? [
      `OK, ${name}.`,
      '',
      'Du kan afbryde spillet',
      'ved at trykke på Esc!',
      '',
      'Tryk på en tast.',
    ]
    : [
      'Hvad er dit navn?',
      '',
      `${text}${cursorOn ? '_' : ' '}`,
      '',
      'Enter: ok   Esc: tilbage',
      '',
      '',
      record ? recordLine(record) : 'Der er ingen rekord endnu.',
    ];

  lines.forEach((line, i) => {
    ctx.font = `bold 20px ${FONT}`;
    ctx.fillStyle = i === 0 || (step === 'name' && i === 2) ? COLORS.white : COLORS.salmon;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(line, LEFT, TOP + i * LINE);
  });
}

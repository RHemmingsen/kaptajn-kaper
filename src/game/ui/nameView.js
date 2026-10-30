// Drawing the name question before a new game, and the greeting after it.
import { COLORS } from '../palette.js';
import { text } from './draw.js';
import { recordLine } from './recordText.js';

const LEFT = 40;
const TOP = 60;
const LINE = 28; // pixels between lines

// `view` is what the scene wants shown:
//   { step, text, cursorOn, name, record }, where text is what's typed so far
//   and record is { points, name } or null
export function drawName(ctx, { step, text: typed, cursorOn, name, record }) {
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
      `${typed}${cursorOn ? '_' : ' '}`,
      '',
      'Enter: ok   Esc: tilbage',
      '',
      '',
      recordLine(record),
    ];

  lines.forEach((line, i) => {
    const color = i === 0 || (step === 'name' && i === 2) ? COLORS.white : COLORS.salmon;
    text(ctx, line, LEFT, TOP + i * LINE, { color });
  });
}

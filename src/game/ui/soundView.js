// Drawing the question about sound at the start, in the original's words.
import { COLORS } from '../palette.js';
import { text } from './draw.js';
import { TEXTS } from '../texts.js';

const LEFT = 40;
const TOP = 60;
const LINE = 28; // pixels between lines

export function drawSoundQuestion(ctx, soundOn) {
  const words = TEXTS.sound;
  const lines = [
    words.flipWithF2,
    '',
    words.whatNow,
    '',
    words.silence,
    words.effects,
    '',
    words.current(soundOn ? 1 : 0),
    '',
    words.newValue,
  ];

  lines.forEach((line, i) => {
    text(ctx, line, LEFT, TOP + i * LINE, { color: i === 4 || i === 5 ? COLORS.salmon : COLORS.white });
  });
}

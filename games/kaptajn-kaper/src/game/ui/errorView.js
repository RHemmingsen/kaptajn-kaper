// What the player sees if the game crashes (see Game.crash): that something
// went wrong, and the error's own message, which is in English.
import { COLORS } from '../palette.js';
import { clearScreen, text } from './draw.js';
import { TEXTS } from '../texts.js';

const LEFT = 40;
const TOP = 60;
const LINE = 28; // pixels between lines
const MAX_LINE_LENGTH = 48; // characters; the font is monospaced

export function drawError(ctx, error) {
  clearScreen(ctx);
  text(ctx, TEXTS.error.happened, LEFT, TOP, { color: COLORS.white });
  wrap(String(error?.message ?? error)).forEach((line, i) => {
    text(ctx, line, LEFT, TOP + (i + 2) * LINE);
  });
}

// Split a message into lines that fit the screen, between words.
function wrap(message) {
  const lines = [];
  let line = '';
  for (const word of message.split(' ')) {
    if (line && (line + ' ' + word).length > MAX_LINE_LENGTH) {
      lines.push(line);
      line = word;
    } else {
      line = line ? line + ' ' + word : word;
    }
  }
  return [...lines, line];
}

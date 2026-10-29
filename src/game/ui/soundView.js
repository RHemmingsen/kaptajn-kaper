// Drawing the question about sound at the start, in the original's words.
import { COLORS, FONT } from '../palette.js';

const LEFT = 40;
const TOP = 60;
const LINE = 28; // pixels between lines

export function drawSoundQuestion(ctx, soundOn) {
  const lines = [
    'Du kan altid flippe lyden af og på med F2!',
    '',
    'Hvad vælger du lige nu?:',
    '',
    '0: Stilhed',
    '1: Lydeffekter',
    '',
    `Nuværende værdi: ${soundOn ? 1 : 0}   (Enter beholder den)`,
    '',
    'Angiv ny værdi:',
  ];

  lines.forEach((line, i) => {
    ctx.font = `bold 20px ${FONT}`;
    ctx.fillStyle = i === 4 || i === 5 ? COLORS.salmon : COLORS.white;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(line, LEFT, TOP + i * LINE);
  });
}

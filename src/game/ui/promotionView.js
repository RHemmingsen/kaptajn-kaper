// Drawing a promotion, in the original's words.
import { COLORS } from '../palette.js';
import { text } from './draw.js';

const LEFT = 40;
const TOP = 40;
const LINE = 26; // pixels between lines

// `view` is what the scene wants shown: { won, rank, title, name, goal, maxMoves }.
export function drawPromotion(ctx, view) {
  linesFor(view).forEach((line, i) => {
    text(ctx, line, LEFT, TOP + i * LINE, { color: i === 0 ? COLORS.white : COLORS.salmon });
  });
}

function linesFor({ won, rank, title, name, goal, maxMoves }) {
  // "BARON Ronnie", as the original wrote it.
  const titled = [title.toUpperCase(), name].filter(Boolean).join(' ');
  const news = [
    'Tillykke!!!!',
    '',
    'Du har netop modtaget',
    'din udnævnelse med flaskepost.',
  ];
  const julie = 'Komtesse Julie venter dig med længsel!';

  if (won) {
    return [
      ...news,
      '',
      julie,
      '',
      'Du har klaret det hele.',
      'Du får også det halve kongerige,',
      `${titled}!`,
      '',
      'Tryk på en tast.',
    ];
  }
  return [
    ...news,
    `Du er nu ${rank}.`,
    '',
    julie,
    '',
    'Lad os se, om du kan klare',
    `det næste mål, ${titled}!`,
    `${goal} point inden træk ${maxMoves}.`,
    '',
    'Tryk på en tast.',
  ];
}

// Drawing the end of the game, in the original's words.
import { COLORS, FONT } from '../palette.js';
import { recordLine } from './recordText.js';

const LEFT = 40;
const TOP = 60;
const LINE = 28; // pixels between lines

// What happened, for each way the game can end.
const HEADLINES = {
  sunk: ['Beklager, dit skib gik ned!'],
  jilted: [
    'Det er med sorg, vi meddeler, at',
    'Komtesse Julie Knokkelfryd',
    'i dag fejrer sit bryllup med',
    'den velbårne Tulleman Gylleborg!',
    '',
    'Af sorg herover, hopper du i havet!',
  ],
  won: ['Komtesse Julie er din!'],
};

// When it was the weight of the cargo that sank her.
const TOO_HEAVY = {
  money: 'Vægten af alle dine penge',
  men: 'Vægten af alle dine folk',
  guns: 'Vægten af alle dine kanoner',
  grain: 'Vægten af alt dit korn',
};

// `view` is { ending, sunkBy, name, points, money, men, repair, record, isNew },
// where record is { points, name }, or null if there's none yet.
export function drawEnding(ctx, view) {
  const why = view.sunkBy ? [TOO_HEAVY[view.sunkBy], 'fik skibet til at synke!'] : [];
  const lines = [
    ...HEADLINES[view.ending],
    ...why,
    '',
    `Du fik ${view.points} point og havde ${view.money} rigsdaler!`,
    `Du sluttede med ${view.men} mand og ${view.repair} Rep.`,
    '',
    view.isNew ? `Ny rekord: ${view.record.points} point!` : recordLine(view.record),
    '',
    'Tryk på en tast.',
  ];

  lines.forEach((line, i) => {
    ctx.font = `bold 20px ${FONT}`;
    ctx.fillStyle = i === 0 ? COLORS.white : COLORS.salmon;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(line, LEFT, TOP + i * LINE);
  });
}

// Drawing the harbor minigame: walls, docks, ships at anchor, our ship, and
// where the gusts come from. Also the original's instructions, shown first.
import { COLORS, FONT } from '../palette.js';
import { LAYOUT, gustDirection } from '../rules/harbor.js';

// Where the gust indicator sits: below the left dock.
const WIND_X = 40;
const WIND_Y = 446;
const WIND_ARROW_HALF = 40; // half the arrow's length

const INTRO_LEFT = 24;
const INTRO_TOP = 36;
const INTRO_LINE = 24;

export function drawHarbor(ctx, harbor) {
  drawGustIndicator(ctx, harbor);
  drawWall(ctx, LAYOUT.wallLeft - 14);
  drawWall(ctx, LAYOUT.wallRight + 2);

  ctx.fillStyle = COLORS.brown;
  for (const dock of harbor.docks) ctx.fillRect(dock.x, dock.y, dock.w, dock.h);

  for (const obstacle of harbor.obstacles) drawAnchoredShip(ctx, obstacle);
  drawOurShip(ctx, harbor.ship);
  if (harbor.gustTimer > 0) drawGust(ctx, harbor);
}

// The original's instructions, before you sail in.
export function drawHarborIntro(ctx, harbor) {
  const from = harbor.gustsFrom === 'right' ? 'højre' : 'venstre';
  const lines = [
    `Du er på vej ind i havnen i ${harbor.city.name}.`,
    'Styr uden om de andre skibe på reden',
    'ind i havneindløbet.',
    'Brug 4 eller ← for at flytte til venstre',
    'og 6 eller → for at flytte til højre.',
    '',
    'Hvis du støder ind i et af de andre skibe,',
    'vil dit skib blive beskadiget, men hvis du',
    'rammer ved siden af havneindløbet,',
    'så overlever du det ikke!',
    '',
    `Pas på!!! Der kan komme vindstød fra ${from}!`,
    '',
    'Tryk på en tast for at fortsætte!',
  ];
  lines.forEach((line, i) => {
    ctx.font = `bold 20px ${FONT}`;
    ctx.fillStyle = i === 11 ? COLORS.white : COLORS.salmon;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(line, INTRO_LEFT, INTRO_TOP + i * INTRO_LINE);
  });
  drawArrow(ctx, INTRO_LEFT + 560, INTRO_TOP + 11 * INTRO_LINE, gustDirection(harbor), 20);
}

// "Vindstød fra højre" and an arrow the way the gusts push.
function drawGustIndicator(ctx, harbor) {
  const from = harbor.gustsFrom === 'right' ? 'højre' : 'venstre';
  ctx.fillStyle = COLORS.white;
  ctx.font = `bold 20px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const text = `Vindstød fra ${from}`;
  ctx.fillText(text, WIND_X, WIND_Y);
  // The arrow goes just after the text, which is longer for "venstre".
  const arrowX = WIND_X + ctx.measureText(text).width + 20 + WIND_ARROW_HALF;
  drawArrow(ctx, arrowX, WIND_Y, gustDirection(harbor), WIND_ARROW_HALF);
}

// While a gust blows: three arrows just above the ship, the way it pushes.
function drawGust(ctx, harbor) {
  const { x, y, w } = harbor.ship;
  const direction = gustDirection(harbor);
  for (let i = -1; i <= 1; i++) drawArrow(ctx, x + w / 2 + i * 16, y - 12, direction, 7);
}

// A white arrow centred on (x, y), pointing left (-1) or right (1).
function drawArrow(ctx, x, y, direction, halfLength) {
  const tip = x + direction * halfLength;
  ctx.strokeStyle = COLORS.white;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - direction * halfLength, y);
  ctx.lineTo(tip, y);
  ctx.moveTo(tip - direction * 8, y - 6);
  ctx.lineTo(tip, y);
  ctx.lineTo(tip - direction * 8, y + 6);
  ctx.stroke();
}

// A column of magenta and cyan dots, like the original's harbor walls.
function drawWall(ctx, x) {
  for (let y = 16; y < LAYOUT.dockTop + LAYOUT.dockHeight; y += 4) {
    ctx.fillStyle = COLORS.magenta;
    ctx.fillRect(x, y, 2, 2);
    ctx.fillRect(x + 8, y + 2, 2, 2);
    ctx.fillStyle = COLORS.cyan;
    ctx.fillRect(x + 4, y + 2, 2, 2);
    ctx.fillRect(x + 10, y, 2, 2);
  }
}

// Two masts on a red hull. Drawn to fill the obstacle's collision box.
function drawAnchoredShip(ctx, { x, y, w, h }) {
  ctx.fillStyle = COLORS.red;
  ctx.fillRect(x, y + h - 6, w, 6);
  ctx.fillStyle = COLORS.cyan;
  ctx.fillRect(x + 3, y + 2, 3, h - 8);
  ctx.fillRect(x + w - 6, y + 2, 3, h - 8);
  ctx.fillStyle = COLORS.green;
  ctx.fillRect(x + 3, y, 3, 3);
  ctx.fillRect(x + w - 6, y, 3, 3);
}

function drawOurShip(ctx, { x, y, w, h }) {
  ctx.fillStyle = COLORS.cyan;
  ctx.fillRect(x, y + h - 6, w, 6);
  ctx.fillStyle = COLORS.red;
  ctx.fillRect(x + 4, y, w - 8, h - 6);
  ctx.fillStyle = COLORS.green;
  ctx.fillRect(x + 2, y + h - 3, w - 4, 3);
}

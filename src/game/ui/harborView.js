// Drawing the harbor minigame: walls, docks, ships at anchor, our ship, and
// where the gusts come from. Also the original's instructions, shown first.
import { COLORS } from '../palette.js';
import { LAYOUT, gustDirection } from '../rules/harbor.js';
import { centeredLabel, text, textWidth } from './draw.js';
import { TEXTS } from '../texts.js';

// Where the gust indicator sits: below the left dock.
const WIND_X = 40;
const WIND_Y = 446;
const WIND_ARROW_HALF = 40; // half the arrow's length

const INTRO_LEFT = 24;
const INTRO_TOP = 36;
const INTRO_LINE = 24;

// The harbor while you sail in, with the message after a crash and the
// welcome once you're in. `state` is for the Rep left after a crash.
export function drawHarbor(ctx, harbor, state) {
  drawGustIndicator(ctx, harbor);
  drawWall(ctx, LAYOUT.wallLeft - 14);
  drawWall(ctx, LAYOUT.wallRight + 2);

  ctx.fillStyle = COLORS.brown;
  for (const dock of harbor.docks) ctx.fillRect(dock.x, dock.y, dock.w, dock.h);

  for (const obstacle of harbor.obstacles) drawAnchoredShip(ctx, obstacle);
  drawOurShip(ctx, harbor.ship);
  if (harbor.gustTimer > 0) drawGust(ctx, harbor);

  if (harbor.crashTimer > 0) {
    centeredLabel(ctx, TEXTS.harbor.crash(harbor.lastCrash, state.repair), 240, COLORS.white);
  }
  if (harbor.status === 'docked') {
    centeredLabel(ctx, TEXTS.harbor.welcome(harbor.city.name), 440, COLORS.white);
    centeredLabel(ctx, TEXTS.harbor.pressAnyKey, 464, COLORS.white);
  }
}

// The original's instructions, before you sail in.
export function drawHarborIntro(ctx, harbor) {
  const words = TEXTS.harbor;
  const lines = [
    words.sailingInto(harbor.city.name),
    ...words.instructions,
    '',
    ...words.warning,
    '',
    words.gustsMayCome(words.sides[harbor.gustsFrom]),
    '',
    TEXTS.common.pressAnyKeyToContinue,
  ];
  lines.forEach((line, i) => {
    const color = i === 11 ? COLORS.white : COLORS.salmon;
    text(ctx, line, INTRO_LEFT, INTRO_TOP + i * INTRO_LINE, { color });
  });
  drawArrow(ctx, INTRO_LEFT + 560, INTRO_TOP + 11 * INTRO_LINE, gustDirection(harbor), 20);
}

// "Vindstød fra højre" and an arrow the way the gusts push.
function drawGustIndicator(ctx, harbor) {
  const message = TEXTS.harbor.gustsFrom(TEXTS.harbor.sides[harbor.gustsFrom]);
  text(ctx, message, WIND_X, WIND_Y, { color: COLORS.white });
  // The arrow goes just after the text, which is longer for "venstre".
  const arrowX = WIND_X + textWidth(ctx, message) + 20 + WIND_ARROW_HALF;
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

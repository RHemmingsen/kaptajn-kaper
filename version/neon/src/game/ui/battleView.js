// Drawing a gun battle, laid out like the original's "Sigte" screen: the
// enemy ("Fjende") and your ship ("Egen") from above with the splashes, the
// sights on the enemy ship, and a table of both ships.
import { COLORS } from '../palette.js';
import { text } from './draw.js';
import { drawSideViewShip } from './shipArt.js';
import { TEXTS } from '../texts.js';

// The three panels.
const ENEMY_PANEL = { x: 16, y: 16, w: 284, h: 114 };
const OWN_PANEL = { x: 16, y: 140, w: 284, h: 110 };
const SIGHTS_PANEL = { x: 316, y: 16, w: 308, h: 234 };

// The sights: their centre on screen, and pixels per step of aim.
const SIGHTS_X = 470;
const SIGHTS_Y = 110;
const AIM_SCALE = 3;

// Where your shot's splash shows next to the enemy, by where it landed.
const SPLASH = {
  left: [60, 73], right: [256, 73], short: [158, 108], long: [158, 40], hit: [158, 73],
};

// The table at the bottom. Columns: wind, labels, your ship, the enemy.
const TABLE_LEFT = 16;
const LABELS_X = 150;
const OWN_X = 270;
const ENEMY_X = 440;
const TABLE_RIGHT = 612;
// Rows: the header, then Skyts, Mand and Rep.
const ROWS = [330, 365, 401, 437, 472];

// `view` is { battle, state, step, result }; nothing here changes them.
export function drawBattle(ctx, { battle, state, step, result }) {
  drawPanel(ctx, ENEMY_PANEL, TEXTS.battle.enemy);
  drawHull(ctx, 158, 73, COLORS.magenta);
  if (result?.shot) drawSplash(ctx, ...SPLASH[result.shot.lands]);

  drawPanel(ctx, OWN_PANEL, TEXTS.battle.own);
  drawHull(ctx, 158, 200, COLORS.cyan);
  if (result) drawEnemyHits(ctx, result.enemyFire);

  drawPanel(ctx, SIGHTS_PANEL, null);
  drawSideViewShip(ctx, 392, 44); // the target
  drawSights(ctx, battle.aim);
  if (step === 'aim') text(ctx, TEXTS.battle.aim, 440, 236, { color: COLORS.white });
  else text(ctx, TEXTS.common.pressAnyKey, 372, 236, { color: COLORS.white });

  drawMessages(ctx, step, result);
  drawTable(ctx, battle, state);
}

// Up to three lines between the panels and the table.
function drawMessages(ctx, step, result) {
  const lines = step === 'aim' ? TEXTS.battle.howToAim : resultLines(result);
  lines.forEach((line, i) => {
    text(ctx, line, 24, 268 + i * 24, { color: i === 0 ? COLORS.white : COLORS.salmon });
  });
}

// Your shot (none if you were sunk first), the enemy's fire, and how it ended.
function resultLines({ shot, enemyFire, outcome, points }) {
  const lines = [];
  if (shot) lines.push(shotText(shot));
  lines.push(enemyFireText(enemyFire));
  if (outcome === 'sunk') lines.push(TEXTS.battle.sank(points));
  if (outcome === 'surrender') lines.push(TEXTS.battle.strikesHerFlag);
  return lines;
}

function shotText(shot) {
  const words = TEXTS.battle;
  if (shot.lands !== 'hit') return words.landed[shot.lands];
  // If she struck her flag or sank from the damage, her men weren't counted.
  return shot.menKilled === undefined
    ? words.hit(shot.damage)
    : words.hitAndKilled(shot.damage, shot.menKilled);
}

function enemyFireText({ repair, men, gun }) {
  const words = TEXTS.battle;
  const losses = [];
  if (repair > 0) losses.push(words.lostRepair(repair));
  if (men > 0) losses.push(words.lostMen(men));
  if (gun) losses.push(words.lostGun);
  return losses.length ? words.enemyHits(losses) : words.enemyMisses;
}

function drawTable(ctx, { enemy, wind }, state) {
  const top = ROWS[0];
  const header = ROWS[1];
  const bottom = ROWS.at(-1);

  ctx.strokeStyle = COLORS.white;
  ctx.lineWidth = 2;
  ctx.strokeRect(TABLE_LEFT, top, TABLE_RIGHT - TABLE_LEFT, bottom - top);
  ctx.beginPath();
  ctx.moveTo(TABLE_LEFT, header);
  ctx.lineTo(TABLE_RIGHT, header);
  // The distance in the header spans the wind and label columns.
  ctx.moveTo(LABELS_X, header);
  ctx.lineTo(LABELS_X, bottom);
  for (const x of [OWN_X, ENEMY_X]) {
    ctx.moveTo(x, top);
    ctx.lineTo(x, bottom);
  }
  // The wind spans all three rows.
  for (const y of ROWS.slice(2, -1)) {
    ctx.moveTo(LABELS_X, y);
    ctx.lineTo(TABLE_RIGHT, y);
  }
  ctx.stroke();

  const headerY = (top + header) / 2;
  const words = TEXTS.battle;
  text(ctx, words.distance(enemy.distance), TABLE_LEFT + 12, headerY, { color: COLORS.white });
  text(ctx, words.own, OWN_X + 12, headerY, { color: COLORS.white });
  text(ctx, words.enemy, ENEMY_X + 12, headerY, { color: COLORS.white });

  const rows = [
    [words.guns, state.guns, enemy.guns],
    [words.men, state.men, enemy.men],
    [words.repair, state.repair, enemy.repair],
  ];
  rows.forEach(([label, ours, theirs], i) => {
    const y = (ROWS[i + 1] + ROWS[i + 2]) / 2;
    text(ctx, label, LABELS_X + 12, y, { color: COLORS.white });
    text(ctx, String(ours), OWN_X + 12, y);
    text(ctx, String(theirs), ENEMY_X + 12, y);
  });

  drawWind(ctx, wind);
}

// "Vind" and its strength, over a compass whose dot shows where the wind
// comes from: up is from the enemy, down is from behind you.
function drawWind(ctx, wind) {
  text(ctx, TEXTS.battle.wind(wind.strength), 30, 378, { color: COLORS.white });
  const cx = 83;
  const cy = 430;
  const r = 28;

  ctx.strokeStyle = COLORS.white;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.moveTo(cx - r - 6, cy);
  ctx.lineTo(cx + r + 6, cy);
  ctx.moveTo(cx, cy - r - 6);
  ctx.lineTo(cx, cy + r + 6);
  ctx.stroke();

  ctx.fillStyle = COLORS.red;
  ctx.beginPath();
  ctx.arc(cx + wind.side * r, cy + wind.length * r, 5, 0, Math.PI * 2);
  ctx.fill();
}

function drawPanel(ctx, { x, y, w, h }, title) {
  ctx.strokeStyle = COLORS.white;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
  if (title) text(ctx, title, x + 12, y + 18, { color: COLORS.white });
}

// A ship's hull seen from above.
function drawHull(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, 70, 12, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawSplash(ctx, x, y) {
  ctx.fillStyle = COLORS.white;
  for (const [dx, dy, r] of [[0, 0, 5], [-7, 3, 3], [7, 3, 3], [0, -6, 3]]) {
    ctx.beginPath();
    ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Splashes on your own hull, one for each kind of damage the enemy did.
function drawEnemyHits(ctx, { repair, men, gun }) {
  if (repair > 0) drawSplash(ctx, 118, 200);
  if (men > 0) drawSplash(ctx, 196, 200);
  if (gun) drawSplash(ctx, 158, 192);
}

// The crosshair, moved by the aim.
function drawSights(ctx, aim) {
  const x = SIGHTS_X + aim.side * AIM_SCALE;
  const y = SIGHTS_Y + aim.elevation * AIM_SCALE;
  ctx.strokeStyle = COLORS.red;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 10, 0, Math.PI * 2);
  ctx.moveTo(x - 16, y);
  ctx.lineTo(x + 16, y);
  ctx.moveTo(x, y - 16);
  ctx.lineTo(x, y + 16);
  ctx.stroke();
}


// The synthwave sunset, behind the title and the ending: a sky that darkens
// upwards, a striped sun sinking behind the horizon, and a grid of lines
// running from the horizon towards you. Its colours are SUNSET in palette.js.
import { SUNSET } from '../palette.js';

const HORIZON = 300; // y of the horizon
const SUN_RADIUS = 140;
const SUN_STRIPES = 7; // the gaps across the sun's lower half, thicker further down
const GRID_LINES = 12; // across, closer together near the horizon
const GRID_SPACING = 80; // between the lines running towards you, at the bottom

export function drawSynthwave(ctx) {
  const { width, height } = ctx.canvas;
  const centre = width / 2;

  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, SUNSET.skyTop);
  sky.addColorStop(0.55, SUNSET.skyHorizon);
  sky.addColorStop(1, SUNSET.skyTop);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  // The sun: a half circle on the horizon, yellow to pink to violet, with
  // stripes of sky cut through its lower part.
  const top = HORIZON - SUN_RADIUS;
  const sun = ctx.createLinearGradient(0, top, 0, HORIZON);
  sun.addColorStop(0, SUNSET.sunTop);
  sun.addColorStop(0.6, SUNSET.sunMiddle);
  sun.addColorStop(1, SUNSET.sunBottom);
  ctx.save();
  ctx.beginPath();
  ctx.arc(centre, HORIZON, SUN_RADIUS, Math.PI, 0);
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = sun;
  ctx.fillRect(centre - SUN_RADIUS, top, 2 * SUN_RADIUS, SUN_RADIUS);
  ctx.fillStyle = SUNSET.skyHorizon;
  for (let i = 0; i < SUN_STRIPES; i++) {
    ctx.fillRect(centre - SUN_RADIUS, HORIZON - 70 + i * 11, 2 * SUN_RADIUS, 2 + i);
  }
  ctx.restore();

  // The grid: lines across, closer together towards the horizon, and lines
  // from the horizon's middle out to the bottom edge.
  ctx.strokeStyle = SUNSET.grid;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < GRID_LINES; i++) {
    const y = HORIZON + i * i * 1.6;
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }
  for (let x = -width; x <= 2 * width; x += GRID_SPACING) {
    ctx.moveTo(centre, HORIZON);
    ctx.lineTo(x, height);
  }
  ctx.stroke();
}

// A dark, see-through panel, for text that sits on the sunset.
export function drawShade(ctx, x, y, w, h) {
  ctx.fillStyle = SUNSET.shade;
  ctx.fillRect(x, y, w, h);
}

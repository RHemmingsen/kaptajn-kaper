// The title scene's picture: ship, title, cannon, skull and treasure chest,
// and the prompt below it.
//
// All drawn with plain canvas shapes (rectangles, polygons, circles). Later we
// might swap these for image files.
import { COLORS } from '../palette.js';
import { polygon, text, textWidth } from './draw.js';

// "Tryk på en tast for at fortsætte!" at the bottom, with a cursor after it
// when `cursorOn`.
export function drawTitlePrompt(ctx, cursorOn) {
  const prompt = 'Tryk på en tast for at fortsætte!';
  text(ctx, prompt, 14, 470, { color: COLORS.white, baseline: 'alphabetic' });

  if (cursorOn) {
    const x = 14 + textWidth(ctx, prompt) + 6;
    ctx.fillStyle = COLORS.white;
    ctx.fillRect(x, 462, 12, 8);
  }
}

export function drawTitleArt(ctx) {
  drawShipPanel(ctx);
  drawTitlePanel(ctx);
  drawCannon(ctx);
  drawSkull(ctx);
  drawChest(ctx);
}

function drawShipPanel(ctx) {
  ctx.strokeStyle = COLORS.white;
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 5, 212, 235);

  // The waterline.
  ctx.beginPath();
  ctx.moveTo(10, 108);
  ctx.lineTo(222, 108);
  ctx.stroke();

  // Hull.
  ctx.fillStyle = COLORS.magenta;
  polygon(ctx, [[88, 86], [182, 86], [176, 106], [94, 120], [92, 106]]);
  ctx.fillRect(140, 78, 36, 10); // cabin

  // Sails.
  ctx.fillStyle = COLORS.white;
  polygon(ctx, [[112, 24], [112, 84], [70, 84]]);
  polygon(ctx, [[118, 18], [118, 84], [150, 84], [134, 48]]);
  polygon(ctx, [[138, 30], [168, 36], [158, 70], [138, 66]]);
  ctx.fillRect(115, 14, 3, 72); // mast

  // Danish flag.
  ctx.fillStyle = COLORS.red;
  ctx.fillRect(150, 12, 16, 11);
  ctx.fillStyle = COLORS.white;
  ctx.fillRect(155, 12, 2, 11);
  ctx.fillRect(150, 16, 16, 2);

  // Small boats in the distance.
  for (const x of [22, 40, 58, 204]) drawSmallBoat(ctx, x, 104);

  // Shark fins below the water.
  ctx.strokeStyle = COLORS.white;
  ctx.lineWidth = 2;
  for (const [x, y] of [[70, 168], [138, 200]]) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + 10, y - 22, x + 30, y - 30);
    ctx.quadraticCurveTo(x + 20, y - 10, x + 26, y);
    ctx.closePath();
    ctx.stroke();
  }
}

function drawSmallBoat(ctx, x, y) {
  ctx.fillStyle = COLORS.magenta;
  ctx.fillRect(x - 6, y - 4, 13, 5);
  ctx.fillStyle = COLORS.cyan;
  ctx.fillRect(x - 4, y - 12, 3, 8);
  ctx.fillRect(x + 2, y - 12, 3, 8);
  ctx.fillStyle = COLORS.red;
  ctx.fillRect(x - 1, y - 15, 3, 3);
}

function drawTitlePanel(ctx) {
  // Thick magenta frame with a white-outlined blue box inside.
  ctx.fillStyle = COLORS.magenta;
  ctx.fillRect(224, 5, 382, 235);
  ctx.fillStyle = COLORS.blue;
  ctx.fillRect(240, 18, 348, 198);
  ctx.strokeStyle = COLORS.white;
  ctx.lineWidth = 2;
  ctx.strokeRect(240, 18, 348, 198);

  const title = { color: COLORS.white, size: 64, align: 'center' };
  text(ctx, 'Kaptajn', 414, 75, title);
  text(ctx, 'Kaper', 414, 155, title);
}

function drawCannon(ctx) {
  // Carriage: a cyan staircase block.
  ctx.fillStyle = COLORS.cyan;
  polygon(ctx, [
    [242, 338], [242, 322], [262, 322], [262, 308], [282, 308],
    [282, 294], [300, 294], [306, 338],
  ]);

  // Barrel: drawn level, then rotated to point up and to the right.
  ctx.save();
  ctx.translate(232, 310);
  ctx.rotate(-0.36);
  ctx.fillStyle = COLORS.magenta;
  ctx.fillRect(0, -16, 150, 32);
  ctx.beginPath();
  ctx.ellipse(150, 0, 8, 18, 0, 0, Math.PI * 2); // muzzle
  ctx.fill();
  ctx.fillStyle = COLORS.white;
  ctx.beginPath();
  ctx.ellipse(150, 0, 4, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.magenta;
  ctx.beginPath();
  ctx.arc(-6, 0, 6, 0, Math.PI * 2); // knob at the back
  ctx.fill();
  ctx.restore();
}

function drawSkull(ctx) {
  ctx.fillStyle = COLORS.white;
  ctx.strokeStyle = COLORS.white;
  ctx.lineCap = 'round';

  // Crossed bones, with knobbly ends.
  ctx.lineWidth = 14;
  for (const [x1, y1, x2, y2] of [[380, 410, 600, 345], [380, 345, 600, 410]]) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    for (const [x, y] of [[x1, y1], [x2, y2]]) {
      ctx.beginPath();
      ctx.arc(x - 4, y - 6, 9, 0, Math.PI * 2);
      ctx.arc(x + 4, y + 6, 9, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Head and jaw.
  ctx.beginPath();
  ctx.ellipse(490, 320, 60, 58, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(458, 350, 64, 66);

  // Eyes, nose and teeth are holes, so they're painted in the background colour.
  ctx.fillStyle = COLORS.blue;
  ctx.beginPath();
  ctx.arc(466, 326, 13, 0, Math.PI * 2);
  ctx.arc(514, 326, 13, 0, Math.PI * 2);
  ctx.fill();
  polygon(ctx, [[490, 344], [484, 360], [496, 360]]);
  ctx.strokeStyle = COLORS.blue;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(470, 400);
  ctx.quadraticCurveTo(490, 410, 510, 400);
  ctx.stroke();
}

function drawChest(ctx) {
  // Lid.
  ctx.fillStyle = COLORS.magenta;
  polygon(ctx, [[58, 378], [192, 376], [196, 400], [64, 404]]);
  ctx.strokeStyle = COLORS.white;
  ctx.lineWidth = 2;
  ctx.strokeRect(58, 376, 138, 28);

  // Box.
  ctx.strokeRect(70, 404, 128, 66);
  ctx.beginPath();
  ctx.moveTo(56, 392);
  ctx.lineTo(70, 404);
  ctx.moveTo(196, 392);
  ctx.lineTo(198, 404);
  ctx.stroke();

  const sign = { color: COLORS.white, align: 'center', baseline: 'alphabetic' };
  text(ctx, 'Rigs-', 140, 432, sign);
  text(ctx, 'dalere', 140, 452, sign);
}

// A grid of pixels held in plain memory, with the two drawing operations old
// BASIC programs used: draw a line, and flood-fill an area (PAINT).
//
// Each pixel is a small number (a colour index, 0 = empty), not an RGB colour.
// Because it doesn't use the browser's canvas, it also works in Node, so we
// can test it and use it to work out things like "which map cells are land".
export class Bitmap {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.pixels = new Uint8Array(width * height);
  }

  inBounds(x, y) {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  get(x, y) {
    return this.inBounds(x, y) ? this.pixels[y * this.width + x] : 0;
  }

  set(x, y, color) {
    if (this.inBounds(x, y)) this.pixels[y * this.width + x] = color;
  }

  // A straight line of pixels from (x0, y0) to (x1, y1), using Bresenham's
  // algorithm: step along the longer axis, and step the other axis whenever
  // the accumulated error says the line has drifted half a pixel.
  line(x0, y0, x1, y1, color) {
    x0 = Math.round(x0); y0 = Math.round(y0);
    x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;

    for (;;) {
      this.set(x0, y0, color);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }

  // Like BASIC's PAINT (x, y), color, border: colour every pixel reachable
  // from (x, y) without crossing a pixel of the border colour. Only moves
  // up/down/left/right, so a diagonal line is still a solid wall.
  fill(x, y, color, border) {
    x = Math.round(x); y = Math.round(y);
    const stack = [[x, y]];
    while (stack.length > 0) {
      const [px, py] = stack.pop();
      if (!this.inBounds(px, py)) continue;
      const here = this.get(px, py);
      if (here === border || here === color) continue;
      this.set(px, py, color);
      stack.push([px + 1, py], [px - 1, py], [px, py + 1], [px, py - 1]);
    }
  }
}

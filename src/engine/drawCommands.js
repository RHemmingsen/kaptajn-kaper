// An interpreter for GW-BASIC's DRAW language, the "turtle graphics" the
// original game used to draw its map. It turns command strings into straight
// line segments; what to do with them (and at what scale) is up to the caller.
//
//   U n  D n  L n  R n    move up / down / left / right n pixels (default 1)
//   E n  F n  G n  H n    move diagonally: up-right, down-right, down-left, up-left
//   M x,y                 move to (x, y); M+x,-y moves relative instead
//   B                     prefix: the next move doesn't draw ("pen up")
//   N                     prefix: the next move returns to where it started
//   C n                   set colour (ignored: the caller decides colours)
//
// The pen position carries over from one string to the next, like it did in
// BASIC, so pass all of a picture's strings in order in one call.

const STEPS = {
  U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0],
  E: [1, -1], F: [1, 1], G: [-1, 1], H: [-1, -1],
};

// Returns an array of segments: { x0, y0, x1, y1 }.
export function drawCommandsToSegments(commandStrings, start = { x: 0, y: 0 }) {
  const segments = [];
  let x = start.x;
  let y = start.y;

  for (const commands of commandStrings) {
    const text = commands.toUpperCase().replace(/\s+/g, '');
    let i = 0;
    let penUp = false;
    let returnAfter = false;

    // Read an optionally signed whole number at the current position.
    const readNumber = () => {
      const match = /^[+-]?\d+/.exec(text.slice(i));
      if (!match) return null;
      i += match[0].length;
      return Number(match[0]);
    };

    const moveTo = (nx, ny) => {
      if (!penUp) segments.push({ x0: x, y0: y, x1: nx, y1: ny });
      if (!returnAfter) { x = nx; y = ny; }
      penUp = false;
      returnAfter = false;
    };

    while (i < text.length) {
      const command = text[i++];

      if (command === 'B') { penUp = true; continue; }
      if (command === 'N') { returnAfter = true; continue; }
      if (command === 'C') { readNumber(); continue; }

      if (command === 'M') {
        const relative = text[i] === '+' || text[i] === '-';
        const mx = readNumber();
        i++; // the comma
        const my = readNumber();
        if (relative) moveTo(x + mx, y + my);
        else moveTo(mx, my);
        continue;
      }

      if (STEPS[command]) {
        const n = readNumber() ?? 1;
        const [sx, sy] = STEPS[command];
        moveTo(x + sx * n, y + sy * n);
        continue;
      }

      throw new Error(`Unknown DRAW command '${command}' in "${commands}"`);
    }
  }

  return segments;
}

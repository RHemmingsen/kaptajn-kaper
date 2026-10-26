import { test } from 'node:test';
import assert from 'node:assert/strict';
import { drawCommandsToSegments } from '../src/engine/drawCommands.js';

test('direction letters move the pen and draw', () => {
  const segments = drawCommandsToSegments(['BM10,10 R5 D2 G1']);
  assert.deepEqual(segments, [
    { x0: 10, y0: 10, x1: 15, y1: 10 },
    { x0: 15, y0: 10, x1: 15, y1: 12 },
    { x0: 15, y0: 12, x1: 14, y1: 13 },
  ]);
});

test('a direction without a number moves 1, and spaces are ignored', () => {
  const segments = drawCommandsToSegments(['BM0,0 U E 2']);
  assert.deepEqual(segments, [
    { x0: 0, y0: 0, x1: 0, y1: -1 },
    { x0: 0, y0: -1, x1: 2, y1: -3 },
  ]);
});

test('B moves without drawing, and M can be absolute or relative', () => {
  const segments = drawCommandsToSegments(['BM5,5 M8,5 BM+0,2 M-3,+1']);
  assert.deepEqual(segments, [
    { x0: 5, y0: 5, x1: 8, y1: 5 },
    { x0: 8, y0: 7, x1: 5, y1: 8 },
  ]);
});

test('the pen carries over from one string to the next', () => {
  const segments = drawCommandsToSegments(['BM1,1 R1', 'D1']);
  assert.deepEqual(segments.at(-1), { x0: 2, y0: 1, x1: 2, y1: 2 });
});

test('an unknown command is an error', () => {
  assert.throws(() => drawCommandsToSegments(['Q5']), /Unknown DRAW command/);
});

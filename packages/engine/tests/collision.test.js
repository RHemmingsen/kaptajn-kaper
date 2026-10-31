import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rectsOverlap } from '../src/collision.js';

const box = { x: 10, y: 10, w: 10, h: 10 };

test('overlapping boxes collide', () => {
  assert.equal(rectsOverlap(box, { x: 15, y: 15, w: 10, h: 10 }), true);
});

test('boxes that only touch edges do not collide', () => {
  assert.equal(rectsOverlap(box, { x: 20, y: 10, w: 10, h: 10 }), false);
  assert.equal(rectsOverlap(box, { x: 10, y: 20, w: 10, h: 10 }), false);
});

test('separate boxes do not collide', () => {
  assert.equal(rectsOverlap(box, { x: 100, y: 100, w: 10, h: 10 }), false);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Bitmap } from '../src/engine/Bitmap.js';

// Draw a bitmap as text, '#' for any colour, so tests can compare pictures.
function picture(bitmap) {
  const rows = [];
  for (let y = 0; y < bitmap.height; y++) {
    let row = '';
    for (let x = 0; x < bitmap.width; x++) row += bitmap.get(x, y) ? '#' : '.';
    rows.push(row);
  }
  return rows;
}

test('a diagonal line steps one pixel at a time', () => {
  const bitmap = new Bitmap(4, 4);
  bitmap.line(0, 0, 3, 3, 1);
  assert.deepEqual(picture(bitmap), ['#...', '.#..', '..#.', '...#']);
});

test('fill colours the inside of a shape and stops at its border', () => {
  const bitmap = new Bitmap(5, 5);
  bitmap.line(0, 0, 4, 0, 1);
  bitmap.line(4, 0, 4, 4, 1);
  bitmap.line(4, 4, 0, 4, 1);
  bitmap.line(0, 4, 0, 0, 1);
  bitmap.fill(2, 2, 1, 1);
  assert.deepEqual(picture(bitmap), ['#####', '#####', '#####', '#####', '#####']);
});

test('fill does not leak through a diagonal wall', () => {
  const bitmap = new Bitmap(4, 4);
  bitmap.line(0, 3, 3, 0, 1); // wall from bottom-left to top-right
  bitmap.fill(0, 0, 2, 1);
  assert.deepEqual(picture(bitmap), ['####', '###.', '##..', '#...']);
  assert.equal(bitmap.get(3, 3), 0, 'the other side must stay empty');
});

test('pixels outside the bitmap are ignored', () => {
  const bitmap = new Bitmap(2, 2);
  bitmap.set(5, 5, 1);
  bitmap.line(-3, 0, 5, 0, 1);
  assert.deepEqual(picture(bitmap), ['##', '..']);
});

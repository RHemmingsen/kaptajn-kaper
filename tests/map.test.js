// Tests for the Kattegat map rebuilt from the original's BUILD.BAS.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CITIES, COLS, ROWS } from '../src/game/map.js';
import { canSailTo } from '../src/game/rules/sailing.js';
import { GameState } from '../src/game/GameState.js';

// Every cell the ship can reach from (col, row) with the four arrow keys.
function reachableFrom(col, row) {
  const seen = new Set([`${col},${row}`]);
  const queue = [[col, row]];
  while (queue.length > 0) {
    const [c, r] = queue.shift();
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const key = `${c + dc},${r + dr}`;
      if (!seen.has(key) && canSailTo(c + dc, r + dr)) {
        seen.add(key);
        queue.push([c + dc, r + dr]);
      }
    }
  }
  return seen;
}

test('the ship starts on open water', () => {
  const { col, row } = new GameState().ship;
  assert.equal(canSailTo(col, row), true);
});

test('every port can be reached from the start', () => {
  const { col, row } = new GameState().ship;
  const reachable = reachableFrom(col, row);
  for (const city of CITIES) {
    assert.ok(reachable.has(`${city.col},${city.row}`), `${city.name} can't be reached`);
  }
});

test('land from the original drawing blocks the ship', () => {
  assert.equal(canSailTo(2, 2), false); // Djursland
  assert.equal(canSailTo(22, 10), false); // Zealand
  assert.equal(canSailTo(28, 3), false); // Skåne
});

test('the ship stays inside the map box', () => {
  assert.equal(canSailTo(0, 12), false);
  assert.equal(canSailTo(COLS + 1, 12), false);
  assert.equal(canSailTo(15, 0), false);
  assert.equal(canSailTo(15, ROWS + 1), false);
});

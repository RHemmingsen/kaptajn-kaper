// Tests for the Kattegat map: it must be possible to sail everywhere that
// matters.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CITIES, KATTEGAT, SeaChart } from '../src/game/map.js';
import { GameState } from '../src/game/GameState.js';

// Every cell the ship can reach from (col, row) with the four arrow keys.
function reachableFrom(col, row) {
  const seen = new Set([`${col},${row}`]);
  const queue = [[col, row]];
  while (queue.length > 0) {
    const [c, r] = queue.shift();
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const key = `${c + dc},${r + dr}`;
      if (!seen.has(key) && KATTEGAT.canSailTo(c + dc, r + dr)) {
        seen.add(key);
        queue.push([c + dc, r + dr]);
      }
    }
  }
  return seen;
}

test('the ship starts on open water', () => {
  const { col, row } = new GameState().ship;
  assert.equal(KATTEGAT.canSailTo(col, row), true);
});

test('every port can be reached from the start', () => {
  const { col, row } = new GameState().ship;
  const reachable = reachableFrom(col, row);
  for (const city of CITIES) {
    assert.ok(reachable.has(`${city.col},${city.row}`), `${city.name} can't be reached`);
  }
});

test('a chart counts cells from 1, as the original did; outside it there is nothing', () => {
  const chart = new SeaChart(['#.', '..'], [{ name: 'Havn', col: 1, row: 1 }]);
  assert.equal(chart.tileAt(1, 1), '#'); // top left
  assert.equal(chart.tileAt(2, 2), '.'); // bottom right
  assert.equal(chart.tileAt(0, 1), null);
  assert.equal(chart.tileAt(3, 1), null);
  assert.equal(chart.cityAt(1, 1).name, 'Havn');
  assert.equal(chart.canSailTo(1, 1), true, 'a port is land, but you can sail into it');
  assert.equal(chart.width, 2);
});

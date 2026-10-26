// Tests for the sailing rules. These run in Node, with no browser or canvas,
// because the rules don't touch either. Run them with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventBus } from '../src/engine/EventBus.js';
import { GameState } from '../src/game/GameState.js';
import { sail } from '../src/game/rules/sailing.js';

// Records every event emitted, so a test can check what happened.
function recordEvents() {
  const events = new EventBus();
  const log = [];
  for (const name of ['shipMoved', 'arrivedAtPort']) {
    events.on(name, (data) => log.push({ name, data }));
  }
  return { events, log };
}

test('sailing onto water moves the ship and costs one move', () => {
  const state = new GameState(); // ship starts at col 12, row 9
  const { events, log } = recordEvents();

  assert.equal(sail(state, 'left', events), true);
  assert.deepEqual(state.ship, { col: 11, row: 9 });
  assert.equal(state.moves, 1);
  assert.deepEqual(log, [{ name: 'shipMoved', data: { col: 11, row: 9 } }]);
});

test('land blocks the ship and costs nothing', () => {
  const state = new GameState();
  state.ship = { col: 8, row: 9 }; // Jutland's coast is just to the left
  const { events, log } = recordEvents();

  assert.equal(sail(state, 'left', events), false);
  assert.deepEqual(state.ship, { col: 8, row: 9 });
  assert.equal(state.moves, 0);
  assert.deepEqual(log, []);
});

test('sailing into a port announces the arrival', () => {
  const state = new GameState();
  state.ship = { col: 10, row: 5 }; // right next to Skagen
  const { events, log } = recordEvents();

  sail(state, 'left', events);

  assert.deepEqual(log.map((e) => e.name), ['shipMoved', 'arrivedAtPort']);
  assert.equal(log[1].data.city.name, 'Skagen');
});

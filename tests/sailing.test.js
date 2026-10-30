// Tests for the sailing rules. These run in Node, with no browser or canvas,
// because the rules don't touch either. Run them with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { recordEvents as record } from './helpers.js';
import { GameState } from '../src/game/GameState.js';
import { sail } from '../src/game/rules/sailing.js';

// Decides the dice: nothing is ever spotted at sea, so the tests below are
// only about sailing. Sea events are tested in sea.test.js.
const nothingSpotted = () => 0.99;

// The events these tests look at.
const recordEvents = () => record([
  'shipMoved', 'arrivedAtPort', 'shipRanAground', 'shipDamaged', 'shipSunk', 'seaEvent', 'gameOver',
]);

test('sailing onto water moves the ship and costs one move', () => {
  const state = new GameState(); // ship starts at col 10, row 10
  const { events, log } = recordEvents();

  assert.equal(sail(state, 'left', events, nothingSpotted), true);
  assert.deepEqual(state.ship, { col: 9, row: 10 });
  assert.equal(state.moves, 1);
  assert.deepEqual(log, [{ name: 'shipMoved', data: { col: 9, row: 10 } }]);
});

test('the ship can sail diagonally', () => {
  const state = new GameState();
  const { events } = recordEvents();

  assert.equal(sail(state, 'upLeft', events, nothingSpotted), true);
  assert.deepEqual(state.ship, { col: 9, row: 9 });
});

// How much the crew eats, and starving, is tested in ship.test.js; here we
// only check that a move makes them eat.
test('every move the crew eats', () => {
  const state = new GameState(); // 200 men, difficulty 2, 30 sacks
  const { events } = recordEvents();

  sail(state, 'left', events, nothingSpotted);

  assert.equal(state.grain, 29.5);
});

test('sailing into land: the ship stays, but it costs a move, grain and 3 Rep', () => {
  const state = new GameState();
  state.ship = { col: 8, row: 10 }; // Samsø is just to the left
  const { events, log } = recordEvents();

  assert.equal(sail(state, 'left', events, nothingSpotted), false);
  assert.deepEqual(state.ship, { col: 8, row: 10 });
  assert.equal(state.moves, 1);
  assert.equal(state.grain, 29.5);
  assert.equal(state.repair, 197);
  assert.deepEqual(log.map((e) => e.name), ['shipRanAground', 'shipDamaged']);
});

test('sailing into a port announces the arrival', () => {
  const state = new GameState();
  state.ship = { col: 8, row: 4 }; // right next to Ebeltoft
  const { events, log } = recordEvents();

  sail(state, 'left', events, nothingSpotted);

  assert.deepEqual(log.map((e) => e.name), ['shipMoved', 'arrivedAtPort']);
  assert.equal(log[1].data.city.name, 'Ebeltoft');
});

test('the edge of the map stops the ship and costs nothing', () => {
  const state = new GameState();
  state.ship = { col: 1, row: 13 }; // open water at the left edge
  const { events, log } = recordEvents();

  assert.equal(sail(state, 'left', events, nothingSpotted), false);
  assert.deepEqual(state.ship, { col: 1, row: 13 });
  assert.equal(state.moves, 0);
  assert.equal(state.grain, 30);
  assert.deepEqual(log, []);
});

test('if the crew starves to death, the ship is lost and goes nowhere', () => {
  const state = new GameState();
  state.men = 11; // a tenth will starve, leaving 9: too few to sail
  state.grain = 0;
  state.ship = { col: 8, row: 10 }; // Samsø is just to the left
  const { events, log } = recordEvents();

  assert.equal(sail(state, 'left', events, nothingSpotted), false);
  assert.equal(state.sunk, true);
  assert.equal(state.repair, 200, 'the lost ship does not also run aground');
  assert.deepEqual(log.map((e) => e.name), ['shipSunk', 'gameOver']);
});

test('sailing onto open water can make the lookout spot something', () => {
  const state = new GameState();
  const { events, log } = recordEvents();

  sail(state, 'left', events, () => 0); // the dice come up as low as possible

  assert.deepEqual(log.map((e) => e.name), ['shipMoved', 'seaEvent']);
  assert.equal(log[1].data.kind, 'ship');
});

test('nothing is spotted when sailing into a port', () => {
  const state = new GameState();
  state.ship = { col: 8, row: 4 }; // right next to Ebeltoft
  const { events, log } = recordEvents();

  sail(state, 'left', events, () => 0);

  assert.deepEqual(log.map((e) => e.name), ['shipMoved', 'arrivedAtPort']);
});

test('the last move ends the game before the ship moves or the crew eats', () => {
  const state = new GameState();
  state.moves = 299; // the limit is 300
  const { events, log } = recordEvents();

  assert.equal(sail(state, 'left', events, nothingSpotted), false);
  assert.equal(state.ending, 'jilted');
  assert.deepEqual(state.ship, { col: 10, row: 10 });
  assert.equal(state.grain, 30);
  assert.deepEqual(log.map((e) => e.name), ['gameOver']);
});

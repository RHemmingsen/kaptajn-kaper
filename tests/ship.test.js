import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventBus } from '../src/engine/EventBus.js';
import { GameState } from '../src/game/GameState.js';
import { crewEats, damageShip, isSunk, sinkShip } from '../src/game/rules/ship.js';

function recordEvents() {
  const events = new EventBus();
  const log = [];
  for (const name of ['shipDamaged', 'shipSunk', 'crewStarving']) {
    events.on(name, (data) => log.push(name === 'crewStarving' ? { name, ...data } : name));
  }
  return { events, log };
}

test('damage lowers Rep without sinking a healthy ship', () => {
  const state = new GameState();
  const { events, log } = recordEvents();

  damageShip(state, 30, events);

  assert.equal(state.repair, 170);
  assert.equal(isSunk(state), false);
  assert.deepEqual(log, ['shipDamaged']);
});

test('the ship goes down at 20 Rep or less', () => {
  const state = new GameState();
  state.repair = 31;
  const { events, log } = recordEvents();

  damageShip(state, 10, events); // 21: still afloat
  assert.equal(isSunk(state), false);

  damageShip(state, 1, events); // 20: lost
  assert.equal(isSunk(state), true);
  assert.deepEqual(log, ['shipDamaged', 'shipDamaged', 'shipSunk']);
});

test('Rep never goes below 0', () => {
  const state = new GameState();
  state.repair = 5;
  const { events } = recordEvents();

  damageShip(state, 30, events);

  assert.equal(state.repair, 0);
});

test('the ship goes down with 10 men or fewer', () => {
  const state = new GameState();
  state.men = 13;
  state.grain = 0;
  const { events, log } = recordEvents();

  crewEats(state, events); // 90% of 13, rounded down: 11 left, still afloat
  assert.equal(state.men, 11);
  assert.equal(isSunk(state), false);

  crewEats(state, events); // 90% of 11, rounded down: 9 left, lost
  assert.equal(state.men, 9);
  assert.equal(isSunk(state), true);
  assert.deepEqual(log.at(-1), 'shipSunk');
});

test('a lost ship is only announced once', () => {
  const state = new GameState();
  state.repair = 25;
  const { events, log } = recordEvents();

  damageShip(state, 10, events);
  damageShip(state, 10, events);
  sinkShip(state, events);

  assert.equal(log.filter((e) => e === 'shipSunk').length, 1);
});

test('a ship can be lost with Rep and crew to spare, e.g. wrecked on a pier', () => {
  const state = new GameState();
  const { events, log } = recordEvents();

  sinkShip(state, events);

  assert.equal(isSunk(state), true);
  assert.equal(state.repair, 200);
  assert.deepEqual(log, ['shipSunk']);
});

test('a meal is men x difficulty / 800 sacks of grain', () => {
  const state = new GameState(); // 200 men, difficulty 2, 30 sacks
  const { events, log } = recordEvents();

  crewEats(state, events);

  assert.equal(state.grain, 29.5);
  assert.equal(state.men, 200);
  assert.deepEqual(log, []);
});

test('a bigger crew and a higher difficulty eat more', () => {
  const state = new GameState();
  state.men = 400;
  state.difficulty = 4;
  const { events } = recordEvents();

  crewEats(state, events);

  assert.equal(state.grain, 28); // 400 x 4 / 800 = 2 sacks
});

test('without enough grain, the grain runs out and a tenth of the crew dies', () => {
  const state = new GameState();
  state.grain = 0.2; // less than the half sack they need
  const { events, log } = recordEvents();

  crewEats(state, events);
  assert.equal(state.grain, 0);
  assert.equal(state.men, 180);
  assert.deepEqual(log, [{ name: 'crewStarving', lost: 20 }]);

  crewEats(state, events);
  assert.equal(state.men, 162);
});

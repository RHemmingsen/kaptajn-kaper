import { test } from 'node:test';
import assert from 'node:assert/strict';
import { recordEvents as record } from './helpers.js';
import { EventBus } from '../src/engine/EventBus.js';
import { GameState } from '../src/game/GameState.js';
import { checkCargo, crewEats, damageShip, isSunk, overload, sinkShip } from '../src/game/rules/ship.js';

// The events these tests look at.
const recordEvents = () => record(['gameOver']);

test('damage lowers Rep without sinking a healthy ship', () => {
  const state = new GameState();
  const { events, log } = recordEvents();

  damageShip(state, 30, events);

  assert.equal(state.repair, 170);
  assert.equal(isSunk(state), false);
  assert.deepEqual(log, [], 'the game goes on');
});

test('the ship goes down at 20 Rep or less', () => {
  const state = new GameState();
  state.repair = 31;
  const { events, log } = recordEvents();

  damageShip(state, 10, events); // 21: still afloat
  assert.equal(isSunk(state), false);

  damageShip(state, 1, events); // 20: lost
  assert.equal(isSunk(state), true);
  assert.deepEqual(log.map((e) => e.name), ['gameOver']);
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
  assert.deepEqual(log.map((e) => e.name), ['gameOver']);
});

test('a lost ship ends the game only once', () => {
  const state = new GameState();
  state.repair = 25;
  const { events, log } = recordEvents();

  damageShip(state, 10, events);
  damageShip(state, 10, events);
  sinkShip(state, events);

  assert.equal(log.length, 1);
});

test('a ship can be lost with Rep and crew to spare, e.g. wrecked on a pier', () => {
  const state = new GameState();
  const { events, log } = recordEvents();

  sinkShip(state, events);

  assert.equal(isSunk(state), true);
  assert.equal(state.repair, 200);
  assert.deepEqual(log.map((e) => e.name), ['gameOver']);
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

  crewEats(state, events);
  assert.equal(state.men, 162);
});

test('the ship can carry up to 30000 rigsdaler, 500 men, 150 guns and 700 sacks of grain', () => {
  const state = new GameState();
  Object.assign(state, { money: 30000, men: 500, guns: 150, grain: 700 });
  assert.equal(overload(state), null);

  for (const [cargo, tooMuch] of [['money', 30001], ['men', 501], ['guns', 151], ['grain', 700.5]]) {
    const loaded = new GameState();
    loaded[cargo] = tooMuch;
    assert.equal(overload(loaded), cargo);
  }
});

test('too much cargo sinks the ship, and says what was too heavy', () => {
  const state = new GameState();
  state.money = 31000;
  const events = new EventBus();
  const endings = [];
  events.on('gameOver', (summary) => endings.push(summary));

  assert.equal(checkCargo(state, events), true);
  assert.equal(state.sunk, true);
  assert.equal(endings[0].ending, 'sunk');
  assert.equal(endings[0].sunkBy, 'money');
});

test('a ship within her limits is left alone', () => {
  const state = new GameState();
  assert.equal(checkCargo(state, new EventBus()), false);
  assert.equal(state.sunk, false);
});

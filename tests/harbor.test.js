// Tests for the harbor minigame rules. The harbor runs in real time, so the
// tests "play" it by calling updateHarbor many times with a fixed dt.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventBus } from '../src/engine/EventBus.js';
import { GameState } from '../src/game/GameState.js';
import { createHarbor, updateHarbor, LAYOUT } from '../src/game/rules/harbor.js';

const DT = 1 / 60;
const NO_KEYS = {};
const CITY = { name: 'Kalundborg' };
const COLUMN = (LAYOUT.wallRight - LAYOUT.wallLeft) / 38; // the original's text columns

const noGusts = () => 0.99; // never under difficulty / 18
const gustEveryStep = () => 0; // always under it

// A predictable stand-in for Math.random, so every run builds the same harbor.
function seededRandom(seed) {
  return () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
}

// A harbor with no ships at anchor: tests add only what they need.
function emptyHarbor(difficulty = 2) {
  const harbor = createHarbor(CITY, difficulty, seededRandom(1));
  harbor.obstacles = [];
  return harbor;
}

// Run the harbor for a number of seconds with the same keys held.
function play(harbor, controls, seconds, state, events, random = noGusts) {
  for (let t = 0; t < seconds; t += DT) updateHarbor(harbor, controls, DT, state, events, random);
}

function recordEvents() {
  const events = new EventBus();
  const log = [];
  for (const name of ['shipDamaged', 'shipSunk', 'enteredHarbor', 'harborGust']) {
    events.on(name, (data) => log.push({ name, data }));
  }
  return { events, log };
}

test('there are difficulty x 5 + 1 ships at anchor, spread out', () => {
  assert.equal(createHarbor(CITY, 2, seededRandom(42)).obstacles.length, 11);
  const harbor = createHarbor(CITY, 4, seededRandom(42));
  assert.equal(harbor.obstacles.length, 21);
  for (const a of harbor.obstacles) {
    for (const b of harbor.obstacles) {
      if (a === b) continue;
      const apart = Math.abs(a.x - b.x) >= 50 || Math.abs(a.y - b.y) >= 50;
      assert.ok(apart, 'two ships at anchor are too close');
    }
  }
});

test('the gap is 8 columns wide at the start and 4 at the end, between the docks', () => {
  const start = createHarbor(CITY, 2, () => 0);
  assert.ok(Math.abs(start.gap.right - start.gap.left - 8 * COLUMN) < 1e-9);
  assert.equal(start.docks[0].x + start.docks[0].w, start.gap.left);
  assert.equal(start.docks[1].x, start.gap.right);

  const end = createHarbor(CITY, 10, () => 0);
  assert.ok(Math.abs(end.gap.right - end.gap.left - 4 * COLUMN) < 1e-9);
});

test('the gap starts somewhere from column 10 to 17 at the start', () => {
  const leftmost = createHarbor(CITY, 2, () => 0);
  const rightmost = createHarbor(CITY, 2, () => 0.999);
  assert.ok(Math.abs(leftmost.gap.left - (LAYOUT.wallLeft + 10 * COLUMN)) < 1e-9);
  assert.ok(Math.abs(rightmost.gap.left - (LAYOUT.wallLeft + 17 * COLUMN)) < 1e-9);
});

test('the ship sails down on its own, and with no gusts it keeps its course', () => {
  const harbor = emptyHarbor();
  const start = { x: harbor.ship.x, y: harbor.ship.y };
  const { events } = recordEvents();

  play(harbor, NO_KEYS, 1, new GameState(), events);

  assert.ok(harbor.ship.y > start.y + 40);
  assert.equal(harbor.ship.x, start.x);
});

test('in one step of the trip you can steer as far as a gust pushes', () => {
  const left = emptyHarbor();
  const right = emptyHarbor();
  const startX = left.ship.x;
  const { events } = recordEvents();

  play(left, { left: true }, 0.45, new GameState(), events);
  play(right, { right: true }, 0.45, new GameState(), events);

  assert.ok(Math.abs(startX - left.ship.x - 23) < 1);
  assert.ok(Math.abs(right.ship.x - startX - 23) < 1);
});

test('a gust from the right pushes the ship 23 pixels left', () => {
  const harbor = emptyHarbor();
  harbor.gustsFrom = 'right';
  const startX = harbor.ship.x;
  const { events, log } = recordEvents();

  // The first gust can come after one step (0.45 s) and takes 0.3 s.
  play(harbor, NO_KEYS, 0.8, new GameState(), events, gustEveryStep);

  assert.equal(log.filter((e) => e.name === 'harborGust').length, 1);
  assert.ok(Math.abs(startX - harbor.ship.x - 23) < 0.5);
});

test('gusts come with a chance of difficulty / 18 each step', () => {
  const harbor = emptyHarbor();
  const { events, log } = recordEvents();

  play(harbor, NO_KEYS, 2, new GameState(), events, () => 0.12); // just over 2 / 18

  assert.equal(log.filter((e) => e.name === 'harborGust').length, 0);
});

test('the harbor wall stops the ship', () => {
  const harbor = emptyHarbor();
  const { events } = recordEvents();

  play(harbor, { left: true }, 7, new GameState(), events);

  assert.equal(harbor.ship.x, LAYOUT.wallLeft);
});

test('hitting a ship at anchor costs 15 x difficulty Rep, once, and you sail on', () => {
  const harbor = emptyHarbor();
  const start = { x: harbor.ship.x, y: harbor.ship.y };
  harbor.obstacles = [{ x: start.x, y: start.y + 30, w: 16, h: 18, hit: false }];
  const state = new GameState();
  const { events, log } = recordEvents();

  play(harbor, NO_KEYS, 1.5, state, events); // right across it

  assert.equal(state.repair, 170);
  assert.deepEqual(log, [{ name: 'shipDamaged', data: { amount: 30 } }]);
  assert.ok(harbor.ship.y > start.y + 50, 'the ship carries on, not back to the start');
});

test('the harder it gets, the more a crash costs', () => {
  const harbor = emptyHarbor(4);
  harbor.obstacles = [{ x: harbor.ship.x, y: harbor.ship.y + 30, w: 16, h: 18, hit: false }];
  const state = new GameState();
  state.difficulty = 4;

  play(harbor, NO_KEYS, 1.5, state, recordEvents().events);

  assert.equal(state.repair, 140);
});

test('a crash that takes Rep down to 20 or less sinks the ship', () => {
  const harbor = emptyHarbor();
  harbor.obstacles = [{ x: harbor.ship.x, y: harbor.ship.y + 30, w: 16, h: 18, hit: false }];
  const state = new GameState();
  state.repair = 50; // one crash takes 30
  const { events, log } = recordEvents();

  play(harbor, NO_KEYS, 2, state, events);

  assert.equal(harbor.status, 'sunk');
  assert.equal(state.sunk, true);
  assert.deepEqual(log.map((e) => e.name), ['shipDamaged', 'shipSunk']);
});

test('sailing through the gap docks the ship', () => {
  const harbor = emptyHarbor();
  harbor.ship.x = (harbor.gap.left + harbor.gap.right) / 2 - harbor.ship.w / 2;
  const state = new GameState();
  const { events, log } = recordEvents();

  play(harbor, NO_KEYS, 12, state, events);

  assert.equal(harbor.status, 'docked');
  assert.equal(state.repair, 200);
  assert.deepEqual(log, [{ name: 'enteredHarbor', data: { city: CITY } }]);
});

test('missing the gap and hitting a dock sinks the ship', () => {
  const harbor = emptyHarbor();
  harbor.ship.x = LAYOUT.wallLeft + 10; // over the left dock
  const state = new GameState();
  const { events, log } = recordEvents();

  play(harbor, NO_KEYS, 12, state, events);

  assert.equal(harbor.status, 'sunk');
  assert.equal(state.sunk, true);
  assert.equal(state.repair, 200, 'a wreck on the pier sinks the ship whatever its Rep');
  assert.deepEqual(log.map((e) => e.name), ['shipSunk']);
});

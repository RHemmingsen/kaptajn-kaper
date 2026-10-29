// Tests for the harbor minigame rules. The harbor runs in real time, so the
// tests "play" it by calling updateHarbor many times with a fixed dt.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventBus } from '../src/engine/EventBus.js';
import { GameState } from '../src/game/GameState.js';
import { rectsOverlap } from '../src/engine/collision.js';
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
  for (const name of ['harborCrash', 'shipDamaged', 'shipSunk', 'enteredHarbor', 'harborGust']) {
    events.on(name, (data) => log.push({ name, data }));
  }
  return { events, log };
}

test('there are difficulty x 5 + 1 ships at anchor, all of them, however crowded', () => {
  for (const difficulty of [2, 4, 6, 8]) {
    const harbor = createHarbor(CITY, difficulty, seededRandom(42));
    assert.equal(harbor.obstacles.length, 5 * difficulty + 1);
  }
});

test('no ship at anchor lies on top of yours at the start', () => {
  for (let seed = 1; seed <= 200; seed++) {
    const harbor = createHarbor(CITY, 8, seededRandom(seed));
    assert.ok(!harbor.obstacles.some((o) => rectsOverlap(o, harbor.ship)));
  }
});

test('ships at anchor lie on a 29 x 14 grid inside the walls, never two on one place', () => {
  const harbor = createHarbor(CITY, 8, seededRandom(7));
  const places = new Set(harbor.obstacles.map((o) => `${o.x},${o.y}`));
  assert.equal(places.size, harbor.obstacles.length);
  for (const o of harbor.obstacles) {
    assert.ok(o.x >= LAYOUT.wallLeft && o.x + o.w <= LAYOUT.wallRight);
    assert.ok(o.y + o.h < LAYOUT.dockTop);
  }
  // The corners of the grid: random() just under 1 picks the last column and row.
  const corners = createHarbor(CITY, 0, () => 0.999).obstacles[0];
  assert.equal(corners.x + corners.w, LAYOUT.wallRight);
  assert.equal(createHarbor(CITY, 0, () => 0).obstacles[0].x, LAYOUT.wallLeft);
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

  play(left, { left: true }, 0.3, new GameState(), events);
  play(right, { right: true }, 0.3, new GameState(), events);

  assert.ok(Math.abs(startX - left.ship.x - 23) < 1);
  assert.ok(Math.abs(right.ship.x - startX - 23) < 1);
});

test('a gust from the right pushes the ship 23 pixels left', () => {
  const harbor = emptyHarbor();
  harbor.gustsFrom = 'right';
  const startX = harbor.ship.x;
  const { events, log } = recordEvents();

  // The first gust can come after one step (0.3 s) and takes 0.2 s.
  play(harbor, NO_KEYS, 0.55, new GameState(), events, gustEveryStep);

  assert.equal(log.filter((e) => e.name === 'harborGust').length, 1);
  assert.ok(Math.abs(startX - harbor.ship.x - 23) < 0.5);
});

test('while a gust blows, the rudder does not answer', () => {
  const harbor = emptyHarbor();
  harbor.gustsFrom = 'right';
  const startX = harbor.ship.x;
  const { events } = recordEvents();

  // A gust from the right has just begun; you steer right against it.
  harbor.gustTimer = 0.2;
  play(harbor, { right: true }, 0.2, new GameState(), events);

  // It pushes you its full 23 pixels left, as if you weren't steering.
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
  assert.deepEqual(log, [
    { name: 'harborCrash', data: { damage: 30 } },
    { name: 'shipDamaged', data: { amount: 30 } },
  ]);
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
  assert.deepEqual(log.map((e) => e.name), ['harborCrash', 'shipDamaged', 'shipSunk']);
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

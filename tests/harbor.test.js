// Tests for the harbor minigame rules. The harbor runs in real time, so the
// tests "play" it by calling updateHarbor many times with a fixed dt.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventBus } from '../src/engine/EventBus.js';
import { GameState } from '../src/game/GameState.js';
import { createHarbor, updateHarbor, LAYOUT } from '../src/game/rules/harbor.js';

const DT = 1 / 60;
const NO_KEYS = {};
const SKAGEN = { name: 'Skagen' }; // any city will do here

// A predictable stand-in for Math.random, so every run builds the same harbor.
function seededRandom(seed) {
  return () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
}

// An empty, windless harbor: tests add only what they need.
function emptyHarbor() {
  const harbor = createHarbor(SKAGEN, seededRandom(1));
  harbor.obstacles = [];
  harbor.wind = 0;
  return harbor;
}

// Run the harbor for a number of seconds with the same keys held.
function play(harbor, controls, seconds, state, events) {
  for (let t = 0; t < seconds; t += DT) updateHarbor(harbor, controls, DT, state, events);
}

function recordEvents() {
  const events = new EventBus();
  const log = [];
  for (const name of ['shipDamaged', 'shipSunk', 'enteredHarbor']) {
    events.on(name, (data) => log.push({ name, data }));
  }
  return { events, log };
}

test('a new harbor has its anchored ships spread out', () => {
  const harbor = createHarbor(SKAGEN, seededRandom(42));
  assert.equal(harbor.obstacles.length, 13);
  for (const a of harbor.obstacles) {
    for (const b of harbor.obstacles) {
      if (a === b) continue;
      const apart = Math.abs(a.x - b.x) >= 50 || Math.abs(a.y - b.y) >= 50;
      assert.ok(apart, 'two anchored ships are too close');
    }
  }
});

test('the ship sails downwards on its own', () => {
  const harbor = emptyHarbor();
  const start = { x: harbor.ship.x, y: harbor.ship.y };
  const { events } = recordEvents();

  play(harbor, NO_KEYS, 1, new GameState(), events);

  assert.ok(harbor.ship.y > start.y + 40);
  assert.equal(harbor.ship.x, start.x);
});

test('the arrow keys steer left and right', () => {
  const left = emptyHarbor();
  const right = emptyHarbor();
  const startX = left.ship.x;
  const { events } = recordEvents();

  play(left, { left: true }, 0.5, new GameState(), events);
  play(right, { right: true }, 0.5, new GameState(), events);

  assert.ok(left.ship.x < startX);
  assert.ok(right.ship.x > startX);
});

test('the wind pushes the ship sideways, in pixels per second', () => {
  const harbor = emptyHarbor();
  harbor.wind = 30;
  const startX = harbor.ship.x;
  const { events } = recordEvents();

  play(harbor, NO_KEYS, 1, new GameState(), events);

  assert.ok(Math.abs(harbor.ship.x - (startX + 30)) < 1);
});

test('the harbor wall stops the ship', () => {
  const harbor = emptyHarbor();
  harbor.wind = -1000;
  const { events } = recordEvents();

  play(harbor, NO_KEYS, 1, new GameState(), events);

  assert.equal(harbor.ship.x, LAYOUT.wallLeft);
});

test('hitting an anchored ship costs Rep and sends you back to the start', () => {
  const harbor = emptyHarbor();
  const start = { x: harbor.ship.x, y: harbor.ship.y };
  harbor.obstacles = [{ x: start.x, y: start.y + 30, w: 16, h: 18 }];
  const state = new GameState();
  const { events, log } = recordEvents();

  play(harbor, NO_KEYS, 0.5, state, events); // long enough to hit it once

  assert.equal(state.repair, 190);
  assert.deepEqual(log, [{ name: 'shipDamaged', data: { amount: 10 } }]);
  assert.ok(harbor.ship.y < start.y + 30, 'ship should be back near the start');
});

test('a crash that takes the last Rep sinks the ship', () => {
  const harbor = emptyHarbor();
  harbor.obstacles = [{ x: harbor.ship.x, y: harbor.ship.y + 30, w: 16, h: 18 }];
  const state = new GameState();
  state.repair = 10;
  const { events, log } = recordEvents();

  play(harbor, NO_KEYS, 2, state, events);

  assert.equal(harbor.status, 'sunk');
  assert.equal(state.repair, 0);
  assert.deepEqual(log.map((e) => e.name), ['shipDamaged', 'shipSunk']);
});

test('sailing through the gap docks the ship', () => {
  const harbor = emptyHarbor();
  harbor.ship.x = (LAYOUT.gapLeft + LAYOUT.gapRight) / 2 - harbor.ship.w / 2;
  const state = new GameState();
  const { events, log } = recordEvents();

  play(harbor, NO_KEYS, 12, state, events);

  assert.equal(harbor.status, 'docked');
  assert.equal(state.repair, 200);
  assert.deepEqual(log, [{ name: 'enteredHarbor', data: { city: SKAGEN } }]);
});

test('missing the gap and hitting a dock sinks the ship', () => {
  const harbor = emptyHarbor();
  harbor.ship.x = 100; // over the left dock
  const state = new GameState();
  const { events, log } = recordEvents();

  play(harbor, NO_KEYS, 12, state, events);

  assert.equal(harbor.status, 'sunk');
  assert.equal(state.repair, 0);
  assert.deepEqual(log.map((e) => e.name), ['shipSunk']);
});

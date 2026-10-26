import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventBus } from '../src/engine/EventBus.js';
import { GameState } from '../src/game/GameState.js';
import { damageShip, isSunk } from '../src/game/rules/ship.js';

function recordEvents() {
  const events = new EventBus();
  const log = [];
  for (const name of ['shipDamaged', 'shipSunk']) events.on(name, () => log.push(name));
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

test('Rep never goes below 0, and reaching 0 sinks the ship', () => {
  const state = new GameState();
  state.repair = 5;
  const { events, log } = recordEvents();

  damageShip(state, 30, events);

  assert.equal(state.repair, 0);
  assert.equal(isSunk(state), true);
  assert.deepEqual(log, ['shipDamaged', 'shipSunk']);
});

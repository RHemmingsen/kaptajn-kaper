import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventBus } from '../src/engine/EventBus.js';
import { GameState } from '../src/game/GameState.js';
import { endGame, isGameOver } from '../src/game/rules/ending.js';
import { sinkShip } from '../src/game/rules/ship.js';

function recordGameOver() {
  const events = new EventBus();
  const log = [];
  events.on('gameOver', (data) => log.push(data));
  return { events, log };
}

test('the game ends with a summary of how it went', () => {
  const state = new GameState('Ronnie');
  state.points = 1250;
  const { events, log } = recordGameOver();

  endGame(state, 'won', events);

  assert.equal(isGameOver(state), true);
  assert.deepEqual(log, [{ ending: 'won', name: 'Ronnie', points: 1250, money: 600, men: 200, repair: 200 }]);
});

test('the game only ends once; the first ending stands', () => {
  const state = new GameState();
  const { events, log } = recordGameOver();

  endGame(state, 'jilted', events);
  endGame(state, 'sunk', events);

  assert.equal(state.ending, 'jilted');
  assert.equal(log.length, 1);
});

test('losing the ship ends the game', () => {
  const state = new GameState();
  const { events, log } = recordGameOver();

  sinkShip(state, events);

  assert.equal(state.ending, 'sunk');
  assert.equal(log[0].ending, 'sunk');
});

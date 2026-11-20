// Tests for boarding. Each round rolls one die: how many of your men fall.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dice } from './helpers.js';
import { EventBus } from 'engine/EventBus.js';
import { GameState } from '../src/game/GameState.js';
import { SHIP_TYPES } from '../src/game/rules/sea.js';
import { fightRound } from '../src/game/rules/boarding.js';
import { EVENTS } from '../src/game/events.js';


// A galease with 140 men, against your 200 at the start of the game.
function setup(enemyMen = 140) {
  const enemy = { type: SHIP_TYPES[3], repair: 120, guns: 15, men: enemyMen, money: 450, grain: 3, distance: 700 };
  return { enemy, state: new GameState(), events: new EventBus() };
}

test('both sides lose men; the weaker enemy loses more', () => {
  const { enemy, state, events } = setup();

  const result = fightRound(enemy, state, events, dice(0.5));

  // You: 200 men x morale 1.5 x (difficulty 2 x 0.5 / 30) = 10.
  assert.equal(result.ownLosses, 10);
  assert.equal(state.men, 190);
  // Her strength: 140 / 200 x 1.5 x 0.2 = 0.21, raised to the 0.6 minimum.
  // She loses 10 / 0.6 = 16.7, rounded to 17.
  assert.equal(result.enemyLosses, 17);
  assert.equal(enemy.men, 123);
  assert.equal(result.outcome, null);
});

test('each round is told as a boardingRound event', () => {
  const { enemy, state, events } = setup();
  const told = [];
  events.on(EVENTS.boardingRound, (round) => told.push(round));
  const result = fightRound(enemy, state, events, dice(0.5));
  assert.deepEqual(told, [result]);
});

test('the enemy always loses at least a tenth of her men', () => {
  const { enemy, state, events } = setup();

  const result = fightRound(enemy, state, events, dice(0));

  assert.equal(result.ownLosses, 0);
  assert.equal(result.enemyLosses, 14);
});

test('a much stronger enemy is capped at strength 1.2', () => {
  const { enemy, state, events } = setup(480); // a troop transport
  state.men = 50;

  const result = fightRound(enemy, state, events, dice(0.9));

  // You: 50 x 1.5 x (2 x 0.9 / 30) = 4.5, so 4. Her: 4 / 1.2 = 3, but at
  // least a tenth of 480 = 48.
  assert.equal(result.ownLosses, 4);
  assert.equal(result.enemyLosses, 48);
});

test('she strikes her flag with fewer than 20 men', () => {
  const { enemy, state, events } = setup(25);

  const result = fightRound(enemy, state, events, dice(0.5));

  assert.equal(enemy.men, 8);
  assert.equal(result.outcome, 'surrender');
});

test('she can never lose more men than she has', () => {
  const { enemy, state, events } = setup(21);
  state.flights = 20; // terrible morale: big losses on both sides

  const result = fightRound(enemy, state, events, dice(0.99));

  assert.equal(result.enemyLosses, 21);
  assert.equal(enemy.men, 0);
});

test('if too few of your men are left, your ship is lost', () => {
  const { enemy, state, events } = setup();
  state.men = 11;
  state.flights = 20; // morale (2 + 20) / 2 = 11

  const result = fightRound(enemy, state, events, dice(0.99));

  // 11 x 11 x (2 x 0.99 / 30) = 7.98, so 7 fall and 4 are left.
  assert.equal(result.ownLosses, 7);
  assert.equal(result.outcome, 'lost');
  assert.equal(state.sunk, true);
  assert.equal(enemy.men, 140, 'the fight stops when your ship is lost');
});

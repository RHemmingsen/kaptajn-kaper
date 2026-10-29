// Tests for your career: goals, promotions, and running out of moves.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventBus } from '../src/engine/EventBus.js';
import { GameState } from '../src/game/GameState.js';
import { addressedAs, goalReached, nobleTitle, promote, rankTitle, useMove } from '../src/game/rules/career.js';

function recordGameOver() {
  const events = new EventBus();
  const log = [];
  events.on('gameOver', (data) => log.push(data));
  return { events, log };
}

test('you start as skibsfører and borger, aiming for 1000 points in 300 moves', () => {
  const state = new GameState();
  assert.equal(rankTitle(state), 'skibsfører');
  assert.equal(nobleTitle(state), 'Borger');
  assert.equal(state.goal, 1000);
  assert.equal(state.maxMoves, 300);
});

test('the goal is reached at its number of points', () => {
  const state = new GameState();
  state.points = 999;
  assert.equal(goalReached(state), false);
  state.points = 1000;
  assert.equal(goalReached(state), true);
});

test('a promotion raises the difficulty, rank and title, and sets a new goal from here', () => {
  const state = new GameState();
  state.points = 1010;
  state.moves = 120;

  assert.deepEqual(promote(state), { won: false });
  assert.equal(state.difficulty, 4);
  assert.equal(rankTitle(state), 'kaptajn');
  assert.equal(nobleTitle(state), 'Baron');
  assert.equal(state.goal, 1010 + 500 + 250 * 4); // 2510
  assert.equal(state.maxMoves, 120 + 325 - 12.5 * 4); // 395
});

test('the fourth promotion wins the game, as kronprins', () => {
  const state = new GameState();
  assert.equal(promote(state).won, false); // baron
  assert.equal(promote(state).won, false); // greve
  assert.equal(promote(state).won, false); // kammerherre
  assert.equal(promote(state).won, true);
  assert.equal(nobleTitle(state), 'Kronprins');
});

test('the move that reaches the limit ends the game: Julie marries another', () => {
  const state = new GameState();
  state.moves = 298;
  const { events, log } = recordGameOver();

  useMove(state, events);
  assert.equal(state.ending, null);

  useMove(state, events);
  assert.equal(state.ending, 'jilted');
  assert.equal(log.length, 1);
  assert.equal(log[0].ending, 'jilted');
});

test('you are addressed by rank and name', () => {
  assert.equal(addressedAs(new GameState('Ronnie')), 'skibsfører Ronnie');
  assert.equal(addressedAs(new GameState()), 'skibsfører', 'no name, just the rank');
});

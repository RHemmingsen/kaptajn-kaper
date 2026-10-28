import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../src/game/GameState.js';
import { rankTitle } from '../src/game/rules/career.js';

test('you start as skibsfører and end as admiral', () => {
  const state = new GameState();
  assert.equal(rankTitle(state), 'skibsfører');
  state.difficulty = 10;
  assert.equal(rankTitle(state), 'admiral');
});

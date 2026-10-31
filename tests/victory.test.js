// Tests for what happens when a ship strikes her flag.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventBus } from 'engine/EventBus.js';
import { GameState } from '../src/game/GameState.js';
import { SHIP_TYPES } from '../src/game/rules/sea.js';
import { plunder, sinkPrize, sendPrize, collectPrizes } from '../src/game/rules/victory.js';

// A galease that has struck her flag with 108 men left.
function galease(changes = {}) {
  return { type: SHIP_TYPES[3], repair: 30, guns: 10, men: 108, money: 450, grain: 3, distance: 700, ...changes };
}

test('you take her rigsdaler, points for them, and her grain', () => {
  const state = new GameState();
  const spoils = plunder(galease(), state);

  assert.deepEqual(spoils, { money: 450, points: 45, grain: 3, survivors: 108, prizeCrew: 59 });
  assert.equal(state.money, 1050);
  assert.equal(state.points, 45);
  assert.equal(state.grain, 33);
});

test('there are always at least 2 sacks of grain aboard', () => {
  assert.equal(plunder(galease({ grain: 1 }), new GameState()).grain, 2);
});

test('a prize crew is 5 men plus half her survivors', () => {
  assert.equal(plunder(galease({ men: 0 }), new GameState()).prizeCrew, 5);
  assert.equal(plunder(galease({ men: 19 }), new GameState()).prizeCrew, 14);
});

test('sinking her: her survivors join you, and you get no extra points', () => {
  const state = new GameState();
  const spoils = plunder(galease(), state);

  assert.deepEqual(sinkPrize(state, spoils), { joined: 108, toTheSharks: 0 });
  assert.equal(state.men, 308);
  assert.equal(state.points, 45);
});

test('more than 500 men, and the rest go to the sharks', () => {
  const state = new GameState();
  state.men = 450;
  const spoils = plunder(galease(), state);

  assert.deepEqual(sinkPrize(state, spoils), { joined: 108, toTheSharks: 58 });
  assert.equal(state.men, 500);
});

test('a prize crew leaves your ship, and the prize reaches København 13 times in 16', () => {
  const state = new GameState();
  const spoils = plunder(galease(), state);

  // floor(0.2 x 16) = 3, more than difficulty 2: she arrives.
  assert.deepEqual(sendPrize(state, spoils, new EventBus(), () => 0.2), { arrives: true });
  assert.equal(state.men, 141);
  assert.equal(state.prizeMen, 59);
  assert.equal(state.prizeMoney, 450);
});

test('the prize can be lost on the way', () => {
  const state = new GameState();
  const spoils = plunder(galease(), state);

  // floor(0.1 x 16) = 1, not more than difficulty 2: she's lost.
  assert.deepEqual(sendPrize(state, spoils, new EventBus(), () => 0.1), { arrives: false });
  assert.equal(state.men, 141, 'the prize crew is gone either way');
  assert.equal(state.prizeMen, 0);
});

test('a prize crew can leave too few men to sail your own ship', () => {
  const state = new GameState();
  state.men = 60;
  const spoils = plunder(galease(), state); // a prize crew of 59

  assert.deepEqual(sendPrize(state, spoils, new EventBus(), () => 0.99), { arrives: false });
  assert.equal(state.sunk, true);
});

test('in København, the prize crews and prize money are paid out, with points', () => {
  const state = new GameState();
  state.prizeMen = 59;
  state.prizeMoney = 450;

  assert.deepEqual(collectPrizes(state), { men: 59, money: 450, points: 45, leftBehind: 0 });
  assert.equal(state.men, 259);
  assert.equal(state.money, 1050);
  assert.equal(state.points, 45);
  assert.equal(collectPrizes(state), null, 'paid out only once');
});

test('prize money fills the ship up to 30000 rigsdaler; the rest is left behind', () => {
  const state = new GameState();
  state.money = 29900;
  state.prizeMoney = 450;

  assert.deepEqual(collectPrizes(state), { men: 0, money: 450, points: 45, leftBehind: 350 });
  assert.equal(state.money, 30000);
  assert.equal(state.points, 45, 'points for all of it');
});

test('where she struck her flag, the waters are quiet', () => {
  const state = new GameState();
  plunder(galease(), state);
  assert.deepEqual(state.quietWaters, [{ col: 10, row: 10 }]);
});

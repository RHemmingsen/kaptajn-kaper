// Tests for trading in a port.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { recordEvents } from './helpers.js';
import { EventBus } from '../src/engine/EventBus.js';
import { GameState } from '../src/game/GameState.js';
import { GOODS, rollPrices, buy, sell } from '../src/game/rules/trade.js';
import { EVENTS } from '../src/game/events.js';

// Nobody listens to these, except the test about refusals.
const events = new EventBus();

// Fixed prices, so the sums are easy to check.
const PRICES = { men: 10, repair: 8, guns: 100, grain: 5, jewels: 50 };

test('prices are 80% to 180% of the base price, in whole rigsdaler', () => {
  const cheapest = rollPrices(() => 0);
  const dearest = rollPrices(() => 0.9999);
  for (const [name, good] of Object.entries(GOODS)) {
    assert.equal(cheapest[name], Math.round(good.basePrice * 0.8));
    assert.equal(dearest[name], Math.round(good.basePrice * 1.8));
    assert.ok(Number.isInteger(cheapest[name]) && Number.isInteger(dearest[name]));
  }
});

test('buying pays the price and adds to the ship', () => {
  const state = new GameState(); // 600 rgsd, 20 guns
  const result = buy(state, PRICES, 'guns', 3, events);

  assert.deepEqual(result, { ok: true, total: 300 });
  assert.equal(state.money, 300);
  assert.equal(state.guns, 23);
});

test('hiring men and repairing work the same way', () => {
  const state = new GameState();
  buy(state, PRICES, 'men', 10, events);
  buy(state, PRICES, 'repair', 25, events);

  assert.equal(state.men, 210);
  assert.equal(state.repair, 225);
  assert.equal(state.money, 600 - 100 - 200);
});

test("you can't buy what you can't afford", () => {
  const state = new GameState();
  const result = buy(state, PRICES, 'guns', 7, events); // 700 > 600

  assert.deepEqual(result, { ok: false, reason: 'cantAfford' });
  assert.equal(state.money, 600);
  assert.equal(state.guns, 20);
});

test('the ship holds at most 149 guns, 499 men and 699 sacks of grain', () => {
  const state = new GameState();
  state.money = 1_000_000;
  state.guns = 140;
  state.men = 490;
  state.grain = 690;

  assert.equal(buy(state, PRICES, 'guns', 10, events).reason, 'tooMany');
  assert.equal(buy(state, PRICES, 'men', 10, events).reason, 'tooMany');
  assert.equal(buy(state, PRICES, 'grain', 10, events).reason, 'tooMany');
  assert.equal(buy(state, PRICES, 'guns', 9, events).ok, true); // exactly 149
});

test('there is no limit on repairs', () => {
  const state = new GameState();
  state.money = 1_000_000;
  assert.equal(buy(state, PRICES, 'repair', 5000, events).ok, true);
});

test('only whole amounts of at least 1 can be traded', () => {
  const state = new GameState();
  for (const amount of [0, -100, 1.5, NaN, null]) {
    assert.equal(buy(state, PRICES, 'guns', amount, events).reason, 'invalidAmount');
    assert.equal(sell(state, PRICES, 'guns', amount, events).reason, 'invalidAmount');
  }
  assert.equal(state.money, 600);
  assert.equal(state.guns, 20);
});

test('selling takes from the ship and pays the price', () => {
  const state = new GameState();
  state.jewels = 3;
  const result = sell(state, PRICES, 'jewels', 2, events);

  assert.deepEqual(result, { ok: true, total: 100 });
  assert.equal(state.jewels, 1);
  assert.equal(state.money, 700);
});

test("you can't sell more than you have", () => {
  const state = new GameState();
  state.grain = 28.5; // the crew eats half sacks
  assert.equal(sell(state, PRICES, 'grain', 29, events).reason, 'notEnough');
  assert.equal(sell(state, PRICES, 'grain', 28, events).ok, true);
  assert.equal(state.grain, 0.5);
});

test('men and repairs can only be bought, jewels only sold', () => {
  const state = new GameState();
  state.jewels = 1;
  assert.equal(sell(state, PRICES, 'men', 1, events).reason, 'notForSale');
  assert.equal(sell(state, PRICES, 'repair', 1, events).reason, 'notForSale');
  assert.equal(buy(state, PRICES, 'jewels', 1, events).reason, 'notForSale');
});

test('a refused trade is told as a tradeRefused event; a trade that happens is not', () => {
  const state = new GameState(); // 600 rigsdaler
  const { events: recorded, log } = recordEvents([EVENTS.tradeRefused]);
  buy(state, PRICES, 'guns', 7, recorded); // 700 > 600
  buy(state, PRICES, 'guns', 1, recorded);
  assert.deepEqual(log, [{ name: EVENTS.tradeRefused, data: { reason: 'cantAfford' } }]);
});

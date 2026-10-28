// The rules for trading in a port, as in the original game: hire men, repair
// the ship, buy guns and grain, and sell grain, guns and jewels.
//
// buy() and sell() answer the one who asked with a result, rather than
// emitting events: { ok: true } or { ok: false, reason }. The reasons are
//   invalidAmount   not a whole number of at least 1
//   notForSale      this can't be bought / sold
//   cantAfford      not enough rigsdaler
//   tooMany         the ship can't hold that many
//   notEnough       selling more than you have

// What can be traded. `stat` is the GameState field it changes, `max` the
// most the ship can hold (the original's limits).
export const GOODS = {
  men: { stat: 'men', basePrice: 10, max: 499, canBuy: true, canSell: false },
  repair: { stat: 'repair', basePrice: 8, max: Infinity, canBuy: true, canSell: false },
  guns: { stat: 'guns', basePrice: 100, max: 149, canBuy: true, canSell: true },
  grain: { stat: 'grain', basePrice: 5, max: 699, canBuy: true, canSell: true },
  jewels: { stat: 'jewels', basePrice: 50, max: Infinity, canBuy: false, canSell: true },
};

// New prices for a port visit: each good costs 80% to 180% of its base
// price, rounded to whole rigsdaler. Buying and selling use the same price.
// `random` returns 0..1; tests pass their own.
export function rollPrices(random = Math.random) {
  const prices = {};
  for (const [name, good] of Object.entries(GOODS)) {
    prices[name] = Math.max(1, Math.round(good.basePrice * (0.8 + random())));
  }
  return prices;
}

export function buy(state, prices, goodName, amount) {
  const good = GOODS[goodName];
  if (!isWholeAmount(amount)) return fail('invalidAmount');
  if (!good.canBuy) return fail('notForSale');

  const cost = amount * prices[goodName];
  if (cost > state.money) return fail('cantAfford');
  if (state[good.stat] + amount > good.max) return fail('tooMany');

  state.money -= cost;
  state[good.stat] += amount;
  return { ok: true, total: cost };
}

export function sell(state, prices, goodName, amount) {
  const good = GOODS[goodName];
  if (!isWholeAmount(amount)) return fail('invalidAmount');
  if (!good.canSell) return fail('notForSale');
  if (amount > state[good.stat]) return fail('notEnough');

  const earnings = amount * prices[goodName];
  state[good.stat] -= amount;
  state.money += earnings;
  return { ok: true, total: earnings };
}

// The original didn't check this, so you could buy -100 guns and be paid.
function isWholeAmount(amount) {
  return Number.isInteger(amount) && amount >= 1;
}

function fail(reason) {
  return { ok: false, reason };
}

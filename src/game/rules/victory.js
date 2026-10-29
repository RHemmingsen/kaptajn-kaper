// The rules for a ship that has struck her flag, as in the original game (its
// lines 2950-3090 and 1500-1507): take what's aboard, then sink her or send
// her to København as a prize, where her crew and the prize money wait.
//
// Random numbers come from a `random` function returning 0..1, so tests can
// decide what happens.
import { isSunk, loseMen, MAX_CARGO } from './ship.js';

const MIN_GRAIN = 2; // there's always a little grain aboard
const PRIZE_CREW_BASE = 5; // a prize crew is 5 men, plus half her survivors

// Take her rigsdaler (and points for them) and her grain, and count her
// survivors. Returns the spoils, which say what was taken and what the
// choice between sinking her and taking her as a prize involves:
//   { money, points, grain, survivors, prizeCrew }
export function plunder(enemy, state) {
  const money = enemy.money;
  const points = Math.floor(money / 10);
  const grain = Math.max(MIN_GRAIN, enemy.grain);
  const survivors = Math.max(0, enemy.men);

  state.money += money;
  state.points += points;
  state.grain += grain;

  return {
    money,
    points,
    grain,
    survivors,
    prizeCrew: PRIZE_CREW_BASE + Math.floor(survivors / 2),
  };
}

// Sink her. Her survivors join your crew, but the ship can hold no more than
// 500 men; the rest go to the sharks. Returns { joined, toTheSharks }.
//
// (In the original, sinking a ship that had surrendered gave her points a
// second time. Here you only get them once, in plunder().)
export function sinkPrize(state, spoils) {
  state.men += spoils.survivors;
  const toTheSharks = Math.max(0, state.men - MAX_CARGO.men);
  state.men -= toTheSharks;
  return { joined: spoils.survivors, toTheSharks };
}

// Send her to København with a prize crew of your men. She may not make it:
// the chance is (15 - difficulty) in 16, 13 in 16 at the start. If she does,
// her prize crew and her rigsdaler wait for you there. Losing the prize crew
// can leave too few men to sail your own ship.
//
// Returns { arrives }. You aren't told this in the game; you find out in
// København.
export function sendPrize(state, spoils, events, random = Math.random) {
  loseMen(state, spoils.prizeCrew, events);
  if (isSunk(state)) return { arrives: false };

  const arrives = state.difficulty < Math.floor(random() * 16);
  if (arrives) {
    state.prizeMen += spoils.prizeCrew;
    state.prizeMoney += spoils.money;
  }
  return { arrives };
}

// Arriving in the prize port: collect the crews and prize money waiting
// there, with points for all the money. The ship can't carry more than
// 30000 rigsdaler, so any more is left behind. (That's what the original
// meant to do; a typo, irdsd=3000, meant the weight sank the ship instead.)
// Returns { men, money, points, leftBehind }, or null if nothing was waiting.
export function collectPrizes(state) {
  if (state.prizeMen === 0 && state.prizeMoney === 0) return null;

  const men = state.prizeMen;
  const money = state.prizeMoney;
  const points = Math.floor(money / 10);
  const kept = Math.min(money, Math.max(0, MAX_CARGO.money - state.money));
  state.men += men;
  state.money += kept;
  state.points += points;
  state.prizeMen = 0;
  state.prizeMoney = 0;
  return { men, money, points, leftBehind: money - kept };
}

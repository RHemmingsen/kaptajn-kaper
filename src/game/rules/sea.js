// The rules for what can happen at sea, as in the original game: ships
// sighted, and fog banks that may hide something good or bad.
//
// Random numbers come from a `random` function returning 0..1, so tests can
// decide what happens.
import { loseMen } from './ship.js';
import { EVENTS } from '../events.js';

const SEA_EVENT_CHANCE = 0.25; // per move onto open water

// The ships you can meet (the original's lines 840-910). `maxGrain` is the
// most grain one can carry.
export const SHIP_TYPES = [
  { name: 'handelsmand', guns: 5, men: 80, money: 150, maxGrain: 30 },
  { name: 'troppetransport', guns: 10, men: 480, money: 600, maxGrain: 15 },
  { name: 'kanonbåd', guns: 2, men: 40, money: 150, maxGrain: 4 },
  { name: 'galease', guns: 15, men: 140, money: 450, maxGrain: 5 },
  { name: 'brig', guns: 6, men: 50, money: 200, maxGrain: 4 },
  { name: 'skonnert', guns: 1, men: 10, money: 30, maxGrain: 1 },
  { name: 'orlogsmand', guns: 50, men: 140, money: 900, maxGrain: 20 },
  { name: 'sørøverskib', guns: 70, men: 200, money: 1500, maxGrain: 12, pirate: true },
];

// What's in a fog bank, one tenth chance each (the original's lines 2480-2590).
const FOG_OUTCOMES = [
  'ship', 'ship', 'treasure', 'jewels', 'gun', 'castaways', 'nothing', 'nothing', 'grain', 'plague',
];
const TREASURE = 600; // rigsdaler in the chest

// After a move onto open water: maybe the lookout spots something.
// Returns null, { kind: 'ship', ship } or { kind: 'fog' }. In quiet waters,
// always null.
export function rollSeaEvent(state, random = Math.random) {
  if (isQuiet(state, state.ship)) return null;
  if (random() >= SEA_EVENT_CHANCE) return null;

  const n = Math.floor(random() * 10); // 0-7 a ship type, 8-9 a fog bank
  if (n >= SHIP_TYPES.length) {
    state.encounters += 1;
    return { kind: 'fog' };
  }
  return { kind: 'ship', ship: meetShip(state, SHIP_TYPES[n], random) };
}

// Go into the fog bank and see what's there. Returns what was found:
//   { kind: 'ship', ship }       a ship comes out of the mist
//   { kind: 'treasure', money }
//   { kind: 'jewels', count }
//   { kind: 'gun' }
//   { kind: 'castaways', count } shipwrecked men who join the crew
//   { kind: 'nothing' }
//   { kind: 'grain', count }
//   { kind: 'plague', count }    men who died of it
// and tells the same as a 'fogInvestigated' event.
export function investigateFog(state, events, random = Math.random) {
  const found = findInFog(state, events, random);
  events.emit(EVENTS.fogInvestigated, found);
  return found;
}

function findInFog(state, events, random) {
  const kind = FOG_OUTCOMES[Math.floor(random() * FOG_OUTCOMES.length)];

  switch (kind) {
    case 'ship': {
      const type = SHIP_TYPES[Math.floor(random() * SHIP_TYPES.length)];
      return { kind, ship: meetShip(state, type, random) };
    }
    case 'treasure':
      state.money += TREASURE;
      return { kind, money: TREASURE };
    case 'jewels': {
      const count = 2 + Math.floor(random() * 6);
      state.jewels += count;
      return { kind, count };
    }
    case 'gun':
      state.guns += 1;
      return { kind };
    case 'castaways': {
      const count = 9 + Math.floor(random() * 40);
      state.men += count;
      return { kind, count };
    }
    case 'grain': {
      const count = 2 + Math.floor(random() * 6);
      state.grain += count;
      return { kind, count };
    }
    case 'plague': {
      const count = Math.floor(state.men / 3);
      loseMen(state, count, events);
      return { kind, count };
    }
    default:
      return { kind: 'nothing' };
  }
}

// Where you beat an enemy, the English don't dare come any more: the cell
// the ship is in becomes quiet, and nothing more happens there. Called when
// an enemy strikes her flag or is sunk. (The original's lines 3000 and 3080;
// its help: "Der, hvor du har nedkæmpet en fjende, tør englænderne ikke
// komme mere!")
export function quietenWaters(state) {
  if (!isQuiet(state, state.ship)) state.quietWaters.push({ ...state.ship });
}

export function isQuiet(state, { col, row }) {
  return state.quietWaters.some((cell) => cell.col === col && cell.row === row);
}

// Sail away from a ship. It always works, but it's remembered.
export function flee(state, events) {
  state.flights += 1;
  events.emit(EVENTS.fled, {});
}

// A ship of the given type comes into view, ready for battle: its own Rep,
// some grain, and a distance in fathoms.
function meetShip(state, type, random) {
  state.encounters += 1;
  return {
    type,
    repair: 100 + Math.floor(random() * 50),
    guns: type.guns,
    men: type.men,
    money: type.money,
    grain: 1 + Math.floor(random() * type.maxGrain),
    distance: 500 + Math.floor(random() * 500),
  };
}

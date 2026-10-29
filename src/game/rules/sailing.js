// The rules for sailing on the map, as in the original game. Nothing here
// knows about the keyboard or the canvas: it takes the game state, changes
// it, and announces what happened.
import { tileAt, cityAt } from '../map.js';
import { useMove } from './career.js';
import { isGameOver } from './ending.js';
import { rollSeaEvent } from './sea.js';
import { crewEats, damageShip, isSunk } from './ship.js';

// How each direction changes the ship's position, as [columns, rows].
export const DIRECTIONS = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
  upLeft: [-1, -1],
  upRight: [1, -1],
  downLeft: [-1, 1],
  downRight: [1, 1],
};

const AGROUND_DAMAGE = 3; // Rep lost when sailing into land

// Water is always sailable. Ports are on land, but you can sail into them.
export function canSailTo(col, row) {
  return tileAt(col, row) === '.' || cityAt(col, row) !== null;
}

// Try to sail one cell in a direction. Returns true if the ship moved.
//
//   - Off the edge of the map: nothing happens.
//   - Every other attempt is a move (Træk). If it was the last one, the game
//     is over and the ship goes nowhere.
//   - The crew eats. If that starves them to death, the ship is lost and
//     goes nowhere.
//   - Into land: the ship runs aground. It stays where it is and loses Rep.
//   - Onto open water: the lookout may spot something (see sea.js).
//
// `random` returns 0..1 and decides what's spotted; tests pass their own.
//
// Events emitted (plus the ones from ship.js and sea.js):
//   shipMoved       { col, row }
//   arrivedAtPort   { city }
//   shipRanAground  { col, row }   the land cell it hit
//   seaEvent        { kind: 'ship', ship } or { kind: 'fog' }
export function sail(state, direction, events, random = Math.random) {
  const [dCol, dRow] = DIRECTIONS[direction];
  const col = state.ship.col + dCol;
  const row = state.ship.row + dRow;

  if (tileAt(col, row) === null) return false;

  useMove(state, events);
  if (isGameOver(state)) return false;

  crewEats(state, events);
  if (isSunk(state)) return false;

  if (!canSailTo(col, row)) {
    events.emit('shipRanAground', { col, row });
    damageShip(state, AGROUND_DAMAGE, events);
    return false;
  }

  state.ship.col = col;
  state.ship.row = row;
  events.emit('shipMoved', { col, row });

  const city = cityAt(col, row);
  if (city) {
    events.emit('arrivedAtPort', { city });
    return true;
  }

  const seaEvent = rollSeaEvent(state, random);
  if (seaEvent) events.emit('seaEvent', seaEvent);
  return true;
}

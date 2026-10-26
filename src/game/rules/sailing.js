// The rules for sailing on the map. Nothing here knows about the keyboard or
// the canvas: it takes the game state, changes it, and announces what happened.
import { tileAt, cityAt } from '../map.js';

// How each direction changes the ship's position, as [columns, rows].
export const DIRECTIONS = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

// Water is always sailable. Ports are on land, but you can sail into them.
export function canSailTo(col, row) {
  return tileAt(col, row) === '.' || cityAt(col, row) !== null;
}

// Move the ship one tile. Costs one move (Træk). Returns false, and changes
// nothing, if the way is blocked.
//
// Events emitted:
//   shipMoved      { col, row }
//   arrivedAtPort  { city }
export function sail(state, direction, events) {
  const [dCol, dRow] = DIRECTIONS[direction];
  const col = state.ship.col + dCol;
  const row = state.ship.row + dRow;

  if (!canSailTo(col, row)) return false;

  state.ship.col = col;
  state.ship.row = row;
  state.moves += 1;

  events.emit('shipMoved', { col, row });

  const city = cityAt(col, row);
  if (city) events.emit('arrivedAtPort', { city });

  return true;
}

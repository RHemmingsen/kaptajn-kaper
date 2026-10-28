// The rules for sailing on the map, as in the original game. Nothing here
// knows about the keyboard or the canvas: it takes the game state, changes
// it, and announces what happened.
import { tileAt, cityAt } from '../map.js';
import { damageShip } from './ship.js';

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
const STARVING_SURVIVORS = 0.9; // share of the crew left after a move without grain

// Water is always sailable. Ports are on land, but you can sail into them.
export function canSailTo(col, row) {
  return tileAt(col, row) === '.' || cityAt(col, row) !== null;
}

// Try to sail one cell in a direction. Returns true if the ship moved.
//
//   - Off the edge of the map: nothing happens.
//   - Every other attempt is a move (Træk), and the crew eats.
//   - Into land: the ship runs aground. It stays where it is and loses Rep.
//
// Events emitted (plus the ones from ship.js):
//   shipMoved       { col, row }
//   arrivedAtPort   { city }
//   shipRanAground  { col, row }   the land cell it hit
//   crewStarving    { lost }       men who died for lack of grain
export function sail(state, direction, events) {
  const [dCol, dRow] = DIRECTIONS[direction];
  const col = state.ship.col + dCol;
  const row = state.ship.row + dRow;

  if (tileAt(col, row) === null) return false;

  state.moves += 1;
  eatGrain(state, events);

  if (!canSailTo(col, row)) {
    events.emit('shipRanAground', { col, row });
    damageShip(state, AGROUND_DAMAGE, events);
    return false;
  }

  state.ship.col = col;
  state.ship.row = row;
  events.emit('shipMoved', { col, row });

  const city = cityAt(col, row);
  if (city) events.emit('arrivedAtPort', { city });

  return true;
}

// The crew eats men x difficulty / 800 sacks per move: half a sack for 200
// men at the start. When there's not enough, the grain runs out and a tenth
// of the crew dies.
function eatGrain(state, events) {
  state.grain -= (state.men * state.difficulty) / 800;
  if (state.grain >= 0) return;

  state.grain = 0;
  const survivors = Math.floor(state.men * STARVING_SURVIVORS);
  const lost = state.men - survivors;
  state.men = survivors;
  events.emit('crewStarving', { lost });
}

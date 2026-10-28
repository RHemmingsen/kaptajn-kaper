// Rules for the ship and its crew, shared by every part of the game that
// affects them: sailing makes the crew eat, harbor crashes and (later) cannon
// fire damage the ship.
//
// The ship is lost when it gets too damaged or its crew too small (the
// original's line 5000). Everything here that lowers Rep or men checks that
// straight away, so no other rule has to remember to.
//
// Events emitted:
//   shipDamaged   { amount }
//   crewStarving  { lost }   men who died for lack of grain
//   shipSunk      {}         once per game, however the ship was lost

const MIN_REPAIR = 20; // at this Rep or less, the ship goes down...
const MIN_MEN = 10; // ...and with this few men or fewer, too
const STARVING_SURVIVORS = 0.9; // share of the crew left after a meal without grain

// Lose `amount` Rep, never going below 0.
export function damageShip(state, amount, events) {
  state.repair = Math.max(0, state.repair - amount);
  events.emit('shipDamaged', { amount });
  checkShipLost(state, events);
}

// The crew eats one meal: men x difficulty / 800 sacks of grain, which is half
// a sack for 200 men at the start. When there's not enough, the grain runs
// out and a tenth of the crew dies.
export function crewEats(state, events) {
  state.grain -= (state.men * state.difficulty) / 800;
  if (state.grain >= 0) return;

  state.grain = 0;
  const survivors = Math.floor(state.men * STARVING_SURVIVORS);
  const lost = state.men - survivors;
  state.men = survivors;
  events.emit('crewStarving', { lost });
  checkShipLost(state, events);
}

// The ship is lost, whatever its Rep and crew, e.g. wrecked on a pier.
export function sinkShip(state, events) {
  if (state.sunk) return;
  state.sunk = true;
  events.emit('shipSunk', {});
}

export function isSunk(state) {
  return state.sunk;
}

// Too damaged, or too few men to sail her?
export function isShipLost(state) {
  return state.repair <= MIN_REPAIR || state.men <= MIN_MEN;
}

function checkShipLost(state, events) {
  if (isShipLost(state)) sinkShip(state, events);
}

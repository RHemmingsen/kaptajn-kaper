// Rules for the ship and its crew, shared by every part of the game that
// affects them: sailing makes the crew eat, harbor crashes and (later) cannon
// fire damage the ship.
//
// Events emitted:
//   shipDamaged   { amount }
//   shipSunk      {}
//   crewStarving  { lost }   men who died for lack of grain

const STARVING_SURVIVORS = 0.9; // share of the crew left after a meal without grain

// Lose `amount` Rep. If that brings Rep to 0, the ship sinks.
export function damageShip(state, amount, events) {
  state.repair = Math.max(0, state.repair - amount);
  events.emit('shipDamaged', { amount });
  if (state.repair === 0) sinkShip(state, events);
}

// The ship is lost, whatever its Rep was.
export function sinkShip(state, events) {
  state.repair = 0;
  events.emit('shipSunk', {});
}

export function isSunk(state) {
  return state.repair === 0;
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
}

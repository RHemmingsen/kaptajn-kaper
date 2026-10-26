// Rules for the ship itself, shared by every part of the game that can hurt it
// (harbor crashes now, cannon fire later).
//
// Events emitted:
//   shipDamaged  { amount }
//   shipSunk     {}

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

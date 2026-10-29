// Rules for the ship and its crew, shared by every part of the game that
// affects them: sailing makes the crew eat, harbor crashes and (later) cannon
// fire damage the ship.
//
// The ship is lost when it gets too damaged or its crew too small (the
// original's line 5000). Rep and men only go down through damageShip and
// loseMen, and both check that straight away, so no other rule has to
// remember to.
//
// Events emitted:
//   shipDamaged   { amount }
//   crewStarving  { lost }   men who died for lack of grain
//   shipSunk      {}         once per game, however the ship was lost
// and, when the ship is lost, the game ends (see ending.js).

import { endGame } from './ending.js';

const MIN_REPAIR = 20; // at this Rep or less, the ship goes down...
const MIN_MEN = 10; // ...and with this few men or fewer, too
// The most the ship can carry (the original's lines 960-963). Any more, and
// the weight sinks her.
export const MAX_CARGO = { money: 30000, men: 500, guns: 150, grain: 700 };
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
  const lost = state.men - Math.floor(state.men * STARVING_SURVIVORS);
  events.emit('crewStarving', { lost });
  loseMen(state, lost, events);
}

// Lose `count` men, to hunger, plague or (later) battle. Never below 0.
export function loseMen(state, count, events) {
  state.men = Math.max(0, state.men - count);
  checkShipLost(state, events);
}

// A gun is knocked out by enemy fire. As in the original, the ship always
// keeps at least one. Returns true if a gun was lost.
export function loseGun(state) {
  if (state.guns <= 1) return false;
  state.guns -= 1;
  return true;
}

// The ship is lost, whatever its Rep and crew, e.g. wrecked on a pier.
// `sunkBy` is the cargo that was too heavy, if that's what sank her.
export function sinkShip(state, events, sunkBy = null) {
  if (state.sunk) return;
  state.sunk = true;
  state.sunkBy = sunkBy;
  events.emit('shipSunk', {});
  endGame(state, 'sunk', events);
}

// What she's carrying too much of: 'money', 'men', 'guns' or 'grain' (the
// first, in that order), or null if nothing.
export function overload(state) {
  return Object.keys(MAX_CARGO).find((cargo) => state[cargo] > MAX_CARGO[cargo]) ?? null;
}

// Check the cargo, at the moments the original did: when the ship is back at
// sea, and in port after trading. Carrying too much sinks her. Returns true
// if it did.
export function checkCargo(state, events) {
  const tooHeavy = overload(state);
  if (tooHeavy) sinkShip(state, events, tooHeavy);
  return tooHeavy !== null;
}

// How badly the crew fights, the more often you've fled: it multiplies the
// losses in battle and boarding. 1.5 at the start (the original's odd start
// values), going down as you meet more ships and up each time you flee.
export function moraleFactor(state) {
  return (state.encounters + state.flights) / state.encounters;
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

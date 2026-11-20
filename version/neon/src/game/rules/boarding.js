// The rules for boarding an enemy ship, as in the original game (its lines
// 3100-3240): fight on her deck one round at a time, until she strikes her
// flag or you go back to your own ship.
//
// Random numbers come from a `random` function returning 0..1, so tests can
// decide what happens.
import { isSunk, loseMen, moraleFactor } from './ship.js';
import { EVENTS } from '../events.js';

const MIN_STRENGTH = 0.6;
const MAX_STRENGTH = 1.2;
const SURRENDERS_BELOW = 20; // the enemy strikes her flag with fewer men

// One round of fighting on the enemy's deck. Both sides lose men.
//
// Returns { ownLosses, enemyLosses, outcome }, where outcome is null (the
// fight goes on), 'surrender' (she strikes her flag) or 'lost' (your ship is
// lost, too few men left to sail her). Tells the same as a 'boardingRound'
// event.
export function fightRound(enemy, state, events, random = Math.random) {
  const morale = moraleFactor(state);
  // How strong the enemy is against you: more men, worse morale and a higher
  // difficulty make her stronger. Kept between 0.6 and 1.2.
  const strength = Math.min(
    Math.max((enemy.men / state.men) * morale * (state.difficulty / 10), MIN_STRENGTH),
    MAX_STRENGTH,
  );

  // You lose up to a tenth or so of the crew (at the start), more if you've fled a lot.
  const ownLosses = Math.floor(state.men * morale * ((state.difficulty * random()) / 30));
  loseMen(state, ownLosses, events);
  if (isSunk(state)) return told({ ownLosses, enemyLosses: 0, outcome: 'lost' }, events);

  // She loses more the weaker she is, and always at least a tenth of her men.
  const enemyLosses = Math.min(
    Math.max(Math.round(ownLosses / strength), Math.floor(enemy.men / 10)),
    enemy.men,
  );
  enemy.men -= enemyLosses;

  const outcome = enemy.men < SURRENDERS_BELOW ? 'surrender' : null;
  return told({ ownLosses, enemyLosses, outcome }, events);
}

function told(round, events) {
  events.emit(EVENTS.boardingRound, round);
  return round;
}

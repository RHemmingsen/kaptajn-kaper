// Your career, as in the original game (its lines 102, 1170-1171 and
// 6000-6119): reach the goal in points before you run out of moves, and you
// are promoted, with a new goal. Reach four goals and you've won Komtesse
// Julie. Run out of moves first, and she marries another.
import { endGame } from './ending.js';

// Your rank and noble title, by difficulty (the original's tit(1, IDIF/2)
// and tit(2, IDIF/2)). The difficulty starts at 2 and goes up by 2 with each
// goal reached.
const RANKS = ['skibsfører', 'kaptajn', 'kommandørkaptajn', 'kommandør', 'admiral'];
const NOBLE_TITLES = ['Borger', 'Baron', 'Greve', 'Kammerherre', 'Kronprins'];
const STEP = 2; // difficulty gained per goal
const WON_AT = 10; // the difficulty after the fourth goal

export function rankTitle(state) {
  return RANKS[state.difficulty / STEP - 1];
}

export function nobleTitle(state) {
  return NOBLE_TITLES[state.difficulty / STEP - 1];
}

export function goalReached(state) {
  return state.points >= state.goal;
}

// Promote: a higher difficulty, rank and title, and a new goal, counted from
// where you are now. Returns { won }: after the fourth goal there is no new
// goal; you've won. (Ending the game is left to the caller, after the news
// has been shown; see endGame.)
export function promote(state) {
  state.difficulty += STEP;
  state.goal = state.points + 500 + 250 * state.difficulty;
  state.maxMoves = state.moves + 325 - 12.5 * state.difficulty;
  return { won: state.difficulty >= WON_AT };
}

// Use up one move. The move that reaches the limit is the last: the game
// ends with Julie marrying another.
export function useMove(state, events) {
  state.moves += 1;
  if (state.moves >= state.maxMoves) endGame(state, 'jilted', events);
}

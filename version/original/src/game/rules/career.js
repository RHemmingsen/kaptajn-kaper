// Your career, as in the original game (its lines 102, 1170-1171 and
// 6000-6119): reach the goal in points before you run out of moves, and you
// are promoted, with a new goal. Reach four goals and you've won Komtesse
// Julie. Run out of moves first, and she marries another.
import { endGame } from './ending.js';
import { EVENTS } from '../events.js';

const STEP = 2; // difficulty gained per goal
const WON_AT = 10; // the difficulty after the fourth goal

// How far you've come: 1 at the start, one more for each goal reached, 5
// once you've won. The difficulty starts at 2 and goes up by 2 with each
// goal (the original's IDIF / 2). Your rank and noble title follow it:
// TEXTS.career.ranks and .titles.
export function careerLevel(state) {
  return state.difficulty / STEP;
}

export function goalReached(state) {
  return state.points >= state.goal;
}

// Promote: a higher difficulty, rank and title, and a new goal, counted from
// where you are now. Returns { won }: after the fourth goal there is no new
// goal; you've won. (Ending the game is left to the caller, after the news
// has been shown; see endGame.) Tells it as a 'promoted' event.
export function promote(state, events) {
  state.difficulty += STEP;
  state.goal = state.points + 500 + 250 * state.difficulty;
  state.maxMoves = state.moves + 325 - 12.5 * state.difficulty;
  const won = state.difficulty >= WON_AT;
  events.emit(EVENTS.promoted, { won });
  return { won };
}

// Use up one move. The move that reaches the limit is the last: the game
// ends with Julie marrying another.
export function useMove(state, events) {
  state.moves += 1;
  if (state.moves >= state.maxMoves) endGame(state, 'jilted', events);
}

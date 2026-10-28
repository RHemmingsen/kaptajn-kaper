// Your career: the rank you're addressed by, which goes up with the
// difficulty each time you reach a goal (the original's tit(1, IDIF/2)).

const RANKS = ['skibsfører', 'kaptajn', 'kommandørkaptajn', 'kommandør', 'admiral'];

export function rankTitle(state) {
  return RANKS[state.difficulty / 2 - 1];
}

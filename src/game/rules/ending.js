// How the game ends. There are three ways, as in the original:
//   'sunk'    the ship is lost (see ship.js)
//   'jilted'  out of moves: Julie marries another (see career.js)
//   'won'     every goal reached (see career.js)
//
// Whatever the reason, the game ends here, once, with one event:
//   gameOver  { ending, points, money, men, repair }
// so whoever shows the ending doesn't need to know every way to get there.

export function endGame(state, ending, events) {
  if (state.ending) return;
  state.ending = ending;
  events.emit('gameOver', {
    ending,
    points: state.points,
    money: state.money,
    men: state.men,
    repair: state.repair,
  });
}

export function isGameOver(state) {
  return state.ending !== null;
}

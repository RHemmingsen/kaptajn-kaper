// Every key the game uses, in one place. The engine's Input turns key presses
// into these named actions, and the scenes only ever ask about actions.
//
// Key names are the browser's KeyboardEvent.code values, which name the
// physical key whatever the keyboard layout: 'Digit7' is 7 on the number row,
// 'Numpad7' is 7 on the numeric keypad.
export const CONTROLS = {
  // On the map. As in the original: the arrow keys, or the number keys laid
  // out like a compass (7 8 9 / 4 6 / 1 2 3), where the corners are diagonals.
  sailUp: ['ArrowUp', 'Digit8', 'Numpad8'],
  sailDown: ['ArrowDown', 'Digit2', 'Numpad2'],
  sailLeft: ['ArrowLeft', 'Digit4', 'Numpad4'],
  sailRight: ['ArrowRight', 'Digit6', 'Numpad6'],
  sailUpLeft: ['Digit7', 'Numpad7'],
  sailUpRight: ['Digit9', 'Numpad9'],
  sailDownLeft: ['Digit1', 'Numpad1'],
  sailDownRight: ['Digit3', 'Numpad3'],

  // In the harbor. As in the original: the arrow keys, or 4 and 6.
  steerLeft: ['ArrowLeft', 'Digit4', 'Numpad4'],
  steerRight: ['ArrowRight', 'Digit6', 'Numpad6'],

  // In a gun battle. As in the original: the arrow keys or the number keys
  // like a compass move the sights (hold to keep moving), F fires, 0 breaks
  // off the battle.
  aimUp: ['ArrowUp', 'Digit8', 'Numpad8'],
  aimDown: ['ArrowDown', 'Digit2', 'Numpad2'],
  aimLeft: ['ArrowLeft', 'Digit4', 'Numpad4'],
  aimRight: ['ArrowRight', 'Digit6', 'Numpad6'],
  aimUpLeft: ['Digit7', 'Numpad7'],
  aimUpRight: ['Digit9', 'Numpad9'],
  aimDownLeft: ['Digit1', 'Numpad1'],
  aimDownRight: ['Digit3', 'Numpad3'],
  fire: ['KeyF'],
  breakOff: ['Digit0', 'Numpad0'],

  // On the map it ends the game; in the harbor it turns back to sea; in a
  // port it goes back a step.
  leave: ['Escape'],

  // Typing a number, e.g. how many to buy.
  confirm: ['Enter', 'NumpadEnter'],
  erase: ['Backspace'],

  // Anywhere: the help, as in the original. (Bound also stops the browser
  // opening its own help page on F1.)
  help: ['F1'],

  // Shown on the map ("F2:lyd") but not made yet. Bound already so the
  // browser leaves the key alone.
  toggleSound: ['F2'],

  // Developer tools.
  debugCollision: ['KeyG'],
};

// Every text the player reads, in one place: in Danish, and mostly the
// original's own words. Code uses the constants, never the text itself:
//
//   text(ctx, TEXTS.common.pressAnyKey, x, y);
//
// and text with values in it is a function that puts them in:
//
//   TEXTS.port.welcome(city.name)   ->   'Velkommen til Ebeltoft'
//
// Where the lines go, their colours, and the blank lines between paragraphs
// stay in ui/; this file only holds the words. A block of lines that belongs
// together, broken as the original broke it for its 40-column screen, is an
// array.
//
// Like EVENTS, it's frozen, all the way down, so nothing can change a text
// while the game runs; and a misspelt constant is undefined, which text() in
// ui/draw.js refuses, loudly, instead of writing "undefined" on the screen.
//
// The help (F1) is in helpText.js: the original's help, kept apart for its
// size.
export const TEXTS = deepFreeze({
  common: {
    pressAnyKey: 'Tryk på en tast.',
    pressAnyKeyToContinue: 'Tryk på en tast for at fortsætte!',
  },
});

// Object.freeze, for the object and everything in it.
function deepFreeze(object) {
  for (const value of Object.values(object)) {
    if (typeof value === 'object' && value !== null) deepFreeze(value);
  }
  return Object.freeze(object);
}

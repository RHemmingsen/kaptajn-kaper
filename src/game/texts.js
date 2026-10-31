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

  // The question about sound at the start (the original's lines 83-88).
  sound: {
    flipWithF2: 'Du kan altid flippe lyden af og på med F2!',
    whatNow: 'Hvad vælger du lige nu?:',
    silence: '0: Stilhed',
    effects: '1: Lydeffekter',
    current: (value) => `Nuværende værdi: ${value}   (Enter beholder den)`,
    newValue: 'Angiv ny værdi:',
  },

  title: {
    words: ['Kaptajn', 'Kaper'],
    sign: ['Rigs-', 'dalere'], // on the treasure chest
  },

  // Your name, before a new game, and the greeting after it.
  name: {
    question: 'Hvad er dit navn?',
    keys: 'Enter: ok   Esc: tilbage',
    greeting: (name) => `OK, ${name}.`,
    howToQuit: ['Du kan afbryde spillet', 'ved at trykke på Esc!'],
  },

  // The record, wherever it's shown. The first version kept no name.
  record: {
    none: 'Der er ingen rekord endnu.',
    is: (points) => `Rekorden er ${points} point.`,
    isBy: (points, name) => `Rekorden er ${points} point, sat af ${name}.`,
    newOne: (points) => `Ny rekord: ${points} point!`,
  },

  // The frame around the map.
  map: {
    points: (points) => `Point: ${points}`,
    goal: (goal, maxMoves) => `Mål: ${goal} på ${maxMoves} træk`,
    help: 'F1:Hjælp',
    sound: (on) => `F2:lyd ${on ? 'til' : 'fra'}`,
    quit: 'Esc:Slut',
    debugCollision: 'DEBUG: kollision (G)',
  },

  // The table below the map, and below a fight on deck.
  status: {
    moves: (moves) => `Træk: ${moves}`,
    money: (money) => `Rgsdl: ${money}`,
    grain: (sacks) => `Korn: ${sacks}`,
    men: (men) => `Mænd: ${men}`,
    guns: (guns) => `Skyts: ${guns}`,
    repair: (repair) => `Rep: ${repair}`,
    points: (points) => `Point: ${points}`,
  },

  // The harbor (the original's lines 1260-1340), and what happens there.
  harbor: {
    sides: { right: 'højre', left: 'venstre' },
    sailingInto: (city) => `Du er på vej ind i havnen i ${city}.`,
    instructions: [
      'Styr uden om de andre skibe på reden',
      'ind i havneindløbet.',
      'Brug 4 eller ← for at flytte til venstre',
      'og 6 eller → for at flytte til højre.',
    ],
    warning: [
      'Hvis du støder ind i et af de andre skibe,',
      'vil dit skib blive beskadiget, men hvis du',
      'rammer ved siden af havneindløbet,',
      'så overlever du det ikke!',
    ],
    gustsMayCome: (side) => `Pas på!!! Der kan komme vindstød fra ${side}!`,
    gustsFrom: (side) => `Vindstød fra ${side}`,
    crash: (lost, left) => `Du ramte et skib! -${lost} Rep, ${left} tilbage`,
    welcome: (city) => `Velkommen til ${city}!`,
    pressAnyKey: 'Tryk på en tast', // without the full stop, under the welcome
  },
});

// Object.freeze, for the object and everything in it.
function deepFreeze(object) {
  for (const value of Object.values(object)) {
    if (typeof value === 'object' && value !== null) deepFreeze(value);
  }
  return Object.freeze(object);
}

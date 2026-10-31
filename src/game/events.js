// Every event in the game, in one place: what it's called, who announces it,
// and what it carries. Code uses the constants, never the names as strings:
//
//   events.emit(EVENTS.harborGust, {});
//   events.on(EVENTS.gameOver, (summary) => ...);
//
// so the editor can complete them and find every use, and a misspelt one
// (EVENTS.gameOvr) is undefined, which EventBus refuses loudly instead of
// quietly listening for something that never comes.
//
// Rules return what happened to whoever called them; events are for the
// others, who the rule doesn't know about: mostly the sound (sounds.js).
export const EVENTS = Object.freeze({
  // The game is over, however it ended (rules/ending.js):
  // { ending, sunkBy, name, points, money, men, repair }
  gameOver: 'gameOver',

  // The title is showing (TitleScene): {}
  titleShown: 'titleShown',
  // The help has opened (HelpScene): {}
  helpOpened: 'helpOpened',

  // Sailing into land (rules/sailing.js): { col, row }, the land cell
  shipRanAground: 'shipRanAground',

  // In the harbor (rules/harbor.js): a gust starts pushing the ship, {};
  // you hit a ship at anchor, { damage }
  harborGust: 'harborGust',
  harborCrash: 'harborCrash',

  // A trade that didn't happen (rules/trade.js): { reason }
  tradeRefused: 'tradeRefused',

  // At sea (rules/sea.js): you sailed away from a ship, {}; you went into a
  // fog bank, and what you found (see investigateFog)
  fled: 'fled',
  fogInvestigated: 'fogInvestigated',

  // A broadside, and what came of it (rules/battle.js; see fire)
  shotFired: 'shotFired',
  // A round of fighting on her deck (rules/boarding.js; see fightRound)
  boardingRound: 'boardingRound',

  // A promotion (rules/career.js): { won }
  promoted: 'promoted',
});

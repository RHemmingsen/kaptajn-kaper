// Everything that belongs to "this playthrough": the ship's stats and where it
// is. Every scene (map, harbor, combat, boarding) reads and changes the same
// GameState object, which is how a battle's losses show up back on the map.
//
// A new GameState is created each time a new game starts, with the player's
// name.
export class GameState {
  constructor(name = '') {
    this.name = name;
    this.points = 0;
    // The current goal: reach `goal` points before move number `maxMoves`.
    // Both are raised each time you reach a goal; see rules/career.js.
    this.goal = 1000;
    this.maxMoves = 300;

    // How hard the game is (IDIF in the original). Starts at 2 and goes up
    // with each goal reached. Many rules use it, e.g. how much grain the crew
    // eats.
    this.difficulty = 2;

    // Counted as in the original (IKAMP and ILOSE, with the same odd start
    // values). Ships and fog banks met, and times you fled. Later, battles
    // get harder the more often you've fled: (encounters + flights) /
    // encounters.
    this.encounters = 2;
    this.flights = 1;

    this.moves = 0; // Træk
    this.money = 600; // Rigsdaler
    this.grain = 30; // Korn, in sacks. Can be a fraction: the crew eats half sacks.
    this.men = 200; // Mænd
    this.guns = 20; // Skyts
    this.repair = 200; // Rep: the ship's condition
    this.jewels = 0; // Juveler: found on islands, sold in ports

    // Prizes that reached København: their crews, and the prize money for
    // the ships. Paid out on the next visit there. See rules/victory.js.
    this.prizeMen = 0;
    this.prizeMoney = 0;

    // True once the ship is lost, by damage, a starved crew or a wreck. The
    // game is over then. See rules/ship.js.
    this.sunk = false;
    // What sank her, if it was too much cargo: 'money', 'men', 'guns' or
    // 'grain'. See checkCargo in rules/ship.js.
    this.sunkBy = null;

    // How the game ended, once it has: 'sunk', 'jilted' (out of moves, and
    // Julie marries another) or 'won'. See rules/ending.js.
    this.ending = null;

    this.ship = { col: 10, row: 10 }; // as in the original
  }
}

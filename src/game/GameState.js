// Everything that belongs to "this playthrough": the ship's stats and where it
// is. Every screen (map, harbor, combat, boarding) reads and changes the same
// GameState object, which is how a battle's losses show up back on the map.
//
// A new GameState is created each time a new game starts.
export class GameState {
  constructor() {
    this.points = 0;
    this.goal = 1000; // points needed to win...
    this.maxMoves = 300; // ...within this many moves

    // How hard the game is (IDIF in the original). Starts at 2 and goes up
    // with each goal reached. Many rules use it, e.g. how much grain the crew
    // eats.
    this.difficulty = 2;

    this.moves = 0; // Træk
    this.money = 600; // Rigsdaler
    this.grain = 30; // Korn, in sacks. Can be a fraction: the crew eats half sacks.
    this.men = 200; // Mænd
    this.guns = 20; // Skyts
    this.repair = 200; // Rep: the ship's condition

    // True once the ship is lost, by damage, a starved crew or a wreck. The
    // game is over then. See rules/ship.js.
    this.sunk = false;

    this.ship = { col: 10, row: 10 }; // as in the original
  }
}

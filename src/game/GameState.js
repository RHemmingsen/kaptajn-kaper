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

    this.moves = 0; // Træk
    this.money = 600; // Rigsdaler
    this.grain = 30; // Korn
    this.men = 200; // Mænd
    this.guns = 20; // Skyts
    this.repair = 200; // Rep: the ship's condition

    this.ship = { col: 10, row: 10 }; // as in the original
  }
}

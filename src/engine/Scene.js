// A Scene is one part of the game: the title, the map, the harbor, a battle...
// It's where that part comes together: it decides which rules apply, turns
// input into calls to them, hands the state to the drawing code, and says
// which scene comes next. Drawing itself lives elsewhere (the game's ui/).
//
// Only one scene is active at a time, and the Game forwards update/render to
// it. Every scene extends this class and overrides the methods it needs.
export class Scene {
  constructor(game) {
    this.game = game;
    this.unsubscribers = [];
  }

  // Listen to a game event for as long as this scene is active. The Game
  // removes these listeners automatically when we switch away, so a scene
  // that's gone can't keep reacting to events.
  listen(name, fn) {
    this.unsubscribers.push(this.game.events.on(name, fn));
  }

  stopListening() {
    for (const unsubscribe of this.unsubscribers) unsubscribe();
    this.unsubscribers = [];
  }

  // Called once when the scene becomes active. Good place to reset things
  // and to listen() to events.
  enter() {}

  // Called once when we switch away from this scene.
  exit() {}

  // Advance the scene's logic by dt seconds. No drawing here.
  update(dt) {}

  // Draw the current state. No logic here.
  render(ctx) {}
}

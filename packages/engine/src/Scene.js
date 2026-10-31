// A Scene is one part of the game: the title, the map, the harbor, a battle...
// It's where that part comes together: it decides which rules apply, turns
// input into calls to them, hands the state to the drawing code, and says
// which scene comes next. Drawing itself lives elsewhere (the game's ui/).
//
// Only one scene is active at a time, and the Game forwards update/render to
// it. Every scene extends this class and overrides the methods it needs.
// Asking the Game for another scene (game.setScene...) takes effect when the
// step is over, so the rest of the scene's update() still runs, on this
// scene.
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

  // Called when another scene is pushed on top of this one (see
  // Game.pushScene), and when it's taken off again. In between, this scene
  // isn't updated or drawn, but it isn't ended either.
  pause() {}
  resume() {}

  // Advance the scene's logic by dt seconds. No drawing here.
  update(dt) {}

  // Draw the current state. No logic here.
  render(ctx) {}
}

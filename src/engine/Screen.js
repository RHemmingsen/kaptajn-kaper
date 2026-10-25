// A Screen is one "mode" of the game: title screen, map, harbor, combat...
// Only one screen is active at a time, and the Game forwards update/render to it.
//
// Every screen extends this class and overrides the methods it needs.
export class Screen {
  constructor(game) {
    this.game = game;
    this.unsubscribers = [];
  }

  // Listen to a game event for as long as this screen is active. The Game
  // removes these listeners automatically when we switch away, so a screen
  // that's gone can't keep reacting to events.
  listen(name, fn) {
    this.unsubscribers.push(this.game.events.on(name, fn));
  }

  stopListening() {
    for (const unsubscribe of this.unsubscribers) unsubscribe();
    this.unsubscribers = [];
  }

  // Called once when the screen becomes active. Good place to reset things
  // and to listen() to events.
  enter() {}

  // Called once when we switch away from this screen.
  exit() {}

  // Advance the screen's logic by dt seconds. No drawing here.
  update(dt) {}

  // Draw the current state. No logic here.
  render(ctx) {}
}

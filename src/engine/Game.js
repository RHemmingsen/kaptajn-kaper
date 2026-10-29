import { Input } from './Input.js';
import { EventBus } from './EventBus.js';
import { Sound } from './Sound.js';

// How often the game logic runs: 60 times per second, no matter how fast the
// monitor refreshes. One "step" is therefore 1/60 s.
const STEP = 1 / 60;

// If the tab was in the background for a while we don't want to run thousands
// of catch-up steps when it comes back, so cap how much time one frame can add.
const MAX_FRAME_TIME = 0.25;

// The Game owns the canvas, the input, the event bus and the loop, and holds
// the scenes.
//
// `controls` is the game's key bindings, { actionName: [keyCode, ...], ... },
// handed on to the Input. See Input.js. `inputTarget` is what the Input
// listens on: the browser window normally, something else in tests. Sound
// listens there too, for the first key press that lets it play.
//
// Scenes are kept in a stack. Normally there's one, and setScene() swaps it.
// pushScene() puts another on top, like help over a battle: the one below is
// paused, not ended, and popScene() takes it back up where it was. Only the
// top scene is updated and drawn.
export class Game {
  constructor(canvas, { controls, inputTarget } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;

    this.input = new Input(controls, inputTarget);
    this.events = new EventBus();
    this.sound = new Sound(inputTarget);
    this.scenes = [];

    // Actions that work whatever scene is showing, like opening help:
    // action name -> function. See onAction().
    this.globalActions = new Map();

    // Developer switches, like showing collision boxes. They live on the
    // Game rather than a scene, so they stay on when the scene changes.
    this.debug = {};

    this.lastTime = 0;
    this.accumulator = 0;
  }

  // The scene being played: the top of the stack.
  get scene() {
    return this.scenes.at(-1) ?? null;
  }

  // Swap to a new scene. Every scene in the stack gets exit(), top first; the
  // new one gets enter().
  setScene(scene) {
    while (this.scenes.length > 0) this.removeTop();
    this.scenes.push(scene);
    scene.enter();
  }

  // Put a scene on top of the current one, which is paused until the new one
  // is popped.
  pushScene(scene) {
    this.scene?.pause();
    this.scenes.push(scene);
    scene.enter();
  }

  // End the top scene and carry on with the one below it.
  popScene() {
    this.removeTop();
    this.scene?.resume();
  }

  removeTop() {
    const top = this.scenes.pop();
    top.exit();
    top.stopListening();
  }

  // Do something when an action is pressed, whatever scene is showing. That
  // step, the scene doesn't see the key.
  onAction(action, fn) {
    this.globalActions.set(action, fn);
  }

  start() {
    this.lastTime = performance.now();
    requestAnimationFrame(this.frame);
  }

  // One step of game logic: a global action if one was pressed, otherwise
  // the top scene.
  step(dt) {
    const global = [...this.globalActions].find(([action]) => this.input.wasActionPressed(action));
    if (global) global[1]();
    else this.scene.update(dt);
    this.input.endStep();
  }

  // The game loop. The browser calls this before every repaint (~60 times a
  // second on most screens, but 120 or 144 on others).
  //
  // We use a "fixed timestep": real time is collected in an accumulator, and
  // the logic is advanced in exact STEP-sized chunks. That keeps the game
  // running at the same speed on every machine, and makes the logic
  // predictable (gusts push the ship the same amount each step, etc.).
  frame = (now) => {
    const elapsed = Math.min((now - this.lastTime) / 1000, MAX_FRAME_TIME);
    this.lastTime = now;
    this.accumulator += elapsed;

    while (this.accumulator >= STEP) {
      this.step(STEP);
      this.accumulator -= STEP;
    }

    this.scene.render(this.ctx);

    requestAnimationFrame(this.frame);
  };
}

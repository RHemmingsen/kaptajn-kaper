import { Input } from './Input.js';
import { EventBus } from './EventBus.js';
import { Sound } from './Sound.js';

// How often the game logic runs: 60 times per second, no matter how fast the
// monitor refreshes. One "step" is therefore 1/60 s.
const STEP = 1 / 60;

// If the tab was in the background for a while we don't want to run thousands
// of catch-up steps when it comes back, so cap how much time one frame can add.
const MAX_FRAME_TIME = 0.25;

// A new scene's enter() may ask for another change, and so on. More than this
// in one step can only be scenes sending each other round in a circle.
const MAX_SCENE_CHANGES_PER_STEP = 10;

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
//
// Scene changes are deferred: setScene(), pushScene() and popScene() only
// ask for the change, and the Game makes it at the end of the step, when the
// scene's update() has finished. So a scene's code always runs to its end,
// even when something deep inside it (a rule ending the game, say) asks for
// another scene, and scenes only ever change in one place. Unity's
// SceneManager.LoadScene and Godot's call_deferred work the same way. (The
// pattern: "deferred state transitions".)
//
// One change can be asked for per step; a second is a mistake, and throws.
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
    // The scene change asked for this step, made at its end:
    // { kind: 'set' | 'push' | 'pop', scene }, or null.
    this.pendingChange = null;

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
  // new one gets enter(). (At the end of the step.)
  setScene(scene) {
    this.askForChange({ kind: 'set', scene });
  }

  // Put a scene on top of the current one, which is paused until the new one
  // is popped. (At the end of the step.)
  pushScene(scene) {
    this.askForChange({ kind: 'push', scene });
  }

  // End the top scene and carry on with the one below it. (At the end of the
  // step.)
  popScene() {
    this.askForChange({ kind: 'pop' });
  }

  askForChange(change) {
    if (this.pendingChange) {
      throw new Error(
        `Two scene changes asked for in one step: ${describe(this.pendingChange)}, then ${describe(change)}`,
      );
    }
    this.pendingChange = change;
  }

  // Make the scene change asked for, if any. The new scene's enter() can ask
  // for another (arriving in a port with too much cargo ends the game), so
  // keep going until none is left.
  changeScenes() {
    for (let count = 0; this.pendingChange; count++) {
      if (count === MAX_SCENE_CHANGES_PER_STEP) {
        const last = describe(this.pendingChange);
        throw new Error(`More than ${MAX_SCENE_CHANGES_PER_STEP} scene changes in one step; the last: ${last}`);
      }
      const { kind, scene } = this.pendingChange;
      this.pendingChange = null;
      if (kind === 'set') {
        while (this.scenes.length > 0) this.removeTop();
        this.scenes.push(scene);
        scene.enter();
      } else if (kind === 'push') {
        this.scene?.pause();
        this.scenes.push(scene);
        scene.enter();
      } else {
        this.removeTop();
        this.scene?.resume();
      }
    }
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

  // Start the loop, with the scene asked for by setScene().
  start() {
    this.changeScenes();
    this.lastTime = performance.now();
    requestAnimationFrame(this.frame);
  }

  // One step of game logic: a global action if one was pressed, otherwise
  // the top scene (if there is one yet); then any scene change asked for.
  step(dt) {
    const global = [...this.globalActions].find(([action]) => this.input.wasActionPressed(action));
    if (global) global[1]();
    else this.scene?.update(dt);
    this.input.endStep();
    this.changeScenes();
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

// "set TitleScene", for error messages.
function describe({ kind, scene }) {
  return scene ? `${kind} ${scene.constructor.name}` : kind;
}

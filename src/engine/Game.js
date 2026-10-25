import { Input } from './Input.js';

// How often the game logic runs: 60 times per second, no matter how fast the
// monitor refreshes. One "step" is therefore 1/60 s.
const STEP = 1 / 60;

// If the tab was in the background for a while we don't want to run thousands
// of catch-up steps when it comes back, so cap how much time one frame can add.
const MAX_FRAME_TIME = 0.25;

// The Game owns the canvas, the input and the loop, and holds the active screen.
export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;

    this.input = new Input();
    this.screen = null;

    this.lastTime = 0;
    this.accumulator = 0;
  }

  // Swap the active screen. The old one gets exit(), the new one enter().
  setScreen(screen) {
    if (this.screen) this.screen.exit();
    this.screen = screen;
    this.screen.enter();
  }

  start() {
    this.lastTime = performance.now();
    requestAnimationFrame(this.frame);
  }

  // The game loop. The browser calls this before every repaint (~60 times a
  // second on most screens, but 120 or 144 on others).
  //
  // We use a "fixed timestep": real time is collected in an accumulator, and
  // the logic is advanced in exact STEP-sized chunks. That keeps the game
  // running at the same speed on every machine, and makes the logic
  // predictable (wind pushes the ship the same amount each step, etc.).
  frame = (now) => {
    const elapsed = Math.min((now - this.lastTime) / 1000, MAX_FRAME_TIME);
    this.lastTime = now;
    this.accumulator += elapsed;

    while (this.accumulator >= STEP) {
      this.screen.update(STEP);
      this.input.endStep();
      this.accumulator -= STEP;
    }

    this.screen.render(this.ctx);

    requestAnimationFrame(this.frame);
  };
}

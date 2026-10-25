// Keyboard input.
//
// The browser tells us about keys through events (keydown/keyup) that can arrive
// at any moment. Games don't want that: they want to ask "is the left arrow held
// right now?" in the middle of update(). So we listen to the events and record
// the answers in two sets that the game can read whenever it likes.
//
//   down    - keys currently held (for continuous things, like steering)
//   pressed - keys pressed since the last update (for one-shot things, like "fire")

// Keys whose default browser behaviour (scrolling, help page...) we want to block.
const BLOCKED_KEYS = new Set([
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'F1', 'F2',
]);

export class Input {
  constructor() {
    this.down = new Set();
    this.pressed = new Set();

    window.addEventListener('keydown', (e) => {
      if (BLOCKED_KEYS.has(e.code)) e.preventDefault();
      // Holding a key makes the OS repeat keydown events; only count the first one.
      if (!e.repeat) this.pressed.add(e.code);
      this.down.add(e.code);
    });

    window.addEventListener('keyup', (e) => {
      this.down.delete(e.code);
    });

    // If the window loses focus we never get the keyup, so forget everything.
    window.addEventListener('blur', () => this.down.clear());
  }

  isDown(code) {
    return this.down.has(code);
  }

  wasPressed(code) {
    return this.pressed.has(code);
  }

  anyKeyPressed() {
    return this.pressed.size > 0;
  }

  // Called by the game loop after every update, so "pressed" only lasts one step.
  endStep() {
    this.pressed.clear();
  }
}

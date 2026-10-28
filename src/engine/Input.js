// Keyboard input, as named actions.
//
// The browser tells us about keys through events (keydown/keyup) that can
// arrive at any moment. Games don't want that: they want to ask "is the player
// steering left right now?" in the middle of update(). So we listen to the
// events and record which keys are down, and which were pressed since the
// last update.
//
// The game never asks about keys directly, though. It names its actions and
// says which keys trigger each one:
//
//   input.setBindings({ steerLeft: ['ArrowLeft', 'Numpad4'], ... });
//
// and then asks about actions:
//
//   input.isActionDown('steerLeft')     held right now (steering)
//   input.wasActionPressed('steerLeft') pressed since the last update (one step)
//
// That keeps every key in one place in the game, and lets several keys do the
// same thing. Key names are the browser's KeyboardEvent.code values, which
// name the physical key whatever the keyboard layout.
export class Input {
  // `target` is what to listen on: the browser window normally, something
  // else in tests.
  constructor(target = window) {
    this.down = new Set();
    this.pressed = new Set();
    this.bindings = new Map(); // action -> key codes
    this.boundKeys = new Set();

    target.addEventListener('keydown', (e) => {
      // Stop the browser acting on keys the game uses (scrolling on arrow
      // keys, opening its help page on F1, ...).
      if (this.boundKeys.has(e.code)) e.preventDefault();
      // Holding a key makes the OS repeat keydown events; only count the first one.
      if (!e.repeat) this.pressed.add(e.code);
      this.down.add(e.code);
    });

    target.addEventListener('keyup', (e) => {
      this.down.delete(e.code);
    });

    // If the window loses focus we never get the keyup, so forget everything.
    target.addEventListener('blur', () => this.down.clear());
  }

  // Replace all bindings: { actionName: [keyCode, ...], ... }.
  setBindings(bindings) {
    this.bindings = new Map(Object.entries(bindings));
    this.boundKeys = new Set(Object.values(bindings).flat());
  }

  isActionDown(action) {
    return this.keysFor(action).some((code) => this.down.has(code));
  }

  wasActionPressed(action) {
    return this.keysFor(action).some((code) => this.pressed.has(code));
  }

  // For "press any key to continue", which isn't an action.
  anyKeyPressed() {
    return this.pressed.size > 0;
  }

  // Called by the game loop after every update, so "pressed" only lasts one step.
  endStep() {
    this.pressed.clear();
  }

  // An action nobody bound is almost always a typo, so fail loudly.
  keysFor(action) {
    const codes = this.bindings.get(action);
    if (!codes) throw new Error(`No keys are bound to the action '${action}'`);
    return codes;
  }
}

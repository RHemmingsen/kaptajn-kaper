// Keyboard input, as named actions.
//
// The browser tells us about keys through events (keydown/keyup) that can
// arrive at any moment. Games don't want that: they want to ask "is the player
// steering left right now?" in the middle of update(). So we listen to the
// events and record which keys are down, and which were pressed since the
// last update.
//
// The game never asks about keys directly, though. It names its actions and
// says which keys trigger each one, when the Input is made:
//
//   new Input({ steerLeft: ['ArrowLeft', 'Numpad4'], ... });
//
// and then asks about actions:
//
//   input.isActionDown('steerLeft')       held right now (steering)
//   input.wasActionPressed('steerLeft')   pressed since the last update (one step)
//   input.wasActionRepeated('aimUp')      pressed, or repeated by the OS because
//                                         it's held down (moving a cursor)
//
// That keeps every key in one place in the game, and lets several keys do the
// same thing. Key names are the browser's KeyboardEvent.code values, which
// name the physical key whatever the keyboard layout.
//
// Typing is different: when the player writes a number or a letter, what
// matters is the character, not which key made it. typedText() gives the
// characters typed since the last update, using the keyboard layout (so
// Shift+7 on a Danish keyboard is '/').
export class Input {
  // `bindings` is { actionName: [keyCode, ...], ... }. There's no Input
  // without them, so a game can't forget to set its keys.
  // `target` is what to listen on: the browser window normally, something
  // else in tests.
  constructor(bindings, target = window) {
    this.down = new Set();
    this.pressed = new Set();
    this.repeated = new Set(); // pressed, or repeated while held
    this.typed = '';
    this.setBindings(bindings);

    target.addEventListener('keydown', (e) => {
      // Stop the browser acting on keys the game uses (scrolling on arrow
      // keys, opening its help page on F1, ...).
      if (this.isBound(e.code)) e.preventDefault();
      // Holding a key makes the OS repeat keydown events; only count the first one.
      if (!e.repeat) {
        this.pressed.add(e.code);
        // e.key is the character for printable keys ('7', 'k'), and a name
        // like 'Enter' or 'Shift' for the rest.
        if (e.key.length === 1) this.typed += e.key;
      }
      this.repeated.add(e.code);
      this.down.add(e.code);
    });

    target.addEventListener('keyup', (e) => {
      this.down.delete(e.code);
    });

    // If the window loses focus we never get the keyup, so forget everything.
    target.addEventListener('blur', () => this.down.clear());
  }

  // Replace all bindings, e.g. if the player changes their keys.
  setBindings(bindings) {
    if (!bindings) {
      throw new Error('Input needs key bindings: { actionName: [keyCode, ...], ... }');
    }
    // A Map holds only what we put in it (a plain object would also "have"
    // toString, constructor, ...). The key lists are copied, so later changes
    // to the caller's object can't reach in here.
    this.bindings = new Map(
      Object.entries(bindings).map(([action, codes]) => [action, [...codes]]),
    );
  }

  // Does the game use this key for any action?
  isBound(code) {
    for (const codes of this.bindings.values()) {
      if (codes.includes(code)) return true;
    }
    return false;
  }

  isActionDown(action) {
    return this.keysFor(action).some((code) => this.down.has(code));
  }

  wasActionPressed(action) {
    return this.keysFor(action).some((code) => this.pressed.has(code));
  }

  // Like wasActionPressed, but also true each time the operating system
  // repeats a held-down key, at the player's own key-repeat speed. For moving
  // something one step per press, faster when held.
  wasActionRepeated(action) {
    return this.keysFor(action).some((code) => this.repeated.has(code));
  }

  // For "press any key to continue", which isn't an action.
  anyKeyPressed() {
    return this.pressed.size > 0;
  }

  // The characters typed since the last update, e.g. '12' or 'k'.
  typedText() {
    return this.typed;
  }

  // Called by the game loop after every update, so "pressed" and the typed
  // text only last one step.
  endStep() {
    this.pressed.clear();
    this.repeated.clear();
    this.typed = '';
  }

  // An action nobody bound is almost always a typo, so fail loudly.
  keysFor(action) {
    const codes = this.bindings.get(action);
    if (!codes) throw new Error(`No keys are bound to the action '${action}'`);
    return codes;
  }
}

# Code review (30 October 2026, commit 9e29345)

When an item is resolved, delete it here (don't just tick it).

A review of the whole finished codebase (~3,000 lines of src, ~2,000 lines of
tests) with one question: are the architecture and standards best practice
for a small browser engine and a game built on it? Nothing was assumed to be
right because it works.

**Verdict:** the layering is genuinely good and holds everywhere (checked, not
assumed). The weak spot is *game flow*: which scene follows which is spread
over 13 scenes that import each other, scene switches happen synchronously in
the middle of other code, and rules report what happened in three different
ways. That is where cleanup pays off most.

### What is really good (keep it)

- **The layers hold.** Nothing in `src/engine/` imports from `src/game/`.
  Rules import nothing from `ui/` or `scenes/`. No file in `ui/` assigns to
  game state. All three checked with grep.
- **Fixed timestep with accumulator and cap** (`Game.frame`), with the logic in
  `Game.step(dt)` so the loop itself is testable without a browser
  (`tests/game.test.js`). The canonical pattern (search: Glenn Fiedler, "Fix
  Your Timestep").
- **Scene stack** with `pause`/`resume`, used for F1 help over any scene.
- **Input separates actions from typing.** Actions use `KeyboardEvent.code`
  (physical key), typing uses `KeyboardEvent.key` (the character, layout-aware).
  That distinction is one many engines get wrong. Unknown actions fail loudly.
- **Sound is driven by events.** Rules and scenes never play a sound;
  `game/sounds.js` listens and decides. This is the textbook use of an event
  bus: many unrelated producers, one observer that the producers don't know
  about.
- **The MML parser** (`engine/mml.js`) is small, documented, rejects bad input
  with a clear message, and is tested.
- **One way to end the game.** Every ending goes through `endGame`, which is
  idempotent; `sinkShip` is too. That removes a whole class of "game over
  twice" bugs.
- **Dependency injection where it matters:** `random` in every rule, `storage`
  in `records.js`, the event target and `AudioContext` factory in `Input` and
  `Sound`. That's why 186 tests can run in Node.
- **Faithful to the original, and honest about where it isn't.** Formulas cite
  the original's line numbers; deviations are written down.
- **No build step, no dependencies.** Right for learning: everything that
  happens can be seen. The price is no types (see C2).

### A. Structural (the cleanup that matters most)

All done.

### B. Medium

All done.

### C. Small things

All done.

### Recommended cleanup order

Everything is done or decided.

Decided against:
- **Types (was C2)**, JSDoc `@typedef`s and `// @ts-check`. The game is
  nearly finished, the tests and the screenshot comparison cover it, and the
  next project will be TypeScript from the start, where types come with the
  language instead of in comments.
- **`Input.destroy()` (was B4)**, to remove its listeners on `window`. Only a
  second `Game` on the same page, or a hot reload, would need it, and this
  game has neither. Don't build more engine than the game needs.

Decided: **pixelated scaling (was C6).** `image-rendering: pixelated` keeps
the retro look; the price is blocky text, and grid lines of uneven width
when the scale isn't a whole number. See the comment in `style.css`.

Avoid ECS, plugin systems and general renderer abstractions. The game doesn't
need them, and they would hide what's worth learning.

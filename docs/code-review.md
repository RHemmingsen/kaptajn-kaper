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

**B4. Input details.**
- No `destroy()`: the listeners on `window` are never removed. Harmless in one
  page, but a hot reload or a second `Game` doubles them.

### C. Small things

- **C4. Loading failure is a black screen.** If `loadAssets()` fails, the
  top-level `await` in `main.js` rejects and nothing is drawn. Catch it and
  write the error on the canvas.
- **C5. The redrawn coastline isn't in "Vores beslutninger".** The collision
  grid in `map.js` is our own, not the original's land list (e.g. cell 7,5 is
  land in the original, water here). Help topic 0 says so; the reference doc
  should too.
- **C6. Pixelated text.** `image-rendering: pixelated` makes canvas text
  blocky when scaled; fine for the retro look, but it should be a stated
  choice.

### Recommended cleanup order

The small things above, in any order.

Decided against: **types (was C2)**, JSDoc `@typedef`s and `// @ts-check`.
The game is nearly finished, the tests and the screenshot comparison cover
it, and the next project will be TypeScript from the start, where types
come with the language instead of in comments.

Avoid ECS, plugin systems and general renderer abstractions. The game doesn't
need them, and they would hide what's worth learning.

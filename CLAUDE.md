# CLAUDE.md

## What this project is

A remake of *Kaptajn Kaper i Kattegat* (P.O. Frederiksen, 1985) in plain
HTML/CSS/JS, built on a small hand-made game engine. The game is complete:
map, harbor, trading, sea events, gun battle, boarding, prizes, promotions,
endings, help, sound and the record.

**The main goal is to learn how to build a game engine.** The game is the
learning project, not the end in itself. For Claude that means:

- Explain *why* a solution was chosen and what the alternatives are. A change
  without an explanation is half the job here.
- When there is an established pattern (fixed timestep, scene stack, ECS...),
  name it so it can be looked up.
- Don't build more engine than the game needs. Name the next step rather than
  building it ahead of time.
- Take a position. If something in the code isn't best practice, say so, even
  if Claude wrote it.

## Commands

```sh
npm test                      # Node's built-in test runner, no install (186 tests)
python3 -m http.server 8000   # or: npx serve. ES modules don't load from file://
```

No dependencies, no build step. Needs a modern browser (top-level `await`,
class fields) and Node 20+.

## Architecture on one screen

README.md has the long explanation. In short:

```
src/main.js     builds the Game, wires game-wide reactions (gameOver, F1, F2), starts
src/engine/     reusable, knows nothing about pirates. Must NEVER import from src/game/
src/game/
  rules/        the game's rules: change GameState, return results, emit events.
                No canvas, no keyboard, no scenes. Randomness is injected.
  ui/           drawing code. May read rules' constants and queries, never change state
  scenes/       input -> rules -> drawing, and which scene comes next
  sounds.js     the only place that decides what anything sounds like (listens to events)
  records.js    what is kept between visits (record, last name, sound on/off)
tests/          Node tests for engine and rules
docs/original-regler.md   the reference for the original's rules and numbers (in Danish),
                          with our deviations under "Vores beslutninger"
KaptajnKaper_original/    the original GW-BASIC source (GPL-3), for reference only
```

## Conventions

- Code, identifiers, comments, docs and commit messages in English. Text in
  the game (what the player sees) in Danish, as in the original.
- Comments explain *why* and are written for someone learning. Keep that
  density, and keep them true: a comment that says "(later)" about something
  that now exists is a bug.
- Commit subjects: `Area: what changes`, e.g. `Harbor: keep the start place free of ships at anchor`.
- Every rule function documents what it returns and which events it emits.
- New rules get Node tests. Rules take `random = Math.random` so tests decide
  what happens.
- Deviations from the original go under "Vores beslutninger" in
  `docs/original-regler.md`.
- Update README when the architecture changes. Update the review below when an
  item is resolved (delete it, don't just tick it).

---

## Code review (30 October 2026, commit 9e29345)

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

**A1. The game's flow is spread across every scene.**
There are 22 scene-to-scene imports; `MapScene` alone is constructed from seven
places (Harbor, Port, SeaEvent, Battle, Victory, Promotion, Name). Most of
them import each other in a circle (`MapScene` → `SeaEventScene` →
`BattleScene` → `MapScene`). ES modules tolerate the cycles only because the
classes are used at run time, not at import time; one top-level use and it
breaks with a confusing `ReferenceError`.
Every "back to sea" builds a *new* `MapScene`, which then has to work out from
the state whether it's in a port (`portCity` in its constructor). The scene
stack exists, but only help uses it.
**Better:** the map *pushes* what happens on top of it (harbor → port, sea
event → battle/boarding → victory, promotion) and those *pop* back. The map
keeps its own state, the "back to sea" code and most imports disappear, and
each sub-flow knows only its own next step. (Search: "pushdown automaton",
"scene stack".)

**A2. Scene switches happen synchronously, in the middle of other code.**
`setScene` runs `exit()` and `enter()` immediately, wherever it's called
from. A concrete case today: `HarborScene.update` → `setScene(PortScene)` →
`PortScene.enter` → `checkCargo` → `sinkShip` → `endGame` → `gameOver` →
`main.js` → `setScene(EndScene)`. So `PortScene.exit()` runs *before its own
`enter()` has finished*. Likewise, when your ship sinks in `fire()` or
`sendPrize()`, `BattleScene`/`VictoryScene` go on setting `this.step` on a
scene that is no longer running.
It works today because each case was checked by hand. That's the problem:
correctness depends on every scene and rule knowing that any call might
replace the scene under it.
**Best practice:** deferred transitions. `setScene`/`pushScene`/`popScene`
record a request; `Game.step` applies it after the scene's `update` returns.
Then a scene's code always runs to the end, and there is one place where
switches happen. Easy to test with the `LoggingScene` in `tests/game.test.js`.

**A3. Rules report what happened in three different ways.**
- `sail()` returns only a boolean; the scene learns about a port or a sea
  event through events *it listens to itself* (`arrivedAtPort`, `seaEvent`,
  `shipMoved`, each with exactly one listener: `MapScene`). That's a function
  call with a detour, and it's what makes A2 happen on the map.
- `fire()`, `fightRound()` and `investigateFog()` return a result *and* emit
  the same result as an event (for sound). Good.
- `buy()`/`sell()` return a result and emit nothing; the *scene* emits
  `tradeRefused` on their behalf.
The project's own rule (README, `EventBus.js`) is: events for things several
unrelated parts care about, direct calls for the rest.
**Better:** one convention. Rules *return* what happened to their caller, and
*emit* only for observers (sound, game over). So `sail()` returns
`{ moved, city, seaEvent }` and `MapScene` decides; `buy`/`sell` emit
`tradeRefused` themselves, like `fire()` does.
Also: four events are emitted that nothing in the game listens to
(`shipDamaged`, `shipSunk`, `crewStarving`, `enteredHarbor`); only tests do.
Tests should assert on returned results and state, not on events kept alive
for them. And event names are 19 loose strings: a typo does nothing, silently,
while `Input` fails loudly on a mistyped action. Collect them in one
`EVENTS` object.

**A4. Rules depend on module-level singletons.**
`rules/sailing.js` imports the map directly (`tileAt` → `KATTEGAT`), so the
rules only run on that one map, and `sailing.test.js` depends on the real
coastline ("Samsø is just to the left"). Redraw the coast and unrelated rule
tests fail. `IMAGES` in `game/assets.js` is a mutable global filled as a side
effect of `loadAssets()`.
**Better:** pass the map in (or put it on `GameState`) so tests use a tiny
test map; have `loadAssets()` return the images.

### B. Medium

**B1. Scenes still draw.** `Scene.js` says "Drawing itself lives elsewhere (the
game's ui/)", but `MapScene.drawFrame`, `TitleScene.render` and the messages in
`HarborScene.render` are drawing code with hard-coded coordinates and Danish
text. Move them to `ui/` (`mapView`, `titleArt`, `harborView`).

**B2. Text drawing is duplicated.** `battleView`, `helpView` and `portView`
each have their own `text()` helper, `draw.js` has `label()`, and
`` `bold 20px ${FONT}` `` is spelled out all over `ui/`. One helper in `draw.js`
taking `{ x, y, color, size, align }` would do.

**B3. A global action costs the scene a step.** In `Game.step`, if F1/F2 was
pressed, the scene's `update` is skipped for that step. In a turn-based scene
that's invisible; in the harbor, pressing F2 freezes the ship for 1/60 s and
the time is lost, not caught up. Run the action, hide its key from the scene,
and still update.

**B4. Input details.**
- Modifier keys are ignored. Ctrl+F is `fire`, so the browser's find is
  blocked by `preventDefault`, and in `SeaEventScene` it *types* `f` and
  flees. Alt+← (browser back) counts as a left arrow. Skip events with
  `ctrlKey`, `altKey` or `metaKey`.
- `erase` uses `wasActionPressed`, so holding Backspace deletes one character.
  `wasActionRepeated` exists for exactly this.
- No `destroy()`: the listeners on `window` are never removed. Harmless in one
  page, but a hot reload or a second `Game` doubles them.

**B5. Game loop edges.**
- An exception in `update`/`render` stops the loop (no new
  `requestAnimationFrame`), and the game freezes with nothing on screen.
- `start()` twice gives two loops; `start()` before `setScene()` crashes in
  `frame`.
- The first frame can get a negative `elapsed`, because rAF's timestamp can be
  earlier than the `performance.now()` read in `start()`. `Math.max(0, …)`.

**B6. Two coordinate systems on the map.** The game uses the original's
1-based cells, `TileMap` is 0-based, and the `- 1` happens in two files
(`map.js` `tileAt`, `mapView.js` `cellCorner`). Either convert once when data
is read in, or let only `map.js` know. (The harbor working in 640×480 screen
pixels is a different matter: it's a documented choice, "Skærmen forbliver
640×480", and fine for a fixed-size game.)

**B7. Esc on the map quietly abandons the game.** No question, no `gameOver`,
so no end scene and the points never reach the record. Check what the
original did, and at least ask first.

### C. Small things

- **C1. Stale and broken comments.** `rules/ship.js` still says "(later)
  cannon fire" and "(later) battle"; both exist. Its header says that because
  damage and men are checked centrally "no other rule has to remember to",
  yet `sailing`, `battle`, `boarding` and `victory` all need `isSunk` guards
  to stop. `ending.js` has a sentence broken across lines 8-9.
  `victory.js` line 14 is one overlong line. README still says "The Game holds
  exactly one" scene.
- **C2. No types.** The game passes many plain objects (`battle`, `harbor`,
  `enemy`, fire results, sea events) whose shape is only described in
  comments. That's exactly where JSDoc `@typedef` pays off. Without a build
  step: `// @ts-check` in each file and a `jsconfig.json` with
  `"checkJs": true`, and VS Code checks it.
- **C3. Test helpers copied.** `recordEvents` exists in three test files.
  Move it to `tests/helpers.js`.
- **C4. Loading failure is a black screen.** If `loadAssets()` fails, the
  top-level `await` in `main.js` rejects and nothing is drawn. Catch it and
  write the error on the canvas.
- **C5. The redrawn coastline isn't in "Vores beslutninger".** The collision
  grid in `map.js` is our own, not the original's land list (e.g. cell 7,5 is
  land in the original, water here). Help topic 0 says so; the reference doc
  should too.
- **C6. Odds and ends.** `title-screenshot.png` in the root (move to `docs/`),
  no favicon (404 in the console), `100vh` is wrong on mobile (`100dvh`).
  `image-rendering: pixelated` makes canvas text blocky when scaled; fine for
  the retro look, but it should be a stated choice.

### Recommended cleanup order

1. **No behaviour change, quick:** C1, C3, C6, B1, B2. Good warm-up, and the
   tests prove nothing broke.
2. **Small user-visible fixes:** B4 (modifiers, Backspace), B3, B7.
3. **Engine:** deferred scene transitions (A2), tested with `LoggingScene`.
   Plus B5 while in `Game.js`.
4. **Flow:** the map pushes and pops its sub-scenes (A1). Do this *after* A2,
   since both touch every scene.
5. **Rules:** one convention for results and events, `EVENTS` constants, drop
   unused events (A3). Then the map as a parameter (A4), B6.
6. **C2** `@ts-check` + JSDoc typedefs for the shared object shapes.

Avoid ECS, plugin systems and general renderer abstractions. The game doesn't
need them, and they would hide what's worth learning.

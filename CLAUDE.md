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
npm test                      # Node's built-in test runner, no install
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
  events.js     every event's name, as a constant: use EVENTS.x, never the string
  texts.js      every text the player reads, as a constant: TEXTS.x, or TEXTS.x(value)
  sounds.js     the only place that decides what anything sounds like (listens to events)
  records.js    what is kept between visits (record, last name, sound on/off)
tests/          Node tests for engine and rules
docs/original-regler.md   the reference for the original's rules and numbers (in Danish),
                          with our deviations under "Vores beslutninger"
KaptajnKaper_original/    the original GW-BASIC source (GPL-3), for reference only
```

## Conventions

- Code, identifiers, comments, README and commit messages in English. Text in
  the game (what the player sees) and `docs/original-regler.md` in Danish, as
  in the original.
- Comments explain *why* and are written for someone learning. Keep that
  density, and keep them true: a comment that says "(later)" about something
  that now exists is a bug.
- Commit subjects: `Area: what changes`, e.g. `Harbor: keep the start place free of ships at anchor`.
- Every rule function documents what it returns and which events it emits.
- New rules get Node tests. Rules take `random = Math.random` so tests decide
  what happens.
- Deviations from the original go under "Vores beslutninger" in
  `docs/original-regler.md`.
- Update README when the architecture changes.
- The original's `.BAS` files are in code page 865: read them with
  `iconv -f cp865 -t utf-8` (otherwise `¢` shows where `ø` should be).

## Working agreements

- Talk to the user in Danish.
- **Ask before adding anything that wasn't asked for**, however small or
  obvious it seems: a feature, a visual touch, a rule. Suggest it; don't
  build it.
- Before a bigger change, say what you plan to do and wait for a yes. One
  thing at a time.
- **Never use the original's code or data directly** to draw or run things
  (e.g. interpreting its DRAW strings for the map; that attempt is kept on the
  branch `experiment/original-map-from-build-bas`). Read the original to learn
  its rules and numbers, then build our own. Its texts, help and PLAY tunes are
  used verbatim, by agreement.
- Commit and push to `main` after each finished step, with tests passing.
- Check changes in the browser too (Playwright is available), not only in
  tests. Temporary test pages go in the repo root as `__*.html` and are
  deleted before committing.

## Code review

`docs/code-review.md` is a review of the whole codebase with a recommended
cleanup order. Work from it when cleaning up, and delete items there as they
are resolved.

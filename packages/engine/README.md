# engine

A small hand-made engine for 2D browser games: a game loop, scenes, keyboard
input, events and sound. It knows nothing about any game; a game uses it, and
it never uses a game.

## Using it

Inside this repo the engine is an npm workspace named `engine`, and games
import it by name:

```js
import { Game } from 'engine/Game.js';
import { Scene } from 'engine/Scene.js';
```

Node finds it through the workspace (run `npm install` once at the top of the
repo; it only links the packages, nothing is downloaded). The browser finds it
through an import map in the game's `index.html`:

```html
<script type="importmap">
  { "imports": { "engine/": "../../packages/engine/src/" } }
</script>
```

Tests: `npm test` here, or at the top of the repo for everything.

## What's in it

```
src/
  Game.js            canvas, game loop, the scene stack, crashes
  Scene.js           base class for a part of a game; can be paused
  Input.js           keyboard input as named actions
  EventBus.js        on(event, fn) / emit(event, data)
  Sound.js           beeps, sweeps, noise and tunes, made with Web Audio
  mml.js             reads BASIC's PLAY music language into notes
  collision.js       rectsOverlap(a, b) for box collisions
  loadImage.js       load an image file and wait until it's ready
  storage.js         localStorage that can't crash the game
  TextField.js       text being typed in, like a name
  NumberField.js     a TextField for whole numbers
  TileMap.js         grid of tiles built from strings
tests/               Node tests: npm test
```

A game hands the Game what's its own when it makes it:

```js
const game = new Game(canvas, {
  controls,    // { actionName: [keyCode, ...] }: which keys do what
  assets,      // whatever it loaded before starting (images...): game.assets
  drawError,   // (ctx, error) => ...: what the player sees after a crash
});
```

## How it works

**The game loop** (`Game.frame`). The browser calls it before every repaint. It
runs the logic (`update`) in fixed 1/60-second steps, then draws (`render`) once.
Fixed steps mean the game runs at the same speed on a 60 Hz and a 144 Hz monitor.
(The pattern: fixed timestep. Search: Glenn Fiedler, "Fix Your Timestep".)

**Update vs render.** `update(dt)` changes state, `render(ctx)` draws it. Keeping
them apart is what makes the fixed-step loop possible: logic can run 0, 1 or 2
times in a frame while drawing always happens once.

**Scenes.** Each part of a game (the title, the map, a battle) is a `Scene`:
the place where that part comes together. It decides which rules apply, turns
input into calls to them, hands the state to the drawing code, and says which
scene comes next. Normally one scene runs at a time, and `game.setScene(...)`
switches between them, calling `exit()` on the old one and `enter()` on the
new one. (The name is the one Phaser, Godot and Unity use.) Scenes can also be
stacked: `game.pushScene(...)` puts one on top, like help over a battle, and
the one below is paused (`pause()`), not ended, until `game.popScene()` takes
it back up (`resume()`). `game.replaceScene(...)` swaps only the top one. (A
stack of scenes like this is a "pushdown automaton".)

**Scene changes wait for the end of the step.** `setScene`, `pushScene`,
`replaceScene` and `popScene` only ask; the Game makes the change when the
scene's `update()` has finished. So the rest of a scene's code always runs, on
that scene, even when something deep inside it ends the game, and scenes
change in one place only (`Game.changeScenes`). A new scene's `enter()` may
ask for another change, which follows in the same step. Asking twice in one
step is a mistake, and throws. (The pattern: deferred state transitions.
Unity's `SceneManager.LoadScene` works this way too.)

**Global actions.** `game.onAction('help', ...)` works whatever scene is
showing, like opening the help from anywhere.

**Input.** Keyboard events are turned into state the game can query, as
named actions: `isActionDown('steerLeft')` for held keys,
`wasActionPressed('sailUp')` for one-shot presses, `wasActionRepeated(...)`
for presses that repeat while the key is held. The engine provides the
mechanism; which keys trigger which action is the game's business, handed
over as `controls` when the Game is made, so there is no Input without keys.
Typing is different: `typedText()` gives the characters typed since the last
update, for a `TextField` or a `NumberField`.

**Events.** `EventBus` lets one part of a game announce something
(`events.emit(name, data)`) and any number of others react
(`events.on(name, fn)`), without the announcer knowing who they are. A scene
uses `this.listen(...)` instead, and its listeners are removed automatically
when the scene ends. An event name must be a string: a game that keeps its
names as constants gets `undefined` from a misspelt one, and that's refused
loudly.

**Sound.** `game.sound` makes every sound on the spot, PC-speaker style:
`tone`, `sweep` (a sliding beep), `noise`, and `music`, which plays a tune
written in the music language of BASIC's `PLAY` statement, like
`"O3CEGO4CO3GEC2"`. `mml.js` reads such a string into notes with a frequency
and a length; `Sound` plays them. Browsers only allow sound after the player
has pressed something, so nothing is heard before the first key.

**Tile maps.** A map can be an array of strings, one character per tile.
`TileMap` answers "what's at (col, row)?", counting from 0; the game decides
what each character means and how to draw it.

**Images.** `loadImage(url)` loads one and waits until it can be drawn. A game
loads what it needs before it starts, and hands it to the Game as `assets`.

**Collision boxes.** `rectsOverlap(a, b)` says whether two rectangles
`{ x, y, w, h }` overlap.

**Crashes.** An error in a scene, a rule or the drawing stops the loop on
purpose (carrying on would repeat it 60 times a second), logs it once in the
console, and shows it on the canvas: with the game's `drawError`, or a plain
English one.

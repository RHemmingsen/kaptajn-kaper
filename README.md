# Kaptajn Kaper i Kattegat

A web remake of the old Danish DOS game, built on a small hand-made game engine.

## Running it

The code uses ES modules (`import`/`export`), and browsers won't load those from
`file://`. Serve the folder with any local web server:

```sh
python3 -m http.server 8000
# or: npx serve
```

Then open http://localhost:8000.

## Running the tests

```sh
npm test
```

No install needed; it uses Node's built-in test runner.

## How the engine works

```
src/
  main.js              creates the Game, sets the first scene, starts the loop
  engine/              reusable engine code, knows nothing about pirates
    Game.js            canvas, game loop, active scene
    Input.js           keyboard input as named actions
    EventBus.js        on(event, fn) / emit(event, data)
    collision.js       rectsOverlap(a, b) for box collisions
    loadImage.js       load an image file and wait until it's ready
    storage.js         localStorage that can't crash the game
    NumberField.js     a whole number being typed in ("Hvor mange?")
    Scene.js           base class for a part of the game
    TileMap.js         grid of tiles built from strings
  game/                everything specific to Kaptajn Kaper
    palette.js         colours and font
    controls.js        every key the game uses, as named actions
    assets.js          loads the game's images before it starts
    records.js         the record: most points in a finished game
    GameState.js       the ship's stats for the current playthrough
    map.js             the Kattegat tile map; grid and ports as in the original
    rules/             the game's rules: change GameState, emit events.
      sailing.js         No drawing, no keyboard.
      ship.js            damage and sinking, shared by every mode
      harbor.js          the harbor minigame: steering, wind, crashes
      trade.js           prices, buying and selling in a port
      sea.js             what the lookout spots: ships and fog banks
      battle.js          the gun battle: wind, aim, fire, damage both ways
      boarding.js        boarding: fight on her deck, one round at a time
      victory.js         plunder, sink or take as a prize, prize money
      career.js          goals, promotions, rank and title, running out of moves
      ending.js          the game ends once: sunk, jilted or won
    ui/                drawing code, shared between scenes
      draw.js            small helpers: clearScreen, polygon, label
      mapView.js         the sea map, ports and ship
      harborView.js      the harbor minigame
      portView.js        the trading menu in a port
      seaView.js         what the lookout reports, and what was in the fog
      battleView.js      the "Sigte" screen: panels, sights, table
      boardingView.js    the fight on the enemy's deck
      victoryView.js     what you took, and what you do with her
      promotionView.js   the news of a promotion
      endingView.js      how the game ended, and the record
      shipArt.js         a three-master from the side, at any place and size
      statusPanel.js     the Træk/Rgsdl/Korn... table
      titleArt.js        the title scene's picture
    scenes/            each part of the game: input -> rules -> drawing
      TitleScene.js
      MapScene.js
      HarborScene.js
      PortScene.js
      SeaEventScene.js
      BattleScene.js
      BoardingScene.js
      VictoryScene.js
      PromotionScene.js
      EndScene.js
assets/
  kattegat.svg         the map's land, drawn as SVG (10 units per cell)
tests/                 Node tests for engine and rules: npm test
docs/
  original-regler.md   the original game's rules, in Danish
KaptajnKaper_original/ the original 1985 source code, for reference only
```

**The game loop** (`Game.frame`). The browser calls it before every repaint. It
runs the logic (`update`) in fixed 1/60-second steps, then draws (`render`) once.
Fixed steps mean the game runs at the same speed on a 60 Hz and a 144 Hz monitor.

**Update vs render.** `update(dt)` changes state, `render(ctx)` draws it. Keeping
them apart is what makes the fixed-step loop possible: logic can run 0, 1 or 2
times in a frame while drawing always happens once.

**Scenes.** Each part of the game (title, map, harbor, port, battle, boarding)
is a `Scene`: the place where that part comes together. It decides which rules
apply, turns input into calls to them, hands the state to the drawing code in
`ui/`, and says which scene comes next. The Game holds exactly one, and
`game.setScene(...)` switches between them, calling `exit()` on the old one and
`enter()` on the new one. (The name is the one Phaser, Godot and Unity use.)

**Input.** Keyboard events are turned into state the game can query, as
named actions: `isActionDown('steerLeft')` for held keys,
`wasActionPressed('sailUp')` for one-shot presses. The engine provides the
mechanism; which keys trigger which action is the game's business and lives in
one place, `game/controls.js`. `main.js` hands them over when the game is made,
`new Game(canvas, { controls: CONTROLS })`, so there is no Input without keys.
Scenes never ask about keys directly.
Typing is different: `typedText()` gives the characters typed since the last
update, for answering questions like "Hvor mange?" with a `NumberField`.

**Tile maps.** The map is an array of strings, one character per tile (`.` water,
`#` land). `TileMap` answers "what's at (col, row)?"; the game decides what each
character means and how to draw it.

**Graphics layer and collision layer.** The map has two layers that are kept
apart: `assets/kattegat.svg` is what you *see* (smooth coastlines), and the
text grid in `map.js` is what the ship *hits*. The picture can be redrawn
without touching the rules, but the two must agree. Press **G** on the map to
see the collision grid on top of the picture (`game.debug.showCollision`).

**Loading assets.** Images load in the background, so `main.js` waits for
`loadAssets()` before starting the game. After that, drawing code can use
`IMAGES.kattegat` straight away.

**Game state.** Stats that every mode shares (men, guns, money...) live in one
`GameState` object that is handed from scene to scene.

**Three kinds of game code.** *Rules* (`game/rules/`) decide what happens and
change the `GameState`. *UI* (`game/ui/`) draws things. *Scenes* connect the
two: they turn key presses into rule calls and hand the state to the drawing
code. Because the rules never touch the canvas or keyboard, they can be tested
in Node.

**Events.** Rules announce what happened with `events.emit('arrivedAtPort', {
city })`, and anything interested listens with `events.on(...)`. A scene uses
`this.listen(...)` instead, and its listeners are removed automatically when
the game switches to another scene. Events are for things several unrelated
parts of the game care about; everything else is a direct function call.

**Real time vs turns.** The map is turn-based: one key press, one tile
(arrow keys, or the number keys 1-9 like a compass for diagonals). As in the
original, every move costs grain, and sailing into land costs 3 Rep. The
harbor runs in real time: the ship's position is in pixels and moves by
`speed * dt` every step, so speeds are in pixels per second whatever the frame
rate. The ship sails down on its own, held keys (`isDown`) steer left and
right, and the wind adds a constant sideways speed.

**Controlling chance.** Rules that roll dice take a `random` function
(returning 0..1, `Math.random` by default). The game uses the real thing; tests
pass their own, so they decide exactly what happens.

**Collision boxes.** Everything in the harbor is a rectangle `{ x, y, w, h }`,
and `rectsOverlap` checks whether two of them overlap. The drawings are made to
fill those boxes, so what you see is what collides.

**Game-wide events.** Some reactions apply whatever scene is running. Those
are set up once in `main.js` with `game.events.on(...)`. The game can end in
many places (the ship lost in the harbor or in battle, out of moves, every
goal reached), but always through `endGame` in `rules/ending.js`, which emits
one `gameOver` event; `main.js` answers it with the end scene.

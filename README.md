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
  main.js              creates the Game, sets the first screen, starts the loop
  engine/              reusable engine code, knows nothing about pirates
    Game.js            canvas, game loop, active screen
    Input.js           keyboard state
    EventBus.js        on(event, fn) / emit(event, data)
    collision.js       rectsOverlap(a, b) for box collisions
    Screen.js          base class for a game mode
    TileMap.js         grid of tiles built from strings
  game/                everything specific to Kaptajn Kaper
    palette.js         colours and font
    GameState.js       the ship's stats for the current playthrough
    map.js             the Kattegat tile map and its ports
    rules/             the game's rules: change GameState, emit events.
      sailing.js         No drawing, no keyboard.
      harbor.js          the harbor minigame: steering, wind, crashes
    ui/                drawing code, shared between screens
      draw.js            small helpers: clearScreen, polygon, label
      mapView.js         the sea map, ports and ship
      harborView.js      the harbor minigame
      statusPanel.js     the Træk/Rgsdl/Korn... table
      titleArt.js        the title screen picture
    screens/           thin glue: read input -> call rules -> draw
      TitleScreen.js
      MapScreen.js
      HarborScreen.js
tests/                 Node tests for engine and rules: npm test
```

**The game loop** (`Game.frame`). The browser calls it before every repaint. It
runs the logic (`update`) in fixed 1/60-second steps, then draws (`render`) once.
Fixed steps mean the game runs at the same speed on a 60 Hz and a 144 Hz monitor.

**Update vs render.** `update(dt)` changes state, `render(ctx)` draws it. Keeping
them apart is what makes the fixed-step loop possible: logic can run 0, 1 or 2
times in a frame while drawing always happens once.

**Screens.** Each game mode (title, map, harbor, combat, boarding) is a `Screen`.
The Game holds exactly one, and `game.setScreen(...)` switches between them,
calling `exit()` on the old one and `enter()` on the new one.

**Input.** Keyboard events are turned into state the game can query:
`isDown(code)` for held keys, `wasPressed(code)` for one-shot presses.

**Tile maps.** The map is an array of strings, one character per tile (`.` water,
`#` land). `TileMap` answers "what's at (col, row)?"; the game decides what each
character means and how to draw it.

**Game state.** Stats that every mode shares (men, guns, money...) live in one
`GameState` object that is handed from screen to screen.

**Three kinds of game code.** *Rules* (`game/rules/`) decide what happens and
change the `GameState`. *UI* (`game/ui/`) draws things. *Screens* connect the
two: they turn key presses into rule calls and hand the state to the drawing
code. Because the rules never touch the canvas or keyboard, they can be tested
in Node.

**Events.** Rules announce what happened with `events.emit('arrivedAtPort', {
city })`, and anything interested listens with `events.on(...)`. A screen uses
`this.listen(...)` instead, and its listeners are removed automatically when
the game switches to another screen. Events are for things several unrelated
parts of the game care about; everything else is a direct function call.

**Real time vs turns.** The map is turn-based: one key press, one tile. The
harbor runs in real time: the ship's position is in pixels and moves by
`speed * dt` every step, so speeds are in pixels per second whatever the frame
rate. Held keys (`isDown`) steer; the wind adds a constant sideways speed.

**Collision boxes.** Everything in the harbor is a rectangle `{ x, y, w, h }`,
and `rectsOverlap` checks whether two of them overlap. The drawings are made to
fill those boxes, so what you see is what collides.

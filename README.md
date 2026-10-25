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

## How the engine works

```
src/
  main.js              creates the Game, sets the first screen, starts the loop
  engine/              reusable engine code, knows nothing about pirates
    Game.js            canvas, game loop, active screen
    Input.js           keyboard state
    Screen.js          base class for a game mode
  game/                everything specific to Kaptajn Kaper
    palette.js         colours and font
    screens/
      TitleScreen.js
      MapScreen.js     (placeholder)
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

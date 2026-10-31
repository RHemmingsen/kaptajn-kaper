# Kaptajn Kaper i Kattegat

A web remake of P.O. Frederiksen's Danish DOS game from 1985, built on the
engine in [`packages/engine`](../../packages/engine).

## Running it

From the top of the repo (the engine has to be served too):

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000/version/original/. Tests: `npm test` here,
or at the top of the repo for everything.

## How it's built

```
index.html             the canvas, and the import map that finds the engine
src/
  main.js              creates the Game, wires game-wide reactions, starts
  game/                everything specific to Kaptajn Kaper
    palette.js         colours and font
    controls.js        every key the game uses, as named actions
    helpText.js        the help (F1): the original's topics, and about this version
    events.js          every event's name, as constants, and what it carries
    texts.js           every text the player reads (but the help), as constants
    sounds.js          which events make which sounds
    music.js           the original's tunes, in BASIC's PLAY language
    assets.js          loads the game's images before it starts
    records.js         kept between visits: the record and who set it,
                       the last name played with, and sound on or off
    GameState.js       the ship's stats for the current playthrough
    map.js             SeaChart, and Kattegat as one: grid and ports as in the original
    rules/             the game's rules: change GameState, emit events.
      sailing.js         No drawing, no keyboard.
      ship.js            damage, sinking and what she can carry, shared by all
      harbor.js          the harbor minigame: steering, gusts, crashes, the gap
      trade.js           prices, buying and selling in a port
      sea.js             what the lookout spots: ships and fog banks
      battle.js          the gun battle: wind, aim, fire, damage both ways
      boarding.js        boarding: fight on her deck, one round at a time
      victory.js         plunder, sink or take as a prize, prize money
      career.js          goals, promotions, rank and title, running out of moves
      ending.js          the game ends once: sunk, jilted, won or quit
    ui/                drawing code, shared between scenes
      draw.js            small helpers: clearScreen, polygon, text, label
      mapView.js         the sea map, its frame, ports and ship
      harborView.js      the harbor minigame and its messages
      portView.js        the trading menu in a port
      seaView.js         what the lookout reports, and what was in the fog
      battleView.js      the "Sigte" screen: panels, sights, table
      boardingView.js    the fight on the enemy's deck
      victoryView.js     what you took, and what you do with her
      errorView.js       what the player sees if the game crashes
      promotionView.js   the news of a promotion
      endingView.js      how the game ended, and the record
      nameView.js        "Hvad er dit navn?", and the greeting
      soundView.js       the question about sound at the start
      recordText.js      how the record is written
      helpView.js        the help's menu and pages
      shipArt.js         a three-master from the side, at any place and size
      statusPanel.js     the Træk/Rgsdl/Korn... table
      titleArt.js        the title scene's picture and prompt
    scenes/            each part of the game: input -> rules -> drawing
      SoundScene.js
      TitleScene.js
      NameScene.js
      HelpScene.js
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
tests/                 Node tests for the rules: npm test
  helpers.js           dice() and recordEvents(), shared by the tests
docs/
  original-regler.md   the original game's rules, in Danish, and our decisions
  code-review.md       a review of the code, and what was decided
  title-screenshot.png the title scene
KaptajnKaper_original/ the original 1985 source code, for reference only
```

**Three kinds of game code.** *Rules* (`game/rules/`) decide what happens and
change the `GameState`. *UI* (`game/ui/`) draws things. *Scenes* connect the
two: they turn key presses into rule calls and hand the state to the drawing
code. Because the rules never touch the canvas or keyboard, they can be tested
in Node.

**Game state.** Stats that every mode shares (men, guns, money...) live in one
`GameState` object that is handed from scene to scene.

**Events.** A rule tells whoever called it what happened by returning it:
`sail()` returns `{ moved, city, seaEvent }`, and the map decides what comes
next. Events are for the others, who the rule doesn't know about: it
announces with `events.emit(EVENTS.shipRanAground, { col, row })`, and the
sound, say, listens with `events.on(EVENTS.shipRanAground, ...)`. Every
event's name is a constant in `game/events.js`, which also says who sends it
and what it carries.

**Texts.** Every text the player reads is a constant in `game/texts.js`,
except the original's help, which is in `helpText.js`. Code writes
`TEXTS.port.whatNow`, or `TEXTS.port.welcome(city.name)` for a text with a
value in it; `ui/` decides where the words go and in which colour. The rules
hold no text: a ship type has an `id` (`TEXTS.ships[id]` is its name), and
your career a level (`TEXTS.career.ranks[level - 1]`). The letters you answer
with (`a` for angribe...) are there too, and the questions are built from
them, so a question and its keys can't disagree. A misspelt constant is
`undefined`, and `text()` in `ui/draw.js` refuses that loudly.

**The map stays for the whole voyage.** What happens on the way is pushed on
top of it: a harbor (replaced by its port once you're in), a ship or a fog
bank (replaced by a battle or boarding, then by the victory), a promotion.
When that's over, it pops itself, and the map carries on where it was. So
only `NameScene`, which starts a voyage, ever makes a `MapScene`, and the
scenes on top only know their own next step.

**Sound.** Nothing in the rules or scenes plays a sound. They announce what
happened (`shipRanAground`, `shotFired`, `fled`...) and `game/sounds.js`
listens and decides what that sounds like, so all of the game's sound is in
one file. The tunes are the original's, in BASIC's PLAY language
(`game/music.js`), played by the engine's `Sound`.

**The map.** It's a `SeaChart` (`map.js`): a grid of water and land, and the
ports, numbered from 1 as in the original, so the ship, the ports and the
docs all use the original's numbers. Only the chart knows that the engine's
`TileMap` counts from 0.

**Graphics layer and collision layer.** The map has two layers that are kept
apart: `assets/kattegat.svg` is what you *see* (smooth coastlines), and the
text grid in `map.js` is what the ship *hits*. The picture can be redrawn
without touching the rules, but the two must agree. Press **G** on the map to
see the collision grid on top of the picture (`game.debug.showCollision`).

**Real time vs turns.** The map is turn-based: one key press, one tile
(arrow keys, or the number keys 1-9 like a compass for diagonals). As in the
original, every move costs grain, and sailing into land costs 3 Rep. The
harbor runs in real time: the ship's position is in pixels and moves by
`speed * dt` every step, so speeds are in pixels per second whatever the frame
rate. The ship sails down on its own, held keys steer left and right, and
gusts of wind from one side push it off course now and then. The trip takes
about 18 of the original's steps, and a gust can come once per step.

**Controlling chance.** Rules that roll dice take a `random` function
(returning 0..1, `Math.random` by default). The game uses the real thing; tests
pass their own, so they decide exactly what happens. The same goes for the
map: `sail()` is handed the chart it sails on (`KATTEGAT` in the game, a
five-by-three one in the tests), so redrawing the coast can't break the
sailing tests. Giving a function what it uses, instead of letting it fetch
it, is called dependency injection.

**Collision boxes.** Everything in the harbor is a rectangle `{ x, y, w, h }`,
and `rectsOverlap` checks whether two of them overlap. The drawings are made to
fill those boxes, so what you see is what collides.

**Game-wide events.** Some reactions apply whatever scene is running. Those
are set up once in `main.js` with `game.events.on(...)`. The game can end in
many places (the ship lost in the harbor or in battle, out of moves, every
goal reached, Esc on the map), but always through `endGame` in
`rules/ending.js`, which emits one `gameOver` event; `main.js` answers it with
the end scene.

## License

GNU General Public License version 3; see [LICENSE](../../LICENSE).

Kaptajn Kaper i Kattegat was written by P.O. Frederiksen in 1985. His source
code was released under GPL v3 together with his sons, Jan Thorhauge
Frederiksen and Morten Frederiksen (see `KaptajnKaper_original/`). This
remake builds on it (the rules, texts, help, tunes and the map's layout), so
it is under the same license.

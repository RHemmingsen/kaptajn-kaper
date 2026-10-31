# Kaptajn Kaper, and the engine it runs on

A remake of the Danish DOS game *Kaptajn Kaper i Kattegat* (P.O. Frederiksen,
1985) for the browser, and the small hand-made game engine it's built on. The
engine is a package of its own, so more versions of the game, or other games,
can be built on it.

```
packages/
  engine/               the engine: game loop, scenes, input, events, sound
version/
  original/             the game, as the original
```

Each has its own README: [the engine](packages/engine/README.md),
[Kaptajn Kaper](version/original/README.md).

## Running it

Plain JavaScript and ES modules: no build step, and no dependencies. Once,
after cloning, let npm link the packages (nothing is downloaded):

```sh
npm install
```

Then serve the whole repo with any local web server (browsers won't load
ES modules from `file://`, and a game needs the engine next to it):

```sh
python3 -m http.server 8000
# or: npx serve
```

and open http://localhost:8000/version/original/.

## Tests

```sh
npm test
```

runs the tests of every package, with Node's built-in test runner.

## How the packages fit together

This is an npm workspace (`package.json`: `workspaces`). A game imports the
engine by its name, `import { Game } from 'engine/Game.js'`, never by a path
into its folder. Node finds it through the workspace; the browser through an
import map in the game's `index.html`. The engine never imports from a game.

A new version is a folder under `version/` with a `package.json` that depends
on `engine`, and an `index.html` with the same import map.

## License

GNU General Public License version 3; see [LICENSE](LICENSE).

Kaptajn Kaper i Kattegat was written by P.O. Frederiksen in 1985. His source
code was released under GPL v3 together with his sons, Jan Thorhauge
Frederiksen and Morten Frederiksen (see
`version/original/KaptajnKaper_original/`). The game here builds on it, so
it is under the same license; so, for now, is the engine.

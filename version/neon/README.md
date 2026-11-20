# Kaptajn Kaper Neon

The same game as [the original version](../original/README.md), with the same
rules and texts, in neon synthwave colours: a neon palette, a glow on
everything drawn, scanlines, and a synthwave sunset behind the title and the
ending. It plays the original's tunes and sounds on synths: the tunes on a
filtered sawtooth with an echo, the effects on a triangle wave. The title
tune becomes an EDM track (src/game/track.js): the original's notes at 128
BPM on a supersaw lead, with an intro, a build-up and a drop, four-on-the-
floor drums, an off-beat bass and a sidechain pump.

It started as a copy of `version/original` and shares the engine with it
(`packages/engine`). How the game is built is described in the original's
README; this version changes only how it looks and sounds. Its rules, the original's
source code and the reference for its rules are in `version/original`.

## Running it

From the top of the repo:

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000/version/neon/. Tests: `npm test` here, or at
the top of the repo for everything.

## License

GNU General Public License version 3; see [LICENSE](../../LICENSE). It builds
on P.O. Frederiksen's Kaptajn Kaper i Kattegat (1985), as the original
version does.

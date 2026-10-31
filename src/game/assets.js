// The game's image files. They're all loaded once, before the game starts:
// main.js waits for loadAssets() and hands what it returns to the Game, as
// game.assets, so the drawing code can use them without waiting.
import { loadImage } from '../engine/loadImage.js';

// Returns { kattegat }: the map's land, drawn as SVG.
export async function loadAssets() {
  return {
    kattegat: await loadImage('assets/kattegat.svg'),
  };
}

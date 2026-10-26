// The game's image files. They're all loaded once, before the game starts
// (see main.js), so the drawing code can use them without waiting.
import { loadImage } from '../engine/loadImage.js';

export const IMAGES = {};

export async function loadAssets() {
  IMAGES.kattegat = await loadImage('assets/kattegat.svg');
}

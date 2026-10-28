// Entry point: load the images, create the game, pick the first screen, start
// the loop.
import { Game } from './engine/Game.js';
import { loadAssets } from './game/assets.js';
import { CONTROLS } from './game/controls.js';
import { TitleScreen } from './game/screens/TitleScreen.js';

await loadAssets();

const canvas = document.getElementById('game');
const game = new Game(canvas);
game.input.setBindings(CONTROLS);

// Game-wide reactions, which apply whatever screen is showing. The ship can
// sink in the harbor or (later) in battle; either way the game is over.
game.events.on('shipSunk', () => game.setScreen(new TitleScreen(game)));

game.setScreen(new TitleScreen(game));
game.start();

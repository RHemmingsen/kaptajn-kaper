// Entry point: load the images, create the game, pick the first scene, start
// the loop.
import { Game } from './engine/Game.js';
import { loadAssets } from './game/assets.js';
import { CONTROLS } from './game/controls.js';
import { TitleScene } from './game/scenes/TitleScene.js';

await loadAssets();

const canvas = document.getElementById('game');
const game = new Game(canvas, { controls: CONTROLS });

// Game-wide reactions, which apply whatever scene is running. The ship can
// sink in the harbor or (later) in battle; either way the game is over.
game.events.on('shipSunk', () => game.setScene(new TitleScene(game)));

game.setScene(new TitleScene(game));
game.start();

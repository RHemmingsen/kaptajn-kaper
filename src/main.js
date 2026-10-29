// Entry point: load the images, create the game, pick the first scene, start
// the loop.
import { Game } from './engine/Game.js';
import { loadAssets } from './game/assets.js';
import { CONTROLS } from './game/controls.js';
import { EndScene } from './game/scenes/EndScene.js';
import { HelpScene } from './game/scenes/HelpScene.js';
import { TitleScene } from './game/scenes/TitleScene.js';

await loadAssets();

const canvas = document.getElementById('game');
const game = new Game(canvas, { controls: CONTROLS });

// Game-wide reactions, which apply whatever scene is running. The game can
// end in many places (the ship lost in the harbor or in battle, out of
// moves, all goals reached); whichever, the end scene shows how it went.
game.events.on('gameOver', (summary) => game.setScene(new EndScene(game, summary)));

// F1 opens the help from anywhere, as in the original, on top of whatever
// you were doing, which waits until you close it.
game.onAction('help', () => {
  if (!(game.scene instanceof HelpScene)) game.pushScene(new HelpScene(game));
});

game.setScene(new TitleScene(game));
game.start();

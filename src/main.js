// Entry point: create the game, pick the first screen, start the loop.
import { Game } from './engine/Game.js';
import { TitleScreen } from './game/screens/TitleScreen.js';

const canvas = document.getElementById('game');
const game = new Game(canvas);

// Game-wide reactions, which apply whatever screen is showing. The ship can
// sink in the harbor or (later) in battle; either way the game is over.
game.events.on('shipSunk', () => game.setScreen(new TitleScreen(game)));

game.setScreen(new TitleScreen(game));
game.start();

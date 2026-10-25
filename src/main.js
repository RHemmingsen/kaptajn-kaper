// Entry point: create the game, pick the first screen, start the loop.
import { Game } from './engine/Game.js';
import { TitleScreen } from './game/screens/TitleScreen.js';

const canvas = document.getElementById('game');
const game = new Game(canvas);

game.setScreen(new TitleScreen(game));
game.start();

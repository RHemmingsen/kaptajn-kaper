import { Scene } from '../../engine/Scene.js';
import { recordScore } from '../records.js';
import { clearScreen } from '../ui/draw.js';
import { drawEnding } from '../ui/endingView.js';
import { TitleScene } from './TitleScene.js';

// The game is over: how it ended, how it went, and the record. Any key goes
// back to the title. main.js brings you here when the gameOver event comes,
// with its summary: { ending, points, money, men, repair }.
export class EndScene extends Scene {
  constructor(game, summary) {
    super(game);
    this.summary = summary;
    this.record = null;
  }

  enter() {
    this.record = recordScore(this.summary.points);
  }

  update(dt) {
    if (this.game.input.anyKeyPressed()) this.game.setScene(new TitleScene(this.game));
  }

  render(ctx) {
    clearScreen(ctx);
    drawEnding(ctx, { ...this.summary, ...this.record });
  }
}

import { Scene } from '../../engine/Scene.js';
import { nobleTitle, promote, rankTitle } from '../rules/career.js';
import { endGame } from '../rules/ending.js';
import { clearScreen } from '../ui/draw.js';
import { drawPromotion } from '../ui/promotionView.js';
import { drawStatusPanel } from '../ui/statusPanel.js';
import { MapScene } from './MapScene.js';

// You reached the goal: news of your promotion arrives by message in a
// bottle. You're promoted as soon as you get here. Any key goes back to sea,
// or, after the fourth goal, ends the game as won (via the gameOver listener
// in main.js), once you've read the news.
export class PromotionScene extends Scene {
  constructor(game, state) {
    super(game);
    this.state = state;
    this.won = false;
  }

  enter() {
    this.won = promote(this.state).won;
  }

  update(dt) {
    if (!this.game.input.anyKeyPressed()) return;
    if (this.won) endGame(this.state, 'won', this.game.events);
    else this.game.setScene(new MapScene(this.game, this.state));
  }

  render(ctx) {
    clearScreen(ctx);
    drawPromotion(ctx, {
      won: this.won,
      rank: rankTitle(this.state),
      title: nobleTitle(this.state),
      goal: this.state.goal,
      maxMoves: this.state.maxMoves,
    });
    drawStatusPanel(ctx, this.state);
  }
}

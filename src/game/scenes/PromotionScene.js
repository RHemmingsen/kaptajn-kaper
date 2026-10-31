import { Scene } from '../../engine/Scene.js';
import { careerLevel, promote } from '../rules/career.js';
import { endGame } from '../rules/ending.js';
import { clearScreen } from '../ui/draw.js';
import { drawPromotion } from '../ui/promotionView.js';
import { drawStatusPanel } from '../ui/statusPanel.js';
import { TEXTS } from '../texts.js';

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
    this.won = promote(this.state, this.game.events).won;
  }

  update(dt) {
    if (!this.game.input.anyKeyPressed()) return;
    if (this.won) endGame(this.state, 'won', this.game.events);
    else this.game.popScene(); // back to the map
  }

  render(ctx) {
    clearScreen(ctx);
    drawPromotion(ctx, {
      won: this.won,
      rank: TEXTS.career.ranks[careerLevel(this.state) - 1],
      title: TEXTS.career.titles[careerLevel(this.state) - 1],
      name: this.state.name,
      goal: this.state.goal,
      maxMoves: this.state.maxMoves,
    });
    drawStatusPanel(ctx, this.state);
  }
}

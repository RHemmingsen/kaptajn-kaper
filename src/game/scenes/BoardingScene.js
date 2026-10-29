import { Scene } from '../../engine/Scene.js';
import { fightRound } from '../rules/boarding.js';
import { clearScreen } from '../ui/draw.js';
import { drawBoarding } from '../ui/boardingView.js';
import { drawStatusPanel } from '../ui/statusPanel.js';
import { SeaEventScene } from './SeaEventScene.js';
import { VictoryScene } from './VictoryScene.js';

// Boarding an enemy ship. The first round is fought as soon as you board.
// After each round, as in the original, you answer by typing a letter: fight
// on (k), or go back to your own ship (t) and choose again whether to attack
// or flee. When she strikes her flag, any key goes on to the victory.
// If your ship is lost, the shipSunk listener in main.js ends the game.
export class BoardingScene extends Scene {
  constructor(game, state, enemy) {
    super(game);
    this.state = state;
    this.enemy = enemy;
    this.round = null; // the result of the last round
  }

  enter() {
    this.fight();
  }

  fight() {
    this.round = fightRound(this.enemy, this.state, this.game.events);
  }

  update(dt) {
    const input = this.game.input;

    if (this.round.outcome === 'surrender') {
      if (input.anyKeyPressed()) this.game.setScene(new VictoryScene(this.game, this.state, this.enemy));
      return;
    }

    const typed = input.typedText().toLowerCase();
    if (typed.includes('k')) {
      this.fight();
    } else if (typed.includes('t')) {
      const seaEvent = { kind: 'ship', ship: this.enemy };
      this.game.setScene(new SeaEventScene(this.game, this.state, seaEvent));
    }
  }

  render(ctx) {
    clearScreen(ctx);
    drawBoarding(ctx, { enemy: this.enemy, round: this.round });
    drawStatusPanel(ctx, this.state, 'boarding');
  }
}

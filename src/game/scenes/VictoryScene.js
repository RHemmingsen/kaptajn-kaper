import { Scene } from '../../engine/Scene.js';
import { plunder, sendPrize, sinkPrize } from '../rules/victory.js';
import { clearScreen } from '../ui/draw.js';
import { drawStatusPanel } from '../ui/statusPanel.js';
import { drawVictory } from '../ui/victoryView.js';

// An enemy ship has struck her flag, after a gun battle or boarding. You
// plunder her as soon as you get here, then, as in the original, answer by
// typing a letter.
//
// The scene goes through these steps:
//   plunder  what you took; sink her (s) or take her as a prize (p)?
//   sunk     she sank, and her survivors joined you; any key: back to sea
//   prize    she's on her way to København; any key: back to sea
// If sending a prize crew leaves too few men, the gameOver listener in
// main.js ends the game.
export class VictoryScene extends Scene {
  constructor(game, state, enemy) {
    super(game);
    this.state = state;
    this.enemy = enemy;
    this.step = 'plunder';
    this.spoils = null;
    this.sinking = null; // what sinking her did: { joined, toTheSharks }
  }

  enter() {
    this.spoils = plunder(this.enemy, this.state);
  }

  update(dt) {
    const input = this.game.input;

    if (this.step === 'plunder') {
      const typed = input.typedText().toLowerCase();
      if (typed.includes('s')) {
        this.sinking = sinkPrize(this.state, this.spoils);
        this.step = 'sunk';
      } else if (typed.includes('p')) {
        sendPrize(this.state, this.spoils, this.game.events);
        this.step = 'prize';
      }
    } else if (input.anyKeyPressed()) {
      this.game.popScene(); // back to the map
    }
  }

  render(ctx) {
    clearScreen(ctx);
    drawVictory(ctx, {
      step: this.step,
      spoils: this.spoils,
      sinking: this.sinking,
      men: this.state.men,
    });
    drawStatusPanel(ctx, this.state);
  }
}

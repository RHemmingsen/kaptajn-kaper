import { Scene } from 'engine/Scene.js';
import { createHarbor, updateHarbor } from '../rules/harbor.js';
import { clearScreen } from '../ui/draw.js';
import { drawHarbor, drawHarborIntro } from '../ui/harborView.js';
import { PortScene } from './PortScene.js';

// The harbor minigame, played when the ship sails into a port on the map.
// First the original's instructions, then, after any key, you sail in:
// steer left and right (hold the keys down), or leave to give up and go back
// to sea. The keys are in controls.js.
// If the ship is lost, the gameOver listener in main.js ends the game.
export class HarborScene extends Scene {
  constructor(game, state, city) {
    super(game);
    this.state = state;
    this.harbor = createHarbor(city, state.difficulty);
    this.started = false; // reading the instructions
  }

  update(dt) {
    const input = this.game.input;

    if (!this.started) {
      if (input.wasActionPressed('leave')) this.backToMap();
      else if (input.anyKeyPressed()) this.started = true;
      return;
    }

    if (this.harbor.status === 'docked') {
      if (input.anyKeyPressed()) {
        this.game.replaceScene(new PortScene(this.game, this.state, this.harbor.city));
      }
      return;
    }

    if (input.wasActionPressed('leave')) {
      this.backToMap();
      return;
    }

    const controls = {
      left: input.isActionDown('steerLeft'),
      right: input.isActionDown('steerRight'),
    };
    updateHarbor(this.harbor, controls, dt, this.state, this.game.events);
  }

  // Back to the map, which waited below.
  backToMap() {
    this.game.popScene();
  }

  render(ctx) {
    clearScreen(ctx);
    if (!this.started) {
      drawHarborIntro(ctx, this.harbor);
      return;
    }
    drawHarbor(ctx, this.harbor, this.state);
  }
}

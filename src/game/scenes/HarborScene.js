import { Scene } from '../../engine/Scene.js';
import { COLORS } from '../palette.js';
import { createHarbor, updateHarbor } from '../rules/harbor.js';
import { clearScreen, centeredLabel } from '../ui/draw.js';
import { drawHarbor, drawHarborIntro } from '../ui/harborView.js';
import { MapScene } from './MapScene.js';
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
        this.game.setScene(new PortScene(this.game, this.state, this.harbor.city));
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

  backToMap() {
    this.game.setScene(new MapScene(this.game, this.state));
  }

  render(ctx) {
    clearScreen(ctx);
    if (!this.started) {
      drawHarborIntro(ctx, this.harbor);
      return;
    }
    drawHarbor(ctx, this.harbor);

    if (this.harbor.crashTimer > 0) {
      const text = `Du ramte et skib! -${this.harbor.lastCrash} Rep, ${this.state.repair} tilbage`;
      centeredLabel(ctx, text, 240, COLORS.white);
    }
    if (this.harbor.status === 'docked') {
      centeredLabel(ctx, `Velkommen til ${this.harbor.city.name}!`, 440, COLORS.white);
      centeredLabel(ctx, 'Tryk på en tast', 464, COLORS.white);
    }
  }
}

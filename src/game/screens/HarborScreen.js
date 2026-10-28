import { Screen } from '../../engine/Screen.js';
import { COLORS } from '../palette.js';
import { createHarbor, updateHarbor } from '../rules/harbor.js';
import { clearScreen, centeredLabel } from '../ui/draw.js';
import { drawHarbor } from '../ui/harborView.js';
import { MapScreen } from './MapScreen.js';

// The harbor minigame, played when the ship sails into a port on the map.
// Steer left and right (hold the keys down), or leave to give up and go back
// to sea. The keys are in controls.js.
// If the ship sinks, the shipSunk listener in main.js ends the game.
export class HarborScreen extends Screen {
  constructor(game, state, city) {
    super(game);
    this.state = state;
    this.harbor = createHarbor(city);
  }

  update(dt) {
    const input = this.game.input;

    if (this.harbor.status === 'docked') {
      if (input.anyKeyPressed()) this.backToMap();
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
    this.game.setScreen(new MapScreen(this.game, this.state));
  }

  render(ctx) {
    clearScreen(ctx);
    drawHarbor(ctx, this.harbor);

    if (this.harbor.crashTimer > 0) {
      centeredLabel(ctx, `Du ramte noget! Rep: ${this.state.repair}`, 240, COLORS.white);
    }
    if (this.harbor.status === 'docked') {
      centeredLabel(ctx, `Velkommen til ${this.harbor.city.name}!`, 440, COLORS.white);
      centeredLabel(ctx, 'Tryk på en tast', 464, COLORS.white);
    }
  }
}

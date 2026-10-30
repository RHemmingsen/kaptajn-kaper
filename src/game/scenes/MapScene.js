import { Scene } from '../../engine/Scene.js';
import { KATTEGAT, cityAt } from '../map.js';
import { goalReached } from '../rules/career.js';
import { sail } from '../rules/sailing.js';
import { checkCargo } from '../rules/ship.js';
import { clearScreen } from '../ui/draw.js';
import {
  drawMap, drawMapFrame, drawCollisionOverlay, drawCities, drawCityName, drawShip,
} from '../ui/mapView.js';
import { drawStatusPanel } from '../ui/statusPanel.js';
import { HarborScene } from './HarborScene.js';
import { PromotionScene } from './PromotionScene.js';
import { SeaEventScene } from './SeaEventScene.js';
import { TitleScene } from './TitleScene.js';

// Which action sails which way. The keys for each action are in controls.js.
const SAIL_ACTIONS = {
  sailUp: 'up',
  sailDown: 'down',
  sailLeft: 'left',
  sailRight: 'right',
  sailUpLeft: 'upLeft',
  sailUpRight: 'upRight',
  sailDownLeft: 'downLeft',
  sailDownRight: 'downRight',
};

// The main scene: sail the ship around the Kattegat, one tile per key press.
// The scene only connects things: keys go to the sailing rules, and the
// state is handed to the drawing code.
export class MapScene extends Scene {
  constructor(game, state) {
    super(game);
    this.state = state;
    // The city we're in, if any. We can be in one already when coming back
    // from the harbor.
    this.portCity = cityAt(state.ship.col, state.ship.row);
  }

  enter() {
    this.listen('shipMoved', () => { this.portCity = null; });
    this.listen('arrivedAtPort', ({ city }) => {
      this.game.setScene(new HarborScene(this.game, this.state, city));
    });
    this.listen('seaEvent', (seaEvent) => {
      this.game.setScene(new SeaEventScene(this.game, this.state, seaEvent));
    });
  }

  update(dt) {
    const input = this.game.input;

    // Back at sea, first the original's checks: is she carrying too much? If
    // so she sinks, and the gameOver listener in main.js ends the game.
    if (checkCargo(this.state, this.game.events)) return;

    // With enough points, e.g. after a victory or a payout in København,
    // the news of your promotion comes next.
    if (goalReached(this.state)) {
      this.game.setScene(new PromotionScene(this.game, this.state));
      return;
    }

    if (input.wasActionPressed('leave')) {
      this.game.setScene(new TitleScene(this.game));
      return;
    }

    if (input.wasActionPressed('debugCollision')) {
      this.game.debug.showCollision = !this.game.debug.showCollision;
    }

    // One step per update at most. Sailing can switch to the harbor scene,
    // and this scene must not keep moving the ship after that.
    for (const [action, direction] of Object.entries(SAIL_ACTIONS)) {
      if (input.wasActionPressed(action)) {
        sail(this.state, direction, this.game.events);
        break;
      }
    }
  }

  render(ctx) {
    clearScreen(ctx);
    drawMapFrame(ctx, this.state, this.game.sound.enabled);
    drawMap(ctx, KATTEGAT);
    if (this.game.debug.showCollision) drawCollisionOverlay(ctx);
    drawCities(ctx);
    if (this.portCity) drawCityName(ctx, this.portCity);
    drawShip(ctx, this.state.ship);
    drawStatusPanel(ctx, this.state);
  }

}

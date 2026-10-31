import { Scene } from '../../engine/Scene.js';
import { KATTEGAT } from '../map.js';
import { goalReached } from '../rules/career.js';
import { endGame } from '../rules/ending.js';
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
//
// The map stays for the whole voyage. What happens on the way (a harbor and
// its port, a ship or a fog bank, a promotion) is pushed on top of it, and
// when that's over it's popped, and the map carries on where it was. So
// those scenes never need to know about the map. (See Game.js.)
export class MapScene extends Scene {
  constructor(game, state) {
    super(game);
    this.state = state;
    // The port we're in, if any: set when we sail into one, so its name
    // still shows when we come back from the harbor.
    this.portCity = null;
  }

  update(dt) {
    const input = this.game.input;

    // Back at sea, first the original's checks: is she carrying too much? If
    // so she sinks, and the gameOver listener in main.js ends the game.
    if (checkCargo(this.state, this.game.events)) return;

    // With enough points, e.g. after a victory or a payout in København,
    // the news of your promotion comes next.
    if (goalReached(this.state)) {
      this.game.pushScene(new PromotionScene(this.game, this.state));
      return;
    }

    // Esc ends the game, as in the original: the end scene, with the points
    // and the record (via the gameOver listener in main.js).
    if (input.wasActionPressed('leave')) {
      endGame(this.state, 'quit', this.game.events);
      return;
    }

    if (input.wasActionPressed('debugCollision')) {
      this.game.debug.showCollision = !this.game.debug.showCollision;
    }

    // One step per update at most: after a step into a port or onto
    // something the lookout spotted, that comes next.
    const action = Object.keys(SAIL_ACTIONS).find((name) => input.wasActionPressed(name));
    if (action) this.sail(SAIL_ACTIONS[action]);
  }

  sail(direction) {
    const { moved, city, seaEvent } = sail(this.state, KATTEGAT, direction, this.game.events);
    if (moved) this.portCity = city;
    if (city) this.game.pushScene(new HarborScene(this.game, this.state, city));
    else if (seaEvent) this.game.pushScene(new SeaEventScene(this.game, this.state, seaEvent));
  }

  render(ctx) {
    clearScreen(ctx);
    drawMapFrame(ctx, this.state, this.game.sound.enabled);
    drawMap(ctx, KATTEGAT, this.game.assets.kattegat);
    if (this.game.debug.showCollision) drawCollisionOverlay(ctx, KATTEGAT);
    drawCities(ctx, KATTEGAT);
    if (this.portCity) drawCityName(ctx, this.portCity);
    drawShip(ctx, this.state.ship);
    drawStatusPanel(ctx, this.state);
  }

}

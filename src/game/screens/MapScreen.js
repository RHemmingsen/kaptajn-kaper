import { Screen } from '../../engine/Screen.js';
import { COLORS } from '../palette.js';
import { KATTEGAT, cityAt } from '../map.js';
import { sail } from '../rules/sailing.js';
import { clearScreen, label } from '../ui/draw.js';
import { drawMap, drawCities, drawCityName, drawShip } from '../ui/mapView.js';
import { drawStatusPanel } from '../ui/statusPanel.js';
import { HarborScreen } from './HarborScreen.js';
import { TitleScreen } from './TitleScreen.js';

// Which arrow key means which sailing direction.
const KEY_TO_DIRECTION = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

// The main screen: sail the ship around the Kattegat, one tile per key press.
// The screen only connects things: keys go to the sailing rules, and the
// state is handed to the drawing code.
export class MapScreen extends Screen {
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
      this.game.setScreen(new HarborScreen(this.game, this.state, city));
    });
  }

  update(dt) {
    const input = this.game.input;

    if (input.wasPressed('Escape')) {
      this.game.setScreen(new TitleScreen(this.game));
      return;
    }

    // One step per update at most. Sailing can switch to the harbor screen,
    // and this screen must not keep moving the ship after that.
    for (const [key, direction] of Object.entries(KEY_TO_DIRECTION)) {
      if (input.wasPressed(key)) {
        sail(this.state, direction, this.game.events);
        break;
      }
    }
  }

  render(ctx) {
    clearScreen(ctx);
    this.drawFrame(ctx);
    drawMap(ctx, KATTEGAT);
    drawCities(ctx);
    if (this.portCity) drawCityName(ctx, this.portCity);
    drawShip(ctx, this.state.ship);
    drawStatusPanel(ctx, this.state);
  }

  // The green border with the score, goal and key help on it.
  drawFrame(ctx) {
    const s = this.state;

    ctx.strokeStyle = COLORS.green;
    ctx.lineWidth = 12;
    ctx.strokeRect(23, 19, 574, 335);

    label(ctx, `Point: ${s.points}`, 44, 19);
    label(ctx, `Mål: ${s.goal} på ${s.maxMoves} træk`, 262, 19);
    label(ctx, 'F1:Hjælp', 44, 354);
    label(ctx, 'F2:lyd', 262, 354);
    label(ctx, 'Esc:Slut', 466, 354);
  }
}

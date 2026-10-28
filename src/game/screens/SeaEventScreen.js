import { Screen } from '../../engine/Screen.js';
import { rankTitle } from '../rules/career.js';
import { flee, investigateFog } from '../rules/sea.js';
import { clearScreen } from '../ui/draw.js';
import { drawSeaEvent } from '../ui/seaView.js';
import { drawStatusPanel } from '../ui/statusPanel.js';
import { MapScreen } from './MapScreen.js';

// The lookout has spotted something. As in the original, you answer by
// typing a letter.
//
// The screen goes through these steps:
//   ship      a ship in sight: attack (a) or flee (f)?
//   fog       a fog bank: investigate it (j/n)?
//   outcome   what was in the fog; a ship from the fog goes on to 'ship'
//   noBattle  stand-in until battles are made: the ship sails off
export class SeaEventScreen extends Screen {
  constructor(game, state, seaEvent) {
    super(game);
    this.state = state;
    this.step = seaEvent.kind; // 'ship' or 'fog'
    this.ship = seaEvent.ship ?? null;
    this.outcome = null;
  }

  update(dt) {
    const input = this.game.input;
    const typed = input.typedText().toLowerCase();

    if (this.step === 'ship') {
      if (typed.includes('a')) this.step = 'noBattle';
      else if (typed.includes('f')) {
        flee(this.state);
        this.backToSea();
      }
    } else if (this.step === 'fog') {
      if (typed.includes('j')) this.searchFog();
      else if (typed.includes('n')) this.backToSea();
    } else if (input.anyKeyPressed()) {
      if (this.step === 'outcome' && this.outcome.kind === 'ship') this.step = 'ship';
      else this.backToSea();
    }
  }

  searchFog() {
    this.outcome = investigateFog(this.state, this.game.events);
    if (this.outcome.kind === 'ship') this.ship = this.outcome.ship;
    this.step = 'outcome';
  }

  backToSea() {
    this.game.setScreen(new MapScreen(this.game, this.state));
  }

  render(ctx) {
    clearScreen(ctx);
    drawSeaEvent(ctx, {
      step: this.step,
      ship: this.ship,
      outcome: this.outcome,
      rank: rankTitle(this.state),
    });
    drawStatusPanel(ctx, this.state);
  }
}

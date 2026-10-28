import { Screen } from '../../engine/Screen.js';
import { breakOff, fire, moveAim, startBattle } from '../rules/battle.js';
import { clearScreen } from '../ui/draw.js';
import { drawBattle } from '../ui/battleView.js';
import { MapScreen } from './MapScreen.js';
import { SeaEventScreen } from './SeaEventScreen.js';

// How each aiming action moves the sights, as [elevation, side]. Up means
// aiming higher, which is a lower elevation number and a longer shot.
const AIM_ACTIONS = {
  aimUp: [-1, 0],
  aimDown: [1, 0],
  aimLeft: [0, -1],
  aimRight: [0, 1],
  aimUpLeft: [-1, -1],
  aimUpRight: [-1, 1],
  aimDownLeft: [1, -1],
  aimDownRight: [1, 1],
};

// A gun battle ("Sigte"). The screen has two steps:
//   aim     move the sights; fire, or break off the battle
//   result  where the shot landed and what the enemy hit; any key goes on
// If your ship is sunk, the shipSunk listener in main.js ends the game.
export class BattleScreen extends Screen {
  constructor(game, state, enemy) {
    super(game);
    this.state = state;
    this.battle = startBattle(enemy);
    this.step = 'aim';
    this.result = null;
  }

  update(dt) {
    const input = this.game.input;

    if (this.step === 'result') {
      if (input.anyKeyPressed()) this.afterShot();
      return;
    }

    for (const [action, [dElevation, dSide]] of Object.entries(AIM_ACTIONS)) {
      if (input.wasActionRepeated(action)) moveAim(this.battle, dElevation, dSide);
    }

    if (input.wasActionPressed('fire')) {
      this.result = fire(this.battle, this.state, this.game.events);
      this.step = 'result';
    } else if (input.wasActionPressed('breakOff')) {
      breakOff(this.battle);
      const seaEvent = { kind: 'ship', ship: this.battle.enemy };
      this.game.setScreen(new SeaEventScreen(this.game, this.state, seaEvent));
    }
  }

  afterShot() {
    if (this.result.outcome) this.game.setScreen(new MapScreen(this.game, this.state));
    else this.step = 'aim';
  }

  render(ctx) {
    clearScreen(ctx);
    drawBattle(ctx, {
      battle: this.battle,
      state: this.state,
      step: this.step,
      result: this.result,
    });
  }
}

import { Scene } from '../../engine/Scene.js';
import { breakOff, fire, moveAim, startBattle } from '../rules/battle.js';
import { clearScreen } from '../ui/draw.js';
import { drawBattle } from '../ui/battleView.js';
import { SeaEventScene } from './SeaEventScene.js';
import { VictoryScene } from './VictoryScene.js';

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

// A gun battle ("Sigte"). The scene has two steps:
//   aim     move the sights; fire, or break off the battle
//   result  where the shot landed and what the enemy hit; any key goes on
// If your ship is sunk, the gameOver listener in main.js ends the game.
export class BattleScene extends Scene {
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
      this.game.replaceScene(new SeaEventScene(this.game, this.state, seaEvent));
    }
  }

  afterShot() {
    const { outcome } = this.result;
    const enemy = this.battle.enemy;
    if (outcome === 'surrender') this.game.replaceScene(new VictoryScene(this.game, this.state, enemy));
    else if (outcome === 'sunk') this.game.popScene(); // back to the map
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

import { Scene } from '../../engine/Scene.js';
import { COLORS, FONT } from '../palette.js';
import { GameState } from '../GameState.js';
import { clearScreen } from '../ui/draw.js';
import { drawTitleArt } from '../ui/titleArt.js';
import { MapScene } from './MapScene.js';

// The title scene: a picture and "press any key to continue".
export class TitleScene extends Scene {
  enter() {
    this.time = 0;
  }

  update(dt) {
    this.time += dt;

    if (this.game.input.anyKeyPressed()) {
      this.game.setScene(new MapScene(this.game, new GameState()));
    }
  }

  render(ctx) {
    clearScreen(ctx);
    drawTitleArt(ctx);

    ctx.fillStyle = COLORS.white;
    ctx.font = `bold 20px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    const prompt = 'Tryk på en tast for at fortsætte!';
    ctx.fillText(prompt, 14, 470);

    // A blinking cursor after the text: on for half a second, off for half.
    if (Math.floor(this.time * 2) % 2 === 0) {
      const x = 14 + ctx.measureText(prompt).width + 6;
      ctx.fillRect(x, 462, 12, 8);
    }
  }
}

import { Scene } from '../../engine/Scene.js';
import { clearScreen } from '../ui/draw.js';
import { drawTitleArt, drawTitlePrompt } from '../ui/titleArt.js';
import { NameScene } from './NameScene.js';

// The title scene: a picture and "press any key to continue", on to the name
// question before a new game.
export class TitleScene extends Scene {
  enter() {
    this.time = 0;
    this.game.events.emit('titleShown', {});
  }

  update(dt) {
    this.time += dt;

    if (this.game.input.anyKeyPressed()) {
      this.game.setScene(new NameScene(this.game));
    }
  }

  render(ctx) {
    clearScreen(ctx);
    drawTitleArt(ctx);
    // A blinking cursor: on for half a second, off for half.
    drawTitlePrompt(ctx, Math.floor(this.time * 2) % 2 === 0);
  }
}

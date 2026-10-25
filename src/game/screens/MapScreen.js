import { Screen } from '../../engine/Screen.js';
import { COLORS, FONT } from '../palette.js';
import { TitleScreen } from './TitleScreen.js';

// Placeholder for the sailing map. For now it only proves that switching
// screens works: Esc takes you back to the title screen.
export class MapScreen extends Screen {
  update(dt) {
    if (this.game.input.wasPressed('Escape')) {
      this.game.setScreen(new TitleScreen(this.game));
    }
  }

  render(ctx) {
    ctx.fillStyle = COLORS.blue;
    ctx.fillRect(0, 0, this.game.width, this.game.height);

    ctx.fillStyle = COLORS.white;
    ctx.font = `bold 24px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Kortet kommer her...', this.game.width / 2, 220);
    ctx.font = `bold 18px ${FONT}`;
    ctx.fillText('Esc: tilbage til titelskærmen', this.game.width / 2, 260);
  }
}

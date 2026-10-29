import { Scene } from '../../engine/Scene.js';
import { rememberSound } from '../records.js';
import { clearScreen } from '../ui/draw.js';
import { drawSoundQuestion } from '../ui/soundView.js';
import { TitleScene } from './TitleScene.js';

// The first thing you see, as in the original: sound on or off? 0 for
// silence, 1 for sound; Enter keeps what you had last time. The choice is
// kept for next time, and F2 changes it later (see main.js). Then the title.
export class SoundScene extends Scene {
  update() {
    const input = this.game.input;
    const typed = input.typedText();

    if (typed.includes('0')) this.choose(false);
    else if (typed.includes('1')) this.choose(true);
    else if (input.wasActionPressed('confirm')) this.choose(this.game.sound.enabled);
  }

  choose(on) {
    this.game.sound.setEnabled(on);
    rememberSound(on);
    this.game.setScene(new TitleScene(this.game));
  }

  render(ctx) {
    clearScreen(ctx);
    drawSoundQuestion(ctx, this.game.sound.enabled);
  }
}

import { Scene } from '../../engine/Scene.js';
import { TextField } from '../../engine/TextField.js';
import { GameState } from '../GameState.js';
import { currentRecord, lastName, rememberName } from '../records.js';
import { clearScreen } from '../ui/draw.js';
import { drawName } from '../ui/nameView.js';
import { MapScene } from './MapScene.js';
import { TitleScene } from './TitleScene.js';

const MAX_NAME_LENGTH = 16; // so "Nå kommandørkaptajn <name>, ..." fits a line

// Before a new game: "Hvad er dit navn?", as in the original, with the record
// and who set it shown below. The last name used is ready in the field. A new
// game starts once you've given a name.
//
// The scene goes through two steps:
//   name      type your name; Enter to go on, leave to go back to the title
//   greeting  "OK, Ronnie."; any key and you're at sea
export class NameScene extends Scene {
  constructor(game) {
    super(game);
    this.field = new TextField({ maxLength: MAX_NAME_LENGTH, text: lastName() });
    this.record = currentRecord();
    this.step = 'name';
    this.state = null; // the new game, once you have a name
    this.time = 0; // for the blinking cursor
  }

  update(dt) {
    this.time += dt;
    const input = this.game.input;

    if (this.step === 'greeting') {
      if (input.anyKeyPressed()) this.game.setScene(new MapScene(this.game, this.state));
      return;
    }

    if (input.wasActionPressed('leave')) {
      this.game.setScene(new TitleScene(this.game));
      return;
    }
    this.field.type(input.typedText());
    if (input.wasActionRepeated('erase')) this.field.erase(); // held down, it keeps erasing

    const name = this.field.text.trim();
    if (input.wasActionPressed('confirm') && name !== '') {
      rememberName(name);
      this.state = new GameState(name);
      this.step = 'greeting';
    }
  }

  render(ctx) {
    clearScreen(ctx);
    drawName(ctx, {
      step: this.step,
      text: this.field.text,
      cursorOn: Math.floor(this.time * 2) % 2 === 0,
      name: this.state?.name,
      record: this.record,
    });
  }
}

import { Scene } from '../../engine/Scene.js';
import { HELP_TOPICS } from '../helpText.js';
import { clearScreen } from '../ui/draw.js';
import { drawHelpMenu, drawHelpPage } from '../ui/helpView.js';
import { EVENTS } from '../events.js';

// The help (F1). It opens on top of whatever you were doing, which waits,
// paused, until you close it (see main.js and Game.pushScene).
//
// The scene goes through two steps:
//   menu  choose a topic by typing its key; leave closes the help
//   page  read a topic a page at a time; any key for the next page, leave
//         for the menu; after the last page, back to the menu
export class HelpScene extends Scene {
  constructor(game) {
    super(game);
    this.topic = null;
    this.pageIndex = 0;
  }

  enter() {
    this.game.events.emit(EVENTS.helpOpened, {});
  }

  update(dt) {
    const input = this.game.input;

    if (!this.topic) {
      if (input.wasActionPressed('leave')) {
        this.game.popScene();
        return;
      }
      const typed = input.typedText();
      this.topic = HELP_TOPICS.find((topic) => typed.includes(topic.key)) ?? null;
      this.pageIndex = 0;
      return;
    }

    if (input.wasActionPressed('leave')) {
      this.topic = null;
    } else if (input.anyKeyPressed()) {
      this.pageIndex += 1;
      if (this.pageIndex >= this.topic.pages.length) this.topic = null;
    }
  }

  render(ctx) {
    clearScreen(ctx);
    if (this.topic) drawHelpPage(ctx, this.topic.pages[this.pageIndex]);
    else drawHelpMenu(ctx, HELP_TOPICS);
  }
}

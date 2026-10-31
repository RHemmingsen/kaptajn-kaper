import { Scene } from '../../engine/Scene.js';
import { NumberField } from '../../engine/NumberField.js';
import { rollPrices, buy, sell } from '../rules/trade.js';
import { checkCargo } from '../rules/ship.js';
import { collectPrizes } from '../rules/victory.js';
import { clearScreen } from '../ui/draw.js';
import { drawPort } from '../ui/portView.js';
import { drawStatusPanel } from '../ui/statusPanel.js';

// The menu, as in the original: type a number to choose.
const BUY_CHOICES = { 1: 'men', 2: 'repair', 3: 'guns', 4: 'grain' };
const SELL_CHOICE = '5';
const LEAVE_CHOICE = '6';
// What to sell: Korn, Skyts or Juveler.
const SELL_CHOICES = { k: 'grain', s: 'guns', j: 'jewels' };

// A port, reached by docking in the harbor. Trade, then set sail again. In
// the prize port (København), prizes you sent there are paid out first.
// As in the original, the cargo is checked whenever the menu comes up: on
// arrival, after you've seen the payout, and after each trade. Too much, and
// she sinks (the gameOver listener in main.js ends the game).
//
// The scene goes through these steps:
//   prizes    the prize crews and prize money waiting here; any key: menu
//   menu      choose 1-6
//   sellWhat  choose what to sell (k, s or j)
//   amount    type how many, Enter to trade, leave to change your mind
export class PortScene extends Scene {
  constructor(game, state, city) {
    super(game);
    this.state = state;
    this.city = city;
    this.prices = rollPrices(); // new prices every visit
    this.step = 'menu';
    this.prizes = null; // what was paid out on arrival, if anything
    this.trade = null; // { action: 'buy' | 'sell', good } while asking how many
    this.amount = new NumberField(4);
    this.message = null; // the outcome of the last trade
    this.time = 0; // for the blinking cursor
  }

  enter() {
    if (this.city.prizePort) this.prizes = collectPrizes(this.state);
    if (this.prizes) this.step = 'prizes';
    else this.showMenu();
  }

  // The menu comes up, and with it the check of the cargo.
  showMenu() {
    this.step = 'menu';
    checkCargo(this.state, this.game.events);
  }

  update(dt) {
    this.time += dt;
    const input = this.game.input;

    if (this.step === 'prizes') {
      if (input.anyKeyPressed()) this.showMenu();
    } else if (this.step === 'menu') this.updateMenu(input);
    else if (this.step === 'sellWhat') this.updateSellWhat(input);
    else this.updateAmount(input);
  }

  updateMenu(input) {
    if (input.wasActionPressed('leave')) {
      this.setSail();
      return;
    }
    for (const ch of input.typedText()) {
      if (BUY_CHOICES[ch]) {
        this.askAmount('buy', BUY_CHOICES[ch]);
        return;
      }
      if (ch === SELL_CHOICE) {
        this.step = 'sellWhat';
        this.message = null;
        return;
      }
      if (ch === LEAVE_CHOICE) {
        this.setSail();
        return;
      }
    }
  }

  updateSellWhat(input) {
    if (input.wasActionPressed('leave')) {
      this.step = 'menu';
      return;
    }
    for (const ch of input.typedText().toLowerCase()) {
      if (SELL_CHOICES[ch]) {
        this.askAmount('sell', SELL_CHOICES[ch]);
        return;
      }
    }
  }

  askAmount(action, good) {
    this.trade = { action, good };
    this.amount.clear();
    this.message = null;
    this.step = 'amount';
  }

  updateAmount(input) {
    if (input.wasActionPressed('leave')) {
      this.step = 'menu';
      return;
    }

    this.amount.type(input.typedText());
    if (input.wasActionRepeated('erase')) this.amount.erase(); // held down, it keeps erasing
    if (!input.wasActionPressed('confirm')) return;

    this.step = 'menu';
    const count = this.amount.value;
    if (count === null || count === 0) return; // nothing typed: changed their mind

    const { action, good } = this.trade;
    const trade = action === 'buy' ? buy : sell;
    const result = trade(this.state, this.prices, good, count, this.game.events);
    this.message = { action, result };
    this.showMenu();
  }

  // Back to the map, which waited below the harbor and the port.
  setSail() {
    this.game.popScene();
  }

  render(ctx) {
    clearScreen(ctx);
    drawPort(ctx, {
      city: this.city,
      prices: this.prices,
      step: this.step,
      trade: this.trade,
      amountText: this.amount.text,
      cursorOn: Math.floor(this.time * 2) % 2 === 0,
      message: this.message,
      jewels: this.state.jewels,
      prizes: this.prizes,
    });
    drawStatusPanel(ctx, this.state);
  }
}

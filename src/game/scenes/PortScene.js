import { Scene } from '../../engine/Scene.js';
import { NumberField } from '../../engine/NumberField.js';
import { rollPrices, buy, sell } from '../rules/trade.js';
import { clearScreen } from '../ui/draw.js';
import { drawPort } from '../ui/portView.js';
import { drawStatusPanel } from '../ui/statusPanel.js';
import { MapScene } from './MapScene.js';

// The menu, as in the original: type a number to choose.
const BUY_CHOICES = { 1: 'men', 2: 'repair', 3: 'guns', 4: 'grain' };
const SELL_CHOICE = '5';
const LEAVE_CHOICE = '6';
// What to sell: Korn, Skyts or Juveler.
const SELL_CHOICES = { k: 'grain', s: 'guns', j: 'jewels' };

// A port, reached by docking in the harbor. Trade, then set sail again.
//
// The scene goes through three steps:
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
    this.trade = null; // { action: 'buy' | 'sell', good } while asking how many
    this.amount = new NumberField(4);
    this.message = null; // the outcome of the last trade
    this.time = 0; // for the blinking cursor
  }

  update(dt) {
    this.time += dt;
    const input = this.game.input;

    if (this.step === 'menu') this.updateMenu(input);
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
    if (input.wasActionPressed('erase')) this.amount.erase();
    if (!input.wasActionPressed('confirm')) return;

    this.step = 'menu';
    const count = this.amount.value;
    if (count === null || count === 0) return; // nothing typed: changed their mind

    const { action, good } = this.trade;
    const trade = action === 'buy' ? buy : sell;
    const result = trade(this.state, this.prices, good, count);
    this.message = { action, result };
  }

  setSail() {
    this.game.setScene(new MapScene(this.game, this.state));
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
    });
    drawStatusPanel(ctx, this.state);
  }
}

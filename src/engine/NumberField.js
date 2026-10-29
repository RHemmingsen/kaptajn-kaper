// A whole number being typed in, like the answer to "Hvor mange?": a
// TextField that only accepts digits, with the number as `value`.
import { TextField } from './TextField.js';

export class NumberField extends TextField {
  constructor(maxDigits = 4) {
    super({ maxLength: maxDigits, accepts: (ch) => ch >= '0' && ch <= '9' });
  }

  // The number typed so far, or null if nothing is typed yet.
  get value() {
    return this.text === '' ? null : Number(this.text);
  }
}

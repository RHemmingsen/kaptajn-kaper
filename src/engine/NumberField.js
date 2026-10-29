// A whole number being typed in, like the answer to "Hvor mange?".
//
// It only holds the text and decides what's allowed (digits, up to a maximum
// length). It doesn't read the keyboard or draw anything; the scene feeds it
// typed text and draws it:
//
//   field.type(input.typedText());
//   if (input.wasActionPressed('erase')) field.erase();
//   if (input.wasActionPressed('confirm')) use(field.value);
export class NumberField {
  constructor(maxDigits = 4) {
    this.maxDigits = maxDigits;
    this.text = '';
  }

  // Add typed characters. Anything that isn't a digit is ignored, and so is
  // anything beyond maxDigits.
  type(characters) {
    for (const ch of characters) {
      if (ch >= '0' && ch <= '9' && this.text.length < this.maxDigits) this.text += ch;
    }
  }

  // Remove the last digit.
  erase() {
    this.text = this.text.slice(0, -1);
  }

  clear() {
    this.text = '';
  }

  // The number typed so far, or null if nothing is typed yet.
  get value() {
    return this.text === '' ? null : Number(this.text);
  }
}

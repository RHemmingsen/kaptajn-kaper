// Text being typed in, like a name.
//
// It only holds the text and decides what's allowed: which characters it
// accepts, and how many. It doesn't read the keyboard or draw anything; the
// scene feeds it typed text and draws it:
//
//   field.type(input.typedText());
//   if (input.wasActionPressed('erase')) field.erase();
//   if (input.wasActionPressed('confirm')) use(field.text);
export class TextField {
  // `accepts(ch)` says whether a typed character is allowed; anything else
  // is ignored. By default, any printable character is.
  constructor({ maxLength = 20, accepts = (ch) => ch >= ' ', text = '' } = {}) {
    this.maxLength = maxLength;
    this.accepts = accepts;
    this.text = '';
    this.type(text);
  }

  // Add typed characters, skipping any that aren't accepted, up to maxLength.
  type(characters) {
    for (const ch of characters) {
      if (this.accepts(ch) && this.text.length < this.maxLength) this.text += ch;
    }
  }

  // Remove the last character.
  erase() {
    this.text = this.text.slice(0, -1);
  }

  clear() {
    this.text = '';
  }
}

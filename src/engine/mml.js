// A reader for MML, the little music language of BASIC's PLAY statement
// (GW-BASIC and QBasic): "T120 L8 O3 CDEFG4". parseMml turns such a string
// into a list of notes that Sound can play:
//
//   [{ frequency, duration, sounding }, ...]
//
// `frequency` is in Hz, 0 for a rest. `duration` is how long the note takes
// in seconds, before the next one starts; `sounding` is how much of that the
// note is actually heard (see the M commands below).
//
// The language, as PLAY understands it:
//
//   C D E F G A B   a note in the current octave. Follow it with # or + for
//                   sharp, - for flat, then optionally a length (C8 is an
//                   eighth note) and dots (C4. is a dotted quarter).
//   N n             note number n, 1-84 counting semitones up from the lowest
//                   C; 0 is a rest.
//   P n             a pause (rest) of length n. Dots work here too.
//   O n             octave 0-6; O3 starts at middle C. The default is 4.
//   < >             one octave down / up.
//   L n             the length of notes that don't give their own: 1 whole,
//                   2 half, 4 quarter, ... 64. The default is 4.
//   T n             tempo, in quarter notes per minute. The default is 120.
//   MN ML MS        normal (heard 7/8 of its length), legato (all of it),
//                   staccato (3/4).
//   MF MB           play in the foreground / background. Meaningless here
//                   (we always play in the background), so skipped.
//
// Spaces are ignored and lowercase is fine. Anything else is an error, so a
// typo in a tune is found when it's read, not heard as something odd.

const SEMITONES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const ARTICULATION = { N: 7 / 8, L: 1, S: 3 / 4 };

export function parseMml(mml) {
  const reader = new Reader(mml.toUpperCase().replace(/\s+/g, ''));
  const notes = [];
  let octave = 4;
  let length = 4;
  let tempo = 120;
  let articulation = ARTICULATION.N;

  // How long a note of `noteLength` (4 = quarter) with `dots` lasts. One dot
  // adds half the note, two add half and a quarter.
  const seconds = (noteLength, dots) => (4 / noteLength) * (60 / tempo) * (2 - 0.5 ** dots);

  const play = (midi, noteLength, dots) => {
    const duration = seconds(noteLength, dots);
    notes.push({ frequency: midiToFrequency(midi), duration, sounding: duration * articulation });
  };
  const rest = (noteLength, dots) => {
    notes.push({ frequency: 0, duration: seconds(noteLength, dots), sounding: 0 });
  };

  while (!reader.done()) {
    const command = reader.next();

    if (command in SEMITONES) {
      let semitone = SEMITONES[command];
      if (reader.accept('#') || reader.accept('+')) semitone += 1;
      else if (reader.accept('-')) semitone -= 1;
      const noteLength = reader.number() ?? length;
      play(12 * octave + 24 + semitone, checkLength(noteLength, mml), reader.dots());
    } else if (command === 'N') {
      const n = reader.requireNumber(command);
      if (n > 84) throw new Error(`MML: note N${n} is out of range (0-84) in "${mml}"`);
      if (n === 0) rest(length, reader.dots());
      else play(n + 23, length, reader.dots());
    } else if (command === 'P') {
      rest(checkLength(reader.requireNumber(command), mml), reader.dots());
    } else if (command === 'O') {
      octave = reader.requireNumber(command);
      if (octave > 6) throw new Error(`MML: octave O${octave} is out of range (0-6) in "${mml}"`);
    } else if (command === '<') {
      octave = Math.max(0, octave - 1);
    } else if (command === '>') {
      octave = Math.min(6, octave + 1);
    } else if (command === 'L') {
      length = checkLength(reader.requireNumber(command), mml);
    } else if (command === 'T') {
      tempo = reader.requireNumber(command);
      if (tempo < 32 || tempo > 255) throw new Error(`MML: tempo T${tempo} is out of range (32-255) in "${mml}"`);
    } else if (command === 'M') {
      const mode = reader.next();
      if (mode in ARTICULATION) articulation = ARTICULATION[mode];
      else if (mode !== 'F' && mode !== 'B') throw new Error(`MML: unknown command M${mode} in "${mml}"`);
    } else {
      throw new Error(`MML: unknown command "${command}" in "${mml}"`);
    }
  }
  return notes;
}

export function midiToFrequency(midi) {
  return 440 * 2 ** ((midi - 69) / 12);
}

function checkLength(noteLength, mml) {
  if (noteLength < 1 || noteLength > 64) throw new Error(`MML: length ${noteLength} is out of range (1-64) in "${mml}"`);
  return noteLength;
}

// Walks through the string one character, number or run of dots at a time.
class Reader {
  constructor(text) {
    this.text = text;
    this.at = 0;
  }

  done() {
    return this.at >= this.text.length;
  }

  next() {
    return this.text[this.at++];
  }

  accept(char) {
    if (this.text[this.at] !== char) return false;
    this.at += 1;
    return true;
  }

  // The number at the current position, or null if there isn't one.
  number() {
    const digits = /^\d+/.exec(this.text.slice(this.at));
    if (!digits) return null;
    this.at += digits[0].length;
    return Number(digits[0]);
  }

  requireNumber(command) {
    const n = this.number();
    if (n === null) throw new Error(`MML: ${command} needs a number in "${this.text}"`);
    return n;
  }

  dots() {
    let count = 0;
    while (this.accept('.')) count += 1;
    return count;
  }
}

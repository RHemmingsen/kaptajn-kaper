import { parseMml } from './mml.js';

// How loud everything is. Square waves are harsh, so this is low.
const VOLUME = 0.08;

// Sound effects and music, made on the spot with the browser's Web Audio API:
// no sound files. It sounds like an old PC speaker on purpose: square waves,
// one note at a time.
//
//   sound.tone(440, 0.2)              a beep: frequency in Hz, seconds
//   sound.sweep(2000, 200, 0.5)       a beep sliding from one frequency to another
//   sound.noise(0.3)                  a hiss or a bang
//   sound.music('T120 L8 CDEFG')      a tune, in BASIC's PLAY language (mml.js)
//
// Each takes { delay } in seconds, to start later, and returns how long it
// lasts, so effects can be put one after another:
//
//   const t = sound.sweep(1600, 200, 0.8);
//   sound.sweep(2200, 800, 0.7, { delay: t });
//
// Effects can overlap. Music can't: a new tune stops the one playing.
//
// Browsers don't let a page make sound before the player has done something,
// like pressing a key. So the audio is set up at the first key press on
// `target` (the browser window normally); anything played before that is
// skipped. In Node, where there is no Web Audio, nothing is ever heard.
// `createContext` makes the AudioContext; tests pass a fake.
export class Sound {
  constructor(target = window, createContext = defaultContext) {
    this.createContext = createContext;
    this.context = null;
    this.enabled = true;
    this.playing = new Set(); // every sound scheduled and not yet finished
    this.tune = new Set(); // the notes of the music playing now
    target.addEventListener('keydown', () => this.unlock());
  }

  // Make the AudioContext if there isn't one yet, and wake it if the browser
  // put it to sleep.
  unlock() {
    this.context ??= this.createContext();
    if (this.context?.state === 'suspended') this.context.resume();
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) this.stopAll();
  }

  tone(frequency, duration, { delay = 0 } = {}) {
    return this.sweep(frequency, frequency, duration, { delay });
  }

  sweep(from, to, duration, { delay = 0 } = {}) {
    this.whenAudible(() => this.oscillator(from, to, delay, duration, this.playing));
    return duration;
  }

  noise(duration, { delay = 0 } = {}) {
    this.whenAudible(() => {
      const ctx = this.context;
      const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate);
      const samples = buffer.getChannelData(0);
      for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      this.schedule(source, delay, duration, this.playing);
    });
    return duration;
  }

  music(mml, { delay = 0 } = {}) {
    const notes = parseMml(mml);
    this.stopMusic();
    this.whenAudible(() => {
      let at = delay;
      for (const note of notes) {
        if (note.frequency > 0) this.oscillator(note.frequency, note.frequency, at, note.sounding, this.tune);
        at += note.duration;
      }
    });
    return notes.reduce((total, note) => total + note.duration, 0);
  }

  stopMusic() {
    stop(this.tune);
  }

  stopAll() {
    stop(this.tune);
    stop(this.playing);
  }

  // Runs `play` only if sound is on and the audio is set up.
  whenAudible(play) {
    if (this.enabled && this.context) play();
  }

  // A square wave starting `delay` seconds from now, sliding from one
  // frequency to the other over `duration` seconds.
  oscillator(from, to, delay, duration, group) {
    const osc = this.context.createOscillator();
    osc.type = 'square';
    const start = this.context.currentTime + delay;
    osc.frequency.setValueAtTime(from, start);
    if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, start + duration);
    this.schedule(osc, delay, duration, group);
  }

  // Connects a source to the speakers through a volume control, plays it
  // from `delay` for `duration` seconds, and keeps it in `group` until it
  // ends, so it can be stopped early.
  schedule(source, delay, duration, group) {
    const gain = this.context.createGain();
    gain.gain.value = VOLUME;
    source.connect(gain).connect(this.context.destination);
    const start = this.context.currentTime + delay;
    source.start(start);
    source.stop(start + duration);
    group.add(source);
    source.onended = () => group.delete(source);
  }
}

function stop(group) {
  for (const source of group) source.stop();
  group.clear();
}

function defaultContext() {
  return globalThis.AudioContext ? new AudioContext() : null;
}

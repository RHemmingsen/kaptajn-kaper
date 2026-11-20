import { parseMml } from './mml.js';

// How loud everything is. Square waves are harsh, so this is low.
const VOLUME = 0.08;

// The PC speaker: the voice everything is played with unless a game sets
// another (see setVoices).
const SPEAKER = Object.freeze({ wave: 'square', volume: VOLUME });

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
// Effects and music each have a voice: how their sounds are made. Both start
// as the PC speaker, and a game can give them others:
//
//   sound.setVoices({
//     effects: { wave: 'triangle' },
//     music: { wave: 'sawtooth', filter: 1800, echo: { delay: 0.22, feedback: 0.35 } },
//   });
//
//   wave     'square' (the default), 'sawtooth', 'triangle' or 'sine'
//   volume   0..1; VOLUME by default
//   filter   a low-pass filter's cutoff, in Hz: lets the low notes through
//            and dulls the bright edge of a sawtooth (none by default)
//   echo     { delay, feedback }: each sound comes back `delay` seconds later,
//            `feedback` times as loud, again and again (none by default)
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
    this.voices = { effects: SPEAKER, music: SPEAKER };
    this.outputs = new Map(); // voice name -> the node its sounds go into
    target.addEventListener('keydown', () => this.unlock());
  }

  // Make the AudioContext if there isn't one yet, and wake it if the browser
  // put it to sleep.
  unlock() {
    this.context ??= this.createContext();
    if (this.context?.state === 'suspended') this.context.resume();
  }

  // Give effects and music voices of their own. What isn't given stays as the
  // PC speaker's.
  setVoices({ effects, music } = {}) {
    this.voices = { effects: { ...SPEAKER, ...effects }, music: { ...SPEAKER, ...music } };
    this.outputs.clear();
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) this.stopAll();
  }

  tone(frequency, duration, { delay = 0 } = {}) {
    return this.sweep(frequency, frequency, duration, { delay });
  }

  sweep(from, to, duration, { delay = 0 } = {}) {
    this.whenAudible(() => this.oscillator(from, to, delay, duration, this.playing, 'effects'));
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
      this.schedule(source, delay, duration, this.playing, 'effects');
    });
    return duration;
  }

  music(mml, { delay = 0 } = {}) {
    const notes = parseMml(mml);
    this.stopMusic();
    this.whenAudible(() => {
      let at = delay;
      for (const note of notes) {
        if (note.frequency > 0) this.oscillator(note.frequency, note.frequency, at, note.sounding, this.tune, 'music');
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

  // A wave in the voice's shape, starting `delay` seconds from now, sliding
  // from one frequency to the other over `duration` seconds.
  oscillator(from, to, delay, duration, group, voice) {
    const osc = this.context.createOscillator();
    osc.type = this.voices[voice].wave;
    const start = this.context.currentTime + delay;
    osc.frequency.setValueAtTime(from, start);
    if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, start + duration);
    this.schedule(osc, delay, duration, group, voice);
  }

  // Connects a source to the voice's output through a volume control, plays
  // it from `delay` for `duration` seconds, and keeps it in `group` until it
  // ends, so it can be stopped early.
  schedule(source, delay, duration, group, voice) {
    const gain = this.context.createGain();
    gain.gain.value = this.voices[voice].volume;
    source.connect(gain).connect(this.output(voice));
    const start = this.context.currentTime + delay;
    source.start(start);
    source.stop(start + duration);
    group.add(source);
    source.onended = () => group.delete(source);
  }

  // Where a voice's sounds go: through its filter and echo, if it has them, to
  // the speakers. Built once per voice, the first time it's needed, and shared
  // by all its sounds, so an echo carries on after the note that made it.
  output(name) {
    if (this.outputs.has(name)) return this.outputs.get(name);
    const ctx = this.context;
    const voice = this.voices[name];
    let node = ctx.destination;
    if (voice.echo) {
      // The sound goes straight on, and also round a loop: delayed, made
      // quieter, delayed again...
      const bus = ctx.createGain();
      const delay = ctx.createDelay(1);
      const feedback = ctx.createGain();
      delay.delayTime.value = voice.echo.delay;
      feedback.gain.value = voice.echo.feedback;
      bus.connect(ctx.destination);
      bus.connect(delay);
      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(ctx.destination);
      node = bus;
    }
    if (voice.filter) {
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = voice.filter;
      filter.connect(node);
      node = filter;
    }
    this.outputs.set(name, node);
    return node;
  }
}

function stop(group) {
  for (const source of group) source.stop();
  group.clear();
}

function defaultContext() {
  return globalThis.AudioContext ? new AudioContext() : null;
}

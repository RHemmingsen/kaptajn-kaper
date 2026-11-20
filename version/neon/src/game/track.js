// The title track: the original's title tune as an EDM track, with a
// build-up and a drop. The engine plays it (Sound.playTrack); this file says
// what's in it.
//
//   intro     bars 1-4   the tune behind a closed filter, hi-hats, a soft clap
//   build-up  bars 5-8   the filter opens, a snare roll gets faster, a riser
//                        climbs; the last beat is almost silent
//   drop      bar 9 on   a boom and a crash, then a hard kick on every beat,
//                        sub bass, an off-beat bass, claps, the full lead
//
// The tune is the original's notes, at 128 BPM instead of 230, and legato,
// on a supersaw lead (four sawtooths a little out of tune with each other).
// The bass follows the tune: the note playing at each beat, low down. Lead
// and bass "pump": they dip on every kick and swell back (sidechain).
//
// It comes in two parts. compose() is the score: which sound plays when,
// as plain data that tests can read. TITLE_TRACK.play turns the score into
// sound with Web Audio. (A sequencer: the pattern apart from the
// instruments.)
import { parseMml } from 'engine/mml.js';
import { TITLE } from './music.js';

const BPM = 128;
export const BEAT = 60 / BPM;
export const BAR = 4 * BEAT;
const STEP = BEAT / 4; // a sixteenth: the drum grid

// When each part starts, in seconds from the beginning.
export const SECTIONS = { intro: 0, build: 4 * BAR, drop: 8 * BAR };

// --- The score -------------------------------------------------------------

// Every sound in the track, in order of when it's made:
//   { duration, events: [{ time, sound, ...what that sound needs }] }
// where sound is 'lead', 'kick', 'snare', 'clap', 'hat', 'openHat', 'bass',
// 'sub', 'duck' (the pump), 'riser' or 'impact'.
export function compose(mml = TITLE) {
  // At 128 BPM, legato: every tempo becomes 128, staccato and normal become legato.
  const notes = parseMml(mml.replace(/T\d+/gi, `T${BPM}`).replace(/MS|MN/gi, 'ML'));
  const duration = notes.reduce((total, note) => total + note.duration, 0);
  const { build, drop } = SECTIONS;
  const events = [];

  let at = 0;
  for (const note of notes) {
    if (note.frequency > 0) events.push({ time: at, sound: 'lead', frequency: note.frequency, length: note.sounding });
    at += note.duration;
  }

  for (let i = 0; i * STEP < duration; i++) {
    const time = i * STEP;
    const step = i % 16; // the sixteenth in the bar
    const offBeat = step % 4 === 2;
    const backBeat = step === 4 || step === 12; // beats 2 and 4
    const accent = step % 2 === 0;

    if (time < build) {
      events.push({ time, sound: 'hat', level: accent ? 0.035 : 0.02 });
      if (backBeat) events.push({ time, sound: 'clap', level: 0.5 });
    } else if (time < drop) {
      events.push({ time, sound: 'hat', level: accent ? 0.05 : 0.03 });
      if (time < drop - BEAT) events.push(...roll(i, time));
    } else {
      if (step % 4 === 0) {
        events.push({ time, sound: 'kick' }, { time, sound: 'duck' });
        events.push({ time, sound: 'sub', frequency: low(noteAt(notes, time), 55) });
      }
      if (backBeat) events.push({ time, sound: 'clap', level: 1 });
      if (offBeat) {
        events.push({ time, sound: 'openHat' });
        events.push({ time, sound: 'bass', frequency: low(noteAt(notes, time), 98) });
      }
      events.push({ time, sound: 'hat', level: accent ? 0.05 : 0.03 });
    }
  }

  events.push({ time: build, sound: 'riser', length: drop - BEAT - build });
  events.push({ time: drop, sound: 'impact' });
  events.sort((a, b) => a.time - b.time);
  return { duration, events: events.filter((event) => event.frequency !== 0) };
}

// The snare roll in the build-up, louder and louder: quarter notes in its
// first bar, eighths in the second, sixteenths in the third, 32nds in the last.
function roll(i, time) {
  const { build, drop } = SECTIONS;
  const bar = Math.floor((time - build) / BAR); // 0 to 3
  const every = [4, 2, 1, 1][bar]; // in sixteenths
  const level = 0.25 + 0.6 * ((time - build) / (drop - build));
  const hits = [];
  if (i % every === 0) hits.push({ time, sound: 'snare', level });
  if (bar === 3) hits.push({ time: time + STEP / 2, sound: 'snare', level });
  return hits;
}

// The tune's note sounding at `time` (the last one, through a rest); 0 if
// none has played yet.
function noteAt(notes, time) {
  let at = 0;
  let frequency = 0;
  for (const note of notes) {
    if (at > time) break;
    if (note.frequency > 0) frequency = note.frequency;
    at += note.duration;
  }
  return frequency;
}

// The same note, octaves down until it's no higher than `ceiling` Hz.
function low(frequency, ceiling) {
  let f = frequency;
  while (f > ceiling) f /= 2;
  return f;
}

// --- The sound -------------------------------------------------------------

const SCORE = compose();

export const TITLE_TRACK = {
  duration: SCORE.duration,
  play(context, output, start) {
    const mix = mixer(context, output, start);
    for (const event of SCORE.events) INSTRUMENTS[event.sound](context, mix, start + event.time, event);
  },
};

// Where the sounds go. Everything ends in `master`, which falls almost silent
// for the beat before the drop, then through a compressor (to glue the mix)
// and a limiter (so the drop can't clip) at a level that leaves room for the
// game's sound effects on top. The lead goes through a filter that opens
// over the build-up and an echo; lead and bass through the pump.
function mixer(context, output, start) {
  const { build, drop } = SECTIONS;
  const level = context.createGain();
  level.gain.value = 0.35;
  level.connect(output);
  const limiter = compressor(context, -3, 20, 0.001, 0.05);
  limiter.connect(level);
  const glue = compressor(context, -16, 4, 0.003, 0.12);
  glue.connect(limiter);

  const master = context.createGain();
  master.connect(glue);
  const gap = start + drop - BEAT;
  master.gain.setValueAtTime(1, gap);
  master.gain.linearRampToValueAtTime(0.08, gap + 0.03);
  master.gain.setValueAtTime(0.08, start + drop - 0.01);
  master.gain.linearRampToValueAtTime(1, start + drop);

  const pump = context.createGain();
  pump.connect(master);

  const leadFilter = context.createBiquadFilter();
  leadFilter.type = 'lowpass';
  leadFilter.Q.value = 3;
  leadFilter.frequency.setValueAtTime(500, start);
  leadFilter.frequency.setValueAtTime(500, start + build);
  leadFilter.frequency.exponentialRampToValueAtTime(7000, gap);
  leadFilter.frequency.setValueAtTime(3600, start + drop);
  leadFilter.connect(echo(context, pump, BEAT * 0.75, 0.3)); // a dotted-eighth echo

  return { master, pump, lead: leadFilter };
}

const INSTRUMENTS = {
  // Supersaw: four sawtooths, a little out of tune with each other.
  lead(context, mix, t, { frequency, length }) {
    const gain = context.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.06, t + 0.01);
    gain.gain.setValueAtTime(0.06, t + Math.max(0.02, length - 0.03));
    gain.gain.linearRampToValueAtTime(0, t + length);
    gain.connect(mix.lead);
    for (const cents of [-16, -5, 5, 16]) {
      const saw = oscillator(context, 'sawtooth', frequency, cents);
      saw.connect(gain);
      play(saw, t, length + 0.01);
    }
  },

  // A hard kick: a sine diving from 180 to 46 Hz, held a moment, driven into
  // a soft clipper for punch, with a click of noise on top.
  kick(context, mix, t) {
    const sine = oscillator(context, 'sine', 180);
    glide(sine, 180, 46, t, 0.07);
    const gain = envelope(context, t, 1, 0.42, 0.06);
    const drive = context.createWaveShaper();
    drive.curve = softClip(3);
    const out = context.createGain();
    out.gain.value = 0.75;
    sine.connect(gain).connect(drive).connect(out).connect(mix.master);
    play(sine, t, 0.45);
    noiseHit(context, mix.master, t, 0.25, 'highpass', 2500, 0.012);
  },

  // Snare: a burst of bright noise and a short tone.
  snare(context, mix, t, { level }) {
    noiseHit(context, mix.master, t, 0.3 * level, 'highpass', 1500, 0.12);
    const tone = oscillator(context, 'sine', 200);
    tone.connect(envelope(context, t, 0.2 * level, 0.07)).connect(mix.master);
    play(tone, t, 0.08);
  },

  // Clap: three quick bursts of mid noise, then a short tail.
  clap(context, mix, t, { level }) {
    const source = noise(context, 0.3);
    const filter = context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1500;
    filter.Q.value = 0.8;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0, t);
    for (const d of [0, 0.012, 0.024]) {
      gain.gain.setValueAtTime(0.4 * level, t + d);
      gain.gain.exponentialRampToValueAtTime(0.06 * level, t + d + 0.011);
    }
    gain.gain.setValueAtTime(0.22 * level, t + 0.036);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
    source.connect(filter).connect(gain).connect(mix.master);
    play(source, t, 0.3);
  },

  hat(context, mix, t, { level }) {
    noiseHit(context, mix.master, t, level, 'highpass', 9000, 0.03);
  },

  openHat(context, mix, t) {
    noiseHit(context, mix.master, t, 0.08, 'highpass', 7500, 0.15);
  },

  // Off-beat bass: two sawtooths, a filter closing on each note.
  bass(context, mix, t, { frequency }) {
    const length = BEAT * 0.45;
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = 4;
    filter.frequency.setValueAtTime(2200, t);
    filter.frequency.exponentialRampToValueAtTime(250, t + length);
    filter.connect(envelope(context, t, 0.22, length)).connect(mix.pump);
    for (const cents of [-12, 12]) {
      const saw = oscillator(context, 'sawtooth', frequency, cents);
      saw.connect(filter);
      play(saw, t, length);
    }
  },

  // Sub bass: a sine under each beat, swelling in after the kick.
  sub(context, mix, t, { frequency }) {
    const sine = oscillator(context, 'sine', frequency);
    const gain = context.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.35, t + BEAT * 0.3);
    gain.gain.linearRampToValueAtTime(0, t + BEAT * 0.95);
    sine.connect(gain).connect(mix.master);
    play(sine, t, BEAT);
  },

  // The pump: lead and bass down to 15% on the kick, back up just before the next.
  duck(context, mix, t) {
    mix.pump.gain.setValueAtTime(0.15, t);
    mix.pump.gain.linearRampToValueAtTime(1, t + BEAT * 0.85);
  },

  // The riser over the build-up: noise through a filter sweeping up, and a
  // sawtooth climbing three octaves, both getting louder.
  riser(context, mix, t, { length }) {
    const end = t + length;
    const source = noise(context, length);
    const filter = context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 4;
    filter.frequency.setValueAtTime(300, t);
    filter.frequency.exponentialRampToValueAtTime(9000, end);
    source.connect(filter).connect(swell(context, t, end, 0.5)).connect(mix.master);
    play(source, t, length);
    const saw = oscillator(context, 'sawtooth', 110);
    glide(saw, 110, 880, t, length);
    const dull = context.createBiquadFilter();
    dull.type = 'lowpass';
    dull.frequency.value = 2500;
    saw.connect(dull).connect(swell(context, t, end, 0.08)).connect(mix.master);
    play(saw, t, length);
  },

  // The drop: a deep boom and a crash.
  impact(context, mix, t) {
    const boom = oscillator(context, 'sine', 70);
    glide(boom, 70, 28, t, 1.2);
    boom.connect(envelope(context, t, 0.9, 1.4)).connect(mix.master);
    play(boom, t, 1.5);
    noiseHit(context, mix.master, t, 0.35, 'highpass', 4500, 1.8);
  },
};

// --- Building blocks ---------------------------------------------------------

function oscillator(context, type, frequency, cents = 0) {
  const node = context.createOscillator();
  node.type = type;
  node.frequency.value = frequency;
  node.detune.value = cents;
  return node;
}

// Slide an oscillator from one frequency to another, starting at t. (A ramp
// runs from the last value set at a time, so set the start at t first.)
function glide(node, from, to, t, length) {
  node.frequency.setValueAtTime(from, t);
  node.frequency.exponentialRampToValueAtTime(to, t + length);
}

function play(source, t, length) {
  source.start(t);
  source.stop(t + length);
}

// A gain at `peak` from t, held for `hold` seconds, fading out by t + length.
function envelope(context, t, peak, length, hold = 0) {
  const gain = context.createGain();
  gain.gain.setValueAtTime(peak, t);
  if (hold) gain.gain.setValueAtTime(peak, t + hold);
  gain.gain.exponentialRampToValueAtTime(0.001, t + length);
  return gain;
}

// A gain growing from nothing to `peak` between t and end.
function swell(context, t, end, peak) {
  const gain = context.createGain();
  gain.gain.setValueAtTime(0.001, t);
  gain.gain.exponentialRampToValueAtTime(peak, end);
  return gain;
}

// A short hit of filtered noise: hats, the kick's click, the crash.
function noiseHit(context, out, t, level, type, frequency, length) {
  const source = noise(context, length + 0.02);
  const filter = context.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = frequency;
  source.connect(filter).connect(envelope(context, t, level, length)).connect(out);
  play(source, t, length + 0.02);
}

function noise(context, seconds) {
  const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * seconds), context.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
  const source = context.createBufferSource();
  source.buffer = buffer;
  return source;
}

function compressor(context, threshold, ratio, attack, release) {
  const node = context.createDynamicsCompressor();
  node.threshold.value = threshold;
  node.ratio.value = ratio;
  node.attack.value = attack;
  node.release.value = release;
  return node;
}

// The curve for the kick's drive: tanh, which squashes peaks smoothly.
function softClip(amount) {
  const curve = new Float32Array(1024);
  for (let i = 0; i < curve.length; i++) {
    const x = (i / (curve.length - 1)) * 2 - 1;
    curve[i] = Math.tanh(amount * x) / Math.tanh(amount);
  }
  return curve;
}

function echo(context, out, time, feedback) {
  const bus = context.createGain();
  const delay = context.createDelay(2);
  const loop = context.createGain();
  delay.delayTime.value = time;
  loop.gain.value = feedback;
  bus.connect(out);
  bus.connect(delay);
  delay.connect(loop);
  loop.connect(delay);
  delay.connect(out);
  return bus;
}

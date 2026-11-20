// Tests for Sound, with a fake AudioContext that writes down what it's asked
// to play instead of playing it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Sound } from '../src/Sound.js';

class FakeContext {
  constructor() {
    this.currentTime = 10;
    this.sampleRate = 1000;
    this.state = 'running';
    this.destination = {};
    this.started = []; // { type, frequency, start, stop }
    this.gains = []; // every volume control, with what it was connected to
    this.filters = [];
    this.delays = [];
  }

  createOscillator() {
    const node = this.node('square');
    node.frequency = {
      setValueAtTime: (value) => { node.log.frequency = value; },
      exponentialRampToValueAtTime: (value) => { node.log.to = value; },
    };
    return node;
  }

  createBufferSource() {
    return this.node('noise');
  }

  createBuffer(channels, length) {
    const data = new Float32Array(length);
    return { getChannelData: () => data };
  }

  createGain() {
    const gain = {
      gain: {},
      connectedTo: [],
      connect: (next) => { gain.connectedTo.push(next); return next; },
      disconnect: () => { gain.disconnected = true; },
    };
    this.gains.push(gain);
    return gain;
  }

  createBiquadFilter() {
    const filter = { frequency: {}, connect: (next) => next };
    this.filters.push(filter);
    return filter;
  }

  createDelay() {
    const delay = { delayTime: {}, connect: (next) => next };
    this.delays.push(delay);
    return delay;
  }

  node(type) {
    const log = { type };
    const node = {
      log,
      connect: (next) => next,
      // An oscillator's wave is set after it's made; write down what it is.
      start: (at) => { log.type = node.type ?? log.type; log.start = at; this.started.push(log); },
      // stop() with no time means stop now, before its time.
      stop: (at) => {
        if (at === undefined) log.stoppedEarly = true;
        else log.stop = at;
      },
    };
    return node;
  }
}

function setup() {
  const keys = new EventTarget();
  const context = new FakeContext();
  const sound = new Sound(keys, () => context);
  const pressKey = () => keys.dispatchEvent(new Event('keydown'));
  return { sound, context, pressKey };
}

test('nothing is played before the first key press', () => {
  const { sound, context, pressKey } = setup();
  sound.tone(440, 0.2);
  assert.equal(context.started.length, 0);
  pressKey();
  sound.tone(440, 0.2);
  assert.equal(context.started.length, 1);
});

test('without Web Audio (as in Node), playing does nothing and does not crash', () => {
  const keys = new EventTarget();
  const sound = new Sound(keys);
  keys.dispatchEvent(new Event('keydown'));
  sound.tone(440, 0.2);
  sound.noise(0.1);
  assert.equal(sound.music('CDE'), 1.5);
});

test('a tone starts after its delay and lasts its duration', () => {
  const { sound, context, pressKey } = setup();
  pressKey();
  const length = sound.tone(440, 0.2, { delay: 1 });
  assert.equal(length, 0.2);
  assert.deepEqual(context.started, [{ type: 'square', frequency: 440, start: 11, stop: 11.2 }]);
});

test('a sweep slides from one frequency to the other', () => {
  const { sound, context, pressKey } = setup();
  pressKey();
  sound.sweep(2000, 200, 0.5);
  assert.deepEqual(context.started, [{ type: 'square', frequency: 2000, to: 200, start: 10, stop: 10.5 }]);
});

test('noise is played for its duration', () => {
  const { sound, context, pressKey } = setup();
  pressKey();
  sound.noise(0.3);
  assert.deepEqual(context.started, [{ type: 'noise', start: 10, stop: 10.3 }]);
});

test('music plays its notes one after another, skips rests, and returns its length', () => {
  const { sound, context, pressKey } = setup();
  pressKey();
  const length = sound.music('T60 ML O3A P4 A');
  assert.equal(length, 3);
  assert.deepEqual(context.started.map(({ start, stop }) => [start, stop]), [[10, 11], [12, 13]]);
});

test('a new tune stops the one playing; effects keep going', () => {
  const { sound, context, pressKey } = setup();
  pressKey();
  sound.music('CDE');
  sound.tone(100, 5);
  sound.music('C');
  const stoppedEarly = context.started.map((note) => note.stoppedEarly === true);
  assert.deepEqual(stoppedEarly, [true, true, true, false, false]);
});

test('turning sound off stops everything, and nothing more is played until it is on again', () => {
  const { sound, context, pressKey } = setup();
  pressKey();
  sound.tone(440, 5);
  sound.setEnabled(false);
  assert.equal(context.started[0].stoppedEarly, true);
  sound.tone(440, 1);
  assert.equal(context.started.length, 1);
  sound.setEnabled(true);
  sound.tone(440, 1);
  assert.equal(context.started.length, 2);
});

test('a key press wakes a context the browser put to sleep', () => {
  const { context, pressKey } = setup();
  let resumed = 0;
  context.state = 'suspended';
  context.resume = () => { resumed += 1; };
  pressKey();
  assert.equal(resumed, 1);
});

test('effects and music sound like the PC speaker until a game gives them voices', () => {
  const { sound, context, pressKey } = setup();
  pressKey();
  sound.tone(440, 0.1);
  sound.music('C');
  assert.deepEqual(context.started.map((note) => note.type), ['square', 'square']);
  assert.ok(context.gains.every((gain) => gain.connectedTo[0] === context.destination), 'straight to the speakers');
  assert.equal(context.filters.length + context.delays.length, 0);
});

test('effects and music can have voices of their own', () => {
  const { sound, context, pressKey } = setup();
  pressKey();
  sound.setVoices({ effects: { wave: 'triangle' }, music: { wave: 'sawtooth' } });
  sound.tone(440, 0.1);
  sound.music('C');
  assert.deepEqual(context.started.map((note) => note.type), ['triangle', 'sawtooth']);
});

test('a voice can have a low-pass filter and an echo, made once and shared by its notes', () => {
  const { sound, context, pressKey } = setup();
  pressKey();
  sound.setVoices({ music: { wave: 'sawtooth', filter: 1800, echo: { delay: 0.2, feedback: 0.3 } } });
  sound.music('CDE');
  assert.equal(context.filters.length, 1);
  assert.equal(context.filters[0].type, 'lowpass');
  assert.equal(context.filters[0].frequency.value, 1800);
  assert.equal(context.delays.length, 1);
  assert.equal(context.delays[0].delayTime.value, 0.2);
  // Each note's volume control leads into the filter, not straight out.
  const notes = context.gains.filter((gain) => gain.connectedTo[0] === context.filters[0]);
  assert.equal(notes.length, 3);
  sound.tone(440, 0.1); // effects keep the PC speaker
  assert.equal(context.gains.at(-1).connectedTo[0], context.destination);
});

// A track that writes down what it's asked to do.
function fakeTrack(duration = 32) {
  const calls = [];
  return { calls, duration, play: (context, output, start) => calls.push({ context, output, start }) };
}

test('a track plays into an output of its own, from its start, and gives its length', () => {
  const { sound, context, pressKey } = setup();
  pressKey();
  const track = fakeTrack();
  assert.equal(sound.playTrack(track, { delay: 2 }), 32);
  assert.equal(track.calls.length, 1);
  const { context: given, output, start } = track.calls[0];
  assert.equal(given, context);
  assert.deepEqual(output.connectedTo, [context.destination]);
  assert.equal(start, 12); // currentTime 10, plus the delay
});

test('a track is not played before the first key press, or with sound off', () => {
  const { sound, pressKey } = setup();
  const before = fakeTrack();
  sound.playTrack(before);
  pressKey();
  sound.setEnabled(false);
  const off = fakeTrack();
  sound.playTrack(off);
  assert.equal(before.calls.length + off.calls.length, 0);
});

test('a new tune, or sound turned off, cuts a track off', () => {
  const { sound, pressKey } = setup();
  pressKey();
  const first = fakeTrack();
  sound.playTrack(first);
  sound.music('C');
  assert.equal(first.calls[0].output.disconnected, true);
  const second = fakeTrack();
  sound.playTrack(second);
  sound.setEnabled(false);
  assert.equal(second.calls[0].output.disconnected, true);
});

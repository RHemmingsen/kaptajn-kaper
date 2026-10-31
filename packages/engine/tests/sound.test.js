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
    return { gain: {}, connect: (next) => next };
  }

  node(type) {
    const log = { type };
    return {
      log,
      connect: (next) => next,
      start: (at) => { log.start = at; this.started.push(log); },
      // stop() with no time means stop now, before its time.
      stop: (at) => {
        if (at === undefined) log.stoppedEarly = true;
        else log.stop = at;
      },
    };
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

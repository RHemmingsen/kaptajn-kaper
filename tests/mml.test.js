import { test } from 'node:test';
import assert from 'node:assert/strict';
import { midiToFrequency, parseMml } from '../src/engine/mml.js';

const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-6, `${actual} is not ${expected}`);
const frequencies = (mml) => parseMml(mml).map((note) => Math.round(note.frequency * 100) / 100);
const durations = (mml) => parseMml(mml).map((note) => note.duration);

test('A in octave 3 is 440 Hz, and O3 starts at middle C', () => {
  assert.deepEqual(frequencies('O3A'), [440]);
  near(parseMml('O3C')[0].frequency, midiToFrequency(60));
});

test('the default octave is 4', () => {
  assert.deepEqual(frequencies('A'), [880]);
});

test('sharps (# or +) and flats (-) move a semitone', () => {
  const [a, aSharp, aPlus, bFlat] = parseMml('O3A A# A+ B-');
  near(aSharp.frequency, a.frequency * 2 ** (1 / 12));
  near(aPlus.frequency, aSharp.frequency);
  near(bFlat.frequency, aSharp.frequency);
});

test('< and > change the octave, and stay inside 0-6', () => {
  assert.deepEqual(frequencies('O3A>A<<A'), [440, 880, 220]);
  near(parseMml('O0<C')[0].frequency, parseMml('O0C')[0].frequency);
  near(parseMml('O6>C')[0].frequency, parseMml('O6C')[0].frequency);
});

test('N counts semitones from the lowest C, and N0 is a rest', () => {
  near(parseMml('N1')[0].frequency, parseMml('O0C')[0].frequency);
  near(parseMml('N46')[0].frequency, 440);
  assert.equal(parseMml('N0')[0].frequency, 0);
});

test('at the default tempo 120 and length 4, a note lasts half a second', () => {
  assert.deepEqual(durations('C'), [0.5]);
});

test('a note can give its own length; L changes the default', () => {
  assert.deepEqual(durations('C8 C L2 C C1'), [0.25, 0.5, 1, 2]);
});

test('T is quarter notes per minute', () => {
  assert.deepEqual(durations('T60C T240C'), [1, 0.25]);
});

test('a dot adds half the note, two dots half and a quarter', () => {
  assert.deepEqual(durations('C4. C4.. L2C.'), [0.75, 0.875, 1.5]);
});

test('P is a rest of the given length', () => {
  assert.deepEqual(parseMml('P8'), [{ frequency: 0, duration: 0.25, sounding: 0 }]);
  assert.deepEqual(durations('P4.'), [0.75]);
});

test('MN sounds 7/8 of a note, ML all of it, MS 3/4; MN is the default', () => {
  const sounding = parseMml('C MLC MSC MNC').map((note) => note.sounding);
  assert.deepEqual(sounding, [0.4375, 0.5, 0.375, 0.4375]);
});

test('MB and MF are skipped, spaces are ignored, lowercase works', () => {
  assert.deepEqual(parseMml('mb t60 o3 a mf'), parseMml('T60O3A'));
});

test('mistakes are errors, not strange sounds', () => {
  assert.throws(() => parseMml('H'), /unknown command "H"/);
  assert.throws(() => parseMml('MX'), /unknown command MX/);
  assert.throws(() => parseMml('O7'), /octave/);
  assert.throws(() => parseMml('C65'), /length/);
  assert.throws(() => parseMml('T10'), /tempo/);
  assert.throws(() => parseMml('L'), /needs a number/);
});

test('the original title tune can be read', () => {
  const notes = parseMml('T230L8MBMSCO3BO4C4O3CP8C4GFEGO4CP8CEDCD4O3D4D4O4D');
  assert.equal(notes.length, 20);
});

// Tests for the title track's score: which sound plays when. (How each one
// sounds is Web Audio, heard in the browser, not here.)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseMml } from 'engine/mml.js';
import { TITLE } from '../src/game/music.js';
import { BAR, BEAT, SECTIONS, compose, TITLE_TRACK } from '../src/game/track.js';

const { events, duration } = compose();
const { build, drop } = SECTIONS;
const of = (sound) => events.filter((event) => event.sound === sound);
const near = (a, b) => Math.abs(a - b) < 1e-9;

test('the tune is the original title tune, every note, at 128 BPM', () => {
  const original = parseMml(TITLE).filter((note) => note.frequency > 0);
  const lead = of('lead');
  assert.equal(lead.length, original.length);
  assert.deepEqual(lead.map((note) => note.frequency), original.map((note) => note.frequency));
  assert.equal(lead[0].time, 0);
  // 230 BPM slowed to 128: about 1.8 times as long.
  const originalLength = parseMml(TITLE).reduce((total, note) => total + note.duration, 0);
  assert.ok(Math.abs(duration - originalLength * 230 / 128) < 0.01);
  assert.equal(TITLE_TRACK.duration, duration);
});

test('the build-up starts after four bars, the drop after eight', () => {
  assert.ok(near(build, 4 * BAR) && near(drop, 8 * BAR));
  assert.ok(near(of('riser')[0].time, build));
  assert.ok(near(of('impact')[0].time, drop));
});

test('no kick, bass or sub before the drop; after it, a kick on every beat', () => {
  for (const sound of ['kick', 'bass', 'sub', 'duck', 'openHat']) {
    assert.ok(of(sound).every((event) => event.time >= drop - 1e-9), sound);
  }
  const kicks = of('kick');
  assert.ok(near(kicks[0].time, drop));
  kicks.slice(1).forEach((kick, i) => assert.ok(near(kick.time - kicks[i].time, BEAT)));
});

test('the snare roll gets faster through the build-up, and stops for the gap', () => {
  const inBar = (bar) => (s) => s.time >= build + bar * BAR && s.time < build + (bar + 1) * BAR;
  const perBar = [0, 1, 2, 3].map((bar) => of('snare').filter(inBar(bar)).length);
  // The last bar: 32nds for three beats (3 x 4 x 2); its fourth beat is the gap.
  assert.deepEqual(perBar, [4, 8, 16, 24]);
  const inGap = (e) => e.time > drop - BEAT + 1e-9 && e.time < drop - 1e-9;
  const gap = events.filter((e) => inGap(e) && e.sound !== 'hat' && e.sound !== 'lead');
  assert.deepEqual(gap, []);
});

test('the bass follows the tune, low down', () => {
  assert.ok(of('bass').every((b) => b.frequency > 0 && b.frequency <= 98));
  assert.ok(of('sub').every((s) => s.frequency > 0 && s.frequency <= 55));
});

test('the score is in order of time', () => {
  events.slice(1).forEach((event, i) => assert.ok(event.time >= events[i].time));
});

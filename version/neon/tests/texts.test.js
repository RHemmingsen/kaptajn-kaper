// Tests for the game's texts, and the guard against misspelt ones.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TEXTS } from '../src/game/texts.js';
import { text } from '../src/game/ui/draw.js';
import { SHIP_TYPES } from '../src/game/rules/sea.js';

test('the texts are frozen, all the way down', () => {
  assert.equal(Object.isFrozen(TEXTS), true);
  assert.equal(Object.isFrozen(TEXTS.common), true);
  assert.throws(() => { TEXTS.common.pressAnyKey = 'x'; }, TypeError);
});

test('drawing a text that is not a string, like a misspelt constant, is refused', () => {
  const ctx = { measureText: () => ({ width: 0 }), fillText() {} };
  assert.throws(() => text(ctx, TEXTS.common.pressAnyKy, 0, 0), /must be a string, not undefined/);
  text(ctx, TEXTS.common.pressAnyKey, 0, 0); // a real one is fine
});

test('every kind of ship has a name', () => {
  for (const type of SHIP_TYPES) assert.equal(typeof TEXTS.ships[type.id], 'string', type.id);
});

test('there is a rank and a noble title for each of the five career levels', () => {
  assert.deepEqual([TEXTS.career.ranks.at(0), TEXTS.career.titles.at(0)], ['skibsfører', 'Borger']);
  assert.deepEqual([TEXTS.career.ranks.at(4), TEXTS.career.titles.at(4)], ['admiral', 'Kronprins']);
  assert.equal(TEXTS.career.ranks.length, 5);
  assert.equal(TEXTS.career.titles.length, 5);
});

test('you are addressed by rank and name', () => {
  assert.equal(TEXTS.career.addressedAs(1, 'Ronnie'), 'skibsfører Ronnie');
  assert.equal(TEXTS.career.addressedAs(2, ''), 'kaptajn', 'no name, just the rank');
});

test('every ending has its headline, and every heavy cargo its line', () => {
  for (const ending of ['sunk', 'jilted', 'won', 'quit']) {
    assert.ok(Array.isArray(TEXTS.ending.headlines[ending]), ending);
  }
  for (const cargo of ['money', 'men', 'guns', 'grain']) {
    assert.equal(typeof TEXTS.ending.tooHeavy[cargo], 'string', cargo);
  }
});

test('the answers to one question never share a key', () => {
  for (const keys of [TEXTS.sea.keys, TEXTS.boarding.keys, TEXTS.victory.keys, TEXTS.port.sellKeys]) {
    const letters = Object.values(keys);
    assert.equal(new Set(letters).size, letters.length, letters.join(''));
  }
});

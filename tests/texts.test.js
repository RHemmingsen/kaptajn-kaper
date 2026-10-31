// Tests for the game's texts, and the guard against misspelt ones.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TEXTS } from '../src/game/texts.js';
import { text } from '../src/game/ui/draw.js';

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

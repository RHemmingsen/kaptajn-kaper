import { test } from 'node:test';
import assert from 'node:assert/strict';
import { recordScore } from '../src/game/records.js';
import { browserStorage } from '../src/engine/storage.js';

// Storage that keeps things in a plain object, like localStorage would.
function memoryStorage(start = {}) {
  const data = { ...start };
  return { data, read: (key) => data[key] ?? null, write: (key, value) => { data[key] = value; } };
}

test('the first finished game sets the record', () => {
  const storage = memoryStorage();
  assert.deepEqual(recordScore(450, storage), { record: 450, isNew: true });
  assert.equal(storage.data['kaptajn-kaper.record'], '450');
});

test('a better score beats the record; a worse one does not', () => {
  const storage = memoryStorage({ 'kaptajn-kaper.record': '1200' });
  assert.deepEqual(recordScore(900, storage), { record: 1200, isNew: false });
  assert.deepEqual(recordScore(1500, storage), { record: 1500, isNew: true });
});

test('without a browser, storage quietly keeps nothing', () => {
  assert.equal(browserStorage.read('anything'), null);
  browserStorage.write('anything', '1'); // must not throw
});

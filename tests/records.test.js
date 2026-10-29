import { test } from 'node:test';
import assert from 'node:assert/strict';
import { currentRecord, lastName, recordScore, rememberName } from '../src/game/records.js';
import { browserStorage } from '../src/engine/storage.js';

// Storage that keeps things in a plain object, like localStorage would.
function memoryStorage(start = {}) {
  const data = { ...start };
  return { data, read: (key) => data[key] ?? null, write: (key, value) => { data[key] = value; } };
}

test('with no record yet, there is none', () => {
  assert.equal(currentRecord(memoryStorage()), null);
});

test('the first finished game sets the record, with the name', () => {
  const storage = memoryStorage();
  assert.deepEqual(recordScore(450, 'Ronnie', storage), { record: { points: 450, name: 'Ronnie' }, isNew: true });
  assert.deepEqual(currentRecord(storage), { points: 450, name: 'Ronnie' });
});

test('a better score beats the record; a worse one does not', () => {
  const storage = memoryStorage();
  recordScore(1200, 'Søren', storage);
  assert.deepEqual(recordScore(900, 'Ronnie', storage), { record: { points: 1200, name: 'Søren' }, isNew: false });
  assert.deepEqual(recordScore(1500, 'Ronnie', storage), { record: { points: 1500, name: 'Ronnie' }, isNew: true });
});

test('a record saved by the first version, just the points, still counts', () => {
  const storage = memoryStorage({ 'kaptajn-kaper.record': '5000' });
  assert.deepEqual(currentRecord(storage), { points: 5000, name: '' });
  assert.equal(recordScore(4000, 'Ronnie', storage).isNew, false);
});

test('the last name is remembered for next time', () => {
  const storage = memoryStorage();
  assert.equal(lastName(storage), '');
  rememberName('Ronnie', storage);
  assert.equal(lastName(storage), 'Ronnie');
});

test('without a browser, storage quietly keeps nothing', () => {
  assert.equal(browserStorage.read('anything'), null);
  browserStorage.write('anything', '1'); // must not throw
});

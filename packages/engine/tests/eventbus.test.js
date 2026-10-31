import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventBus } from '../src/EventBus.js';

test('listeners receive emitted data', () => {
  const events = new EventBus();
  const got = [];
  events.on('ping', (data) => got.push(data));
  events.emit('ping', 1);
  events.emit('ping', 2);
  assert.deepEqual(got, [1, 2]);
});

test('the function returned by on() stops listening', () => {
  const events = new EventBus();
  const got = [];
  const stop = events.on('ping', (data) => got.push(data));
  events.emit('ping', 1);
  stop();
  events.emit('ping', 2);
  assert.deepEqual(got, [1]);
});

test('emitting an event nobody listens to does nothing', () => {
  new EventBus().emit('nobody-home', 1);
});

test('an event name that is not a string, like a misspelt constant, is refused', () => {
  const events = new EventBus();
  const EVENTS = { ping: 'ping' };
  assert.throws(() => events.on(EVENTS.pnig, () => {}), /An event name must be a string, not undefined/);
  assert.throws(() => events.emit(EVENTS.pnig, 1), /must be a string/);
});

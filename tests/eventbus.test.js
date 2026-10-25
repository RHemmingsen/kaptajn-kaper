import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventBus } from '../src/engine/EventBus.js';

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

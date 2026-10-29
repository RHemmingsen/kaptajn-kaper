import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventBus } from '../src/engine/EventBus.js';
import { Scene } from '../src/engine/Scene.js';

test('a scene stops hearing events once stopListening() is called', () => {
  const game = { events: new EventBus() }; // just enough of a Game for a Scene
  const scene = new Scene(game);
  const got = [];
  scene.listen('ping', (data) => got.push(data));

  game.events.emit('ping', 1);
  scene.stopListening(); // what Game.setScene does when switching away
  game.events.emit('ping', 2);

  assert.deepEqual(got, [1]);
});

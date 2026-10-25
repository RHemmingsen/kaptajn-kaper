import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventBus } from '../src/engine/EventBus.js';
import { Screen } from '../src/engine/Screen.js';

test('a screen stops hearing events once stopListening() is called', () => {
  const game = { events: new EventBus() }; // just enough of a Game for a Screen
  const screen = new Screen(game);
  const got = [];
  screen.listen('ping', (data) => got.push(data));

  game.events.emit('ping', 1);
  screen.stopListening(); // what Game.setScreen does when switching away
  game.events.emit('ping', 2);

  assert.deepEqual(got, [1]);
});

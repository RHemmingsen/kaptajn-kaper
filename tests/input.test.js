// Tests for keyboard input as named actions. Input listens on whatever it's
// given, so the tests hand it a plain EventTarget and send it fake key events.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Input } from '../src/engine/Input.js';

function setup() {
  const target = new EventTarget();
  const input = new Input(target);
  input.setBindings({ steerLeft: ['ArrowLeft', 'Numpad4'], fire: ['KeyF'] });

  // Send a key event, and return it so tests can check what Input did to it.
  const send = (type, code, extra = {}) => {
    const event = Object.assign(new Event(type, { cancelable: true }), { code, repeat: false }, extra);
    target.dispatchEvent(event);
    return event;
  };
  return { target, input, send };
}

test('any of an action\'s keys triggers it', () => {
  const { input, send } = setup();

  send('keydown', 'Numpad4');

  assert.equal(input.isActionDown('steerLeft'), true);
  assert.equal(input.wasActionPressed('steerLeft'), true);
  assert.equal(input.isActionDown('fire'), false);
});

test('"pressed" lasts one step, "down" lasts until the key is released', () => {
  const { input, send } = setup();

  send('keydown', 'ArrowLeft');
  input.endStep();
  assert.equal(input.wasActionPressed('steerLeft'), false);
  assert.equal(input.isActionDown('steerLeft'), true);

  send('keyup', 'ArrowLeft');
  assert.equal(input.isActionDown('steerLeft'), false);
});

test('the key repeat from holding a key down is not a new press', () => {
  const { input, send } = setup();

  send('keydown', 'KeyF');
  input.endStep();
  send('keydown', 'KeyF', { repeat: true });

  assert.equal(input.wasActionPressed('fire'), false);
});

test('losing focus releases every key', () => {
  const { target, input, send } = setup();

  send('keydown', 'ArrowLeft');
  target.dispatchEvent(new Event('blur'));

  assert.equal(input.isActionDown('steerLeft'), false);
});

test('the browser is stopped from acting on bound keys only', () => {
  const { send } = setup();

  assert.equal(send('keydown', 'ArrowLeft').defaultPrevented, true);
  assert.equal(send('keydown', 'KeyQ').defaultPrevented, false);
});

test('any key counts for "press any key", bound or not', () => {
  const { input, send } = setup();

  send('keydown', 'KeyQ');

  assert.equal(input.anyKeyPressed(), true);
});

test('asking about an action with no keys is an error', () => {
  const { input } = setup();

  assert.throws(() => input.wasActionPressed('steerLeftt'), /No keys are bound to the action 'steerLeftt'/);
});

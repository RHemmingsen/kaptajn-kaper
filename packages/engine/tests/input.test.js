// Tests for keyboard input as named actions. Input listens on whatever it's
// given, so the tests hand it a plain EventTarget and send it fake key events.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Input } from '../src/Input.js';

function setup() {
  const target = new EventTarget();
  const bindings = { steerLeft: ['ArrowLeft', 'Numpad4'], fire: ['KeyF'] };
  const input = new Input(bindings, target);

  // Send a key event, and return it so tests can check what Input did to it.
  const send = (type, code, extra = {}) => {
    const event = Object.assign(
      new Event(type, { cancelable: true }), { code, key: code, repeat: false }, extra,
    );
    target.dispatchEvent(event);
    return event;
  };
  return { target, bindings, input, send };
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

test('there is no Input without key bindings', () => {
  assert.throws(() => new Input(undefined, new EventTarget()), /Input needs key bindings/);
});

test('changing the bindings object afterwards does not change the Input', () => {
  const { bindings, input, send } = setup();

  bindings.fire.push('Space');
  send('keydown', 'Space');

  assert.equal(input.wasActionPressed('fire'), false);
});

test('new bindings replace the old ones completely', () => {
  const { input, send } = setup();

  input.setBindings({ fire: ['Space'] });

  assert.equal(send('keydown', 'ArrowLeft').defaultPrevented, false);
  assert.throws(() => input.isActionDown('steerLeft'), /No keys are bound/);
  send('keydown', 'Space');
  assert.equal(input.wasActionPressed('fire'), true);
});

test('typed text is the characters typed this step', () => {
  const { input, send } = setup();

  send('keydown', 'Digit1', { key: '1' });
  send('keydown', 'Numpad2', { key: '2' });
  send('keydown', 'KeyK', { key: 'k' });
  send('keydown', 'Enter', { key: 'Enter' }); // not a character
  send('keydown', 'ShiftLeft', { key: 'Shift' }); // not a character

  assert.equal(input.typedText(), '12k');
  input.endStep();
  assert.equal(input.typedText(), '');
});

test('holding a key down does not type it again', () => {
  const { input, send } = setup();

  send('keydown', 'Digit5', { key: '5' });
  send('keydown', 'Digit5', { key: '5', repeat: true });

  assert.equal(input.typedText(), '5');
});

test('"repeated" is a press, and every repeat while the key is held', () => {
  const { input, send } = setup();

  send('keydown', 'KeyF');
  assert.equal(input.wasActionRepeated('fire'), true);
  input.endStep();
  assert.equal(input.wasActionRepeated('fire'), false, 'held, but not repeated this step');

  send('keydown', 'KeyF', { repeat: true });
  assert.equal(input.wasActionRepeated('fire'), true);
  assert.equal(input.wasActionPressed('fire'), false, 'a repeat is not a new press');
});

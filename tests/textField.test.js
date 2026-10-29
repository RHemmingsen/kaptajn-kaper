import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TextField } from '../src/engine/TextField.js';

test('typing builds up the text, including spaces and Danish letters', () => {
  const field = new TextField();
  field.type('Søren ');
  field.type('Ærø');
  assert.equal(field.text, 'Søren Ærø');
});

test('it stops at the maximum length', () => {
  const field = new TextField({ maxLength: 5 });
  field.type('Ronnie');
  assert.equal(field.text, 'Ronni');
});

test('only accepted characters are kept', () => {
  const field = new TextField({ accepts: (ch) => ch !== '!' });
  field.type('Hej!');
  assert.equal(field.text, 'Hej');
});

test('it can start with text, and erase and clear it', () => {
  const field = new TextField({ text: 'Ronnie' });
  field.erase();
  assert.equal(field.text, 'Ronni');
  field.clear();
  assert.equal(field.text, '');
});

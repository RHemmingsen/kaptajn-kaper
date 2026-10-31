import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NumberField } from '../src/NumberField.js';

test('typing digits builds up a number', () => {
  const field = new NumberField();
  field.type('1');
  field.type('20');
  assert.equal(field.value, 120);
});

test('nothing typed is no number, not 0', () => {
  assert.equal(new NumberField().value, null);
});

test('anything but digits is ignored, so no minus signs or decimals', () => {
  const field = new NumberField();
  field.type('-1.5k');
  assert.equal(field.text, '15');
});

test('it stops at the maximum number of digits', () => {
  const field = new NumberField(3);
  field.type('12345');
  assert.equal(field.value, 123);
});

test('erase removes the last digit, clear removes all', () => {
  const field = new NumberField();
  field.type('123');
  field.erase();
  assert.equal(field.value, 12);
  field.clear();
  assert.equal(field.value, null);
});

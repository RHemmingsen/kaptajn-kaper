import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BATTLE_PICTURE, HELP_TOPICS } from '../src/game/helpText.js';

test('there are topics 1-9 and 0, each with its own key', () => {
  assert.deepEqual(HELP_TOPICS.map((t) => t.key), ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']);
});

test('every page fits the screen: up to 23 lines of up to 40 characters', () => {
  for (const topic of HELP_TOPICS) {
    for (const page of topic.pages) {
      if (page === BATTLE_PICTURE) continue;
      assert.ok(page.length <= 23, `a page in "${topic.title}" has ${page.length} lines`);
      for (const line of page) assert.ok(line.length <= 40, `too long: "${line}"`);
    }
  }
});

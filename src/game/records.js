// The record: the most points anyone has finished a game with, in this
// browser. (The original also kept the record holder's name; that waits
// until the game asks for your name.)
//
// `storage` is anything with read(key) and write(key, value): the browser's
// storage in the game, a plain object in tests.
import { browserStorage } from '../engine/storage.js';

const KEY = 'kaptajn-kaper.record';

// Compare a finished game's points with the record, and keep them if they're
// better. Returns { record, isNew }: the record now, and whether you set it.
export function recordScore(points, storage = browserStorage) {
  const previous = Number(storage.read(KEY)) || 0;
  if (points > previous) {
    storage.write(KEY, String(points));
    return { record: points, isNew: true };
  }
  return { record: previous, isNew: false };
}

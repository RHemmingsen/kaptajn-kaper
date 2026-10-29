// What the game keeps between visits, in this browser:
//   - the record: the most points anyone has finished a game with, and who
//     set it (the original's "Rekord ... Indehaver")
//   - the last name played with, so it's ready to use next time
//
// `storage` is anything with read(key) and write(key, value): the browser's
// storage in the game, a plain object in tests.
import { browserStorage } from '../engine/storage.js';

const RECORD_KEY = 'kaptajn-kaper.record';
const NAME_KEY = 'kaptajn-kaper.name';

// The record, or null if there isn't one: { points, name }.
export function currentRecord(storage = browserStorage) {
  const saved = storage.read(RECORD_KEY);
  if (saved === null) return null;
  try {
    const { points, name } = JSON.parse(saved);
    if (typeof points === 'number') return { points, name: name ?? '' };
  } catch {
    // Not what we save; see below.
  }
  // The first version saved only the points, as a plain number.
  const points = Number(saved);
  return Number.isFinite(points) && points > 0 ? { points, name: '' } : null;
}

// Compare a finished game's points with the record, and keep them, with the
// name, if they're better. Returns { record, isNew }: the record now, and
// whether you set it.
export function recordScore(points, name, storage = browserStorage) {
  const previous = currentRecord(storage);
  if (previous === null || points > previous.points) {
    const record = { points, name };
    storage.write(RECORD_KEY, JSON.stringify(record));
    return { record, isNew: true };
  }
  return { record: previous, isNew: false };
}

export function lastName(storage = browserStorage) {
  return storage.read(NAME_KEY) ?? '';
}

export function rememberName(name, storage = browserStorage) {
  storage.write(NAME_KEY, name);
}

// How the record is written, wherever it's shown.
import { TEXTS } from '../texts.js';

// "Rekorden er 5000 point, sat af Ronnie." The first version kept no name.
// `record` is { points, name }, or null if there's none yet.
export function recordLine(record) {
  if (!record) return TEXTS.record.none;
  const { points, name } = record;
  return name ? TEXTS.record.isBy(points, name) : TEXTS.record.is(points);
}

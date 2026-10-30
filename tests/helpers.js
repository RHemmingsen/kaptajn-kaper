// Helpers shared by the tests.
import { EventBus } from '../src/engine/EventBus.js';

// A stand-in for Math.random that returns the given values, one per call, so
// a test decides exactly what the dice show. Rolling more than it was given
// is a mistake in the test, and says so.
export function dice(...values) {
  return () => {
    if (values.length === 0) throw new Error('the rules rolled more dice than the test gave');
    return values.shift();
  };
}

// An EventBus that writes down the events in `names` as they're emitted, as
// { name, data }, so a test can check what the rules announced.
export function recordEvents(names) {
  const events = new EventBus();
  const log = [];
  for (const name of names) {
    events.on(name, (data) => log.push({ name, data }));
  }
  return { events, log };
}

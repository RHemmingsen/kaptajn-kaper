// A simple publish/subscribe hub.
//
// One part of the game announces that something happened:
//
//   events.emit('arrivedAtPort', { city });
//
// and any number of other parts react to it, without the announcer knowing
// who they are:
//
//   events.on('arrivedAtPort', ({ city }) => { ... });
//
// Use it for things several unrelated systems care about (a port reached,
// men lost, game over). For everything else, a direct function call is
// easier to follow.
export class EventBus {
  constructor() {
    this.listeners = new Map(); // event name -> Set of functions
  }

  // Start listening. Returns a function that stops listening again.
  on(name, fn) {
    if (!this.listeners.has(name)) this.listeners.set(name, new Set());
    this.listeners.get(name).add(fn);
    return () => this.off(name, fn);
  }

  off(name, fn) {
    this.listeners.get(name)?.delete(fn);
  }

  emit(name, data) {
    const fns = this.listeners.get(name);
    if (!fns) return;
    // Copy first, so a listener that unsubscribes (or switches screen) while
    // we're looping doesn't disturb the loop.
    for (const fn of [...fns]) fn(data);
  }
}

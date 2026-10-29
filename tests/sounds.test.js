// Tests for which events make which sounds, with a fake Sound that writes
// down what it's asked to play.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventBus } from '../src/engine/EventBus.js';
import { connectSounds } from '../src/game/sounds.js';

function setup() {
  const played = [];
  // Like the real Sound, each returns how long it lasts.
  const sound = {
    tone: (...args) => { played.push(['tone', ...args]); return args[1]; },
    sweep: (...args) => { played.push(['sweep', ...args]); return args[2]; },
    noise: (...args) => { played.push(['noise', ...args]); return args[0]; },
    music: (...args) => { played.push(['music', ...args]); return 1; },
  };
  const events = new EventBus();
  connectSounds(events, sound);
  return { events, played };
}

test('every sound the original made has an event that plays it', () => {
  const quiet = ['shipRanAground', 'harborGust', 'tradeRefused', 'fled', 'gameOver'].filter((event) => {
    const { events, played } = setup();
    events.emit(event, {});
    return played.length === 0;
  });
  assert.deepEqual(quiet, []);
});

test('running aground is a falling whine', () => {
  const { events, played } = setup();
  events.emit('shipRanAground', { col: 3, row: 4 });
  assert.deepEqual(played, [['sweep', 500, 100, 0.22]]);
});

test('a broadside is a crack and a roar, with no splashes when the enemy missed', () => {
  const { events, played } = setup();
  events.emit('shotFired', { enemyFire: { repair: 0, men: 0, gun: false } });
  assert.deepEqual(played.map(([kind]) => kind), ['sweep', 'noise']);
});

test('the enemy\'s hits splash after the broadside, one per point of damage, at most 10', () => {
  const splashes = (enemyFire) => {
    const { events, played } = setup();
    events.emit('shotFired', { enemyFire });
    return played.filter(([kind]) => kind === 'tone').length / 2;
  };
  assert.equal(splashes({ repair: 2, men: 3, gun: true }), 6);
  assert.equal(splashes({ repair: 30, men: 20, gun: false }), 10);
});

test('the thump after fleeing comes when the whines are over', () => {
  const { events, played } = setup();
  events.emit('fled', {});
  assert.deepEqual(played.at(-1), ['tone', 50, 0.03, { delay: 1.4 }]);
});

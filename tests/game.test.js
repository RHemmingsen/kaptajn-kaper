// Tests for the Game's scenes and global actions. A Game needs a canvas and
// something to listen to for keys; these fakes are just enough of both.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/engine/Game.js';
import { Scene } from '../src/engine/Scene.js';

function setup(options = {}) {
  const canvas = { width: 640, height: 480, getContext: () => ({}) };
  const keys = new EventTarget();
  const game = new Game(canvas, { controls: { help: ['F1'], fire: ['KeyF'] }, inputTarget: keys, ...options });
  const press = (code) => keys.dispatchEvent(Object.assign(new Event('keydown'), { code, key: code, repeat: false }));
  return { game, press };
}

const DT = 1 / 60;

// A scene that writes down what happens to it. `onUpdate` and `onEnter`, if
// given, run after it has written down its update or enter, for tests that
// need a scene to do something then.
class LoggingScene extends Scene {
  constructor(game, name, log, { onUpdate, onEnter } = {}) {
    super(game);
    this.name = name;
    this.log = log;
    this.onUpdate = onUpdate;
    this.onEnter = onEnter;
  }

  enter() {
    this.log.push(`${this.name} enter`);
    this.onEnter?.();
  }

  exit() { this.log.push(`${this.name} exit`); }
  pause() { this.log.push(`${this.name} pause`); }
  resume() { this.log.push(`${this.name} resume`); }

  update() {
    this.log.push(`${this.name} update`);
    this.onUpdate?.();
  }
}

test('setScene swaps the scene at the end of the step: the old one exits, the new one enters', () => {
  const { game } = setup();
  const log = [];
  game.setScene(new LoggingScene(game, 'map', log));
  game.step(DT); // no scene to update yet; the map enters
  game.setScene(new LoggingScene(game, 'harbor', log));
  assert.equal(game.scene.name, 'map', 'nothing changes until the step is over');
  game.step(DT);
  assert.deepEqual(log, ['map enter', 'map update', 'map exit', 'harbor enter']);
  assert.equal(game.scene.name, 'harbor');
});

test('a scene asking for another in update() runs to the end of its update first', () => {
  const { game } = setup();
  const log = [];
  game.setScene(new LoggingScene(game, 'map', log, {
    onUpdate: () => {
      game.setScene(new LoggingScene(game, 'harbor', log));
      log.push('map goes on after asking');
    },
  }));
  game.step(DT);
  game.step(DT);
  assert.deepEqual(log, ['map enter', 'map update', 'map goes on after asking', 'map exit', 'harbor enter']);
});

test('a change asked for in enter() follows in the same step, after enter() has finished', () => {
  const { game } = setup();
  const log = [];
  // Like a port finding the ship too heavy: arriving ends the game.
  const port = new LoggingScene(game, 'port', log, {
    onEnter: () => {
      game.setScene(new LoggingScene(game, 'end', log));
      log.push('port enter done');
    },
  });
  game.setScene(port);
  game.step(DT);
  assert.deepEqual(log, ['port enter', 'port enter done', 'port exit', 'end enter']);
  assert.equal(game.scene.name, 'end');
});

test('two scene changes asked for in one step is a mistake', () => {
  const { game } = setup();
  game.setScene(new LoggingScene(game, 'map', []));
  assert.throws(
    () => game.setScene(new LoggingScene(game, 'harbor', [])),
    /Two scene changes asked for in one step: set LoggingScene, then set LoggingScene/,
  );
});

test('scenes that keep sending each other on are stopped, with an error', () => {
  const { game } = setup();
  const log = [];
  const bounce = () => game.setScene(new LoggingScene(game, 'again', log, { onEnter: bounce }));
  bounce();
  assert.throws(() => game.step(DT), /More than 10 scene changes in one step/);
});

// The browser's frame scheduling, faked: frames asked for are only counted,
// and tests call game.frame(now) themselves.
let framesAsked = 0;
globalThis.requestAnimationFrame = () => { framesAsked += 1; };

test('start() makes the scene change asked for before it', () => {
  const { game } = setup();
  const log = [];
  game.setScene(new LoggingScene(game, 'title', log));
  game.start();
  assert.deepEqual(log, ['title enter']);
});

test('start() twice, or with no scene, is a mistake', () => {
  const { game } = setup();
  assert.throws(() => game.start(), /No scene to start with/);
  game.setScene(new LoggingScene(game, 'title', []));
  game.start();
  assert.throws(() => game.start(), /already running/);
});

test('a frame whose time is before the last one runs no steps, and time never goes backwards', () => {
  const { game } = setup();
  const log = [];
  game.setScene(new LoggingScene(game, 'map', log));
  game.start();
  game.lastTime = 1000;
  game.frame(990);
  assert.equal(game.accumulator, 0);
  assert.deepEqual(log, ['map enter']);
});

test('an error in a scene stops the loop and shows the error, instead of freezing', () => {
  const shown = [];
  const { game } = setup({ drawError: (ctx, error) => shown.push(error.message) });
  game.setScene(new LoggingScene(game, 'battle', [], { onUpdate: () => { throw new Error('oops'); } }));
  game.start();
  const asked = framesAsked;
  const consoleError = console.error;
  console.error = () => {}; // the game logs it there; keep the test output clean
  try {
    game.frame(game.lastTime + 100); // 0.1 s: a few steps' worth
  } finally {
    console.error = consoleError;
  }
  assert.deepEqual(shown, ['oops']);
  assert.equal(framesAsked, asked, 'no next frame');
  assert.equal(game.running, false);
});

test('a pushed scene pauses the one below, and popping it resumes it, without re-entering', () => {
  const { game } = setup();
  const log = [];
  game.setScene(new LoggingScene(game, 'battle', log));
  game.step(DT);
  game.pushScene(new LoggingScene(game, 'help', log));
  game.step(DT);
  game.popScene();
  game.step(DT);
  assert.deepEqual(log, [
    'battle enter', 'battle update', 'battle pause', 'help enter', 'help update', 'help exit', 'battle resume',
  ]);
});

test('replaceScene swaps only the top scene; the one below stays paused', () => {
  const { game } = setup();
  const log = [];
  game.setScene(new LoggingScene(game, 'map', log));
  game.step(DT);
  game.pushScene(new LoggingScene(game, 'harbor', log));
  game.step(DT);
  game.replaceScene(new LoggingScene(game, 'port', log));
  game.step(DT);
  game.popScene();
  game.step(DT);
  assert.deepEqual(log, [
    'map enter', 'map update', 'map pause', 'harbor enter', 'harbor update', 'harbor exit', 'port enter',
    'port update', 'port exit', 'map resume',
  ]);
  assert.equal(game.scene.name, 'map');
});

test('setScene ends every scene in the stack', () => {
  const { game } = setup();
  const log = [];
  game.setScene(new LoggingScene(game, 'battle', log));
  game.step(DT);
  game.pushScene(new LoggingScene(game, 'help', log));
  game.step(DT);
  game.setScene(new LoggingScene(game, 'title', log));
  game.step(DT);
  assert.deepEqual(log.slice(-3), ['help exit', 'battle exit', 'title enter']);
  assert.equal(game.scenes.length, 1);
});

test('a global action works whatever the scene, and the scene does not see that step', () => {
  const { game, press } = setup();
  const log = [];
  game.setScene(new LoggingScene(game, 'map', log));
  game.step(DT);
  game.onAction('help', () => log.push('help opened'));

  press('F1');
  game.step(DT);
  press('KeyF');
  game.step(DT);

  assert.deepEqual(log, ['map enter', 'help opened', 'map update']);
});

test('a global action that pushes a scene does it at the end of the step', () => {
  const { game, press } = setup();
  const log = [];
  game.setScene(new LoggingScene(game, 'map', log));
  game.step(DT);
  game.onAction('help', () => game.pushScene(new LoggingScene(game, 'help', log)));

  press('F1');
  game.step(DT);

  assert.deepEqual(log, ['map enter', 'map pause', 'help enter']);
});

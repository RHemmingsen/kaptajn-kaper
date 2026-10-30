// Tests for the Game's scenes and global actions. A Game needs a canvas and
// something to listen to for keys; these fakes are just enough of both.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/engine/Game.js';
import { Scene } from '../src/engine/Scene.js';

function setup() {
  const canvas = { width: 640, height: 480, getContext: () => ({}) };
  const keys = new EventTarget();
  const game = new Game(canvas, { controls: { help: ['F1'], fire: ['KeyF'] }, inputTarget: keys });
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

test('start() makes the scene change asked for before it', () => {
  const { game } = setup();
  const log = [];
  game.setScene(new LoggingScene(game, 'title', log));
  globalThis.requestAnimationFrame = () => {};
  globalThis.performance ??= { now: () => 0 };
  game.start();
  assert.deepEqual(log, ['title enter']);
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

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

// A scene that writes down what happens to it.
class LoggingScene extends Scene {
  constructor(game, name, log) {
    super(game);
    this.name = name;
    this.log = log;
  }

  enter() { this.log.push(`${this.name} enter`); }
  exit() { this.log.push(`${this.name} exit`); }
  pause() { this.log.push(`${this.name} pause`); }
  resume() { this.log.push(`${this.name} resume`); }
  update() { this.log.push(`${this.name} update`); }
}

test('setScene swaps the scene: the old one exits, the new one enters', () => {
  const { game } = setup();
  const log = [];
  game.setScene(new LoggingScene(game, 'map', log));
  game.setScene(new LoggingScene(game, 'harbor', log));
  assert.deepEqual(log, ['map enter', 'map exit', 'harbor enter']);
  assert.equal(game.scene.name, 'harbor');
});

test('a pushed scene pauses the one below, and popping it resumes it, without re-entering', () => {
  const { game } = setup();
  const log = [];
  game.setScene(new LoggingScene(game, 'battle', log));
  game.pushScene(new LoggingScene(game, 'help', log));
  game.step(1 / 60);
  game.popScene();
  game.step(1 / 60);
  assert.deepEqual(log, [
    'battle enter', 'battle pause', 'help enter', 'help update', 'help exit', 'battle resume', 'battle update',
  ]);
});

test('setScene ends every scene in the stack', () => {
  const { game } = setup();
  const log = [];
  game.setScene(new LoggingScene(game, 'battle', log));
  game.pushScene(new LoggingScene(game, 'help', log));
  game.setScene(new LoggingScene(game, 'title', log));
  assert.deepEqual(log.slice(-3), ['help exit', 'battle exit', 'title enter']);
  assert.equal(game.scenes.length, 1);
});

test('a global action works whatever the scene, and the scene does not see that step', () => {
  const { game, press } = setup();
  const log = [];
  game.setScene(new LoggingScene(game, 'map', log));
  game.onAction('help', () => log.push('help opened'));

  press('F1');
  game.step(1 / 60);
  press('KeyF');
  game.step(1 / 60);

  assert.deepEqual(log, ['map enter', 'help opened', 'map update']);
});

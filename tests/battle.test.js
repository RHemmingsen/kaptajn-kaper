// Tests for the gun battle. The dice decide everything, so each test lists
// them in the order the rules roll them:
//   enemy fire:  Rep? (and how much), men? (and how much), a gun?
//   your shot:   sideways luck, range luck (two dice)
//   on a hit:    guns knocked out, men killed
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventBus } from '../src/engine/EventBus.js';
import { GameState } from '../src/game/GameState.js';
import { SHIP_TYPES } from '../src/game/rules/sea.js';
import { startBattle, moveAim, breakOff, fire, moraleFactor } from '../src/game/rules/battle.js';

function dice(...values) {
  return () => {
    if (values.length === 0) throw new Error('the rules rolled more dice than the test gave');
    return values.shift();
  };
}

const ENEMY_MISSES = [0.3, 0.3, 0.99]; // no Rep lost, no men lost, no gun lost
const DEAD_ON = [0.5, 0.5, 0.5]; // no sideways luck; range luck 25 - 25 = 0

// A galease 700 away, in calm weather, sights straight ahead.
function setup(enemyChanges = {}) {
  const enemy = {
    type: SHIP_TYPES[3], repair: 120, guns: 15, men: 140, money: 450, grain: 3, distance: 700,
    ...enemyChanges,
  };
  const battle = { enemy, wind: { side: 0, length: 0, strength: 0 }, aim: { elevation: 0, side: 0 } };
  return { battle, enemy, state: new GameState(), events: new EventBus() };
}

test('a battle starts with new wind and the sights straight ahead', () => {
  const battle = startBattle({}, dice(0, 0.7, 0.5));
  assert.deepEqual(battle.wind, { side: -1, length: 1, strength: 6 });
  assert.deepEqual(battle.aim, { elevation: 0, side: 0 });
});

test('with no wind from any side, it is calm', () => {
  const battle = startBattle({}, dice(0.5, 0.5, 0.3));
  assert.deepEqual(battle.wind, { side: 0, length: 0, strength: 0 });
});

test('the sights stop at their limits', () => {
  const { battle } = setup();
  moveAim(battle, -100, 100);
  assert.deepEqual(battle.aim, { elevation: -30, side: 50 });
});

test('breaking off sets a new distance', () => {
  const { battle } = setup();
  breakOff(battle, dice(0.5));
  assert.equal(battle.enemy.distance, 750);
});

test('a level shot in calm weather goes 700', () => {
  const { battle, enemy, state, events } = setup();

  const result = fire(battle, state, events, dice(...ENEMY_MISSES, ...DEAD_ON, 0, 0));

  assert.equal(result.shot.lands, 'hit');
  // 2 x 20 guns / difficulty 2 = 20 Rep; she had 120.
  assert.equal(result.shot.damage, 20);
  assert.equal(enemy.repair, 100);
  // 0.9 x 140 men x (20 guns + 0 luck) / 100 = 25 killed.
  assert.equal(result.shot.menKilled, 25);
  assert.equal(enemy.men, 115);
  assert.equal(result.outcome, null);
});

test('too far away is short, too close is long', () => {
  const far = setup({ distance: 800 });
  assert.equal(fire(far.battle, far.state, far.events, dice(...ENEMY_MISSES, ...DEAD_ON)).shot.lands, 'short');
  const near = setup({ distance: 600 });
  assert.equal(fire(near.battle, near.state, near.events, dice(...ENEMY_MISSES, ...DEAD_ON)).shot.lands, 'long');
});

test('aiming lower shortens the range: 10 per step', () => {
  const { battle, state, events } = setup({ distance: 500 });
  moveAim(battle, 20, 0);
  assert.equal(fire(battle, state, events, dice(...ENEMY_MISSES, ...DEAD_ON, 0, 0)).shot.lands, 'hit');
});

test('a wind from the right blows the shot left, and aiming right makes up for it', () => {
  const { battle, state, events } = setup();
  battle.wind = { side: 1, length: 0, strength: 5 };
  assert.equal(fire(battle, state, events, dice(...ENEMY_MISSES, 0)).shot.lands, 'left');

  moveAim(battle, 0, 25);
  assert.equal(fire(battle, state, events, dice(...ENEMY_MISSES, 0, 0.5, 0.5, 0, 0)).shot.lands, 'hit');
});

test('aiming too far right misses to the right', () => {
  const { battle, state, events } = setup();
  moveAim(battle, 0, 50);
  assert.equal(fire(battle, state, events, dice(...ENEMY_MISSES, 0.5)).shot.lands, 'right');
});

test('a wind from behind carries the shot further', () => {
  const { battle, state, events } = setup({ distance: 800 });
  battle.wind = { side: 0, length: 1, strength: 10 };
  assert.equal(fire(battle, state, events, dice(...ENEMY_MISSES, ...DEAD_ON, 0, 0)).shot.lands, 'hit');
});

test('the enemy fires back: guns / 1.3 Rep and guns / 1.4 men, times the morale factor', () => {
  const { battle, state, events } = setup({ distance: 900 });
  assert.equal(moraleFactor(state), 1.5); // (2 encounters + 1 flight) / 2

  const result = fire(battle, state, events, dice(0.5, 0.5, 0.5, 0.5, 0, ...DEAD_ON));

  assert.deepEqual(result.enemyFire, { repair: 17, men: 16, gun: true });
  assert.equal(state.repair, 183);
  assert.equal(state.men, 184);
  assert.equal(state.guns, 19);
});

test('fleeing often makes the enemy fire hurt more', () => {
  const { battle, state, events } = setup({ distance: 900 });
  state.flights = 3; // (2 + 3) / 2 = 2.5

  const result = fire(battle, state, events, dice(0.5, 0.5, 0.3, 0.99, ...DEAD_ON));

  assert.equal(result.enemyFire.repair, 28); // 15 / 1.3 x 2.5 = 28.8
});

test('sinking her earns her rigsdaler / 10 in points', () => {
  const { battle, state, events } = setup({ repair: 30 });

  const result = fire(battle, state, events, dice(...ENEMY_MISSES, ...DEAD_ON, 0));

  assert.equal(result.outcome, 'sunk');
  assert.equal(result.points, 45);
  assert.equal(state.points, 45);
});

test('she strikes her flag when low on Rep, guns or men', () => {
  const lowRep = setup({ repair: 50 }); // 50 - 20 = 30, under 40 - 2
  assert.equal(fire(lowRep.battle, lowRep.state, lowRep.events, dice(...ENEMY_MISSES, ...DEAD_ON, 0)).outcome, 'surrender');

  const lastGun = setup({ guns: 1 }); // a hit knocks out 0.5 x 10 / 2 = 2 guns
  assert.equal(fire(lastGun.battle, lastGun.state, lastGun.events, dice(...ENEMY_MISSES, ...DEAD_ON, 0.5)).outcome, 'surrender');

  const fewMen = setup({ men: 22 }); // 3 killed, 19 left
  assert.equal(fire(fewMen.battle, fewMen.state, fewMen.events, dice(...ENEMY_MISSES, ...DEAD_ON, 0, 0)).outcome, 'surrender');
});

test('if her fire sinks you, your shot never lands', () => {
  const { battle, state, events } = setup();
  state.repair = 30;

  const result = fire(battle, state, events, dice(0.5, 0.5));

  assert.equal(result.outcome, 'lost');
  assert.equal(result.shot, null);
  assert.equal(state.sunk, true);
});

test('the ship always keeps one gun', () => {
  const { battle, state, events } = setup({ distance: 900 });
  state.guns = 1;

  const result = fire(battle, state, events, dice(0.3, 0.3, 0, ...DEAD_ON));

  assert.equal(result.enemyFire.gun, false);
  assert.equal(state.guns, 1);
});

// Tests for what can happen at sea.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventBus } from '../src/engine/EventBus.js';
import { GameState } from '../src/game/GameState.js';
import { rollSeaEvent, investigateFog, flee } from '../src/game/rules/sea.js';

// A stand-in for Math.random that returns these numbers in order, so a test
// decides exactly what happens. Runs out loudly if the rules ask for more.
function dice(...values) {
  return () => {
    if (values.length === 0) throw new Error('the rules rolled more dice than the test gave');
    return values.shift();
  };
}

test('three times in four, nothing is spotted', () => {
  const state = new GameState();
  assert.equal(rollSeaEvent(state, dice(0.3)), null);
  assert.equal(state.encounters, 2);
});

test('a ship is made from its type, with some dice for Rep, grain and distance', () => {
  const state = new GameState();
  const event = rollSeaEvent(state, dice(0.1, 0.0, 0.5, 0.5, 0.5));

  assert.equal(event.kind, 'ship');
  const { ship } = event;
  assert.equal(ship.type.name, 'handelsmand');
  assert.equal(ship.guns, 5);
  assert.equal(ship.men, 80);
  assert.equal(ship.money, 150);
  assert.equal(ship.repair, 125); // 100-149
  assert.equal(ship.grain, 16); // 1 up to the type's 30
  assert.equal(ship.distance, 750); // 500-999
  assert.equal(state.encounters, 3);
});

test('the eighth type is the pirate ship', () => {
  const event = rollSeaEvent(new GameState(), dice(0.1, 0.75, 0, 0, 0));
  assert.equal(event.ship.type.name, 'sørøverskib');
  assert.equal(event.ship.type.pirate, true);
});

test('one time in five, it is a fog bank', () => {
  const state = new GameState();
  assert.deepEqual(rollSeaEvent(state, dice(0.1, 0.85)), { kind: 'fog' });
  assert.equal(state.encounters, 3);
});

// Investigate a fog bank with the given dice; return what happened.
function fog(state, ...values) {
  return investigateFog(state, new EventBus(), dice(...values));
}

test('the fog can hide a ship', () => {
  const state = new GameState();
  const outcome = fog(state, 0.05, 0.0, 0, 0, 0);
  assert.equal(outcome.kind, 'ship');
  assert.equal(outcome.ship.type.name, 'handelsmand');
  assert.equal(state.encounters, 3);
});

test('the fog can hide a treasure chest with 600 rigsdaler', () => {
  const state = new GameState();
  assert.deepEqual(fog(state, 0.25), { kind: 'treasure', money: 600 });
  assert.equal(state.money, 1200);
});

test('the fog can hide 2-7 jewels, a gun, castaways or grain', () => {
  const state = new GameState();
  assert.deepEqual(fog(state, 0.35, 0.99), { kind: 'jewels', count: 7 });
  assert.deepEqual(fog(state, 0.45), { kind: 'gun' });
  assert.deepEqual(fog(state, 0.55, 0), { kind: 'castaways', count: 9 });
  assert.deepEqual(fog(state, 0.85, 0.5), { kind: 'grain', count: 5 });
  assert.equal(state.jewels, 7);
  assert.equal(state.guns, 21);
  assert.equal(state.men, 209);
  assert.equal(state.grain, 35);
});

test('the fog can hide nothing at all', () => {
  const state = new GameState();
  assert.deepEqual(fog(state, 0.65), { kind: 'nothing' });
  assert.deepEqual(fog(state, 0.75), { kind: 'nothing' });
});

test('plague kills a third of the crew', () => {
  const state = new GameState();
  assert.deepEqual(fog(state, 0.95), { kind: 'plague', count: 66 });
  assert.equal(state.men, 134);
});

test('plague can leave too few men to sail, and the ship is lost', () => {
  const state = new GameState();
  state.men = 15;
  fog(state, 0.95); // 5 die, 10 left
  assert.equal(state.sunk, true);
});

test('fleeing is counted, and told', () => {
  const state = new GameState();
  const events = new EventBus();
  let told = 0;
  events.on('fled', () => { told += 1; });
  flee(state, events);
  assert.equal(state.flights, 2);
  assert.equal(told, 1);
});

test('what was found in the fog is told as a fogInvestigated event', () => {
  const state = new GameState();
  const events = new EventBus();
  const told = [];
  events.on('fogInvestigated', (found) => told.push(found));
  const found = investigateFog(state, events);
  assert.deepEqual(told, [found]);
});

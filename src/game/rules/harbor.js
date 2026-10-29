// The rules for the harbor minigame, as in the original game (its lines
// 1260-1490), with smooth movement. The ship sails down towards the harbor
// on its own; you steer left and right between the ships at anchor, while
// gusts of wind from one side push you off course, and must hit the gap
// between the docks. Miss it and the ship is lost.
//
// This runs in real time. The ship has a position in pixels, and every step
// it moves by speed * dt, where dt is the length of one step in seconds. So
// the speeds below are "pixels per second", whatever the frame rate is.
//
// The original moved in 18 steps. Here that's the time the trip takes
// (TRIP_STEP seconds each), and a gust can come once per step.
//
// Random numbers come from a `random` function returning 0..1, so tests can
// decide what happens.
import { rectsOverlap } from '../../engine/collision.js';
import { damageShip, isSunk, sinkShip } from './ship.js';

// Where things are, in pixels on the 640x480 screen.
export const LAYOUT = {
  wallLeft: 28,
  wallRight: 612,
  dockTop: 398,
  dockHeight: 12,
};
const WIDTH = LAYOUT.wallRight - LAYOUT.wallLeft;

const START = { x: 311, y: 40 };
const SHIP_SIZE = { w: 18, h: 14 };
const OBSTACLE_SIZE = { w: 16, h: 18 };

const SAIL_SPEED = 45; // pixels per second downwards, always: about 8 seconds to the docks
const TRIP_STEP = 0.45; // seconds: the trip is about 18 of the original's steps

// In one step, you can steer as far as a gust pushes you, as in the original
// (10 of its pixels each).
const GUST_PUSH = 23; // pixels a gust pushes the ship
const GUST_TIME = 0.3; // seconds the push takes
const STEER_SPEED = GUST_PUSH / TRIP_STEP; // pixels per second, holding a key

const CRASH_MESSAGE_TIME = 1; // seconds the crash message stays up

// The original counted the harbor's width in text columns: 38 of them.
const COLUMNS = 38;
const COLUMN = WIDTH / COLUMNS;

// A fresh harbor for a visit, at the game's difficulty.
export function createHarbor(city, difficulty, random = Math.random) {
  const gustsFrom = random() < 0.5 ? 'right' : 'left';
  const gap = placeGap(difficulty, random);
  return {
    city,
    ship: { ...START, ...SHIP_SIZE },
    gustsFrom, // gusts from the right push the ship left, and the other way
    gap,
    docks: [
      { x: LAYOUT.wallLeft, y: LAYOUT.dockTop, w: gap.left - LAYOUT.wallLeft, h: LAYOUT.dockHeight },
      { x: gap.right, y: LAYOUT.dockTop, w: LAYOUT.wallRight - gap.right, h: LAYOUT.dockHeight },
    ],
    obstacles: placeObstacles(5 * difficulty + 1, random),
    status: 'sailing', // 'sailing' | 'docked' | 'sunk'
    stepTimer: 0, // time into the current trip step
    gustTimer: 0, // > 0 while a gust is pushing the ship
    crashTimer: 0, // > 0 while the crash message is showing
    lastCrash: 0, // Rep lost in the last crash, for the message
  };
}

// The gap between the docks: 9 - difficulty / 2 columns wide (8 at the
// start, 4 at the end), starting somewhere a little left of the middle, with
// more room to vary the harder it gets.
function placeGap(difficulty, random) {
  const columns = 9 - Math.floor(difficulty / 2);
  const firstColumn = 11 - difficulty / 2 + Math.floor(random() * (6 + difficulty));
  const left = LAYOUT.wallLeft + firstColumn * COLUMN;
  return { left, right: left + columns * COLUMN };
}

// Scatter ships at anchor at random, but not too close to each other, so
// there is always a way through. If the harbor is too crowded for all of
// them, the ones that don't fit stay out.
function placeObstacles(count, random) {
  const top = 90;
  const bottom = LAYOUT.dockTop - 40;
  const left = LAYOUT.wallLeft + 10;
  const right = LAYOUT.wallRight - 10 - OBSTACLE_SIZE.w;

  const obstacles = [];
  for (let attempt = 0; attempt < 1000 && obstacles.length < count; attempt++) {
    const candidate = {
      x: left + random() * (right - left),
      y: top + random() * (bottom - top),
      ...OBSTACLE_SIZE,
      hit: false,
    };
    const tooClose = obstacles.some(
      (o) => Math.abs(o.x - candidate.x) < 50 && Math.abs(o.y - candidate.y) < 50,
    );
    if (!tooClose) obstacles.push(candidate);
  }
  return obstacles;
}

// Advance the harbor by dt seconds.
//
// `controls` says which directions are held: { left, right }. It's plain
// booleans rather than key codes, so the rules don't know about the keyboard.
//
// Events emitted (plus the ones from ship.js):
//   harborGust     {}       a gust starts pushing the ship
//   enteredHarbor  { city }
export function updateHarbor(harbor, controls, dt, state, events, random = Math.random) {
  if (harbor.status !== 'sailing') return;

  harbor.crashTimer = Math.max(0, harbor.crashTimer - dt);

  // 1. Once per trip step, a gust may come: the chance is difficulty / 18.
  harbor.stepTimer += dt;
  if (harbor.stepTimer >= TRIP_STEP) {
    harbor.stepTimer -= TRIP_STEP;
    if (random() < state.difficulty / 18) {
      harbor.gustTimer = GUST_TIME;
      events.emit('harborGust', {});
    }
  }

  // 2. Move: always down; sideways by steering and by any gust. A gust
  //    pushes GUST_PUSH pixels spread over GUST_TIME seconds.
  const ship = harbor.ship;
  const steer = (controls.right ? 1 : 0) - (controls.left ? 1 : 0);
  ship.x += steer * STEER_SPEED * dt;
  if (harbor.gustTimer > 0) {
    const gustDt = Math.min(dt, harbor.gustTimer);
    harbor.gustTimer -= gustDt;
    ship.x += gustDirection(harbor) * (GUST_PUSH / GUST_TIME) * gustDt;
  }
  ship.y += SAIL_SPEED * dt;

  // 3. The harbor walls just stop you.
  ship.x = Math.min(Math.max(ship.x, LAYOUT.wallLeft), LAYOUT.wallRight - ship.w);

  // 4. Missing the gap and hitting a dock: the ship is lost.
  if (harbor.docks.some((dock) => rectsOverlap(ship, dock))) {
    harbor.status = 'sunk';
    sinkShip(state, events);
    return;
  }

  // 5. Hitting a ship at anchor damages yours: 15 x difficulty Rep, once per
  //    ship. You sail on, unless the damage sinks you.
  const hit = harbor.obstacles.find((obstacle) => !obstacle.hit && rectsOverlap(ship, obstacle));
  if (hit) {
    hit.hit = true;
    harbor.lastCrash = 15 * state.difficulty;
    harbor.crashTimer = CRASH_MESSAGE_TIME;
    damageShip(state, harbor.lastCrash, events);
    if (isSunk(state)) {
      harbor.status = 'sunk';
      return;
    }
  }

  // 6. All the way past the docks means you made it in.
  if (ship.y > LAYOUT.dockTop + LAYOUT.dockHeight) {
    harbor.status = 'docked';
    events.emit('enteredHarbor', { city: harbor.city });
  }
}

// Which way gusts push the ship: -1 left, 1 right.
export function gustDirection(harbor) {
  return harbor.gustsFrom === 'right' ? -1 : 1;
}

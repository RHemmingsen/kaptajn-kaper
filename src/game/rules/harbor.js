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
// (TRIP_STEP seconds each), and a gust can come once per step. While a gust
// pushes, the rudder doesn't answer: in the original a gust took the place
// of your move.
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

const SAIL_SPEED = 67.5; // pixels per second downwards, always: about 5.3 seconds to the docks
const TRIP_STEP = 0.3; // seconds: the trip is about 18 of the original's steps

// In one step, you can steer as far as a gust pushes you, as in the original
// (10 of its pixels each).
const GUST_PUSH = 23; // pixels a gust pushes the ship
const GUST_TIME = 0.2; // seconds the push takes
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

// Ships at anchor, placed as in the original: each on a random place in a
// grid of 29 x 14, which covers the whole harbor from the walls to the walls
// and from beside where you start down to a little above the docks. Nothing
// keeps them apart: they can lie close together, and block the way.
// (Two can't lie on the same place; in the original, the second one erased
// the first.) The places where a ship would lie on top of yours at the start
// are kept free, or you'd crash before you could steer; the original only
// looked for crashes after the first step.
const GRID_COLUMNS = 29;
const GRID_ROWS = 14;
const GRID_TOP = 15; // the original's top row, beside its ship
const GRID_BOTTOM = 334; // its bottom row, with a fifth of the trip left to the docks

function placeObstacles(count, random) {
  const columnWidth = (WIDTH - OBSTACLE_SIZE.w) / (GRID_COLUMNS - 1);
  const rowHeight = (GRID_BOTTOM - GRID_TOP) / (GRID_ROWS - 1);
  // Every free place, from which each ship takes one at random.
  const startingShip = { ...START, ...SHIP_SIZE };
  const free = [];
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let column = 0; column < GRID_COLUMNS; column++) {
      const place = {
        x: LAYOUT.wallLeft + column * columnWidth,
        y: GRID_TOP + row * rowHeight,
        ...OBSTACLE_SIZE,
      };
      if (!rectsOverlap(place, startingShip)) free.push(place);
    }
  }

  const obstacles = [];
  for (let i = 0; i < count; i++) {
    const [place] = free.splice(Math.floor(random() * free.length), 1);
    obstacles.push({ ...place, hit: false });
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
//   harborCrash    { damage }  you hit a ship at anchor
// Whether you made it in, or were lost, is in harbor.status.
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

  // 2. Move: always down; sideways by steering or, while a gust blows, only
  //    by the gust. A gust pushes GUST_PUSH pixels spread over GUST_TIME
  //    seconds.
  const ship = harbor.ship;
  if (harbor.gustTimer === 0) {
    const steer = (controls.right ? 1 : 0) - (controls.left ? 1 : 0);
    ship.x += steer * STEER_SPEED * dt;
  } else {
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
    events.emit('harborCrash', { damage: harbor.lastCrash });
    damageShip(state, harbor.lastCrash, events);
    if (isSunk(state)) {
      harbor.status = 'sunk';
      return;
    }
  }

  // 6. All the way past the docks means you made it in.
  if (ship.y > LAYOUT.dockTop + LAYOUT.dockHeight) {
    harbor.status = 'docked';
  }
}

// Which way gusts push the ship: -1 left, 1 right.
export function gustDirection(harbor) {
  return harbor.gustsFrom === 'right' ? -1 : 1;
}

// The rules for the harbor minigame. The ship sails down towards the harbor
// on its own; you steer left and right between the anchored ships while the
// wind pushes you sideways, and must hit the gap between the docks. Miss it
// and the ship sinks.
//
// Unlike the map, this runs in real time. The ship has a position in pixels,
// and every step it moves by speed * dt, where dt is the length of one step in
// seconds. That way the speeds below mean "pixels per second", whatever the
// frame rate is.
import { rectsOverlap } from '../../engine/collision.js';
import { damageShip, isSunk, sinkShip } from './ship.js';

// Where things are, in pixels on the 640x480 screen.
export const LAYOUT = {
  wallLeft: 28,
  wallRight: 612,
  dockTop: 398,
  dockHeight: 12,
  gapLeft: 244,
  gapRight: 370,
};

// The two docks, with the harbor entrance between them.
export const DOCKS = [
  { x: LAYOUT.wallLeft, y: LAYOUT.dockTop, w: LAYOUT.gapLeft - LAYOUT.wallLeft, h: LAYOUT.dockHeight },
  { x: LAYOUT.gapRight, y: LAYOUT.dockTop, w: LAYOUT.wallRight - LAYOUT.gapRight, h: LAYOUT.dockHeight },
];

const START = { x: 311, y: 40 };
const SHIP_SIZE = { w: 18, h: 14 };
const OBSTACLE_SIZE = { w: 16, h: 18 };

const SAIL_SPEED = 45; // pixels per second downwards, always
const STEER_SPEED = 90; // pixels per second sideways, when holding an arrow key
export const WIND_MAX = 55; // wind speed range, pixels per second
const WIND_MIN = 20;
const OBSTACLE_COUNT = 13;
const CRASH_DAMAGE = 10; // Rep lost per crash
const CRASH_MESSAGE_TIME = 1; // seconds the crash message stays up

// A fresh harbor for one visit. `random` is a function returning 0..1; tests
// can pass their own to get the same harbor every time.
export function createHarbor(city, random = Math.random) {
  const direction = random() < 0.5 ? -1 : 1;
  return {
    city,
    ship: { ...START, ...SHIP_SIZE },
    wind: direction * (WIND_MIN + random() * (WIND_MAX - WIND_MIN)), // < 0 blows left
    obstacles: placeObstacles(random),
    status: 'sailing', // 'sailing' | 'docked' | 'sunk'
    crashTimer: 0, // > 0 while the crash message is showing
  };
}

// Scatter anchored ships at random, but not too close to each other, so there
// is always a way through.
function placeObstacles(random) {
  const top = 90;
  const bottom = LAYOUT.dockTop - 40;
  const left = LAYOUT.wallLeft + 10;
  const right = LAYOUT.wallRight - 10 - OBSTACLE_SIZE.w;

  const obstacles = [];
  for (let attempt = 0; attempt < 1000 && obstacles.length < OBSTACLE_COUNT; attempt++) {
    const candidate = {
      x: left + random() * (right - left),
      y: top + random() * (bottom - top),
      ...OBSTACLE_SIZE,
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
//   enteredHarbor  { city }
export function updateHarbor(harbor, controls, dt, state, events) {
  if (harbor.status !== 'sailing') return;

  harbor.crashTimer = Math.max(0, harbor.crashTimer - dt);

  // 1. Move: always down, plus steering and wind sideways.
  const ship = harbor.ship;
  const steer = (controls.right ? 1 : 0) - (controls.left ? 1 : 0);
  ship.x += (steer * STEER_SPEED + harbor.wind) * dt;
  ship.y += SAIL_SPEED * dt;

  // 2. The harbor walls just stop you.
  ship.x = Math.min(Math.max(ship.x, LAYOUT.wallLeft), LAYOUT.wallRight - ship.w);

  // 3. Missing the gap and hitting a dock sinks the ship.
  if (DOCKS.some((dock) => rectsOverlap(ship, dock))) {
    harbor.status = 'sunk';
    sinkShip(state, events);
    return;
  }

  // 4. Hitting an anchored ship costs Rep and sends you back to the start,
  //    unless the damage sinks the ship.
  if (harbor.obstacles.some((obstacle) => rectsOverlap(ship, obstacle))) {
    damageShip(state, CRASH_DAMAGE, events);
    if (isSunk(state)) {
      harbor.status = 'sunk';
      return;
    }
    ship.x = START.x;
    ship.y = START.y;
    harbor.crashTimer = CRASH_MESSAGE_TIME;
    return;
  }

  // 5. All the way past the docks means you made it in.
  if (ship.y > LAYOUT.dockTop + LAYOUT.dockHeight) {
    harbor.status = 'docked';
    events.emit('enteredHarbor', { city: harbor.city });
  }
}

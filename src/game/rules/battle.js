// The rules for a gun battle, as in the original game (its lines 1950-3080):
// aim, fire, and trade shots until the enemy sinks or strikes her flag.
//
// A battle is a plain object:
//   enemy   the ship from sea.js; its repair, guns and men go down as it's hit
//   wind    { side, length, strength }: side and length are -1, 0 or 1 and
//           say where the wind comes FROM (side 1 = from the right, length 1
//           = from behind you); strength is 1-10, or 0 when it's calm
//   aim     { elevation, side }: elevation -30..30, where lower (aiming
//           higher) shoots further; side -50..50, where higher aims further
//           right
//
// Random numbers come from a `random` function returning 0..1, so tests can
// decide what happens.
import { damageShip, isSunk, loseGun, loseMen, moraleFactor } from './ship.js';

const MAX_ELEVATION = 30;
const MAX_SIDE = 50;
const BASE_RANGE = 700; // how far a level shot goes, with no wind
const HIT_DEPTH = 50; // a shot hits if it lands up to this far beyond the enemy
const MAX_SIDEWAYS = 20;
const SINKS_BELOW = 15; // enemy Rep below this: she sinks

// Start a battle with a ship: new wind, sights straight ahead.
export function startBattle(enemy, random = Math.random) {
  const side = Math.floor(3 * random()) - 1;
  const length = Math.floor(3 * random()) - 1;
  const strength = 1 + Math.floor(random() * 10);
  const calm = side === 0 && length === 0;
  return {
    enemy,
    wind: { side, length, strength: calm ? 0 : strength },
    aim: { elevation: 0, side: 0 },
  };
}

// Move the sights, within their limits.
export function moveAim(battle, dElevation, dSide) {
  const { aim } = battle;
  aim.elevation = clamp(aim.elevation + dElevation, MAX_ELEVATION);
  aim.side = clamp(aim.side + dSide, MAX_SIDE);
}

// Break off the battle. The ships drift to a new distance; the enemy keeps
// her damage, ready for whatever you choose next.
export function breakOff(battle, random = Math.random) {
  battle.enemy.distance = 500 + Math.floor(random() * 500);
}

// Fire a broadside. The enemy fires back first, then your shot lands.
//
// Returns what happened:
//   {
//     enemyFire: { repair, men, gun },   what you lost (gun: true if one was)
//     shot: null if you were sunk first, otherwise
//           { lands: 'left' | 'right' | 'short' | 'long' }, or
//           { lands: 'hit', damage, menKilled }
//     outcome: null (the battle goes on), 'sunk' (she went down, and you got
//              `points`), 'surrender' (she strikes her flag) or 'lost'
//              (you went down)
//     points:  points earned, when she sank
//   }
// and tells the same as a 'shotFired' event.
export function fire(battle, state, events, random = Math.random) {
  const result = {
    enemyFire: enemyFires(battle.enemy, state, events, random),
    shot: null,
    outcome: null,
    points: 0,
  };
  if (isSunk(state)) {
    result.outcome = 'lost';
  } else {
    result.shot = landShot(battle, state, random);
    if (result.shot.lands === 'hit') {
      result.outcome = hitEnemy(battle.enemy, state, result.shot, random);
    }
    if (result.outcome === 'sunk') {
      result.points = Math.floor(battle.enemy.money / 10);
      state.points += result.points;
    }
  }
  events.emit('shotFired', result);
  return result;
}

// The enemy's broadside: Rep and men, each with a 60% chance, and sometimes
// a gun. Stops if you're sunk.
function enemyFires(enemy, state, events, random) {
  const morale = moraleFactor(state);
  const lost = { repair: 0, men: 0, gun: false };

  if (random() > 0.4) {
    lost.repair = Math.floor((enemy.guns / 1.3) * morale) + Math.floor(state.difficulty * random() * 0.5);
    if (lost.repair > 0) damageShip(state, lost.repair, events);
    if (isSunk(state)) return lost;
  }
  if (random() > 0.4) {
    lost.men = Math.floor((enemy.guns / 1.4) * morale) + Math.floor(state.difficulty * random() * 0.5);
    if (lost.men > 0) loseMen(state, lost.men, events);
    if (isSunk(state)) return lost;
  }
  if (100 * random() < state.difficulty + enemy.guns / 5) lost.gun = loseGun(state);
  return lost;
}

// Where your shot lands. Sideways: the wind pushes it, aiming to the other
// side makes up for it. Range: elevation, wind from behind or ahead, and some
// luck either way.
function landShot({ enemy, wind, aim }, state, random) {
  const pushed = Math.floor(wind.strength * wind.side);
  const sideways = clamp(pushed + Math.floor(wind.side * 2 * random() - 0.2 * aim.side), MAX_SIDEWAYS);
  const allowed = sidewaysAllowed(state.difficulty);
  if (sideways > allowed) return { lands: 'left' };
  if (sideways < -allowed) return { lands: 'right' };

  const luck = Math.floor(50 * random()) - Math.floor(50 * random());
  const range = BASE_RANGE + wind.strength * wind.length * 10 - 10 * aim.elevation + luck;
  const beyond = range - enemy.distance;
  if (beyond < 0) return { lands: 'short' };
  if (beyond > HIT_DEPTH) return { lands: 'long' };
  return { lands: 'hit', beyond };
}

// How far off sideways a shot may be and still hit: less as it gets harder.
function sidewaysAllowed(difficulty) {
  if (difficulty <= 4) return 2;
  if (difficulty <= 6) return 1;
  return 0;
}

// A hit: she loses Rep, guns and men. Returns 'sunk', 'surrender' or null.
// Fills in the shot's damage and menKilled.
function hitEnemy(enemy, state, shot, random) {
  const { difficulty } = state;

  shot.damage = Math.floor((2 * state.guns) / difficulty) + shot.beyond;
  enemy.repair -= shot.damage;
  enemy.guns = Math.max(0, enemy.guns - Math.floor((random() * 10) / difficulty));

  if (enemy.guns < 1) return 'surrender';
  if (enemy.repair < SINKS_BELOW) return 'sunk';
  if (enemy.repair < 40 - difficulty) return 'surrender';

  const share = (state.guns - shot.beyond / 5 + 10 * random()) / 100;
  shot.menKilled = Math.max(0, Math.floor(0.9 * enemy.men * share));
  enemy.men -= shot.menKilled;
  if (enemy.men < 20) return 'surrender';
  return null;
}

function clamp(value, limit) {
  return Math.min(Math.max(value, -limit), limit);
}

// What the game sounds like: which events make which sounds. The rules and
// scenes don't know about sound; they announce what happened, and this file
// listens. main.js connects it once:
//
//   connectSounds(game.events, game.sound);
//
// The sounds are the original's. It made them with BASIC's SOUND statement,
// a frequency and a length in clock ticks (18.2 a second), often in a loop
// that slid the frequency up or down: a sweep, here. The numbers in the
// comments are the original's lines in KAPER.BAS.
//
// Neon plays them on synths instead of the PC speaker (the engine's voices,
// see Sound.setVoices): the tunes on a sawtooth, its bright edge softened by
// a low-pass filter, with an echo; the effects on a triangle wave, rounder
// than the speaker's square. Same notes, same timing.

import { BOARDING, END, FOG, HELP, MARCH, PROMOTION, TITLE } from './music.js';
import { EVENTS } from './events.js';

const BEEP = { frequency: 800, duration: 0.25 }; // BASIC's BEEP

export const VOICES = {
  // A triangle is quieter than a square at the same volume, so a little more.
  effects: { wave: 'triangle', volume: 0.12 },
  music: { wave: 'sawtooth', volume: 0.08, filter: 1800, echo: { delay: 0.22, feedback: 0.35 } },
};

export function connectSounds(events, sound) {
  sound.setVoices(VOICES);

  // The tunes (music.js).
  events.on(EVENTS.titleShown, () => sound.music(TITLE));
  events.on(EVENTS.helpOpened, () => sound.music(HELP));
  events.on(EVENTS.fogInvestigated, () => sound.music(FOG));
  events.on(EVENTS.promoted, () => sound.music(PROMOTION));

  // 3100, 2950: the boarding tune every round; the march after it when she
  // strikes her flag.
  events.on(EVENTS.boardingRound, ({ outcome }) => {
    sound.music(outcome === 'surrender' ? BOARDING + MARCH : BOARDING);
  });

  // 1225: running aground, a falling whine.
  events.on(EVENTS.shipRanAground, () => sound.sweep(500, 100, 0.22));

  // 1450: a gust in the harbor, a short rising whistle.
  events.on(EVENTS.harborGust, () => sound.sweep(2000, 2500, 0.14));

  // 1730: hitting a ship in the harbor, a rattle.
  events.on(EVENTS.harborCrash, () => sound.noise(0.3));

  // 1629: "Det har du ikke råd til!", "Det er for mange!", "Så mange har
  // du ikke!".
  events.on(EVENTS.tradeRefused, () => sound.tone(BEEP.frequency, BEEP.duration));

  // 1890: fleeing, two falling whines together, and a thump.
  events.on(EVENTS.fled, () => {
    const length = sound.sweep(1600, 200, 1.4);
    sound.sweep(2200, 800, 1.4);
    sound.tone(50, 0.03, { delay: length });
  });

  // 2260 and 2680: your broadside, a crack and a roar; then a splash for
  // every point of damage the enemy did you, at most 10; then, 2950 and
  // 3050, the march if she strikes her flag or sinks.
  events.on(EVENTS.shotFired, ({ enemyFire, outcome }) => {
    sound.sweep(60, 1200, 0.06);
    const cannon = sound.noise(0.25);
    const { repair, men, gun } = enemyFire;
    const splashes = Math.min(10, repair + men + (gun ? 1 : 0));
    for (let i = 0; i < splashes; i++) {
      const delay = cannon + 0.15 + i * 0.12;
      sound.tone(60, 0.055, { delay });
      sound.tone(12000, 0.055, { delay: delay + 0.055 });
    }
    if (outcome === 'sunk' || outcome === 'surrender') {
      sound.music(MARCH, { delay: cannon + 0.3 + splashes * 0.12 });
    }
  });

  // 1755, 1760, 1780: the game is over, however it ended: a quick falling
  // whine, then the end tune. Giving up skips the whine, as the original's
  // Esc jumped straight to the tune.
  events.on(EVENTS.gameOver, ({ ending }) => {
    const whine = ending === 'quit' ? 0 : sound.sweep(5000, 200, 0.13);
    sound.music(END, { delay: whine });
  });
}

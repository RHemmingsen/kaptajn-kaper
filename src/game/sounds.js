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

const BEEP = { frequency: 800, duration: 0.25 }; // BASIC's BEEP

export function connectSounds(events, sound) {
  // 1225: running aground, a falling whine.
  events.on('shipRanAground', () => sound.sweep(500, 100, 0.22));

  // 1450: a gust in the harbor, a short rising whistle.
  events.on('harborGust', () => sound.sweep(2000, 2500, 0.14));

  // 1629: "Det har du ikke råd til!", "Det er for mange!", "Så mange har
  // du ikke!".
  events.on('tradeRefused', () => sound.tone(BEEP.frequency, BEEP.duration));

  // 1890: fleeing, two falling whines together, and a thump.
  events.on('fled', () => {
    const length = sound.sweep(1600, 200, 1.4);
    sound.sweep(2200, 800, 1.4);
    sound.tone(50, 0.03, { delay: length });
  });

  // 2260 and 2680: your broadside, a crack and a roar; then a splash for
  // every point of damage the enemy did you, at most 10.
  events.on('shotFired', ({ enemyFire }) => {
    sound.sweep(60, 1200, 0.06);
    const cannon = sound.noise(0.25);
    const { repair, men, gun } = enemyFire;
    const splashes = Math.min(10, repair + men + (gun ? 1 : 0));
    for (let i = 0; i < splashes; i++) {
      const delay = cannon + 0.15 + i * 0.12;
      sound.tone(60, 0.055, { delay });
      sound.tone(12000, 0.055, { delay: delay + 0.055 });
    }
  });

  // 1755: the game is over, a quick falling whine.
  events.on('gameOver', () => sound.sweep(5000, 200, 0.13));
}

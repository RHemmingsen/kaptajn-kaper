// The original's tunes, as it wrote them for BASIC's PLAY statement (see
// engine/mml.js). The strings are copied verbatim from KAPER.BAS; the numbers
// in the comments are its lines.
//
// One thing needed care: PLAY remembers its settings (tempo, note length,
// octave, staccato) from one PLAY to the next, and some of the original's
// tunes count on that. Where a tune doesn't set everything itself, what the
// original still had set is put in front, separately, as AFTER_TITLE or
// AFTER_MARCH.

// The title tune sets staccato (MS), and only the end tune ever changes it.
const AFTER_TITLE = 'MS';

// The march sets tempo 180 and quarter notes. Promotions come after points,
// and points mostly after a victory, so this is what a promotion usually
// had set.
const AFTER_MARCH = 'T180L4MS';

// 104, 105, 135, 150, 285: played in five parts while the original loaded
// its pictures and drew the map; here, one tune.
export const TITLE = [
  'T230L8MBMSCO3BO4C4O3CP8C4GFEGO4CP8CEDCD4O3D4D4O4D',
  'CO3BDGDG4ABO4C32D32C16O3BAGA32B32A16GFEF32G32F16EDCDCO2BAGO3CO2BO3DCEDFE16F16EC4C4',
  'T230L8MBMSO3gfego4co3gego4co3ga16b16af4f4p16',
  'T230L8MBMSO3agf+ao4do3af+ao4do3ab16o4c16o3bg4g4p16',
  'O3fga32b32a16gfef32g32f16edcd32e32d16co2bo3CDCO2BAGO3CO2BO3DCEDFE16F16EC4C4',
].join('');

// 2470: you sail into the fog bank.
export const FOG = AFTER_TITLE + 'MBT200O2L8GGGE-2.P8FFFD2.';

// 2950, 3050: she strikes her flag, or sinks.
export const MARCH = AFTER_TITLE + 'T180MBO2L4G.G8O3C1P4O2G.O3C8E1P4O2G.O3C8E2O2G.O3C8E2O2G.O3C8E1P2C.O3E8G1.O2G.G8O3C1';

// 3100: every round of fighting on her deck.
export const BOARDING = AFTER_TITLE + 'MBT200L16O3CEGO4C..O3GO4C4';

// 6100: a promotion.
export const PROMOTION = AFTER_MARCH + 'O3CEGO4CO3GEC2';

// 8000: the help opens.
export const HELP = AFTER_TITLE + 'mbo3t100c8f4c8f4';

// 1760, 1780: the game is over, however it ended.
export const END = 'O2T85MBMNL8B.A16G4D4G.B16A4.P8B.O3C16D4E4D.C16O2B4P4' + 'O3E.D16DCO2BAG2BAG2';

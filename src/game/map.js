// The Kattegat, as a tile map. North is up.
//
//   .  water
//   #  land
//
// Top left is Norway, the left side is Jutland, the right side is Sweden and
// the bottom is Funen and Zealand, with Øresund running between Zealand and
// Sweden. The two small islands are Læsø and Anholt.
export const MAP_ROWS = [
  '############..........#############',
  '##########............#############',
  '#######................############',
  '####...................############',
  '####..................#############',
  '##########..............###########',
  '#########...............###########',
  '#########.....##........###########',
  '########......#.........###########',
  '########.................##########',
  '########..................#########',
  '#########........#........#########',
  '###########................########',
  '############...............########',
  '########..........#####....########',
  '########........#########..########',
  '#######........##########..########',
  '#######........##########..########',
  '######..####..###########...#######',
  '######.######.###########...#######',
];

// Ports sit on land tiles next to the water. The ship is allowed to sail
// into a port tile even though it's land.
export const CITIES = [
  { name: 'Skagen', col: 9, row: 5 },
  { name: 'Frederikshavn', col: 8, row: 7 },
  { name: 'Aarhus', col: 7, row: 14 },
  { name: 'Göteborg', col: 24, row: 5 },
  { name: 'Halmstad', col: 27, row: 12 },
  { name: 'Helsingborg', col: 27, row: 15 },
  { name: 'Helsingør', col: 24, row: 15 },
  { name: 'København', col: 24, row: 17 },
  { name: 'Malmö', col: 28, row: 18 },
];

export function cityAt(col, row) {
  return CITIES.find((city) => city.col === col && city.row === row) ?? null;
}

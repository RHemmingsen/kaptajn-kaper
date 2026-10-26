import { TileMap } from '../engine/TileMap.js';

// The southern Kattegat and Øresund, as a tile map. North is up.
//
//   .  water
//   #  land
//
// The grid, the ports and the start cell follow the original game: 29 columns
// by 14 rows, numbered from 1 (so the top-left cell is column 1, row 1). The
// coastlines are our own.
//
// Top left is Djursland and Mols, below them Samsø. The bottom is Zealand,
// with Odsherred and Isefjord, and Sejerø off its west coast. The right side
// is Sweden with Kullen, and Hven and Saltholm lie in Øresund.
export const MAP_ROWS = [
  '#########................####', // 1
  '#######...................###', // 2
  '#######................######', // 3
  '##...##...................###', // 4
  '##.#......................###', // 5
  '##........................###', // 6
  '##.................######..##', // 7
  '##...#...........########..##', // 8
  '##...##...#.....#.######..#.#', // 9
  '##...##........##.######....#', // 10
  '##....#......####.######....#', // 11
  '#.........###############...#', // 12
  '..........###############..#.', // 13
  '...........##############....', // 14
];

export const KATTEGAT = new TileMap(MAP_ROWS);

// The tile at a map cell, using the 1-based numbering. Outside the map: null.
export function tileAt(col, row) {
  return KATTEGAT.get(col - 1, row - 1);
}

// The original's seven ports. They sit on land next to the water, and the
// ship is allowed to sail into a port even though it's land.
export const CITIES = [
  { name: 'København', col: 25, row: 12 },
  { name: 'Helsingør', col: 25, row: 7 },
  { name: 'Hundested', col: 18, row: 8 },
  { name: 'Grenå', col: 9, row: 1 },
  { name: 'Ebeltoft', col: 7, row: 4 },
  { name: 'Kalundborg', col: 11, row: 13 },
  { name: 'Mölle', col: 24, row: 3 },
];

export function cityAt(col, row) {
  return CITIES.find((city) => city.col === col && city.row === row) ?? null;
}

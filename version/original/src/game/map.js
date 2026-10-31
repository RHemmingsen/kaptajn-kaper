import { TileMap } from 'engine/TileMap.js';

// The southern Kattegat and Øresund, as a sea chart. North is up.
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
  '########..................###', // 2
  '###.###................######', // 3
  '##..###.................#####', // 4
  '##.#..#..................####', // 5
  '##...................###..###', // 6
  '##.................#####..###', // 7
  '##...#......##...#######...##', // 8
  '##...##...#...###.######...##', // 9
  '##...##.......###.######....#', // 10
  '#....##.....#####.######....#', // 11
  '#.#......################...#', // 12
  '..........###############.#..', // 13
  '...........##############....', // 14
];

// The original's seven ports. They sit on land next to the water, and the
// ship is allowed to sail into a port even though it's land. Prizes you take
// sail to the prize port, where their crews and prize money wait for you.
export const CITIES = [
  { name: 'København', col: 25, row: 12, prizePort: true },
  { name: 'Helsingør', col: 25, row: 7 },
  { name: 'Hundested', col: 18, row: 8 },
  { name: 'Grenå', col: 9, row: 1 },
  { name: 'Ebeltoft', col: 7, row: 4 },
  { name: 'Kalundborg', col: 11, row: 13 },
  { name: 'Mölle', col: 24, row: 3 },
];

// A sea chart: a grid of water and land, and the ports on it. The sailing
// rules ask it where the ship can go, and are handed the chart they sail on
// (KATTEGAT in the game, a tiny one in the tests).
//
// Cells are numbered from 1, as in the original: column 1, row 1 is the top
// left. The whole game uses those numbers (the ship, the ports, docs/), so
// they can be compared with the original's directly. Only the chart knows
// that the engine's TileMap underneath counts from 0.
export class SeaChart {
  // `rows` as for TileMap ('.' water, '#' land); `cities` as CITIES below.
  constructor(rows, cities) {
    this.tiles = new TileMap(rows);
    this.cities = cities;
    this.width = this.tiles.width;
    this.height = this.tiles.height;
  }

  // '.' or '#' at a cell; null outside the chart.
  tileAt(col, row) {
    return this.tiles.get(col - 1, row - 1);
  }

  // The port at a cell, or null.
  cityAt(col, row) {
    return this.cities.find((city) => city.col === col && city.row === row) ?? null;
  }

  // Water is always sailable. Ports are on land, but you can sail into them.
  canSailTo(col, row) {
    return this.tileAt(col, row) === '.' || this.cityAt(col, row) !== null;
  }
}

export const KATTEGAT = new SeaChart(MAP_ROWS, CITIES);

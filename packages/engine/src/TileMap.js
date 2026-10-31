// A grid of tiles, built from an array of strings where each character is one
// tile. For example:
//
//   ['###..',
//    '##...']
//
// is a 5x2 map. The engine doesn't care what the characters mean; that's up to
// the game. TileMap only answers "what is at column c, row r?".
export class TileMap {
  constructor(rows) {
    this.rows = rows;
    this.height = rows.length;
    this.width = rows[0].length;

    // A row with the wrong length is almost always a typo, so fail loudly.
    rows.forEach((row, i) => {
      if (row.length !== this.width) {
        throw new Error(`TileMap row ${i} has length ${row.length}, expected ${this.width}`);
      }
    });
  }

  inBounds(col, row) {
    return col >= 0 && row >= 0 && col < this.width && row < this.height;
  }

  // The tile character at (col, row), or null outside the map.
  get(col, row) {
    if (!this.inBounds(col, row)) return null;
    return this.rows[row][col];
  }
}

import { Screen } from '../../engine/Screen.js';
import { TileMap } from '../../engine/TileMap.js';
import { COLORS, FONT } from '../palette.js';
import { MAP_ROWS, cityAt, CITIES } from '../map.js';
import { TitleScreen } from './TitleScreen.js';

// Size of one tile in pixels, and where the top-left corner of the map is
// drawn on the canvas.
const TILE = 16;
const MAP_X = 30;
const MAP_Y = 26;

// Which way each arrow key moves the ship, as [columns, rows].
const DIRECTIONS = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
};

// The main screen: sail the ship around the Kattegat, one tile per key press.
// Each step costs one move (Træk).
export class MapScreen extends Screen {
  constructor(game, state) {
    super(game);
    this.state = state;
    this.map = new TileMap(MAP_ROWS);
  }

  update(dt) {
    const input = this.game.input;

    if (input.wasPressed('Escape')) {
      this.game.setScreen(new TitleScreen(this.game));
      return;
    }

    for (const [key, [dCol, dRow]] of Object.entries(DIRECTIONS)) {
      if (input.wasPressed(key)) this.trySail(dCol, dRow);
    }
  }

  trySail(dCol, dRow) {
    const ship = this.state.ship;
    const col = ship.col + dCol;
    const row = ship.row + dRow;

    if (!this.canSailTo(col, row)) return;

    ship.col = col;
    ship.row = row;
    this.state.moves += 1;
  }

  canSailTo(col, row) {
    return this.map.get(col, row) === '.' || cityAt(col, row) !== null;
  }

  // --- Drawing -------------------------------------------------------------

  render(ctx) {
    ctx.fillStyle = COLORS.blue;
    ctx.fillRect(0, 0, this.game.width, this.game.height);

    this.drawFrame(ctx);
    this.drawMap(ctx);
    this.drawCities(ctx);
    this.drawShip(ctx);
    this.drawStatus(ctx);
  }

  drawFrame(ctx) {
    const s = this.state;

    ctx.strokeStyle = COLORS.green;
    ctx.lineWidth = 12;
    ctx.strokeRect(23, 19, 574, 335);

    // Labels sit on top of the green frame, each on its own blue patch.
    label(ctx, `Point: ${s.points}`, 44, 19);
    label(ctx, `Mål: ${s.goal} på ${s.maxMoves} træk`, 262, 19);
    label(ctx, 'F1:Hjælp', 44, 354);
    label(ctx, 'F2:lyd', 262, 354);
    label(ctx, 'Esc:Slut', 466, 354);
  }

  drawMap(ctx) {
    const w = this.map.width * TILE;
    const h = this.map.height * TILE;

    // 1. Fill the whole map area with water.
    ctx.fillStyle = COLORS.blue;
    ctx.fillRect(MAP_X, MAP_Y, w, h);

    // 2. Draw grid lines over all of it.
    ctx.strokeStyle = COLORS.cyan;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let col = 0; col <= this.map.width; col++) {
      const x = MAP_X + col * TILE + 0.5; // +0.5 keeps 1px lines sharp
      ctx.moveTo(x, MAP_Y);
      ctx.lineTo(x, MAP_Y + h);
    }
    for (let row = 0; row <= this.map.height; row++) {
      const y = MAP_Y + row * TILE + 0.5;
      ctx.moveTo(MAP_X, y);
      ctx.lineTo(MAP_X + w, y);
    }
    ctx.stroke();

    // 3. Paint land tiles on top, which hides the grid on land.
    ctx.fillStyle = COLORS.brown;
    for (let row = 0; row < this.map.height; row++) {
      for (let col = 0; col < this.map.width; col++) {
        if (this.map.get(col, row) === '#') {
          ctx.fillRect(MAP_X + col * TILE, MAP_Y + row * TILE, TILE, TILE);
        }
      }
    }
  }

  drawCities(ctx) {
    ctx.fillStyle = COLORS.red;
    for (const city of CITIES) {
      const [x, y] = tileCenter(city.col, city.row);
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // When the ship is in port, show the city's name.
    const city = cityAt(this.state.ship.col, this.state.ship.row);
    if (city) {
      const [x, y] = tileCenter(city.col, city.row);
      label(ctx, city.name, x - 20, y - 18, COLORS.white);
    }
  }

  drawShip(ctx) {
    const x = MAP_X + this.state.ship.col * TILE;
    const y = MAP_Y + this.state.ship.row * TILE;

    // Hull.
    ctx.fillStyle = COLORS.red;
    ctx.beginPath();
    ctx.moveTo(x + 1, y + 10);
    ctx.lineTo(x + 15, y + 10);
    ctx.lineTo(x + 12, y + 14);
    ctx.lineTo(x + 4, y + 14);
    ctx.closePath();
    ctx.fill();

    // Sail and pennant.
    ctx.fillStyle = COLORS.white;
    ctx.beginPath();
    ctx.moveTo(x + 8, y + 2);
    ctx.lineTo(x + 8, y + 9);
    ctx.lineTo(x + 3, y + 9);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(x + 8, y + 2, 1, 8);
    ctx.fillStyle = COLORS.green;
    ctx.fillRect(x + 9, y + 2, 4, 3);
  }

  drawStatus(ctx) {
    const s = this.state;

    // A 3x2 table below the map.
    const left = 16, right = 612, top = 388, bottom = 472;
    const cols = [left, 208, 424, right];
    const mid = (top + bottom) / 2;

    ctx.strokeStyle = COLORS.salmon;
    ctx.lineWidth = 2;
    ctx.strokeRect(left, top, right - left, bottom - top);
    ctx.beginPath();
    ctx.moveTo(left, mid);
    ctx.lineTo(right, mid);
    for (const x of cols.slice(1, -1)) {
      ctx.moveTo(x, top);
      ctx.lineTo(x, bottom);
    }
    ctx.stroke();

    const cells = [
      [`Træk: ${s.moves}`, `Rgsdl: ${s.money}`, `Korn: ${s.grain}`],
      [`Mænd: ${s.men}`, `Skyts: ${s.guns}`, `Rep: ${s.repair}`],
    ];
    ctx.fillStyle = COLORS.salmon;
    ctx.font = `bold 20px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    cells.forEach((rowCells, r) => {
      rowCells.forEach((text, c) => {
        ctx.fillText(text, cols[c] + 14, top + (r + 0.5) * (mid - top));
      });
    });
  }
}

// Pixel position of the middle of a tile.
function tileCenter(col, row) {
  return [MAP_X + col * TILE + TILE / 2, MAP_Y + row * TILE + TILE / 2];
}

// Text on a blue background patch, so it stays readable on top of anything.
function label(ctx, text, x, y, color = COLORS.salmon) {
  ctx.font = `bold 20px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const w = ctx.measureText(text).width;
  ctx.fillStyle = COLORS.blue;
  ctx.fillRect(x - 4, y - 11, w + 8, 22);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

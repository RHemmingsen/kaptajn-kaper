// The Kattegat map, rebuilt from the original game's BUILD.BAS.
//
// The original drew its map with BASIC's DRAW command (coastlines) and PAINT
// (filling in the land), and we do the same: the commands below are copied
// from BUILD.BAS. Coordinates are the original's 320x200 screen pixels.
//
// The map is a grid of 10x10-pixel cells. The ship can be on columns 1-29 and
// rows 1-14, which covers the original's map box from (10, 10) to (300, 150).
import { Bitmap } from '../engine/Bitmap.js';
import { TileMap } from '../engine/TileMap.js';
import { drawCommandsToSegments } from '../engine/drawCommands.js';

export const CELL = 10; // original pixels per cell
export const COLS = 29;
export const ROWS = 14;

// Top-left corner of the map box, in original pixels.
const ORIGIN_X = 10;
const ORIGIN_Y = 10;

// BUILD.BAS lines 140-440: the coastlines, in the original order. The pen
// carries over from one string to the next.
const COASTLINES = [
  // Djursland, Ebeltoft, Aarhus
  'BM98,10 D3G1 D2 F1D3 G2L1 G2 M80,40 D2 G2 M75,60 L2 H2 M65,57 E2 M70,50',
  'U2 H1 U1 H2 L2 M60,50 F2 G1F2 M60,65 R3 F2 G3 L1 D1 L1 H1 L1 H1',
  'E2 R2 E2 U3 H2 M53,52 H2 L2 G2 M45,58 G1 L4 H2 U3 E2 R3 E1 U3 M50,40',
  'U1 H2 L1 H1 L2 M40,40 D2L1G1D2M30,50G2 D2 M30,60',
  'G1 D1 M31,70 F2 D2 G1 M34,78 D1 G2 D2 F2 D1 G2 M30,97',
  'D1 G3 D2 M24,108 G1 L2 H3 L1 H1 M10,104',
  // Jutland south of Aarhus
  'BM10,109 R2 F1 R1 F2 M12,121 R1 E1 D2 M10,132',
  // Endelave
  'BM35,117R1 F1D2 G1 M38,124 F1 D1 G1 L1 M30,127H1U1E1R3U2E1U2M35,117',
  // Skåne and Halland
  'BM262,10F3D1F1D1F1G2M270,20D4F1D1F3M276,30',
  'D2G2M271,40G1L6H1L2M250,28M244,26L1D1F4M250,40D2F1M252,50',
  'D1 F1R2F2M270,73D5F1D1G1M270,86',
  'R1F2R2M280,100R1F1R1F1M290,115D2F1M300,124',
  // Samsø
  'BM60,120H1U1E1M61,110U3R1H2E3M65,100U1UH2U3M56,90U6M62,80',
  'D3F1D2M62,90F2R2M71,93G3D3R1M73,100E1D2G2D1G1D1G1M70,117F2D1G2M60,120',
  // Zealand, Lammefjord, Roskilde, Hundested, København
  'BM120,150U4E1H2L4',
  'M100,140U1R15E2U4H1U1H3L2M107,130L3H2L1G2M93,127M102,123R1F1R1F2M110,125',
  'R1E1R1E2M120,122R1F1R1F2M130,127E1U1E1U1M140,120U2H1U2G1U2H1U2E3M145,105',
  'R4E1R1E2M153,100U2H1U1H2M147,90L1G1M135,87M127,80R1M135,84R1F1M147,87M157,90',
  'R2E1R1E2M165,87R1F2R1M177,90D2L1D3F1D1M170,98D3G2M174,110',
  'L2H1L1G3D1G1D1R2F1M174,112F2D2F1G1L1G1L1G1D1R1E1R1E4D1E1M184,127',
  'E4M188,118L3U4E2R1U1M192,106L3H2E3U1H2M187,91E1R2E1',
  'M200,95D2G2D1M200,100M205,120D2G1L3G3D1M210,132',
  'M212,127H2M209,114U4R1M206,108E1U2E1U2M203,95U2M207,90U3H1U1H3M200,83L1G1M187,86L1H1U3',
  'U1E1M190,80E2R2M205,70R2E2U1M220,58',
  'R3F1R1M245,62F2D1M253,69F1D1G1M250,80G1D1G1D2M247,94M252,100G1D1F1M258,119',
  'F2D2G2D2M266,145M262,150BM247,150H2M250,132H2G4L2M227,150',
  // Saltholm, Hven, Sejerø
  'BM275,134M279,144L1H4M275,134',
  'BM260,89F3M268,96D1G2L2H3M260,89',
  'BM110,90F2R1F1R2M121,100D2L2H1M110,90',
];

// BUILD.BAS lines 200-440: one point inside each piece of land, to flood-fill.
const LAND_FILLS = [
  [11, 11], [60, 68], [11, 112], [34, 125], [290, 50], [62, 118],
  [60, 87], [150, 140], [275, 140], [263, 96], [119, 100],
];

// Draw the land into a bitmap, scaled so one original pixel becomes
// scaleX x scaleY bitmap pixels, with the map box's corner at (0, 0).
export function drawLand(bitmap, scaleX, scaleY, color) {
  const tx = (x) => (x - ORIGIN_X) * scaleX;
  const ty = (y) => (y - ORIGIN_Y) * scaleY;

  for (const s of drawCommandsToSegments(COASTLINES)) {
    bitmap.line(tx(s.x0), ty(s.y0), tx(s.x1), ty(s.y1), color);
  }
  // The bitmap's own edges are the map box, so the fills stop there.
  for (const [x, y] of LAND_FILLS) bitmap.fill(tx(x), ty(y), color, color);
}

// BUILD.BAS lines 450-456 and KAPER.BAS line 750-790: the seven ports.
export const CITIES = [
  { name: 'København', col: 25, row: 12, big: true },
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

// The tile map used for sailing: '.' water, '#' land. A cell is land when
// more than half of it is land in the drawing, so what you see is what you
// hit. Row 0 and column 0 are outside the map box, so they're marked as land
// to keep the ship inside, as the original did.
function buildTileMap() {
  const bitmap = new Bitmap(COLS * CELL, ROWS * CELL);
  drawLand(bitmap, 1, 1, 1);

  const rows = ['#'.repeat(COLS + 1)];
  for (let row = 1; row <= ROWS; row++) {
    let line = '#';
    for (let col = 1; col <= COLS; col++) {
      let land = 0;
      for (let y = 0; y < CELL; y++) {
        for (let x = 0; x < CELL; x++) {
          if (bitmap.get((col - 1) * CELL + x, (row - 1) * CELL + y)) land++;
        }
      }
      line += land > (CELL * CELL) / 2 ? '#' : '.';
    }
    rows.push(line);
  }
  return new TileMap(rows);
}

export const KATTEGAT = buildTileMap();

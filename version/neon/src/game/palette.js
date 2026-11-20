// The game's colours: neon on a synthwave night. Every scene draws with
// these, so this file sets most of the look. The names are the original
// version's (its palette.js), so the drawing code is the same in both;
// what they stand for here is in the comments.
export const COLORS = {
  blue: '#12002b', // the night: the background
  white: '#f4ecff', // headings, and anything that should stand out
  magenta: '#ff2bd6', // hot pink
  cyan: '#00eaff', // electric blue
  red: '#ff3864', // ports, the sights
  brown: '#7a2cff', // the docks in the harbor: violet
  green: '#b46bff', // the map's frame: purple
  salmon: '#ff8ad8', // most text: soft pink
};

export const FONT = '"Courier New", Courier, monospace';

// The synthwave sunset behind the title and the ending (ui/synthwave.js):
// the sky from top to horizon, the sun from top to bottom, and the grid.
export const SUNSET = {
  skyTop: '#0b0020',
  skyHorizon: '#2a0050',
  sunTop: '#ffd319',
  sunMiddle: '#ff2bd6',
  sunBottom: '#8c1eff',
  grid: '#ff2bd6',
  // Behind text that sits on the sunset, so it can still be read.
  shade: 'rgba(18, 0, 43, 0.82)',
};

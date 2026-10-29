// How the record is written, wherever it's shown.

// "Rekorden er 5000 point, sat af Ronnie." The first version kept no name.
export function recordLine({ points, name }) {
  return name ? `Rekorden er ${points} point, sat af ${name}.` : `Rekorden er ${points} point.`;
}

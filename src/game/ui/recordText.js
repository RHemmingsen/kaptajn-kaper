// How the record is written, wherever it's shown.

// "Rekorden er 5000 point, sat af Ronnie." The first version kept no name.
// `record` is { points, name }, or null if there's none yet.
export function recordLine(record) {
  if (!record) return 'Der er ingen rekord endnu.';
  const { points, name } = record;
  return name ? `Rekorden er ${points} point, sat af ${name}.` : `Rekorden er ${points} point.`;
}

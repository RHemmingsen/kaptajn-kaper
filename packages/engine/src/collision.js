// Collision between axis-aligned rectangles: boxes that aren't rotated, given
// as { x, y, w, h } with (x, y) the top-left corner.
//
// Two boxes overlap unless one is completely to the left, right, above or
// below the other. Most 2D games use this test for almost everything, with the
// box drawn a little tighter than the sprite so near-misses feel fair.
export function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.w &&
    b.x < a.x + a.w &&
    a.y < b.y + b.h &&
    b.y < a.y + a.h
  );
}

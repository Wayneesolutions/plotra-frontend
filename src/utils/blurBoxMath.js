// Box maths for FrontPhotoBlurEditor.jsx. A box is { x, y, w, h } as fractions
// of the photo (0..1), so it is independent of screen size and zoom. Pure.

export const MIN_FRAC = 0.03;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** Box after a drag of (dx, dy), given as fractions of the photo's size. */
export function dragBox(box, dx, dy, mode) {
  if (mode === 'resize') {
    return { ...box, w: clamp(box.w + dx, MIN_FRAC, 1 - box.x), h: clamp(box.h + dy, MIN_FRAC, 1 - box.y) };
  }
  return { ...box, x: clamp(box.x + dx, 0, 1 - box.w), y: clamp(box.y + dy, 0, 1 - box.h) };
}

import test from 'node:test';
import assert from 'node:assert';
import { dragBox, MIN_FRAC } from '../src/utils/blurBoxMath.js';

// Boxes live in fractions of the photo, so the same box lands on the same
// pixels whatever the screen size (21 Oct QA bug 1) or zoom (bug 2).
test('moving a box keeps it inside the photo', () => {
  const b = { x: 0.8, y: 0.1, w: 0.15, h: 0.1 };
  const m = dragBox(b, 0.5, -0.5, 'move');
  assert.ok(Math.abs(m.x - 0.85) < 1e-9 && m.y === 0 && m.w === 0.15 && m.h === 0.1);
});

test('resizing never goes past the edge or below the minimum', () => {
  const b = { x: 0.6, y: 0.6, w: 0.2, h: 0.2 };
  const big = dragBox(b, 1, 1, 'resize');
  assert.ok(Math.abs(big.w - 0.4) < 1e-9 && Math.abs(big.h - 0.4) < 1e-9);
  assert.deepStrictEqual(dragBox(b, -1, -1, 'resize'), { ...b, w: MIN_FRAC, h: MIN_FRAC });
});

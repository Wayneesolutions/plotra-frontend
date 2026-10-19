import test from 'node:test';
import assert from 'node:assert';
import { project, unproject, regionToRect, rectToRegion, focalLength } from '../src/utils/streetViewProjection.js';

const size = { width: 800, height: 500 };
const near = (a, b, eps, msg) => assert.ok(Math.abs(a - b) <= eps, `${msg}: ${a} vs ${b}`);

test('the point the camera faces lands in the middle of the screen', () => {
  const p = project({ heading: 123, pitch: 7 }, { heading: 123, pitch: 7 }, 1.5, size);
  near(p.x, 400, 0.01, 'x'); near(p.y, 250, 0.01, 'y');
});

test('looking right moves things left; looking up moves things down; behind the camera is null', () => {
  const pov = { heading: 0, pitch: 0 };
  assert.ok(project({ heading: 10, pitch: 0 }, pov, 1, size).x > 400, 'to the right of centre');
  assert.ok(project({ heading: 0, pitch: 10 }, pov, 1, size).y < 250, 'higher on screen');
  assert.strictEqual(project({ heading: 180, pitch: 0 }, pov, 1, size), null);
});

test('project then unproject returns the same angles, including across north', () => {
  for (const pov of [{ heading: 350, pitch: 10 }, { heading: 90, pitch: -8 }, { heading: 5, pitch: 40 }]) {
    for (const pt of [{ heading: pov.heading + 20, pitch: pov.pitch + 5 }, { heading: pov.heading - 25, pitch: pov.pitch - 6 }]) {
      const wrapped = { heading: (pt.heading + 360) % 360, pitch: pt.pitch };
      const back = unproject(project(wrapped, pov, 2, size), pov, 2, size);
      near(((back.heading - wrapped.heading + 540) % 360) - 180, 0, 1e-6, 'heading');
      near(back.pitch, wrapped.pitch, 1e-6, 'pitch');
    }
  }
});

test('a saved area keeps its size and place when drawn then re-read', () => {
  const pov = { heading: 40, pitch: 5 };
  const region = { heading: 44, pitch: 8, width: 10, height: 6 };
  const rect = regionToRect(region, pov, 1.6, size);
  const back = rectToRegion(rect, pov, 1.6, size);
  near(back.heading, region.heading, 0.3, 'heading'); near(back.pitch, region.pitch, 0.3, 'pitch');
  near(back.width, region.width, 0.3, 'width'); near(back.height, region.height, 0.3, 'height');
});

test('the same area follows the sign when the buyer looks around, and grows when zooming in', () => {
  const region = { heading: 30, pitch: 5, width: 8, height: 5 };
  const a = regionToRect(region, { heading: 30, pitch: 5 }, 1.5, size);
  const b = regionToRect(region, { heading: 45, pitch: 5 }, 1.5, size);
  assert.ok(b.left < a.left, 'turning right moves the box left');
  const zoomed = regionToRect(region, { heading: 30, pitch: 5 }, 2.5, size);
  assert.ok(zoomed.width > a.width * 1.9, 'one zoom level doubles the on-screen size');
  assert.strictEqual(focalLength(800, 2), 2 * focalLength(800, 1));
});

test('the live view pads the box so the whole sign stays covered', () => {
  const region = { heading: 0, pitch: 0, width: 10, height: 6 };
  const pov = { heading: 0, pitch: 0 };
  const plain = regionToRect(region, pov, 1.5, size, 0);
  const padded = regionToRect(region, pov, 1.5, size, 0.12);
  near(padded.width, plain.width * 1.24, 0.01, 'width +12% each side');
  assert.ok(padded.left < plain.left && padded.top < plain.top);
});

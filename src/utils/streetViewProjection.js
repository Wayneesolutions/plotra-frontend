// Maps between street-view angles (heading/pitch, degrees) and screen pixels,
// so a blur box stays on the same part of the house while the buyer looks
// around. Rectilinear model: the focal length (in pixels) doubles with each
// zoom level, with a 90 degree horizontal field of view at zoom 1.
//
// If a real device shows the boxes drifting from the sign when zooming, this
// is the one place to adjust (see FOCAL_AT_ZOOM_1).

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;
// Focal length at zoom 1 as a fraction of the viewport width (0.5 = 90 degree FOV).
const FOCAL_AT_ZOOM_1 = 0.5;

export function focalLength(width, zoom) {
  return width * FOCAL_AT_ZOOM_1 * 2 ** (zoom - 1);
}

function basis(heading, pitch) {
  const h = heading * RAD; const p = pitch * RAD;
  return {
    forward: [Math.cos(p) * Math.sin(h), Math.cos(p) * Math.cos(h), Math.sin(p)],
    right: [Math.cos(h), -Math.sin(h), 0],
    up: [-Math.sin(p) * Math.sin(h), -Math.sin(p) * Math.cos(h), Math.cos(p)],
  };
}
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/** Angles -> pixel on the viewport, or null if the point is behind the camera. */
export function project(point, pov, zoom, size) {
  const { forward, right, up } = basis(pov.heading, pov.pitch);
  const hh = point.heading * RAD; const pp = point.pitch * RAD;
  const d = [Math.cos(pp) * Math.sin(hh), Math.cos(pp) * Math.cos(hh), Math.sin(pp)];
  const depth = dot(d, forward);
  if (depth <= 0.05) return null;
  const f = focalLength(size.width, zoom);
  return { x: size.width / 2 + (f * dot(d, right)) / depth, y: size.height / 2 - (f * dot(d, up)) / depth };
}

/** Pixel on the viewport -> angles. */
export function unproject(pixel, pov, zoom, size) {
  const { forward, right, up } = basis(pov.heading, pov.pitch);
  const f = focalLength(size.width, zoom);
  const dx = pixel.x - size.width / 2; const dy = size.height / 2 - pixel.y;
  const r = [0, 1, 2].map((i) => forward[i] * f + right[i] * dx + up[i] * dy);
  const len = Math.hypot(r[0], r[1], r[2]);
  return {
    heading: (Math.atan2(r[0], r[1]) * DEG + 360) % 360,
    pitch: Math.asin(r[2] / len) * DEG,
  };
}

/**
 * The on-screen box for a saved area, or null if any corner is out of sight.
 * `pad` grows the box by that fraction each side (the live view adds a small
 * safety margin around what the dealer marked).
 */
export function regionToRect(region, pov, zoom, size, pad = 0) {
  const corners = [];
  for (const dh of [-0.5, 0.5]) {
    for (const dp of [-0.5, 0.5]) {
      const px = project({ heading: region.heading + dh * region.width, pitch: region.pitch + dp * region.height }, pov, zoom, size);
      if (!px) return null;
      corners.push(px);
    }
  }
  const xs = corners.map((c) => c.x); const ys = corners.map((c) => c.y);
  let left = Math.min(...xs); let right = Math.max(...xs);
  let top = Math.min(...ys); let bottom = Math.max(...ys);
  const padX = (right - left) * pad; const padY = (bottom - top) * pad;
  left -= padX; right += padX; top -= padY; bottom += padY;
  return { left, top, width: right - left, height: bottom - top };
}

/** The saved area (centre + size in degrees) for a box the dealer drew on screen. */
export function rectToRegion(rect, pov, zoom, size) {
  const cx = rect.left + rect.width / 2; const cy = rect.top + rect.height / 2;
  const center = unproject({ x: cx, y: cy }, pov, zoom, size);
  const left = unproject({ x: rect.left, y: cy }, pov, zoom, size);
  const right = unproject({ x: rect.left + rect.width, y: cy }, pov, zoom, size);
  const top = unproject({ x: cx, y: rect.top }, pov, zoom, size);
  const bottom = unproject({ x: cx, y: rect.top + rect.height }, pov, zoom, size);
  const dh = ((right.heading - left.heading + 540) % 360) - 180;
  return {
    heading: center.heading,
    pitch: center.pitch,
    width: Math.min(80, Math.max(2, Math.abs(dh))),
    height: Math.min(80, Math.max(2, Math.abs(top.pitch - bottom.pitch))),
  };
}

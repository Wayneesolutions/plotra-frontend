import React, { useRef } from 'react';
import { regionToRect, rectToRegion } from '../utils/streetViewProjection';

// Blur boxes drawn over the street view. Each box is stored as angles on the
// panorama (see utils/streetViewProjection.js), so it stays on the same part
// of the house while the buyer looks around. Buyers see only the blur; the
// dealer, while choosing, sees a dashed outline they can drag and resize.
const LIVE_PADDING = 0.12; // grow each live box a little so the whole sign is covered
const MIN_BOX_PX = 28;

// Browsers without backdrop-filter (some older Android/iOS WebViews) would
// show a clear box over the panorama: the sign stays readable. Use a solid
// tint there instead, so a hidden area is always hidden.
const SUPPORTS_BACKDROP = typeof CSS !== 'undefined' && typeof CSS.supports === 'function'
  && (CSS.supports('backdrop-filter', 'blur(1px)') || CSS.supports('-webkit-backdrop-filter', 'blur(1px)'));

export default function SignBlurLayer({ regions, view, editable = false, selected = null, onSelect, onChange }) {
  const dragRef = useRef(null);
  if (!regions?.length && !editable) return null;
  // Until the first measurement of the panorama the boxes can't be placed.
  // Buyers get a neutral cover for that moment instead of an unblurred view.
  if (!view || !view.size || !view.size.width || !view.size.height) {
    if (editable || !regions?.length) return null;
    return <div style={{ position: 'absolute', inset: 0, zIndex: 3, background: '#e5e7eb', pointerEvents: 'none' }} />;
  }
  if (!regions?.length) return null;
  const { pov, zoom, size } = view;

  const startDrag = (e, index, mode) => {
    if (!editable) return;
    e.preventDefault();
    e.stopPropagation();
    onSelect?.(index);
    const rect = regionToRect(regions[index], pov, zoom, size, 0);
    if (!rect) return;
    dragRef.current = { index, mode, startX: e.clientX, startY: e.clientY, rect, id: e.pointerId };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const moveDrag = (e) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startX; const dy = e.clientY - d.startY;
    const next = d.mode === 'resize'
      ? { ...d.rect, width: Math.max(MIN_BOX_PX, d.rect.width + dx), height: Math.max(MIN_BOX_PX, d.rect.height + dy) }
      : { ...d.rect, left: d.rect.left + dx, top: d.rect.top + dy };
    const updated = regions.map((r, i) => (i === d.index ? rectToRegion(next, pov, zoom, size) : r));
    onChange?.(updated);
  };

  const endDrag = () => { dragRef.current = null; };

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 3 }}>
      {regions.map((region, index) => {
        const rect = regionToRect(region, pov, zoom, size, editable ? 0 : LIVE_PADDING);
        if (!rect) return null;
        const isSelected = editable && selected === index;
        return (
          <div
            key={index}
            onPointerDown={(e) => startDrag(e, index, 'move')}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            style={{
              position: 'absolute', left: rect.left, top: rect.top, width: rect.width, height: rect.height,
              ...(SUPPORTS_BACKDROP
                ? { backdropFilter: 'blur(22px)', WebkitBackdropFilter: 'blur(22px)', background: 'rgba(255,255,255,0.18)' }
                : { background: editable ? 'rgba(75,85,99,0.75)' : 'rgb(75,85,99)' }),
              borderRadius: '6px',
              pointerEvents: editable ? 'auto' : 'none', touchAction: 'none', cursor: editable ? 'move' : 'default',
              border: editable ? (isSelected ? '2px solid #f59e0b' : '2px dashed rgba(245,158,11,0.9)') : 'none',
              boxSizing: 'border-box',
            }}
          >
            {editable && (
              <div
                onPointerDown={(e) => startDrag(e, index, 'resize')}
                onPointerMove={moveDrag}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                title="Drag to resize"
                style={{
                  position: 'absolute', right: -2, bottom: -2, width: 22, height: 22, background: '#f59e0b',
                  borderRadius: '6px 0 6px 0', cursor: 'nwse-resize', touchAction: 'none',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

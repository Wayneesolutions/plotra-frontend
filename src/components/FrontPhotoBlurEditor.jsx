import React, { useRef, useState } from 'react';
import { dragBox } from '../utils/blurBoxMath';

// Dealer marks signboards / the house number on the FIXED front photo
// (pre-approval). Boxes are stored as fractions of the photo (x, y, w, h in
// 0..1) and drawn with percentages, so a box covers the same part of the
// photo on every screen size and at every zoom level. The server blurs these
// exact boxes into the photo buyers get (/front-view.jpg), so what the dealer
// sees here is what buyers see.
//
// Replaces SignBlurLayer.jsx + streetViewProjection.js, which placed CSS blur
// boxes over Google's live panorama with our own projection math and drifted
// off the sign on bigger screens and when zooming (21 Oct QA, bugs 1-3).

const MAX_BOXES = 8;

const SUPPORTS_BACKDROP = typeof CSS !== 'undefined' && typeof CSS.supports === 'function'
  && (CSS.supports('backdrop-filter', 'blur(1px)') || CSS.supports('-webkit-backdrop-filter', 'blur(1px)'));

const btn = {
  WebkitAppearance: 'none', appearance: 'none', border: '1.5px solid rgba(255,255,255,0.35)',
  background: 'rgba(17,24,39,0.85)', color: '#fff', fontSize: '13px', fontWeight: 600,
  padding: '8px 12px', borderRadius: '8px', cursor: 'pointer',
};

export default function FrontPhotoBlurEditor({ src, rects = [], onChange, alt = 'Front of the property' }) {
  const wrapRef = useRef(null);
  const dragRef = useRef(null);
  const [selected, setSelected] = useState(null);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (failed) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', background: '#f1f5f9', borderRadius: '12px', fontSize: '14px' }}>
        No street photo is available for this location, so nothing needs hiding.
      </div>
    );
  }

  const startDrag = (e, index, mode) => {
    e.preventDefault();
    e.stopPropagation();
    setSelected(index);
    const box = wrapRef.current?.getBoundingClientRect();
    if (!box) return;
    dragRef.current = { index, mode, startX: e.clientX, startY: e.clientY, rect: rects[index], box };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const moveDrag = (e) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = (e.clientX - d.startX) / d.box.width;
    const dy = (e.clientY - d.startY) / d.box.height;
    const next = dragBox(d.rect, dx, dy, d.mode);
    onChange?.(rects.map((x, i) => (i === d.index ? next : x)));
  };

  const endDrag = () => { dragRef.current = null; };

  const pct = (v) => `${(v * 100).toFixed(3)}%`;

  return (
    <div>
      <div
        ref={wrapRef}
        onPointerDown={() => setSelected(null)}
        style={{ position: 'relative', width: '100%', borderRadius: '12px', overflow: 'hidden', background: '#000', lineHeight: 0, userSelect: 'none', touchAction: 'none' }}
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          style={{ width: '100%', height: 'auto', display: 'block', minHeight: loaded ? undefined : '200px' }}
        />
        {loaded && rects.map((r, index) => {
          const isSel = selected === index;
          return (
            <div
              key={index}
              onPointerDown={(e) => startDrag(e, index, 'move')}
              onPointerMove={moveDrag}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              style={{
                position: 'absolute', left: pct(r.x), top: pct(r.y), width: pct(r.w), height: pct(r.h),
                ...(SUPPORTS_BACKDROP
                  ? { backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', background: 'rgba(255,255,255,0.15)' }
                  : { background: 'rgba(75,85,99,0.75)' }),
                border: isSel ? '2px solid #f59e0b' : '2px dashed rgba(245,158,11,0.9)',
                borderRadius: '6px', boxSizing: 'border-box', cursor: 'move', touchAction: 'none',
              }}
            >
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
            </div>
          );
        })}
        {loaded && (
          <div style={{ position: 'absolute', left: 10, bottom: 10, display: 'flex', gap: 8, lineHeight: 'normal' }}>
            <button
              type="button"
              style={{ ...btn, opacity: rects.length >= MAX_BOXES ? 0.5 : 1 }}
              disabled={rects.length >= MAX_BOXES}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => {
                onChange?.([...rects, { x: 0.38, y: 0.3, w: 0.24, h: 0.14 }]);
                setSelected(rects.length);
              }}
            >
              ＋ Hide an area
            </button>
            <button
              type="button"
              style={{ ...btn, opacity: selected == null || !rects[selected] ? 0.5 : 1 }}
              disabled={selected == null || !rects[selected]}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => {
                onChange?.(rects.filter((_, i) => i !== selected));
                setSelected(null);
              }}
            >
              Remove selected
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

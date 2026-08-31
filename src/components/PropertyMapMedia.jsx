import React, { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '../utils/googleMapsLoader';

// Coerces lat/lng to real numbers and validates them. Needed defensively
// even though the backend now sends real numbers (publicListingController.js
// parseFloat's them) — Postgres NUMERIC columns come back from the `pg`
// driver as strings by default, and Google's LatLngLiteral silently fails
// to render anything (not even a JS error) if given strings instead of
// numbers. This was the actual cause of "satellite/street view not
// showing" after the interactive-maps change: the old static <img> approach
// never hit this, since a URL template literal doesn't care whether lat is
// a string or a number.
function toValidCoords(lat, lng) {
  const nLat = typeof lat === 'number' ? lat : parseFloat(lat);
  const nLng = typeof lng === 'number' ? lng : parseFloat(lng);
  if (!Number.isFinite(nLat) || !Number.isFinite(nLng)) return null;
  return { lat: nLat, lng: nLng };
}

// iOS Safari doesn't support the browser Fullscreen API for arbitrary
// elements (only <video> can go fullscreen there) — Google Maps detects
// this and silently omits its fullscreenControl button entirely on
// iPhone/iPad, with no error or fallback. On a small ~260px-tall embed
// that's the difference between a dealer being able to zoom in and drag
// the pin precisely vs. being stuck nudging it within a postage-stamp
// view, which is exactly what was producing very-off locations on Apple
// devices. This is a plain CSS "fake fullscreen" (position: fixed, full
// viewport) instead — works identically on every platform since it
// doesn't touch the actual Fullscreen API at all.
const expandedWrapStyle = {
  position: 'fixed', inset: 0, width: '100vw', height: '100vh', zIndex: 2000, background: '#000',
};
const expandBtnStyle = {
  position: 'absolute', top: '10px', right: '10px', zIndex: 5,
  width: '36px', height: '36px', borderRadius: '8px', border: 'none',
  background: 'rgba(17,24,39,0.75)', color: '#fff', fontSize: '17px', lineHeight: 1,
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
};

/**
 * Toggles a map container between its normal embedded size and a
 * CSS-only "fullscreen" overlay, keeping Google Maps in sync (it needs an
 * explicit 'resize' event any time its container's size changes outside
 * of its own control, or it keeps rendering at the stale size/position).
 * Shared by InteractiveSatellite and InteractiveStreetView.
 */
function useMapExpand({ mapRef, mapsApiRef, recenter }) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!mapRef.current || !mapsApiRef.current) return;
    const id = requestAnimationFrame(() => {
      mapsApiRef.current.event.trigger(mapRef.current, 'resize');
      if (recenter) recenter();
    });
    document.body.style.overflow = expanded ? 'hidden' : '';
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);

  useEffect(() => {
    if (!expanded) return;
    const onKeyDown = (e) => { if (e.key === 'Escape') setExpanded(false); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [expanded]);

  useEffect(() => () => { document.body.style.overflow = ''; }, []);

  return [expanded, setExpanded];
}

// Interactive satellite view: a real google.maps.Map the buyer can pan and
// zoom in on, instead of a single flat staticmap screenshot fetched once at
// listing-creation time (which goes stale the moment the buyer wants to
// look closer at a specific corner of the plot).
//
// `draggable` + `onPositionChange` are only meaningful pre-approval (see
// PropertyView.jsx, which gates this on listing.status !== 'active' and
// backs it with a hard server-side block once a listing is live) — lets
// a dealer nudge the pin to the exact spot when the AI's geocode is close
// but not quite right.
function InteractiveSatellite({ lat, lng, fallbackUrl, draggable = false, onPositionChange }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const mapsApiRef = useRef(null);
  const [failed, setFailed] = useState(false);
  const coords = toValidCoords(lat, lng);
  const [expanded, setExpanded] = useMapExpand({
    mapRef, mapsApiRef, recenter: () => coords && mapRef.current.setCenter(coords),
  });

  useEffect(() => {
    if (!coords) { setFailed(true); return; }
    let cancelled = false;
    let activeMarker = null;

    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !containerRef.current) return;
        mapsApiRef.current = maps;
        const map = new maps.Map(containerRef.current, {
          center: coords,
          zoom: 18,
          // 'hybrid', not 'satellite' — plain satellite imagery has no
          // road/place-name overlay at all (Google deliberately omits it),
          // so a dealer dragging the pin had no way to actually tell where
          // they were relative to a road or landmark. Hybrid is the same
          // imagery with that overlay on top.
          mapTypeId: 'hybrid',
          tilt: 0,
          streetViewControl: false,
          // Native fullscreenControl deliberately left off — it silently
          // doesn't render on iOS Safari at all (see the expand button
          // below, which replaces it with something that actually works
          // there).
          fullscreenControl: false,
          mapTypeControl: false,
        });
        mapRef.current = map;
        // Marks the exact point the address geocoded to — without this,
        // a buyer has no visual way to tell whether the map is centered
        // precisely on the plot or just somewhere in the general area.
        const marker = new maps.Marker({
          position: coords,
          map,
          draggable,
          title: draggable ? 'Drag to correct the exact plot location' : 'Approximate plot location',
        });
        activeMarker = marker;

        if (draggable && onPositionChange) {
          marker.addListener('dragend', () => {
            const pos = marker.getPosition();
            onPositionChange({ lat: pos.lat(), lng: pos.lng() });
          });
        }
      })
      .catch(() => { if (!cancelled) setFailed(true); });

    return () => {
      cancelled = true;
      // Remove the marker from the map before the effect re-runs (e.g. after
      // a successful pin save updates lat/lng). Without this, each re-render
      // leaves a stale draggable marker at the old position — the second
      // correction attempt drags the wrong (old) marker, making it appear
      // to have no effect.
      if (activeMarker) {
        activeMarker.setMap(null);
        activeMarker = null;
      }
    };
  }, [lat, lng, draggable]);

  if (failed) {
    if (!fallbackUrl) return null;
    return <img src={fallbackUrl} alt="Satellite Grid Layout" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
  }
  return (
    <div style={expanded ? expandedWrapStyle : { width: '100%', height: '100%', position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        aria-label={expanded ? 'Exit full screen' : 'Expand map to full screen'}
        title={expanded ? 'Exit full screen' : 'Expand to full screen — for precise pin placement on iPhone/iPad'}
        style={expandBtnStyle}
      >
        {expanded ? '✕' : '⤢'}
      </button>
    </div>
  );
}

// Rotatable, zoomable street-view panorama in place of a single fixed-angle
// static image. Checks coverage first via StreetViewService — some rural
// Punjab addresses genuinely have no Street View car coverage, in which
// case this falls back to the static image (or hides the card entirely if
// there's no static fallback either) rather than showing a broken/empty pano.
function InteractiveStreetView({ lat, lng, fallbackUrl }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const mapsApiRef = useRef(null);
  const [failed, setFailed] = useState(false);
  const [expanded, setExpanded] = useMapExpand({ mapRef, mapsApiRef });

  useEffect(() => {
    const coords = toValidCoords(lat, lng);
    if (!coords) { setFailed(true); return; }
    let cancelled = false;

    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !containerRef.current) return;
        mapsApiRef.current = maps;
        const svService = new maps.StreetViewService();
        svService.getPanorama({ location: coords, radius: 75 }, (data, status) => {
          if (cancelled) return;
          if (status !== 'OK') { setFailed(true); return; }
          const panorama = new maps.StreetViewPanorama(containerRef.current, {
            position: data.location.latLng,
            pov: { heading: 0, pitch: 0 },
            zoom: 1,
            addressControl: false,
            // See InteractiveSatellite above — iOS Safari silently omits
            // this native control entirely, replaced with the custom
            // expand button below.
            fullscreenControl: false,
          });
          mapRef.current = panorama;
        });
      })
      .catch(() => { if (!cancelled) setFailed(true); });

    return () => { cancelled = true; };
  }, [lat, lng]);

  if (failed) {
    if (!fallbackUrl) return null;
    return <img src={fallbackUrl} alt="Street Frontage Elevation" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
  }
  return (
    <div style={expanded ? expandedWrapStyle : { width: '100%', height: '100%', position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        aria-label={expanded ? 'Exit full screen' : 'Expand street view to full screen'}
        title={expanded ? 'Exit full screen' : 'Expand to full screen'}
        style={expandBtnStyle}
      >
        {expanded ? '✕' : '⤢'}
      </button>
    </div>
  );
}

export { InteractiveSatellite, InteractiveStreetView };

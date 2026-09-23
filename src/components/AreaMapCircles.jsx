import React, { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '../utils/googleMapsLoader';

// New map primitives for the Cities & Localities admin screens. Google Maps
// only ever needed ONE marker anywhere else in this app (see
// PropertyMapMedia.jsx's InteractiveSatellite) — these screens need several
// area circles on one map plus a live-editable radius circle, which that
// component doesn't support (single marker, hardcoded zoom/mapTypeId). Built
// on the same loadGoogleMaps() singleton so there's still only one Maps
// script-tag/API-key path in the app, just with raw google.maps.Circle /
// Marker primitives instead of another wrapper component.

const INDIA_CENTER = { lat: 22.5, lng: 79.0 };

function toValidCoords(lat, lng) {
  const nLat = typeof lat === 'number' ? lat : parseFloat(lat);
  const nLng = typeof lng === 'number' ? lng : parseFloat(lng);
  if (!Number.isFinite(nLat) || !Number.isFinite(nLng)) return null;
  return { lat: nLat, lng: nLng };
}

const STATUS_COLOR = {
  active: '#16a34a',        // verified — success
  pending_review: '#f59e0b', // needs review — warning
  needs_review: '#f59e0b',
  disabled: '#94a3b8',
};
const SELECTED_COLOR = '#f06623'; // orange accent, matches primary CTA

/**
 * A small map with a single draggable marker used to set a city's centre
 * point (Cities list "Add city" modal). Click-to-place, not drag-only —
 * clicking anywhere on the map (re)places the marker there.
 */
export function CityCenterPickerMap({ lat, lng, onPositionChange }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !containerRef.current) return;
        const coords = toValidCoords(lat, lng);
        const map = new maps.Map(containerRef.current, {
          center: coords || INDIA_CENTER,
          zoom: coords ? 13 : 5,
          mapTypeId: 'roadmap',
          streetViewControl: false,
          fullscreenControl: false,
          mapTypeControl: false,
          gestureHandling: 'greedy',
        });
        mapRef.current = map;

        const placeMarker = (pos) => {
          if (markerRef.current) {
            markerRef.current.setPosition(pos);
          } else {
            markerRef.current = new maps.Marker({ position: pos, map, draggable: true });
            markerRef.current.addListener('dragend', () => {
              const p = markerRef.current.getPosition();
              onPositionChange({ lat: p.lat(), lng: p.lng() });
            });
          }
        };

        if (coords) placeMarker(coords);

        map.addListener('click', (e) => {
          const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
          placeMarker(pos);
          onPositionChange(pos);
        });
      })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => {
      cancelled = true;
      if (markerRef.current) { markerRef.current.setMap(null); markerRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep marker in sync if the parent resets lat/lng (e.g. after typing in the fields directly).
  useEffect(() => {
    if (!markerRef.current || !mapRef.current) return;
    const coords = toValidCoords(lat, lng);
    if (!coords) return;
    markerRef.current.setPosition(coords);
    mapRef.current.setCenter(coords);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng]);

  if (failed) return <div style={{ padding: '16px', fontSize: '12px', color: '#94a3b8' }}>Map failed to load.</div>;
  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}

/**
 * Draggable centre pin + a live radius circle that redraws as the radius
 * slider moves — used by the Area add/verify drawer. `radiusM` is fully
 * controlled by the parent (the slider owns it); this component only ever
 * reads it to resize the circle.
 */
export function AreaRadiusPickerMap({ lat, lng, radiusM, onPositionChange }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const [failed, setFailed] = useState(false);
  const coords = toValidCoords(lat, lng);

  useEffect(() => {
    if (!coords) { setFailed(true); return; }
    let cancelled = false;
    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !containerRef.current) return;
        const map = new maps.Map(containerRef.current, {
          center: coords,
          zoom: 15,
          mapTypeId: 'hybrid',
          streetViewControl: false,
          fullscreenControl: false,
          mapTypeControl: false,
          gestureHandling: 'greedy',
        });
        mapRef.current = map;

        const circle = new maps.Circle({
          center: coords,
          radius: radiusM || 500,
          map,
          strokeColor: SELECTED_COLOR,
          strokeOpacity: 0.9,
          strokeWeight: 2,
          fillColor: SELECTED_COLOR,
          fillOpacity: 0.15,
          clickable: false,
        });
        circleRef.current = circle;

        const marker = new maps.Marker({ position: coords, map, draggable: true, title: 'Drag to move the area centre' });
        markerRef.current = marker;
        marker.addListener('drag', () => {
          const p = marker.getPosition();
          circle.setCenter({ lat: p.lat(), lng: p.lng() });
        });
        marker.addListener('dragend', () => {
          const p = marker.getPosition();
          onPositionChange({ lat: p.lat(), lng: p.lng() });
        });
      })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => {
      cancelled = true;
      if (markerRef.current) { markerRef.current.setMap(null); markerRef.current = null; }
      if (circleRef.current) { circleRef.current.setMap(null); circleRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng]);

  // Slider changes redraw the circle without re-mounting the map.
  useEffect(() => {
    if (circleRef.current) circleRef.current.setRadius(radiusM || 500);
  }, [radiusM]);

  if (failed) return <div style={{ padding: '16px', fontSize: '12px', color: '#94a3b8' }}>Map failed to load — check coordinates.</div>;
  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}

/**
 * Every area in a city as a circle at its real radius, colored by status,
 * click-to-select — the Areas tab's map half, and (with a single `areas`
 * entry plus a `testPin`) the Test tab's result map.
 */
export function AreaCirclesMap({ centerLat, centerLng, areas, selectedId, onSelectArea, testPin }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const mapsApiRef = useRef(null);
  const overlaysRef = useRef([]); // [{ id, circle, marker }]
  const testMarkerRef = useRef(null);
  const [failed, setFailed] = useState(false);
  const center = toValidCoords(centerLat, centerLng) || INDIA_CENTER;

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !containerRef.current) return;
        mapsApiRef.current = maps;
        const map = new maps.Map(containerRef.current, {
          center,
          zoom: 12,
          mapTypeId: 'roadmap',
          streetViewControl: false,
          fullscreenControl: false,
          mapTypeControl: false,
          gestureHandling: 'greedy',
        });
        mapRef.current = map;
      })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rebuild every area circle whenever the area list, selection, or map
  // instance changes — simplest robust approach for a list that can add/
  // remove/reorder rows via filters, rather than diffing overlays by id.
  useEffect(() => {
    const maps = mapsApiRef.current;
    const map = mapRef.current;
    if (!maps || !map) return;

    overlaysRef.current.forEach(({ circle, marker }) => {
      circle.setMap(null);
      if (marker) marker.setMap(null);
    });
    overlaysRef.current = [];

    (areas || []).forEach((area) => {
      const coords = toValidCoords(area.center_lat, area.center_lng);
      if (!coords) return;
      const isSelected = String(area.id) === String(selectedId);
      const color = isSelected ? SELECTED_COLOR : (STATUS_COLOR[area.status] || STATUS_COLOR.disabled);
      const circle = new maps.Circle({
        center: coords,
        radius: area.radius_m || 500,
        map,
        strokeColor: color,
        strokeOpacity: 0.9,
        strokeWeight: isSelected ? 3 : 1.5,
        fillColor: color,
        fillOpacity: isSelected ? 0.28 : 0.16,
        clickable: true,
      });
      circle.addListener('click', () => onSelectArea?.(area.id));
      overlaysRef.current.push({ id: area.id, circle, marker: null });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areas, selectedId]);

  // Optional single test pin (Test tab) — a distinct marker separate from
  // the area circles above, dropped wherever the test-match call resolved
  // (or the admin's typed lat/lng) so it's visually clear which pin was
  // being checked against which area.
  useEffect(() => {
    const maps = mapsApiRef.current;
    const map = mapRef.current;
    if (!maps || !map) return;
    if (testMarkerRef.current) { testMarkerRef.current.setMap(null); testMarkerRef.current = null; }
    const coords = toValidCoords(testPin?.lat, testPin?.lng);
    if (!coords) return;
    testMarkerRef.current = new maps.Marker({
      position: coords, map, title: 'Test pin',
      icon: { path: maps.SymbolPath.CIRCLE, scale: 7, fillColor: '#0c1b2e', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 },
    });
    map.panTo(coords);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testPin]);

  if (failed) return <div style={{ padding: '16px', fontSize: '12px', color: '#94a3b8' }}>Map failed to load.</div>;
  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}

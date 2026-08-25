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
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const coords = toValidCoords(lat, lng);
    if (!coords) { setFailed(true); return; }
    let cancelled = false;

    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !containerRef.current) return;
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
          fullscreenControl: true,
          mapTypeControl: false,
        });
        // Marks the exact point the address geocoded to — without this,
        // a buyer has no visual way to tell whether the map is centered
        // precisely on the plot or just somewhere in the general area.
        const marker = new maps.Marker({
          position: coords,
          map,
          draggable,
          title: draggable ? 'Drag to correct the exact plot location' : 'Approximate plot location',
        });

        if (draggable && onPositionChange) {
          marker.addListener('dragend', () => {
            const pos = marker.getPosition();
            onPositionChange({ lat: pos.lat(), lng: pos.lng() });
          });
        }
      })
      .catch(() => { if (!cancelled) setFailed(true); });

    return () => { cancelled = true; };
  }, [lat, lng, draggable]);

  if (failed) {
    if (!fallbackUrl) return null;
    return <img src={fallbackUrl} alt="Satellite Grid Layout" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
  }
  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}

// Rotatable, zoomable street-view panorama in place of a single fixed-angle
// static image. Checks coverage first via StreetViewService — some rural
// Punjab addresses genuinely have no Street View car coverage, in which
// case this falls back to the static image (or hides the card entirely if
// there's no static fallback either) rather than showing a broken/empty pano.
function InteractiveStreetView({ lat, lng, fallbackUrl }) {
  const containerRef = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const coords = toValidCoords(lat, lng);
    if (!coords) { setFailed(true); return; }
    let cancelled = false;

    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !containerRef.current) return;
        const svService = new maps.StreetViewService();
        svService.getPanorama({ location: coords, radius: 75 }, (data, status) => {
          if (cancelled) return;
          if (status !== 'OK') { setFailed(true); return; }
          new maps.StreetViewPanorama(containerRef.current, {
            position: data.location.latLng,
            pov: { heading: 0, pitch: 0 },
            zoom: 1,
            addressControl: false,
            fullscreenControl: true,
          });
        });
      })
      .catch(() => { if (!cancelled) setFailed(true); });

    return () => { cancelled = true; };
  }, [lat, lng]);

  if (failed) {
    if (!fallbackUrl) return null;
    return <img src={fallbackUrl} alt="Street Frontage Elevation" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
  }
  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}

export { InteractiveSatellite, InteractiveStreetView };

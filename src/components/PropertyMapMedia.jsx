import React, { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '../utils/googleMapsLoader';

// Interactive satellite view: a real google.maps.Map the buyer can pan and
// zoom in on, instead of a single flat staticmap screenshot fetched once at
// listing-creation time (which goes stale the moment the buyer wants to
// look closer at a specific corner of the plot).
function InteractiveSatellite({ lat, lng, fallbackUrl }) {
  const containerRef = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (lat == null || lng == null) { setFailed(true); return; }
    let cancelled = false;

    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !containerRef.current) return;
        new maps.Map(containerRef.current, {
          center: { lat, lng },
          zoom: 18,
          mapTypeId: 'satellite',
          tilt: 0,
          streetViewControl: false,
          fullscreenControl: true,
          mapTypeControl: false,
        });
      })
      .catch(() => { if (!cancelled) setFailed(true); });

    return () => { cancelled = true; };
  }, [lat, lng]);

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
    if (lat == null || lng == null) { setFailed(true); return; }
    let cancelled = false;

    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !containerRef.current) return;
        const svService = new maps.StreetViewService();
        svService.getPanorama({ location: { lat, lng }, radius: 75 }, (data, status) => {
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

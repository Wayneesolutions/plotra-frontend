import React, { useEffect, useRef, useState } from 'react';
import apiClient from '../api/apiClient';

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Singleton promise — script is appended exactly once across all renders
let mapsLoadPromise = null;

function loadGoogleMaps() {
  if (mapsLoadPromise) return mapsLoadPromise;
  mapsLoadPromise = new Promise((resolve, reject) => {
    if (window.google?.maps?.drawing) { resolve(window.google.maps); return; }
    window.__googleMapsInit__ = () => {
      delete window.__googleMapsInit__;
      resolve(window.google.maps);
    };
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=drawing&callback=__googleMapsInit__`;
    script.async = true;
    script.onerror = () => {
      delete window.__googleMapsInit__;
      mapsLoadPromise = null;
      reject(new Error('Google Maps failed to load'));
    };
    document.head.appendChild(script);
  });
  return mapsLoadPromise;
}

export default function PlotBoundaryTracer({ listingId, centerLat, centerLng, onSaveSuccess }) {
  const mapContainerRef = useRef(null);
  const polygonRef = useRef(null);
  const drawingManagerRef = useRef(null);

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (!GOOGLE_API_KEY) {
      setErrorMessage('Missing VITE_GOOGLE_MAPS_API_KEY — add it to client/.env');
      return;
    }

    let cancelled = false;
    let drawingManager = null;

    loadGoogleMaps()
      .then((maps) => {
        if (cancelled) return;
        const map = new maps.Map(mapContainerRef.current, {
          center: { lat: centerLat, lng: centerLng },
          zoom: 17,
          mapTypeId: 'satellite',
          tilt: 0,
        });

        drawingManager = new maps.drawing.DrawingManager({
          drawingMode: maps.drawing.OverlayType.POLYGON,
          drawingControl: true,
          drawingControlOptions: {
            position: maps.ControlPosition.TOP_LEFT,
            drawingModes: [maps.drawing.OverlayType.POLYGON],
          },
          polygonOptions: {
            fillColor: '#2563eb',
            fillOpacity: 0.2,
            strokeWeight: 2,
            strokeColor: '#2563eb',
            editable: true,
            draggable: true,
          },
        });

        drawingManager.setMap(map);
        drawingManagerRef.current = drawingManager;

        maps.event.addListener(drawingManager, 'polygoncomplete', (polygon) => {
          if (polygonRef.current) polygonRef.current.setMap(null);
          polygonRef.current = polygon;
          drawingManager.setDrawingMode(null);
        });
      })
      .catch(() => {
        if (!cancelled) setErrorMessage('Failed to load Google Maps. Check your API key.');
      });

    return () => {
      cancelled = true;
      if (drawingManagerRef.current) drawingManagerRef.current.setMap(null);
      if (polygonRef.current) { polygonRef.current.setMap(null); polygonRef.current = null; }
    };
  }, [centerLat, centerLng]);

  const handleSave = async () => {
    if (!polygonRef.current) {
      alert('Trace a boundary on the map before saving.');
      return;
    }

    const path = polygonRef.current.getPath().getArray();
    const coordinates = path.map((ll) => [ll.lng(), ll.lat()]);
    coordinates.push(coordinates[0]); // close the GeoJSON ring

    const boundaryGeoJSON = {
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [coordinates] },
      properties: {},
    };

    try {
      setSaving(true);
      setErrorMessage(null);
      await apiClient.patch(`/api/v1/dashboard/listings/${listingId}/boundary`, { boundaryGeoJSON });
      onSaveSuccess();
    } catch (err) {
      setErrorMessage(err.response?.data?.error?.message || 'Failed to save the boundary.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.container}>
      {errorMessage && <div style={styles.errorBanner}>⚠️ {errorMessage}</div>}
      <div ref={mapContainerRef} style={styles.canvasFrame} />
      <footer style={styles.footerPanel}>
        <p style={styles.helperTxt}>
          💡 Click to place corner points, click the first point to close the boundary.
        </p>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ ...styles.saveBtn, backgroundColor: saving ? '#9ca3af' : '#2563eb' }}
        >
          {saving ? 'Saving…' : '💾 Save Property Boundary'}
        </button>
      </footer>
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', width: '100%', height: '520px', gap: '12px' },
  errorBanner: { padding: '10px', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', color: '#991b1b', fontSize: '13px', borderRadius: '6px' },
  canvasFrame: { flex: 1, width: '100%', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden' },
  footerPanel: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', paddingTop: '4px' },
  helperTxt: { margin: 0, fontSize: '13px', color: '#4b5563', maxWidth: '70%', lineHeight: '1.4' },
  saveBtn: { border: 'none', color: '#fff', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' },
};

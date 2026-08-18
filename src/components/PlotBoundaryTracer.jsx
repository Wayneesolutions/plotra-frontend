import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import apiClient from '../api/apiClient';

export default function PlotBoundaryTracer({ listingId, centerLat, centerLng, onSaveSuccess }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const drawRef = useRef(null);

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

  useEffect(() => {
    if (!mapboxToken) {
      setErrorMessage('Missing VITE_MAPBOX_ACCESS_TOKEN — add it to client/.env');
      return;
    }

    mapboxgl.accessToken = mapboxToken;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/satellite-v9',
      center: [centerLng, centerLat], // Mapbox wants [lng, lat]
      zoom: 17
    });

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: { polygon: true, trash: true },
      defaultMode: 'draw_polygon'
    });

    map.addControl(draw, 'top-left');
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    mapRef.current = map;
    drawRef.current = draw;

    return () => map.remove();
  }, [centerLat, centerLng, mapboxToken]);

  const handleSave = async () => {
    if (!drawRef.current) return;

    const featureCollection = drawRef.current.getAll();
    if (!featureCollection.features || featureCollection.features.length === 0) {
      alert('Trace a boundary on the map before saving.');
      return;
    }

    const boundaryGeoJSON = featureCollection.features[0];

    try {
      setSaving(true);
      setErrorMessage(null);
      // apiClient attaches the JWT — a plain fetch() here would 401 every time,
      // since this hits an authGuard-protected endpoint.
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
          💡 Click to place corner points, double-click to close the boundary.
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
  saveBtn: { border: 'none', color: '#fff', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }
};

import React, { useState } from 'react';
import apiClient from '../api/apiClient';
import { AreaCirclesMap } from './AreaMapCircles.jsx';

// Full https://maps.google.com/... or https://www.google.com/maps/... link
// with an @lat,lng or ?q=lat,lng segment. Short maps.app.goo.gl links
// resolve server-side (redirect) and can't be parsed client-side — flagged
// inline rather than silently failing, per the build brief's own note.
function parseMapsLink(text) {
  const at = text.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (at) return { lat: Number(at[1]), lng: Number(at[2]) };
  const q = text.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (q) return { lat: Number(q[1]), lng: Number(q[2]) };
  return null;
}

const DECISION_BADGE = {
  auto: { background: '#f0fdf4', color: '#15803d', label: 'Auto' },
  confirm: { background: '#fef3c7', color: '#92400e', label: 'Confirm' },
  unmatched: { background: '#fff5f5', color: '#dc2626', label: 'Unmatched' },
};
const PIN_VERDICT_LABEL = { inside: 'Inside area', near: 'Near area', outside: 'Outside area', unknown: 'No pin given' };

export default function CityTestTab({ cityId, city }) {
  const [text, setText] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [mapsLink, setMapsLink] = useState('');
  const [linkError, setLinkError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleMapsLinkChange = (val) => {
    setMapsLink(val);
    setLinkError(null);
    if (!val.trim()) return;
    const parsed = parseMapsLink(val);
    if (parsed) {
      setLat(String(parsed.lat));
      setLng(String(parsed.lng));
    } else if (val.includes('goo.gl')) {
      setLinkError('Short maps.app.goo.gl links can\'t be read here yet — paste the full link, or the lat/lng directly.');
    } else {
      setLinkError('Could not find coordinates in that link.');
    }
  };

  const [matchedAreaGeo, setMatchedAreaGeo] = useState(null); // {center_lat, center_lng, radius_m} for the result's area, fetched separately — test-match's own response has no coordinates

  const handleRun = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setMatchedAreaGeo(null);
    try {
      const payload = { text: text.trim() };
      if (lat !== '' && lng !== '') { payload.lat = Number(lat); payload.lng = Number(lng); }
      const res = await apiClient.post(`/api/v1/admin/cities/${cityId}/test-match`, payload);
      setResult(res.data);
      if (res.data.localityId) {
        try {
          const areasRes = await apiClient.get(`/api/v1/admin/cities/${cityId}/localities`);
          const list = areasRes.data.localities || areasRes.data.rows || [];
          const match = list.find((a) => String(a.id) === String(res.data.localityId));
          if (match) setMatchedAreaGeo(match);
        } catch { /* map just won't draw the area circle — result text still shows */ }
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Test match failed.');
    } finally {
      setLoading(false);
    }
  };

  const matchedArea = result?.localityId
    ? { id: result.localityId, name: result.name, center_lat: matchedAreaGeo?.center_lat, center_lng: matchedAreaGeo?.center_lng, radius_m: matchedAreaGeo?.radius_m || 500, status: 'active' }
    : null;
  const testPin = (lat !== '' && lng !== '') ? { lat: Number(lat), lng: Number(lng) } : null;

  return (
    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
      <div style={{ flex: '1 1 380px', minWidth: '320px' }}>
        <div style={S.card}>
          <label style={S.formLabel}>Paste a dealer address</label>
          <textarea style={S.textarea} rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. Dugri Ph-II near Verka milk plant, Ldh" />

          <label style={{ ...S.formLabel, marginTop: '14px' }}>Paste a Google Maps link (optional)</label>
          <input style={S.formInput} value={mapsLink} onChange={(e) => handleMapsLinkChange(e.target.value)} placeholder="https://maps.google.com/@30.90,75.85,..." />
          {linkError && <p style={S.linkError}>{linkError}</p>}

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={S.formLabel}>Lat (optional)</label>
              <input style={S.formInput} type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={S.formLabel}>Lng (optional)</label>
              <input style={S.formInput} type="number" step="any" value={lng} onChange={(e) => setLng(e.target.value)} />
            </div>
          </div>

          {error && <div style={S.formError}><span style={S.formErrorIcon}>!</span>{error}</div>}

          <button style={{ ...S.createBtn, marginTop: '16px', opacity: loading || !text.trim() ? 0.6 : 1 }} disabled={loading || !text.trim()} onClick={handleRun}>
            {loading ? 'Running…' : 'Run'}
          </button>
          {city?.status === 'draft' && <p style={S.hint}>This city is still Draft — test-match works here too, it just won't affect any live listings yet.</p>}
        </div>

        {result && (
          <div style={S.card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span style={{ ...S.decisionBadge, ...(DECISION_BADGE[result.decision] || DECISION_BADGE.unmatched) }}>
                {(DECISION_BADGE[result.decision] || DECISION_BADGE.unmatched).label}
              </span>
              {result.name && <span style={S.resultName}>{result.name}</span>}
            </div>
            <div style={S.resultGrid}>
              <div><span style={S.resultLabel}>Confidence</span><div style={S.resultVal}>{result.confidence != null ? `${Math.round(result.confidence * (result.confidence <= 1 ? 100 : 1))}%` : '—'}</div></div>
              <div><span style={S.resultLabel}>Method</span><div style={S.resultVal}>{result.method || '—'}</div></div>
              <div><span style={S.resultLabel}>Matched phrase</span><div style={S.resultVal}>{result.matchedPhrase || '—'}</div></div>
              <div><span style={S.resultLabel}>Reason</span><div style={S.resultVal}>{result.reason || '—'}</div></div>
            </div>

            {result.pin && (
              <div style={S.pinBox}>
                <strong>{PIN_VERDICT_LABEL[result.pin.verdict] || result.pin.verdict}</strong>
                {result.pin.distanceM != null && <> — {Math.round(result.pin.distanceM)}m from the area centre</>}
              </div>
            )}

            {result.candidates?.length > 0 && (
              <>
                <div style={{ ...S.formLabel, marginTop: '16px' }}>Top candidates</div>
                <div style={S.tableWrap}>
                  <table style={S.table}>
                    <thead><tr>{['Area', 'Score'].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
                    <tbody>
                      {result.candidates.map((c) => (
                        <tr key={c.localityId} style={S.tr}>
                          <td style={S.td}>{c.name}</td>
                          <td style={S.td}>{typeof c.score === 'number' ? c.score.toFixed(2) : c.score}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div style={{ flex: '1 1 320px', minWidth: '280px', height: '420px' }}>
        <div style={S.mapBox}>
          <AreaCirclesMap
            centerLat={city?.center_lat} centerLng={city?.center_lng}
            areas={matchedArea ? [matchedArea] : []}
            selectedId={matchedArea?.id}
            testPin={testPin}
          />
        </div>
      </div>
    </div>
  );
}

const S = {
  card: { background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '22px', marginBottom: '16px' },
  formLabel: { fontSize: '11px', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.7px', display: 'block', marginBottom: '6px' },
  formInput: { padding: '10px 14px', fontSize: '13px', border: '1.5px solid #e2e8f0', borderRadius: '9px', color: '#0c1b2e', backgroundColor: '#fafbfd', boxSizing: 'border-box', width: '100%' },
  textarea: { width: '100%', padding: '12px 14px', fontSize: '13px', border: '1.5px solid #e2e8f0', borderRadius: '10px', color: '#0c1b2e', backgroundColor: '#fafbfd', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' },
  linkError: { fontSize: '11.5px', color: '#dc2626', margin: '6px 0 0' },
  hint: { fontSize: '11.5px', color: '#94a3b8', margin: '10px 0 0' },
  createBtn: { padding: '10px 20px', background: 'linear-gradient(135deg, #f06623 0%, #d95215 100%)', color: '#fff', border: 'none', borderRadius: '9px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' },

  formError: { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#fff5f5', color: '#c53030', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '500', margin: '14px 0 0', border: '1px solid #fed7d7' },
  formErrorIcon: { width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#fed7d7', color: '#c53030', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800', flexShrink: 0 },

  decisionBadge: { padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: '800' },
  resultName: { fontSize: '15px', fontWeight: '700', color: '#0c1b2e' },
  resultGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  resultLabel: { fontSize: '10px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' },
  resultVal: { fontSize: '13px', fontWeight: '600', color: '#0c1b2e', marginTop: '2px' },
  pinBox: { marginTop: '14px', padding: '10px 14px', background: '#f8fafc', borderRadius: '10px', fontSize: '13px', color: '#334155' },

  tableWrap: { border: '1px solid #f1f5f9', borderRadius: '10px', overflow: 'hidden', marginTop: '8px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '8px 12px', textAlign: 'left', fontSize: '10.5px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #f1f5f9', backgroundColor: '#fafbfd' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '8px 12px', fontSize: '12.5px', color: '#334155' },

  mapBox: { width: '100%', height: '100%', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0' },
};

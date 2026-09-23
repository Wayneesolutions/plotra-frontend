import React, { useState } from 'react';
import apiClient from '../api/apiClient';

const CSV_TEMPLATE_HEADER = 'name,kind,parent,pincode,center_lat,center_lng,radius_m,aliases\n';

function downloadTemplate() {
  const blob = new Blob([CSV_TEMPLATE_HEADER], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'localities_import_template.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function CityImportTab({ cityId, showToast, onViewAreasNeedingReview }) {
  const [file, setFile] = useState(null);
  const [geocode, setGeocode] = useState(true);
  const [preview, setPreview] = useState(null); // { rows, counts }
  const [previewLoading, setPreviewLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = async (e) => {
    const f = e.target.files?.[0];
    setError(null);
    setPreview(null);
    setImportResult(null);
    if (!f) { setFile(null); return; }
    setFile(f);
    setPreviewLoading(true);
    try {
      const form = new FormData();
      form.append('file', f);
      const res = await apiClient.post(`/api/v1/admin/cities/${cityId}/localities/import/preview`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPreview(res.data);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to preview CSV.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const hasErrors = (preview?.rows || []).some((r) => r.errors && r.errors.length > 0);

  const handleImport = async () => {
    if (!file) return;
    setImportLoading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('geocode', String(geocode));
      const res = await apiClient.post(`/api/v1/admin/cities/${cityId}/localities/import`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImportResult(res.data);
      showToast('Import complete.');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Import failed.');
    } finally {
      setImportLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setImportResult(null);
    setError(null);
  };

  return (
    <div style={{ maxWidth: '820px' }}>
      {error && <div style={S.formError}><span style={S.formErrorIcon}>!</span>{error}</div>}

      {!importResult ? (
        <>
          <div style={S.card}>
            <div style={S.stepLabel}>Step 1</div>
            <p style={S.stepText}>Download the CSV template, fill it in, then upload it.</p>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button style={S.planEditBtn} onClick={downloadTemplate}>Download template</button>
              <label style={S.fileLabel}>
                {file ? file.name : 'Choose CSV file…'}
                <input type="file" accept=".csv" style={{ display: 'none' }} onChange={handleFileChange} />
              </label>
            </div>
            <label style={{ ...S.checkboxRow, marginTop: '14px' }}>
              <input type="checkbox" checked={geocode} onChange={(e) => setGeocode(e.target.checked)} />
              Fill missing coordinates from Google
            </label>
          </div>

          {previewLoading && <div style={S.empty}>Previewing…</div>}

          {preview && (
            <div style={S.card}>
              <div style={S.stepLabel}>Step 2 — Preview</div>
              <p style={S.stepText}>
                {preview.counts?.create ?? 0} to create · {preview.counts?.update ?? 0} to update · {preview.counts?.skip ?? 0} to skip
                {hasErrors && <span style={{ color: '#dc2626', fontWeight: 700 }}> — fix errors before importing</span>}
              </p>
              <div style={S.tableWrap}>
                <table style={S.table}>
                  <thead>
                    <tr>{['Name', 'Action', 'Errors'].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {(preview.rows || []).map((r, i) => (
                      <tr key={i} style={S.tr}>
                        <td style={S.td}>{r.input?.name || `Row ${i + 1}`}</td>
                        <td style={S.td}>
                          <span style={{ ...S.actionBadge, ...(r.action === 'create' ? S.actionCreate : r.action === 'update' ? S.actionUpdate : S.actionSkip) }}>
                            {r.action}
                          </span>
                        </td>
                        <td style={{ ...S.td, color: r.errors?.length ? '#dc2626' : '#94a3b8' }}>
                          {r.errors?.length ? r.errors.join('; ') : (r.note || '—')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
                <button style={S.planEditBtn} onClick={reset}>Start over</button>
                <button style={{ ...S.createBtn, opacity: importLoading || hasErrors ? 0.5 : 1 }} disabled={importLoading || hasErrors} onClick={handleImport}>
                  {importLoading ? 'Importing…' : 'Import'}
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div style={S.card}>
          <div style={S.stepLabel}>Step 3 — Done</div>
          <p style={S.stepText}>
            Created {importResult.counts?.create ?? importResult.created ?? 0} · Updated {importResult.counts?.update ?? importResult.updated ?? 0} · Skipped {importResult.counts?.skip ?? importResult.skipped ?? 0}
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button style={S.planEditBtn} onClick={reset}>Import another file</button>
            <button style={S.createBtn} onClick={onViewAreasNeedingReview}>View Areas needing review →</button>
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  card: { background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '16px' },
  stepLabel: { fontSize: '11px', fontWeight: '800', color: '#c8a96e', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' },
  stepText: { fontSize: '13px', color: '#64748b', margin: '0 0 14px' },

  planEditBtn: { padding: '10px 16px', border: '1.5px solid #e2e8f0', borderRadius: '10px', background: '#f8fafc', color: '#374151', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  createBtn: { padding: '10px 20px', background: 'linear-gradient(135deg, #f06623 0%, #d95215 100%)', color: '#fff', border: 'none', borderRadius: '9px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' },
  fileLabel: { padding: '10px 16px', border: '1.5px dashed #cbd5e1', borderRadius: '10px', background: '#fafbfd', color: '#374151', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  checkboxRow: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#374151', cursor: 'pointer' },

  empty: { color: '#94a3b8', fontSize: '14px', padding: '24px 0', textAlign: 'center' },

  tableWrap: { border: '1px solid #f1f5f9', borderRadius: '10px', overflow: 'hidden', maxHeight: '360px', overflowY: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.7px', borderBottom: '1px solid #f1f5f9', backgroundColor: '#fafbfd', position: 'sticky', top: 0 },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '10px 14px', fontSize: '13px', color: '#334155' },
  actionBadge: { padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' },
  actionCreate: { background: '#f0fdf4', color: '#15803d' },
  actionUpdate: { background: '#eff6ff', color: '#1d4ed8' },
  actionSkip: { background: '#f1f5f9', color: '#64748b' },

  formError: { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#fff5f5', color: '#c53030', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '500', marginBottom: '16px', border: '1px solid #fed7d7' },
  formErrorIcon: { width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#fed7d7', color: '#c53030', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800', flexShrink: 0 },
};

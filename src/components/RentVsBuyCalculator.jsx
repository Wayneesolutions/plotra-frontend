import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../api/config';

/**
 * Self-serve rent-vs-buy calculator, embedded on the public property page.
 * Pre-fills the property price from the listing being viewed; everything
 * else the buyer fills in themselves. Every run is logged server-side
 * (tenant_id/property_id passed through as reporting context only).
 */
export default function RentVsBuyCalculator({ tenantId, propertyId, defaultPrice, city, state }) {
  const [form, setForm] = useState({
    propertyPrice: defaultPrice || '',
    downPaymentPercent: 20,
    interestRate: 8.5,
    tenureYears: 20,
    comparableRentMonthly: '',
    taxDeductionToggle: true,
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const setField = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((p) => ({ ...p, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/v1/public/tools/rent-vs-buy`, {
        ...form,
        city,
        state,
        propertyId,
        tenantId,
      });
      setResult(res.data.data);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Could not run the calculation. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  const formatINR = (n) => new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(n);

  return (
    <div style={S.section}>
      <div style={S.sectionHead}>
        <div style={S.sectionAccent} />
        <h2 style={S.sectionTitle}>Rent vs Buy Calculator</h2>
      </div>

      {!expanded ? (
        <button style={S.openBtn} onClick={() => setExpanded(true)}>
          🧮 Should you rent or buy this? Calculate
        </button>
      ) : (
        <>
          <form onSubmit={handleSubmit} style={S.form}>
            <div style={S.grid}>
              <label style={S.field}>
                <span style={S.label}>Property Price (₹)</span>
                <input style={S.input} type="number" min="1" required
                  value={form.propertyPrice} onChange={setField('propertyPrice')} placeholder="5000000" />
              </label>
              <label style={S.field}>
                <span style={S.label}>Comparable Rent / month (₹)</span>
                <input style={S.input} type="number" min="1" required
                  value={form.comparableRentMonthly} onChange={setField('comparableRentMonthly')} placeholder="15000" />
              </label>
              <label style={S.field}>
                <span style={S.label}>Down Payment (%)</span>
                <input style={S.input} type="number" min="0" max="99" required
                  value={form.downPaymentPercent} onChange={setField('downPaymentPercent')} />
              </label>
              <label style={S.field}>
                <span style={S.label}>Loan Interest Rate (%)</span>
                <input style={S.input} type="number" step="0.1" min="0.1" max="25" required
                  value={form.interestRate} onChange={setField('interestRate')} placeholder="8.5" />
              </label>
              <label style={S.field}>
                <span style={S.label}>Loan Tenure (years)</span>
                <input style={S.input} type="number" min="1" max="40" required
                  value={form.tenureYears} onChange={setField('tenureYears')} />
              </label>
              <label style={S.checkboxField}>
                <input type="checkbox" checked={form.taxDeductionToggle} onChange={setField('taxDeductionToggle')} />
                <span style={S.label}>Include home loan tax benefits (80C / Section 24)</span>
              </label>
            </div>

            {error && <div style={S.errorBox}>{error}</div>}

            <button type="submit" disabled={loading} style={{ ...S.submitBtn, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Calculating…' : 'Calculate'}
            </button>
          </form>

          {result && (
            <div style={S.result}>
              <div style={S.resultHeadline}>
                {typeof result.breakEvenYear === 'number' ? (
                  <>Buying becomes cheaper than renting from <strong>Year {result.breakEvenYear}</strong></>
                ) : (
                  <>Renting stays cheaper over your full {form.tenureYears}-year horizon</>
                )}
              </div>

              <div style={S.resultGrid}>
                <div style={S.resultCard}>
                  <span style={S.resultLabel}>Estimated Monthly EMI</span>
                  <span style={S.resultValue}>{formatINR(result.monthlyEmi)}</span>
                </div>
                <div style={S.resultCard}>
                  <span style={S.resultLabel}>Total Upfront Cost</span>
                  <span style={S.resultValue}>{formatINR(result.upfrontCosts.total)}</span>
                </div>
              </div>

              <div style={S.tableWrap}>
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>Year</th>
                      <th style={S.th}>Net Cost — Buying</th>
                      <th style={S.th}>Net Cost — Renting</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.yearlyBreakdown
                      .filter((row) => row.year % Math.max(1, Math.floor(result.yearlyBreakdown.length / 8)) === 0 || row.year === result.yearlyBreakdown.length)
                      .map((row) => (
                        <tr key={row.year} style={row.year === result.breakEvenYear ? S.trHighlight : undefined}>
                          <td style={S.td}>{row.year}</td>
                          <td style={S.td}>{formatINR(row.netCostBuying)}</td>
                          <td style={S.td}>{formatINR(row.netCostRenting)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              <p style={S.disclaimer}>
                Estimate only, based on the numbers you entered and standard market
                assumptions for {city || 'your city'}. Not financial advice — please
                confirm exact figures with your bank and a financial advisor before
                making a decision.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const S = {
  section: {
    border: '1px solid #eff2f8', borderRadius: '14px',
    padding: '18px', backgroundColor: '#fff',
  },
  sectionHead: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' },
  sectionAccent: {
    width: '4px', height: '18px', borderRadius: '2px',
    background: 'linear-gradient(180deg, #c8a96e, #b08848)', flexShrink: 0,
  },
  sectionTitle: { margin: 0, fontSize: '13px', fontWeight: '800', color: '#0c1b2e', textTransform: 'uppercase', letterSpacing: '0.8px' },

  openBtn: {
    width: '100%', padding: '14px', border: '1.5px dashed #c8a96e', borderRadius: '10px',
    background: '#fdfbf6', color: '#0c1b2e', fontSize: '14px', fontWeight: '700', cursor: 'pointer',
  },

  form: { display: 'flex', flexDirection: 'column', gap: '14px' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  checkboxField: { display: 'flex', alignItems: 'center', gap: '8px', gridColumn: '1 / -1' },
  label: { fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' },
  input: {
    padding: '10px 12px', fontSize: '14px', border: '1.5px solid #e2e8f0', borderRadius: '9px',
    color: '#0c1b2e', backgroundColor: '#fff', width: '100%', boxSizing: 'border-box',
  },
  errorBox: {
    backgroundColor: '#fff5f5', color: '#c53030', padding: '10px 14px',
    borderRadius: '8px', fontSize: '13px', border: '1px solid #fed7d7',
  },
  submitBtn: {
    padding: '13px', border: 'none', borderRadius: '10px',
    background: 'linear-gradient(135deg, #0c1b2e 0%, #1a3558 100%)',
    color: '#fff', fontWeight: '700', fontSize: '14px', cursor: 'pointer',
  },

  result: { marginTop: '18px', paddingTop: '18px', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '14px' },
  resultHeadline: { fontSize: '15px', fontWeight: '700', color: '#0c1b2e', lineHeight: '1.5' },
  resultGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  resultCard: {
    display: 'flex', flexDirection: 'column', gap: '4px', padding: '12px 14px',
    backgroundColor: '#f8fafd', borderRadius: '10px', border: '1px solid #eef2f7',
  },
  resultLabel: { fontSize: '10px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.4px' },
  resultValue: { fontSize: '16px', fontWeight: '800', color: '#0c1b2e' },

  tableWrap: { border: '1px solid #eef2f7', borderRadius: '10px', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '12px' },
  th: { padding: '9px 12px', textAlign: 'left', fontWeight: '700', color: '#64748b', backgroundColor: '#f8fafd', borderBottom: '1px solid #eef2f7' },
  td: { padding: '9px 12px', color: '#334155', borderBottom: '1px solid #f8fafd' },
  trHighlight: { backgroundColor: '#fdfbf0' },

  disclaimer: { margin: 0, fontSize: '11px', color: '#94a3b8', lineHeight: '1.6', fontStyle: 'italic' },
};

import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../api/config';

// Wires POST /api/v1/public/tools/rent-vs-buy — built server-side
// (calculatorController.js / rentVsBuyCalculator.js) with no widget
// anywhere to call it, despite the route's own comment saying it's "used
// from the property page calculator widget."
export default function RentVsBuyCalculator({ propertyPrice, propertyId }) {
  const [form, setForm] = useState({
    propertyPrice: propertyPrice || '',
    downPaymentPercent: 20,
    interestRate: 8.5,
    tenureYears: 20,
    comparableRentMonthly: '',
  });
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/v1/public/tools/rent-vs-buy`, {
        ...form,
        propertyId,
      });
      setResult(res.data.data);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to calculate.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} style={styles.form}>
        <label style={styles.label}>Property price (₹)</label>
        <input type="number" name="propertyPrice" value={form.propertyPrice} onChange={handleChange} required style={styles.input} />

        <label style={styles.label}>Down payment (%)</label>
        <input type="number" name="downPaymentPercent" value={form.downPaymentPercent} onChange={handleChange} style={styles.input} />

        <label style={styles.label}>Home loan interest rate (%)</label>
        <input type="number" step="0.1" name="interestRate" value={form.interestRate} onChange={handleChange} required style={styles.input} />

        <label style={styles.label}>Loan tenure (years)</label>
        <input type="number" name="tenureYears" value={form.tenureYears} onChange={handleChange} style={styles.input} />

        <label style={styles.label}>Comparable monthly rent (₹)</label>
        <input type="number" name="comparableRentMonthly" value={form.comparableRentMonthly} onChange={handleChange} required style={styles.input} />

        <button type="submit" disabled={submitting} style={styles.button}>
          {submitting ? 'Calculating…' : 'Calculate'}
        </button>
      </form>

      {error && <div style={styles.errorBox}>{error}</div>}

      {result && (
        <div style={styles.resultBox}>
          <div style={styles.resultRow}><span>Monthly EMI</span><strong>₹{Math.round(result.monthlyEmi).toLocaleString('en-IN')}</strong></div>
          <div style={styles.resultRow}><span>Upfront costs (down payment + stamp duty + registration)</span><strong>₹{Math.round(result.upfrontCosts).toLocaleString('en-IN')}</strong></div>
          <div style={styles.resultRow}><span>Break-even year (buying beats renting)</span><strong>{result.breakEvenYear ? `Year ${result.breakEvenYear}` : 'Beyond modeled horizon'}</strong></div>
          <p style={styles.assumptionsNote}>
            Assumes {result.assumptions.appreciationPercent}% annual appreciation, {result.assumptions.rentEscalationPercent}%
            rent escalation, {result.assumptions.stampDutyPercent}% stamp duty for {result.assumptions.city}, {result.assumptions.state}.
          </p>
        </div>
      )}
    </div>
  );
}

const styles = {
  form: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px', alignItems: 'end' },
  label: { gridColumn: 'span 2', fontSize: '11px', color: '#6b7280', fontWeight: '600', marginBottom: '-4px' },
  input: { gridColumn: 'span 2', padding: '8px 10px', fontSize: '13px', border: '1px solid #d1d5db', borderRadius: '6px', boxSizing: 'border-box' },
  button: { gridColumn: 'span 2', marginTop: '6px', padding: '10px', border: 'none', backgroundColor: '#2563eb', color: '#fff', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' },
  errorBox: { backgroundColor: '#fef2f2', color: '#dc2626', padding: '8px 10px', borderRadius: '6px', fontSize: '13px', marginTop: '10px' },
  resultBox: { marginTop: '14px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px' },
  resultRow: { display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#374151', padding: '4px 0' },
  assumptionsNote: { fontSize: '11px', color: '#9ca3af', marginTop: '8px', lineHeight: '1.5' },
};

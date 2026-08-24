import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import apiClient from '../api/apiClient';

export default function BillingModal({ onClose }) {
  const storedUser = JSON.parse(localStorage.getItem('pve_user') || 'null');
  const isOwner = storedUser?.role === 'owner';

  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState([]); // NEW — gap #8: this was fetched by the backend but never rendered
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingPlan, setPayingPlan] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [message, setMessage] = useState(null);

  const location = useLocation();

  useEffect(() => {
    // Show success/cancelled message if returning from Stripe
    const params = new URLSearchParams(location.search);
    if (params.get('billing') === 'success') {
      setMessage({ type: 'success', text: 'Payment successful! Your plan is now active.' });
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('billing') === 'cancelled') {
      setMessage({ type: 'error', text: 'Payment was cancelled. You can try again anytime.' });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [location.search]);

  const loadStatus = () => {
    return Promise.all([
      apiClient.get('/api/v1/dashboard/billing/status'),
      apiClient.get('/api/v1/public/billing/plans'),
    ]).then(([statusRes, plansRes]) => {
      setStatus(statusRes.data.billing);
      setHistory(statusRes.data.history || []);
      setPlans(plansRes.data.plans || []);
    });
  };

  useEffect(() => {
    loadStatus()
      .catch(() => setMessage({ type: 'error', text: 'Failed to load billing details.' }))
      .finally(() => setLoading(false));
  }, []);

  const handlePay = async (planKey) => {
    setPayingPlan(planKey);
    setMessage(null);
    try {
      const successUrl = `${window.location.origin}/dashboard?billing=success`;
      const cancelUrl = `${window.location.origin}/dashboard?billing=cancelled`;

      const res = await apiClient.post('/api/v1/dashboard/billing/create-checkout-session', {
        plan: planKey,
        successUrl,
        cancelUrl,
      });

      // Redirect to Stripe's hosted checkout page
      window.location.href = res.data.url;
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error?.message || 'Failed to start payment.' });
      setPayingPlan(null);
    }
  };

  // NEW — pairs with gap #6 (auto-renewal): now that renewal is automatic,
  // there needs to be a way to turn it back off.
  const handleCancel = async () => {
    if (!window.confirm('Cancel your subscription? You\u2019ll keep access until the end of your current billing period, then it will not renew.')) {
      return;
    }
    setCancelling(true);
    setMessage(null);
    try {
      const res = await apiClient.post('/api/v1/dashboard/billing/cancel-subscription');
      setMessage({ type: 'success', text: res.data.message });
      await loadStatus();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error?.message || 'Failed to cancel subscription.' });
    } finally {
      setCancelling(false);
    }
  };

  const formatINR = (paise) => `₹${(paise / 100).toLocaleString('en-IN')}`;

  const canCancel = isOwner && status?.subscription_status === 'active';

  return (
    <div className="pve-modal-wrap" style={S.overlay}>
      <div className="pve-modal" style={S.modal}>
        <div style={S.stripe} />

        <div style={S.head}>
          <div>
            <p style={S.eyebrow}>Account</p>
            <h3 style={S.title}>Billing &amp; Plan</h3>
          </div>
          <button onClick={onClose} style={S.closeBtn}>✕</button>
        </div>

        {message && (
          <div style={{
            ...S.banner,
            backgroundColor: message.type === 'error' ? '#fff5f5' : '#ecfdf5',
            color: message.type === 'error' ? '#c53030' : '#059669',
            border: `1px solid ${message.type === 'error' ? '#fed7d7' : '#a7f3d0'}`,
          }}>
            {message.text}
          </div>
        )}

        {loading ? (
          <div style={S.loading}>Loading…</div>
        ) : (
          <div style={S.body}>
            {status && (
              <div style={S.currentPlan}>
                <div>
                  <span style={S.currentPlanLabel}>Current Plan</span>
                  <span style={S.currentPlanValue}>{status.plan}</span>
                </div>
                <span style={{
                  ...S.statusPill,
                  ...(status.subscription_status === 'active' ? S.statusActive : S.statusInactive),
                }}>
                  {status.subscription_status}
                </span>
              </div>
            )}
            {status?.current_period_end && (
              <p style={S.periodNote}>
                {status.subscription_status === 'cancelling' ? 'Access ends' : 'Renews automatically on'}{' '}
                {new Date(status.current_period_end).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}

            {!isOwner ? (
              <p style={S.hint}>Only the account owner can manage billing. Ask your owner to renew or change plans.</p>
            ) : (
              <>
                <div style={S.planList}>
                  {plans.map((p) => (
                    <div key={p.key} style={{ ...S.planRow, ...(p.key === status?.plan ? S.planRowActive : {}) }}>
                      <div>
                        <div style={S.planName}>{p.label}</div>
                        <div style={S.planPrice}>₹{p.priceINR.toLocaleString('en-IN')}/month</div>
                      </div>
                      <button
                        onClick={() => handlePay(p.key)}
                        disabled={payingPlan === p.key}
                        style={{ ...S.payBtn, opacity: payingPlan === p.key ? 0.6 : 1 }}
                      >
                        {payingPlan === p.key ? 'Redirecting…' : p.key === status?.plan ? 'Renew' : 'Switch & Pay'}
                      </button>
                    </div>
                  ))}
                </div>

                {canCancel && (
                  <button onClick={handleCancel} disabled={cancelling} style={S.cancelBtn}>
                    {cancelling ? 'Cancelling…' : 'Cancel auto-renewal'}
                  </button>
                )}
              </>
            )}

            {/* NEW — gap #8: billing history was already being fetched by
                the backend (getBillingStatus returns it) but nothing ever
                rendered it. */}
            {history.length > 0 && (
              <div style={S.historySection}>
                <p style={S.historyTitle}>Payment History</p>
                <div style={S.historyList}>
                  {history.map((h, i) => (
                    <div key={i} style={S.historyRow}>
                      <div>
                        <div style={S.historyPlan}>{h.plan}</div>
                        <div style={S.historyDate}>
                          {new Date(h.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                      <div style={S.historyAmount}>{formatINR(h.amount_paise)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const S = {
  overlay: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(6,12,24,0.68)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 400, padding: '20px', backdropFilter: 'blur(8px)',
  },
  modal: {
    backgroundColor: '#ffffff', borderRadius: '18px', width: '100%', maxWidth: '460px',
    boxShadow: '0 24px 72px rgba(6,12,24,0.30)', overflow: 'hidden', maxHeight: '90vh', overflowY: 'auto',
  },
  stripe: { height: '4px', background: 'linear-gradient(90deg, #c8a96e 0%, #e8c98e 50%, #c8a96e 100%)' },
  head: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: '22px 26px 16px', borderBottom: '1px solid #f1f5f9',
  },
  eyebrow: { margin: '0 0 4px', fontSize: '11px', fontWeight: '700', color: '#c8a96e', textTransform: 'uppercase', letterSpacing: '1.5px' },
  title: { margin: 0, fontSize: '19px', fontWeight: '800', color: '#0c1b2e' },
  closeBtn: {
    width: '32px', height: '32px', borderRadius: '8px', background: '#f1f5f9', border: 'none',
    cursor: 'pointer', fontSize: '14px', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  banner: { margin: '16px 26px 0', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '500' },
  loading: { padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' },
  body: { padding: '20px 26px 26px', display: 'flex', flexDirection: 'column', gap: '14px' },
  currentPlan: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafd', borderRadius: '12px', padding: '16px 18px', border: '1px solid #eef2f7' },
  currentPlanLabel: { display: 'block', fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' },
  currentPlanValue: { fontSize: '17px', fontWeight: '800', color: '#0c1b2e', textTransform: 'capitalize' },
  statusPill: { fontSize: '11px', fontWeight: '700', padding: '4px 12px', borderRadius: '999px', textTransform: 'uppercase' },
  statusActive: { backgroundColor: '#ecfdf5', color: '#059669' },
  statusInactive: { backgroundColor: '#fff7ed', color: '#c2410c' },
  periodNote: { margin: 0, fontSize: '12px', color: '#94a3b8' },
  hint: { margin: 0, fontSize: '13px', color: '#64748b', lineHeight: '1.6' },
  planList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  planRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 16px', borderRadius: '12px', border: '1.5px solid #e2e8f0',
  },
  planRowActive: { borderColor: '#c8a96e', backgroundColor: '#fdfbf6' },
  planName: { fontSize: '14px', fontWeight: '700', color: '#0c1b2e', textTransform: 'capitalize' },
  planPrice: { fontSize: '12px', color: '#64748b', marginTop: '2px' },
  payBtn: {
    padding: '9px 16px', borderRadius: '9px', border: 'none',
    background: 'linear-gradient(135deg, #0c1b2e 0%, #1a3558 100%)',
    color: '#fff', fontWeight: '700', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap',
  },
  cancelBtn: {
    padding: '10px 16px', borderRadius: '9px', border: '1.5px solid #fca5a5',
    background: '#fff', color: '#dc2626', fontWeight: '700', fontSize: '12px', cursor: 'pointer',
  },
  historySection: { borderTop: '1px solid #f1f5f9', paddingTop: '14px' },
  historyTitle: { margin: '0 0 10px', fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' },
  historyList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  historyRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' },
  historyPlan: { fontWeight: '600', color: '#0c1b2e', textTransform: 'capitalize' },
  historyDate: { color: '#94a3b8', fontSize: '11px' },
  historyAmount: { fontWeight: '700', color: '#0c1b2e' },
};

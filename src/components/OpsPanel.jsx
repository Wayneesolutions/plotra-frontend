import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/apiClient';
import Layout from './Layout.jsx';

// Wires the entire "WayneState Pro" ops panel backend
// (dealerOpsController.js) — previously 0% covered by the frontend despite
// being fully built server-side: overview stats, WhatsApp lead inbox with
// thread view, document verification queue, AI voice call log + trigger,
// and site visit scheduling.
const TABS = ['Overview', 'Lead Inbox', 'Documents', 'Calls', 'Visits'];

export default function OpsPanel() {
  const [activeTab, setActiveTab] = useState('Overview');

  return (
    <Layout>
      <div style={styles.container}>
        <h2 style={styles.pageTitle}>Ops</h2>
        <div style={styles.tabRow}>
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{ ...styles.tabBtn, ...(activeTab === tab ? styles.tabBtnActive : {}) }}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'Overview' && <OverviewTab />}
        {activeTab === 'Lead Inbox' && <LeadInboxTab />}
        {activeTab === 'Documents' && <DocumentsTab />}
        {activeTab === 'Calls' && <CallsTab />}
        {activeTab === 'Visits' && <VisitsTab />}
      </div>
    </Layout>
  );
}

// ─── Overview ────────────────────────────────────────────────────────────

function OverviewTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/api/v1/dashboard/ops/overview')
      .then((res) => setData(res.data))
      .catch((err) => alert(err.response?.data?.error?.message || 'Failed to load overview.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={styles.emptyText}>Loading…</p>;
  if (!data) return <p style={styles.errorText}>Could not load overview.</p>;

  const cards = [
    ['Active listings', data.stats.active_listings],
    ['New leads today', data.stats.new_leads_today],
    ['Pending doc verifications', data.stats.pending_verifications],
    ['Flagged documents', data.stats.flagged_verifications],
    ['Unlocks this week', data.stats.unlocks_this_week],
    ['Upcoming visits (7d)', data.stats.upcoming_visits],
  ];

  return (
    <div>
      <div style={styles.statGrid}>
        {cards.map(([label, value]) => (
          <div key={label} style={styles.statCard}>
            <div style={styles.statValue}>{value}</div>
            <div style={styles.statLabel}>{label}</div>
          </div>
        ))}
      </div>

      <h3 style={styles.sectionTitle}>Recent Activity</h3>
      <div style={styles.list}>
        {data.activity.length === 0 && <p style={styles.emptyText}>No recent activity.</p>}
        {data.activity.map((item, i) => (
          <div key={i} style={styles.activityRow}>
            <span style={styles.activityKind}>{item.kind}</span>
            <span style={styles.activityDetail}>{activityLabel(item)}</span>
            <span style={styles.activityTime}>{new Date(item.occurred_at).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function activityLabel(item) {
  switch (item.kind) {
    case 'unlock': return `Address unlocked — ${item.listing_title || 'listing'} ${item.actor_name ? `by ${item.actor_name}` : ''}`;
    case 'call': return `AI call — ${item.listing_title || 'lead'} (${item.outcome || 'pending'})`;
    case 'lead': return `New lead — ${item.actor_name || 'unnamed'} via ${item.source}`;
    case 'document': return `Document submitted — ${item.document_type} for ${item.listing_title}`;
    default: return item.kind;
  }
}

// ─── Lead Inbox (thread view) ───────────────────────────────────────────

function LeadInboxTab() {
  const [leads, setLeads] = useState([]);
  const [selected, setSelected] = useState(null);
  const [thread, setThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [callingId, setCallingId] = useState(null);

  useEffect(() => {
    apiClient.get('/api/v1/dashboard/ops/leads')
      .then((res) => setLeads(res.data.leads || []))
      .catch((err) => alert(err.response?.data?.error?.message || 'Failed to load leads.'));
  }, []);

  const openThread = async (lead) => {
    setSelected(lead);
    try {
      const res = await apiClient.get(`/api/v1/dashboard/ops/leads/${lead.id}/messages`);
      setThread(res.data.thread);
      setMessages(res.data.messages || []);
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to load conversation.');
    }
  };

  const triggerCall = async (lead) => {
    setCallingId(lead.id);
    try {
      const res = await apiClient.post(`/api/v1/dashboard/ops/leads/${lead.id}/call`);
      alert(res.data.message);
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to trigger call.');
    } finally {
      setCallingId(null);
    }
  };

  return (
    <div style={styles.inboxLayout}>
      <div style={styles.inboxList}>
        {leads.length === 0 && <p style={styles.emptyText}>No leads yet.</p>}
        {leads.map((lead) => (
          <div
            key={lead.id}
            onClick={() => openThread(lead)}
            style={{ ...styles.inboxRow, ...(selected?.id === lead.id ? styles.inboxRowActive : {}) }}
          >
            <div style={{ fontWeight: 600, fontSize: '13px' }}>{lead.name || 'Unnamed'}</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>{lead.phone} · {lead.status}</div>
          </div>
        ))}
      </div>
      <div style={styles.inboxThread}>
        {!selected ? (
          <p style={styles.emptyText}>Select a lead to view their WhatsApp conversation.</p>
        ) : (
          <>
            <div style={styles.threadHeader}>
              <h4 style={{ margin: 0 }}>{selected.name || 'Unnamed'} — {selected.phone}</h4>
              <button
                onClick={() => triggerCall(selected)}
                disabled={callingId === selected.id}
                style={styles.callBtn}
              >
                {callingId === selected.id ? 'Placing call…' : '📞 AI Follow-up Call'}
              </button>
            </div>
            {!thread ? (
              <p style={styles.emptyText}>No WhatsApp conversation yet for this lead.</p>
            ) : (
              <div style={styles.messageList}>
                {messages.map((m) => (
                  <div key={m.id} style={{ ...styles.messageBubble, ...(m.direction === 'outbound' ? styles.messageOut : styles.messageIn) }}>
                    {m.body}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Documents ───────────────────────────────────────────────────────────

const DOC_STATUSES = ['pending', 'verified', 'flagged', 'rejected'];

function DocumentsTab() {
  const [documents, setDocuments] = useState([]);
  const [filter, setFilter] = useState('');

  const fetchDocs = useCallback(() => {
    apiClient.get('/api/v1/dashboard/ops/documents', { params: filter ? { status: filter } : {} })
      .then((res) => setDocuments(res.data.documents || []))
      .catch((err) => alert(err.response?.data?.error?.message || 'Failed to load documents.'));
  }, [filter]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const updateStatus = async (id, status) => {
    try {
      await apiClient.patch(`/api/v1/dashboard/ops/documents/${id}`, { status });
      fetchDocs();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to update document.');
    }
  };

  return (
    <div>
      <div style={styles.filterRow}>
        <button onClick={() => setFilter('')} style={{ ...styles.filterBtn, ...(filter === '' ? styles.filterBtnActive : {}) }}>All</button>
        {DOC_STATUSES.map((s) => (
          <button key={s} onClick={() => setFilter(s)} style={{ ...styles.filterBtn, ...(filter === s ? styles.filterBtnActive : {}) }}>{s}</button>
        ))}
      </div>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Listing</th>
            <th style={styles.th}>Buyer</th>
            <th style={styles.th}>Type</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>File</th>
            <th style={styles.th}></th>
          </tr>
        </thead>
        <tbody>
          {documents.map((d) => (
            <tr key={d.id}>
              <td style={styles.td}>{d.listing_title}</td>
              <td style={styles.td}>{d.buyer_name || '—'}</td>
              <td style={styles.td}>{d.document_type}</td>
              <td style={styles.td}><StatusPill status={d.status} /></td>
              <td style={styles.td}><a href={d.file_url} target="_blank" rel="noopener noreferrer">View</a></td>
              <td style={styles.td}>
                <select defaultValue="" onChange={(e) => e.target.value && updateStatus(d.id, e.target.value)} style={styles.statusSelect}>
                  <option value="" disabled>Set status…</option>
                  {DOC_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {documents.length === 0 && <p style={styles.emptyText}>No documents in this view.</p>}
    </div>
  );
}

// ─── Calls ───────────────────────────────────────────────────────────────

function CallsTab() {
  const [calls, setCalls] = useState([]);

  useEffect(() => {
    apiClient.get('/api/v1/dashboard/ops/calls')
      .then((res) => setCalls(res.data.calls || []))
      .catch((err) => alert(err.response?.data?.error?.message || 'Failed to load calls.'));
  }, []);

  return (
    <table style={styles.table}>
      <thead>
        <tr>
          <th style={styles.th}>Lead</th>
          <th style={styles.th}>Direction</th>
          <th style={styles.th}>Outcome</th>
          <th style={styles.th}>Duration</th>
          <th style={styles.th}>Summary</th>
          <th style={styles.th}>When</th>
        </tr>
      </thead>
      <tbody>
        {calls.map((c) => (
          <tr key={c.id}>
            <td style={styles.td}>{c.lead_name || c.lead_phone || '—'}</td>
            <td style={styles.td}>{c.direction}</td>
            <td style={styles.td}>{c.outcome || 'pending'}</td>
            <td style={styles.td}>{c.duration_seconds ? `${c.duration_seconds}s` : '—'}</td>
            <td style={styles.td}>{c.transcript_summary || '—'}</td>
            <td style={styles.td}>{new Date(c.called_at).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
      {calls.length === 0 && <tbody><tr><td colSpan={6} style={styles.emptyText}>No AI calls logged yet.</td></tr></tbody>}
    </table>
  );
}

// ─── Visits ──────────────────────────────────────────────────────────────

const VISIT_STATUSES = ['scheduled', 'completed', 'cancelled', 'no_show'];

function VisitsTab() {
  const [visits, setVisits] = useState([]);

  const fetchVisits = useCallback(() => {
    apiClient.get('/api/v1/dashboard/ops/visits')
      .then((res) => setVisits(res.data.visits || []))
      .catch((err) => alert(err.response?.data?.error?.message || 'Failed to load visits.'));
  }, []);

  useEffect(() => { fetchVisits(); }, [fetchVisits]);

  const updateStatus = async (id, status) => {
    try {
      await apiClient.patch(`/api/v1/dashboard/ops/visits/${id}`, { status });
      fetchVisits();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to update visit.');
    }
  };

  return (
    <table style={styles.table}>
      <thead>
        <tr>
          <th style={styles.th}>Listing</th>
          <th style={styles.th}>Buyer</th>
          <th style={styles.th}>Agent</th>
          <th style={styles.th}>Scheduled</th>
          <th style={styles.th}>Status</th>
          <th style={styles.th}></th>
        </tr>
      </thead>
      <tbody>
        {visits.map((v) => (
          <tr key={v.id}>
            <td style={styles.td}>{v.listing_title}</td>
            <td style={styles.td}>{v.lead_name} ({v.lead_phone})</td>
            <td style={styles.td}>{v.agent_name || '—'}</td>
            <td style={styles.td}>{new Date(v.scheduled_for).toLocaleString()}</td>
            <td style={styles.td}><StatusPill status={v.status} /></td>
            <td style={styles.td}>
              <select defaultValue="" onChange={(e) => e.target.value && updateStatus(v.id, e.target.value)} style={styles.statusSelect}>
                <option value="" disabled>Set status…</option>
                {VISIT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </td>
          </tr>
        ))}
      </tbody>
      {visits.length === 0 && <tbody><tr><td colSpan={6} style={styles.emptyText}>No site visits scheduled.</td></tr></tbody>}
    </table>
  );
}

function StatusPill({ status }) {
  const positive = ['verified', 'completed', 'active'].includes(status);
  const negative = ['flagged', 'rejected', 'cancelled', 'no_show'].includes(status);
  const bg = positive ? '#e8f5e9' : negative ? '#fef2f2' : '#fff3e0';
  const color = positive ? '#2e7d32' : negative ? '#991b1b' : '#ef6c00';
  return <span style={{ ...styles.statusBadge, backgroundColor: bg, color }}>{status}</span>;
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '16px' },
  pageTitle: { margin: 0, fontSize: '24px', color: '#111' },
  statusBadge: { fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '12px', textTransform: 'uppercase' },
  tabRow: { display: 'flex', gap: '4px', borderBottom: '1px solid #e5e7eb' },
  tabBtn: { padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#6b7280', borderBottom: '2px solid transparent' },
  tabBtnActive: { color: '#2563eb', borderBottom: '2px solid #2563eb' },
  statGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' },
  statCard: { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' },
  statValue: { fontSize: '24px', fontWeight: '800', color: '#111827' },
  statLabel: { fontSize: '12px', color: '#6b7280', marginTop: '4px' },
  sectionTitle: { fontSize: '15px', color: '#374151', marginBottom: '10px' },
  list: { display: 'flex', flexDirection: 'column', gap: '6px' },
  activityRow: { display: 'flex', gap: '12px', fontSize: '13px', padding: '8px 12px', backgroundColor: '#fff', border: '1px solid #f3f4f6', borderRadius: '6px' },
  activityKind: { fontSize: '10px', textTransform: 'uppercase', fontWeight: '700', color: '#9ca3af', minWidth: '60px' },
  activityDetail: { flex: 1, color: '#111827' },
  activityTime: { color: '#9ca3af', fontSize: '12px' },
  filterRow: { display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' },
  filterBtn: { padding: '6px 12px', borderRadius: '20px', border: '1px solid #d1d5db', backgroundColor: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: '#4b5563' },
  filterBtnActive: { backgroundColor: '#2563eb', color: '#fff', borderColor: '#2563eb' },
  table: { width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' },
  th: { textAlign: 'left', fontSize: '11px', textTransform: 'uppercase', color: '#6b7280', padding: '10px 12px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' },
  td: { padding: '10px 12px', fontSize: '13px', color: '#111827', borderBottom: '1px solid #f3f4f6' },
  statusSelect: { padding: '5px 8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '12px' },
  emptyText: { color: '#9ca3af', fontStyle: 'italic', fontSize: '13px', padding: '12px' },
  errorText: { color: '#dc2626', fontSize: '13px' },
  inboxLayout: { display: 'grid', gridTemplateColumns: '280px 1fr', gap: '16px', height: '60vh' },
  inboxList: { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', overflowY: 'auto' },
  inboxRow: { padding: '10px 14px', borderBottom: '1px solid #f3f4f6', cursor: 'pointer' },
  inboxRowActive: { backgroundColor: '#eff6ff' },
  inboxThread: { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', overflowY: 'auto' },
  threadHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f3f4f6', paddingBottom: '10px', marginBottom: '10px' },
  callBtn: { padding: '7px 14px', border: 'none', backgroundColor: '#2563eb', color: '#fff', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '12px' },
  messageList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  messageBubble: { padding: '8px 12px', borderRadius: '10px', fontSize: '13px', maxWidth: '75%' },
  messageIn: { backgroundColor: '#f3f4f6', alignSelf: 'flex-start' },
  messageOut: { backgroundColor: '#dbeafe', alignSelf: 'flex-end' },
};

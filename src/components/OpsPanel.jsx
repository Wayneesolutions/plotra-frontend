import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';

/**
 * Internal dealer ops panel — Dashboard / Listings / Leads·WhatsApp /
 * Documents / AI Call Log / Site Visits / Team. Matches the WayneState
 * Pro design system approved in the Lovable mockup (audio-buddy-speak):
 * charcoal sidebar, stone content area, brass accent, teal for verified
 * states, rust for warnings. Wired to the real /api/v1/dashboard/ops/*
 * endpoints — no mock data.
 */

const NAV = [
  { key: 'overview', label: 'Dashboard' },
  { key: 'leads', label: 'Leads · WhatsApp' },
  { key: 'documents', label: 'Documents' },
  { key: 'calls', label: 'AI Call Log' },
  { key: 'visits', label: 'Site Visits' },
];

const fmtDate = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
const timeAgo = (d) => {
  if (!d) return '—';
  const mins = Math.round((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.round(hrs / 24)}d ago`;
};

export default function OpsPanel() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');

  return (
    <div style={S.root}>
      <aside style={S.sidebar}>
        <div style={S.brand}>
          <span style={S.brandMark}>◆</span>
          <div>
            <div style={S.brandName}>WayneState</div>
            <div style={S.brandSub}>PRO · OPS</div>
          </div>
        </div>
        <nav style={S.nav}>
          {NAV.map((n) => (
            <button
              key={n.key}
              onClick={() => setTab(n.key)}
              style={{ ...S.navItem, ...(tab === n.key ? S.navItemActive : {}) }}
            >
              {n.label}
            </button>
          ))}
        </nav>
        <button style={S.backBtn} onClick={() => navigate('/dashboard')}>← Listings dashboard</button>
      </aside>

      <main style={S.main}>
        {tab === 'overview' && <OverviewTab />}
        {tab === 'leads' && <LeadsTab />}
        {tab === 'documents' && <DocumentsTab />}
        {tab === 'calls' && <CallsTab />}
        {tab === 'visits' && <VisitsTab />}
      </main>
    </div>
  );
}

/* ═══════════════════════ OVERVIEW ═══════════════════════ */

function OverviewTab() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiClient.get('/api/v1/dashboard/ops/overview')
      .then((r) => setData(r.data))
      .catch((e) => setError(e.response?.data?.error?.message || 'Could not load overview.'));
  }, []);

  if (error) return <div style={S.errorBox}>{error}</div>;
  if (!data) return <div style={S.loading}>Loading overview…</div>;

  const cards = [
    { label: 'Active listings', value: data.stats.active_listings },
    { label: 'New leads today', value: data.stats.new_leads_today },
    { label: 'Pending verifications', value: data.stats.pending_verifications, note: data.stats.flagged_verifications ? `${data.stats.flagged_verifications} flagged` : null },
    { label: 'Unlocks this week', value: data.stats.unlocks_this_week },
    { label: 'Upcoming visits', value: data.stats.upcoming_visits, note: 'next 7 days' },
  ];

  return (
    <div>
      <h1 style={S.pageTitle}>Overview</h1>
      <p style={S.pageSub}>Snapshot of your live pipeline</p>

      <div style={S.cardRow}>
        {cards.map((c) => (
          <div key={c.label} style={S.statCard}>
            <div style={S.statValue}>{c.value}</div>
            <div style={S.statLabel}>{c.label}</div>
            {c.note && <div style={S.statNote}>{c.note}</div>}
          </div>
        ))}
      </div>

      <div style={S.panel}>
        <div style={S.panelHeader}>Activity feed</div>
        {data.activity.length === 0 && <div style={S.emptyState}>No activity yet.</div>}
        {data.activity.map((a, i) => (
          <div key={i} style={S.activityRow}>
            <div>
              <span style={S.activityActor}>
                {a.kind === 'unlock' && `${a.actor_name || 'A buyer'} unlocked an address`}
                {a.kind === 'call' && `AI (${a.language || 'call'}) — ${a.outcome || 'call placed'}`}
                {a.kind === 'lead' && `${a.actor_name || 'New lead'} — new ${a.source || 'inquiry'}`}
                {a.kind === 'document' && `Document submitted: ${a.document_type}`}
              </span>
              {a.listing_title && <div style={S.activityMeta}>{a.listing_title}</div>}
            </div>
            <span style={S.activityTime}>{timeAgo(a.occurred_at)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════ LEADS · WHATSAPP ═══════════════════════ */

function LeadsTab() {
  const [leads, setLeads] = useState([]);
  const [selected, setSelected] = useState(null);
  const [thread, setThread] = useState(null);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchLeads = useCallback(() => {
    apiClient.get('/api/v1/dashboard/ops/leads', { params: statusFilter ? { status: statusFilter } : {} })
      .then((r) => setLeads(r.data.leads))
      .catch((e) => setError(e.response?.data?.error?.message || 'Could not load leads.'));
  }, [statusFilter]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const openLead = (lead) => {
    setSelected(lead);
    apiClient.get(`/api/v1/dashboard/ops/leads/${lead.id}/messages`)
      .then((r) => setThread(r.data))
      .catch(() => setThread({ thread: null, messages: [] }));
  };

  return (
    <div>
      <h1 style={S.pageTitle}>Leads · WhatsApp</h1>
      <p style={S.pageSub}>Every unlock and enquiry, threaded by buyer</p>
      {error && <div style={S.errorBox}>{error}</div>}

      <div style={S.inboxLayout}>
        <div style={S.inboxList}>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={S.select}>
            <option value="">All statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="closed">Closed</option>
            <option value="lost">Lost</option>
          </select>
          {leads.map((l) => (
            <button key={l.id} onClick={() => openLead(l)} style={{ ...S.leadRow, ...(selected?.id === l.id ? S.leadRowActive : {}) }}>
              <div style={S.leadName}>{l.name || l.phone || 'Unknown'}</div>
              <div style={S.leadMeta}>{l.phone}</div>
              <span style={{ ...S.pill, ...pillColor(l.status) }}>{l.status}</span>
            </button>
          ))}
          {leads.length === 0 && <div style={S.emptyState}>No leads yet.</div>}
        </div>

        <div style={S.threadPane}>
          {!selected && <div style={S.emptyState}>Select a lead to view the conversation.</div>}
          {selected && (
            <>
              <div style={S.threadHeader}>{selected.name || selected.phone}</div>
              {thread?.messages?.length === 0 && <div style={S.emptyState}>No messages yet.</div>}
              {thread?.messages?.map((m) => (
                <div key={m.id} style={{ ...S.msgBubble, ...(m.direction === 'outbound' ? S.msgOutbound : S.msgInbound) }}>
                  <div>{m.body}</div>
                  <div style={S.msgTime}>{fmtDate(m.sent_at)}</div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function pillColor(status) {
  if (status === 'qualified' || status === 'closed') return { background: 'rgba(47,93,83,0.14)', color: '#2F5D53' };
  if (status === 'lost') return { background: 'rgba(181,80,44,0.12)', color: '#8F3E20' };
  return { background: 'rgba(169,131,47,0.14)', color: '#82611F' };
}

/* ═══════════════════════ DOCUMENTS ═══════════════════════ */

function DocumentsTab() {
  const [docs, setDocs] = useState([]);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null);

  const fetchDocs = useCallback(() => {
    apiClient.get('/api/v1/dashboard/ops/documents')
      .then((r) => setDocs(r.data.documents))
      .catch((e) => setError(e.response?.data?.error?.message || 'Could not load documents.'));
  }, []);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const act = async (id, status) => {
    setBusy(id);
    try {
      await apiClient.patch(`/api/v1/dashboard/ops/documents/${id}`, { status });
      fetchDocs();
    } catch (e) {
      alert(e.response?.data?.error?.message || 'Could not update document.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <h1 style={S.pageTitle}>Document verification</h1>
      <p style={S.pageSub}>Sale deed, mutation, and encumbrance certificate review queue</p>
      {error && <div style={S.errorBox}>{error}</div>}

      <div style={S.panel}>
        {docs.length === 0 && <div style={S.emptyState}>Nothing submitted yet.</div>}
        {docs.map((d) => (
          <div key={d.id} style={S.docRow}>
            <div>
              <div style={S.docType}>{d.document_type.replace(/_/g, ' ')}</div>
              <div style={S.activityMeta}>{d.listing_title} {d.buyer_name ? `· ${d.buyer_name}` : ''}</div>
              <a href={d.file_url} target="_blank" rel="noreferrer" style={S.docLink}>View file →</a>
            </div>
            <div style={S.docActions}>
              <span style={{ ...S.pill, ...pillColor(d.status === 'verified' ? 'qualified' : d.status === 'flagged' || d.status === 'rejected' ? 'lost' : '') }}>{d.status}</span>
              {d.status === 'pending' && (
                <>
                  <button disabled={busy === d.id} onClick={() => act(d.id, 'verified')} style={S.btnVerify}>Verify</button>
                  <button disabled={busy === d.id} onClick={() => act(d.id, 'flagged')} style={S.btnFlag}>Flag</button>
                  <button disabled={busy === d.id} onClick={() => act(d.id, 'rejected')} style={S.btnReject}>Reject</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════ AI CALL LOG ═══════════════════════ */

function CallsTab() {
  const [calls, setCalls] = useState([]);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    apiClient.get('/api/v1/dashboard/ops/calls')
      .then((r) => setCalls(r.data.calls))
      .catch((e) => setError(e.response?.data?.error?.message || 'Could not load call log.'));
  }, []);

  return (
    <div>
      <h1 style={S.pageTitle}>AI call log</h1>
      <p style={S.pageSub}>WayneRing follow-up calls, in Hindi, Punjabi and English</p>
      {error && <div style={S.errorBox}>{error}</div>}

      <div style={S.panel}>
        {calls.length === 0 && <div style={S.emptyState}>No calls logged yet.</div>}
        {calls.map((c) => (
          <div key={c.id}>
            <button style={S.callRow} onClick={() => setExpanded(expanded === c.id ? null : c.id)}>
              <div>
                <div style={S.docType}>{c.lead_name || c.lead_phone || 'Unknown lead'}</div>
                <div style={S.activityMeta}>{c.listing_title || '—'} · {c.language || '—'}</div>
              </div>
              <div style={S.callRight}>
                <span style={{ ...S.pill, ...pillColor(c.outcome === 'booked_visit' ? 'qualified' : '') }}>{c.outcome || 'pending'}</span>
                <span style={S.activityTime}>{fmtDate(c.called_at)}</span>
              </div>
            </button>
            {expanded === c.id && (
              <div style={S.callDetail}>
                <div><b>Duration:</b> {c.duration_seconds ? `${c.duration_seconds}s` : '—'}</div>
                <div><b>Transcript summary:</b> {c.transcript_summary || 'Not available.'}</div>
                {c.recording_url && <a href={c.recording_url} target="_blank" rel="noreferrer" style={S.docLink}>Recording →</a>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════ SITE VISITS ═══════════════════════ */

function VisitsTab() {
  const [visits, setVisits] = useState([]);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null);

  const fetchVisits = useCallback(() => {
    apiClient.get('/api/v1/dashboard/ops/visits')
      .then((r) => setVisits(r.data.visits))
      .catch((e) => setError(e.response?.data?.error?.message || 'Could not load site visits.'));
  }, []);

  useEffect(() => { fetchVisits(); }, [fetchVisits]);

  const act = async (id, status) => {
    setBusy(id);
    try {
      await apiClient.patch(`/api/v1/dashboard/ops/visits/${id}`, { status });
      fetchVisits();
    } catch (e) {
      alert(e.response?.data?.error?.message || 'Could not update visit.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <h1 style={S.pageTitle}>Site visits</h1>
      <p style={S.pageSub}>Scheduled walkthroughs, by date</p>
      {error && <div style={S.errorBox}>{error}</div>}

      <div style={S.panel}>
        {visits.length === 0 && <div style={S.emptyState}>Nothing scheduled.</div>}
        {visits.map((v) => (
          <div key={v.id} style={S.docRow}>
            <div>
              <div style={S.docType}>{v.listing_title}</div>
              <div style={S.activityMeta}>{v.lead_name || v.lead_phone} · {fmtDate(v.scheduled_for)}{v.agent_name ? ` · ${v.agent_name}` : ''}</div>
            </div>
            <div style={S.docActions}>
              <span style={{ ...S.pill, ...pillColor(v.status === 'completed' ? 'qualified' : v.status === 'cancelled' || v.status === 'no_show' ? 'lost' : '') }}>{v.status}</span>
              {v.status === 'scheduled' && (
                <>
                  <button disabled={busy === v.id} onClick={() => act(v.id, 'completed')} style={S.btnVerify}>Completed</button>
                  <button disabled={busy === v.id} onClick={() => act(v.id, 'no_show')} style={S.btnFlag}>No-show</button>
                  <button disabled={busy === v.id} onClick={() => act(v.id, 'cancelled')} style={S.btnReject}>Cancel</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════ STYLES ═══════════════════════ */

const INK = '#171B23';
const STONE = '#F5F3EC';
const BRASS = '#A9832F';
const BRASS_DARK = '#82611F';
const TEAL = '#2F5D53';
const RUST = '#B5502C';
const RUST_DARK = '#8F3E20';
const LINE = 'rgba(23,27,35,0.12)';

const S = {
  root: { display: 'flex', minHeight: '100vh', background: STONE, fontFamily: "'Inter', sans-serif", color: INK },
  sidebar: { width: '240px', flexShrink: 0, background: INK, color: STONE, display: 'flex', flexDirection: 'column', padding: '24px 16px' },
  brand: { display: 'flex', alignItems: 'center', gap: '10px', padding: '0 8px 24px', borderBottom: '1px solid rgba(245,243,236,0.1)', marginBottom: '20px' },
  brandMark: { color: BRASS, fontSize: '18px' },
  brandName: { fontFamily: "'Newsreader', serif", fontSize: '16px', fontWeight: 600, lineHeight: 1.1 },
  brandSub: { fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', letterSpacing: '0.06em', color: 'rgba(245,243,236,0.5)' },
  nav: { display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 },
  navItem: { textAlign: 'left', background: 'none', border: 'none', color: 'rgba(245,243,236,0.7)', padding: '10px 12px', borderRadius: '4px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' },
  navItemActive: { background: 'rgba(169,131,47,0.16)', color: STONE },
  backBtn: { marginTop: '12px', background: 'none', border: '1px solid rgba(245,243,236,0.15)', color: 'rgba(245,243,236,0.6)', padding: '10px', borderRadius: '4px', fontSize: '12.5px', cursor: 'pointer' },

  main: { flex: 1, padding: '40px 48px', overflowY: 'auto' },
  pageTitle: { fontFamily: "'Newsreader', serif", fontSize: '28px', fontWeight: 500, margin: '0 0 4px' },
  pageSub: { fontSize: '14px', color: 'rgba(23,27,35,0.6)', margin: '0 0 28px' },

  cardRow: { display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '32px' },
  statCard: { background: '#fff', border: `1px solid ${LINE}`, borderRadius: '4px', padding: '18px 20px', minWidth: '160px', flex: 1 },
  statValue: { fontFamily: "'IBM Plex Mono', monospace", fontSize: '26px', fontWeight: 500 },
  statLabel: { fontSize: '12.5px', color: 'rgba(23,27,35,0.6)', marginTop: '4px' },
  statNote: { fontFamily: "'IBM Plex Mono', monospace", fontSize: '10.5px', color: RUST_DARK, marginTop: '4px' },

  panel: { background: '#fff', border: `1px solid ${LINE}`, borderRadius: '4px', overflow: 'hidden' },
  panelHeader: { fontFamily: "'Newsreader', serif", fontSize: '17px', fontWeight: 600, padding: '18px 22px', borderBottom: `1px solid ${LINE}` },
  emptyState: { padding: '28px 22px', fontSize: '13.5px', color: 'rgba(23,27,35,0.5)' },
  errorBox: { background: 'rgba(181,80,44,0.08)', color: RUST_DARK, padding: '12px 16px', borderRadius: '4px', fontSize: '13.5px', marginBottom: '18px' },
  loading: { fontSize: '14px', color: 'rgba(23,27,35,0.5)' },

  activityRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '14px 22px', borderBottom: `1px solid ${LINE}` },
  activityActor: { fontSize: '13.5px', fontWeight: 600 },
  activityMeta: { fontSize: '12.5px', color: 'rgba(23,27,35,0.55)', marginTop: '2px' },
  activityTime: { fontFamily: "'IBM Plex Mono', monospace", fontSize: '11.5px', color: 'rgba(23,27,35,0.45)', whiteSpace: 'nowrap', marginLeft: '16px' },

  inboxLayout: { display: 'flex', gap: '16px', height: '560px' },
  inboxList: { width: '300px', flexShrink: 0, background: '#fff', border: `1px solid ${LINE}`, borderRadius: '4px', overflowY: 'auto', display: 'flex', flexDirection: 'column' },
  select: { margin: '10px', padding: '8px', fontSize: '12.5px', border: `1px solid ${LINE}`, borderRadius: '3px', fontFamily: 'inherit' },
  leadRow: { textAlign: 'left', background: 'none', border: 'none', borderBottom: `1px solid ${LINE}`, padding: '12px 14px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '4px' },
  leadRowActive: { background: STONE },
  leadName: { fontSize: '13.5px', fontWeight: 600 },
  leadMeta: { fontFamily: "'IBM Plex Mono', monospace", fontSize: '11.5px', color: 'rgba(23,27,35,0.55)' },
  pill: { fontFamily: "'IBM Plex Mono', monospace", fontSize: '10.5px', textTransform: 'uppercase', padding: '3px 8px', borderRadius: '3px', alignSelf: 'flex-start' },

  threadPane: { flex: 1, background: '#fff', border: `1px solid ${LINE}`, borderRadius: '4px', padding: '18px 22px', overflowY: 'auto' },
  threadHeader: { fontFamily: "'Newsreader', serif", fontSize: '16px', fontWeight: 600, marginBottom: '14px' },
  msgBubble: { maxWidth: '75%', padding: '10px 14px', borderRadius: '6px', fontSize: '13.5px', marginBottom: '10px' },
  msgOutbound: { background: INK, color: STONE, marginLeft: 'auto' },
  msgInbound: { background: STONE },
  msgTime: { fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', opacity: 0.6, marginTop: '4px' },

  docRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 22px', borderBottom: `1px solid ${LINE}`, gap: '16px' },
  docType: { fontSize: '14px', fontWeight: 600, textTransform: 'capitalize' },
  docLink: { fontSize: '12px', color: BRASS_DARK, fontWeight: 600 },
  docActions: { display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 },
  btnVerify: { fontSize: '12px', fontWeight: 600, padding: '7px 12px', border: 'none', borderRadius: '3px', background: TEAL, color: '#fff', cursor: 'pointer' },
  btnFlag: { fontSize: '12px', fontWeight: 600, padding: '7px 12px', border: 'none', borderRadius: '3px', background: BRASS, color: '#fff', cursor: 'pointer' },
  btnReject: { fontSize: '12px', fontWeight: 600, padding: '7px 12px', border: `1px solid ${LINE}`, borderRadius: '3px', background: 'none', color: RUST_DARK, cursor: 'pointer' },

  callRow: { width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 22px', borderBottom: `1px solid ${LINE}`, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' },
  callRight: { display: 'flex', alignItems: 'center', gap: '14px' },
  callDetail: { padding: '4px 22px 18px', fontSize: '13px', color: 'rgba(23,27,35,0.75)', display: 'flex', flexDirection: 'column', gap: '6px', borderBottom: `1px solid ${LINE}` },
};

import React, { useEffect, useRef, useState } from 'react';
import apiClient from '../api/apiClient';

// Public web chat widget — lets a dealer add/manage listings by chatting,
// the same conversational flow as the WhatsApp agent-intake feature, but
// embeddable on a tenant's own website (see ChatWidgetPage.jsx, mounted at
// /widget so it can be iframed). Since there's no login here, a tenant is
// identified by a unique activation code they enter once (issued in
// Settings.jsx's "Web Chat Widget" section) — wired to
// POST /api/v1/chat/web/activate and then included on every
// POST /api/v1/chat/web(/photo) call as `tenant_code`.
const CODE_STORAGE_KEY = 'plotra_chat_code';
const TENANT_NAME_STORAGE_KEY = 'plotra_chat_tenant_name';
const SESSION_STORAGE_KEY = 'plotra_chat_session_id';

function getOrCreateSessionId() {
  let id = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!id) {
    id = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : `sess-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem(SESSION_STORAGE_KEY, id);
  }
  return id;
}

export default function ChatWidget() {
  const [code, setCode] = useState(() => localStorage.getItem(CODE_STORAGE_KEY));
  const [tenantName, setTenantName] = useState(() => localStorage.getItem(TENANT_NAME_STORAGE_KEY));
  const [codeInput, setCodeInput] = useState('');
  const [activating, setActivating] = useState(false);
  const [activateError, setActivateError] = useState(null);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const sessionIdRef = useRef(getOrCreateSessionId());
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const disconnect = () => {
    localStorage.removeItem(CODE_STORAGE_KEY);
    localStorage.removeItem(TENANT_NAME_STORAGE_KEY);
    setCode(null);
    setTenantName(null);
    setMessages([]);
  };

  const handleActivate = async (e) => {
    e.preventDefault();
    if (!codeInput.trim()) return;
    setActivating(true);
    setActivateError(null);
    try {
      const trimmed = codeInput.trim();
      const res = await apiClient.post('/api/v1/chat/web/activate', { code: trimmed });
      localStorage.setItem(CODE_STORAGE_KEY, trimmed);
      localStorage.setItem(TENANT_NAME_STORAGE_KEY, res.data.tenantName);
      setCode(trimmed);
      setTenantName(res.data.tenantName);
    } catch (err) {
      setActivateError(err.response?.data?.error?.message || "That code isn't recognized. Please check it and try again.");
    } finally {
      setActivating(false);
    }
  };

  const handleInvalidCode = (message) => {
    disconnect();
    setActivateError(message || 'Your activation code is no longer valid. Please enter your current code.');
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setMessages((prev) => [...prev, { role: 'user', text }]);
    setInput('');
    setSending(true);
    try {
      const res = await apiClient.post('/api/v1/chat/web', {
        message: text,
        session_id: sessionIdRef.current,
        tenant_code: code,
      });
      setMessages((prev) => [...prev, { role: 'assistant', text: res.data.reply, listing: res.data.listing }]);
    } catch (err) {
      if (err.response?.data?.error?.code === 'INVALID_CODE') {
        handleInvalidCode(err.response.data.error.message);
      } else {
        setMessages((prev) => [...prev, {
          role: 'assistant',
          text: err.response?.data?.error?.message || "Couldn't reach Plotra's assistant. Please try again.",
          isError: true,
        }]);
      }
    } finally {
      setSending(false);
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('photo', file);
    formData.append('session_id', sessionIdRef.current);
    formData.append('tenant_code', code);

    setSending(true);
    try {
      const res = await apiClient.post('/api/v1/chat/web/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessages((prev) => [...prev, { role: 'assistant', text: res.data.reply }]);
    } catch (err) {
      if (err.response?.data?.error?.code === 'INVALID_CODE') {
        handleInvalidCode(err.response.data.error.message);
      } else {
        setMessages((prev) => [...prev, {
          role: 'assistant',
          text: err.response?.data?.error?.message || 'Failed to upload photo. Please try again.',
          isError: true,
        }]);
      }
    } finally {
      setSending(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!code) {
    return (
      <div style={S.panel}>
        <div style={S.header}>
          <div style={S.headerTitle}>Plotra Assistant</div>
          <div style={S.headerSubtitle}>Add listings by chatting — just like WhatsApp</div>
        </div>
        <form onSubmit={handleActivate} style={S.activateForm}>
          <p style={S.activateHint}>
            Enter your Plotra activation code to connect this widget to your account. You'll find
            it under Settings → Web Chat Widget in your dashboard.
          </p>
          {activateError && <div style={S.errorBox}>{activateError}</div>}
          <input
            style={S.input}
            type="text"
            required
            autoFocus
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
            placeholder="e.g. 7K3PQMX9"
          />
          <button type="submit" disabled={activating} style={{ ...S.sendBtn, opacity: activating ? 0.7 : 1 }}>
            {activating ? 'Activating…' : 'Activate'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={S.panel}>
      <div style={S.header}>
        <div>
          <div style={S.headerTitle}>Plotra Assistant</div>
          <div style={S.headerSubtitle}>Connected to {tenantName}</div>
        </div>
        <button onClick={disconnect} style={S.disconnectBtn} title="Disconnect this widget">✕</button>
      </div>

      <div style={S.messages}>
        {messages.length === 0 && (
          <div style={S.emptyState}>
            Describe a property to get started — e.g. "3BHK flat sector 45 mohali 55 lakh".
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ ...S.bubbleRow, justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              ...S.bubble,
              ...(m.role === 'user' ? S.bubbleUser : S.bubbleAssistant),
              ...(m.isError ? S.bubbleError : {}),
            }}>
              {m.text}
              {m.listing?.link && (
                <div style={S.listingLink}>
                  <a href={m.listing.link} target="_blank" rel="noreferrer" style={S.listingLinkAnchor}>
                    View listing preview →
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      <form onSubmit={handleSend} style={S.inputRow}>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          style={S.attachBtn}
          title="Attach a photo"
          disabled={sending}
        >
          📷
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
        <input
          style={S.chatInput}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message…"
          disabled={sending}
        />
        <button type="submit" disabled={sending || !input.trim()} style={{ ...S.sendBtn, opacity: sending ? 0.7 : 1 }}>
          {sending ? '…' : 'Send'}
        </button>
      </form>
    </div>
  );
}

const S = {
  panel: {
    display: 'flex', flexDirection: 'column', height: '100%', width: '100%',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backgroundColor: '#fff',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 18px', borderBottom: '1px solid #e5e7eb',
    background: 'linear-gradient(135deg, #0c1b2e 0%, #1a3558 100%)', color: '#fff', flexShrink: 0,
  },
  headerTitle: { fontSize: '15px', fontWeight: '800' },
  headerSubtitle: { fontSize: '12px', color: '#cbd5e1', marginTop: '2px' },
  disconnectBtn: {
    width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(255,255,255,0.12)', border: 'none',
    cursor: 'pointer', fontSize: '13px', color: '#fff', flexShrink: 0,
  },
  activateForm: { display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px' },
  activateHint: { fontSize: '13px', color: '#64748b', lineHeight: '1.6', margin: 0 },
  errorBox: {
    backgroundColor: '#fff5f5', color: '#c53030', padding: '10px 14px',
    borderRadius: '8px', fontSize: '13px', border: '1px solid #fed7d7',
  },
  messages: { flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' },
  emptyState: { fontSize: '13px', color: '#94a3b8', textAlign: 'center', padding: '24px 12px', lineHeight: '1.6' },
  bubbleRow: { display: 'flex' },
  bubble: { maxWidth: '80%', padding: '10px 13px', borderRadius: '12px', fontSize: '14px', lineHeight: '1.5', whiteSpace: 'pre-wrap' },
  bubbleUser: { backgroundColor: '#0c1b2e', color: '#fff', borderBottomRightRadius: '2px' },
  bubbleAssistant: { backgroundColor: '#f1f5f9', color: '#0c1b2e', borderBottomLeftRadius: '2px' },
  bubbleError: { backgroundColor: '#fff5f5', color: '#c53030' },
  listingLink: { marginTop: '8px' },
  listingLinkAnchor: { fontSize: '13px', fontWeight: '700', color: '#c8a96e' },
  inputRow: { display: 'flex', gap: '8px', padding: '12px 14px', borderTop: '1px solid #e5e7eb', flexShrink: 0 },
  attachBtn: {
    width: '38px', height: '38px', borderRadius: '9px', border: '1.5px solid #e2e8f0', background: '#fafbfd',
    cursor: 'pointer', fontSize: '16px', flexShrink: 0,
  },
  chatInput: {
    flex: 1, padding: '10px 13px', fontSize: '14px', border: '1.5px solid #e2e8f0', borderRadius: '9px',
    color: '#0c1b2e', backgroundColor: '#fafbfd',
  },
  input: {
    padding: '11px 13px', fontSize: '14px', border: '1.5px solid #e2e8f0', borderRadius: '9px',
    width: '100%', color: '#0c1b2e', backgroundColor: '#fafbfd', boxSizing: 'border-box',
  },
  sendBtn: {
    padding: '10px 18px', border: 'none', borderRadius: '9px',
    background: 'linear-gradient(135deg, #0c1b2e 0%, #1a3558 100%)',
    color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer', flexShrink: 0,
  },
};

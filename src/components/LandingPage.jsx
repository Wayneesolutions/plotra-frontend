import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../api/config';

/**
 * Public marketing homepage — what a prospective client OR an investor
 * sees at "/". Restyled to match the WayneState Pro design system
 * approved in the Lovable mockup (lock-reveal-plot): charcoal ink,
 * brass/gold accent, deep teal for "verified" states, blueprint-grid
 * texture. The address-protected property card is the signature visual
 * element — it's the product's actual differentiator, not decoration.
 */
export default function LandingPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/v1/public/billing/plans`)
      .then((res) => setPlans(res.data.plans || []))
      .catch(() => {}); // pricing section just hides gracefully if this fails
  }, []);

  return (
    <div style={S.root}>
      {/* ══ NAV ══════════════════════════════════════════════ */}
      <header style={S.nav}>
        <div style={S.navInner}>
          <div style={S.navLogo}>
            <span style={S.navLogoMark}>◆</span>
            <span style={S.navBrand}>WayneState <em style={S.navBrandAccent}>Pro</em></span>
          </div>
          <div style={S.navLinks}>
            <a href="#features" style={S.navLink}>Features</a>
            <a href="#pricing" style={S.navLink}>Pricing</a>
            <button onClick={() => navigate('/login')} style={S.navLoginBtn}>Log In</button>
          </div>
        </div>
      </header>

      {/* ══ HERO ═════════════════════════════════════════════ */}
      <section style={S.hero}>
        <div style={S.heroInner}>
          <div style={S.heroLeft}>
            <span style={S.heroEyebrow}>For dealers &amp; buyers · Punjab</span>
            <h1 style={S.heroTitle}>
              Show the plot.<br /><em style={S.heroTitleAccent}>Hide the address.</em>
            </h1>
            <p style={S.heroSub}>
              One platform for both sides of the deal. Dealers list plots with
              addresses redacted until a buyer messages on WhatsApp. Buyers get
              full property information and independent document verification
              before they visit — not after.
            </p>
            <div style={S.heroActions}>
              <button onClick={() => navigate('/request-access')} style={S.ctaPrimary}>
                Request access
              </button>
              <a href="#features" style={S.ctaSecondary}>See how it works →</a>
            </div>
          </div>

          <div style={S.heroRight}>
            <div style={S.plotCard}>
              <div style={S.plotPhoto}>
                <span style={S.protectTag}>● Verified · Address hidden</span>
              </div>
              <div style={S.plotBody}>
                <div style={S.plotTopRow}>
                  <span style={S.plotName}>3BHK Kothi</span>
                  <span style={S.plotPrice}>₹1.42 Cr</span>
                </div>
                <div style={S.plotMeta}>Sector 68 · Mohali</div>
                <div style={S.plotAddress}>
                  <span style={{ filter: unlocked ? 'none' : 'blur(4px)', userSelect: unlocked ? 'auto' : 'none' }}>
                    House 412, Street 6, Model Town, Mohali
                  </span>
                  <button style={S.unlockBtn} onClick={() => setUnlocked((u) => !u)}>
                    {unlocked ? 'Hide again' : 'Unlock via WhatsApp'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FOR DEALERS / FOR BUYERS ═════════════════════════ */}
      <section id="features" style={S.section}>
        <div style={S.sectionInner}>
          <span style={S.sectionEyebrow}>For dealers</span>
          <h2 style={S.sectionTitle}>Run your book, not a spreadsheet.</h2>
          <div style={S.featureGrid}>
            {DEALER_FEATURES.map((f) => (
              <div key={f.title} style={S.featureCard}>
                <h3 style={S.featureTitle}>{f.title}</h3>
                <p style={S.featureDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ ...S.section, backgroundColor: S.colors.paper }}>
        <div style={S.sectionInner}>
          <span style={S.sectionEyebrow}>For buyers</span>
          <h2 style={S.sectionTitle}>Full information. Verified paperwork. Before you visit.</h2>
          <div style={S.featureGrid}>
            {BUYER_FEATURES.map((f) => (
              <div key={f.title} style={S.featureCard}>
                <h3 style={S.featureTitle}>{f.title}</h3>
                <p style={S.featureDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PRICING ══════════════════════════════════════════ */}
      {plans.length > 0 && (
        <section id="pricing" style={S.section}>
          <div style={S.sectionInner}>
            <h2 style={S.sectionTitle}>Simple, transparent pricing</h2>
            <p style={S.sectionSub}>Cancel or change plans anytime.</p>
            <div style={S.pricingGrid}>
              {plans.map((p, i) => (
                <div key={p.key} style={{ ...S.priceCard, ...(i === 1 ? S.priceCardHighlight : {}) }}>
                  {i === 1 && <span style={S.popularBadge}>Most popular</span>}
                  <h3 style={S.priceLabel}>{p.label}</h3>
                  <div style={S.priceAmount}>
                    ₹{p.priceINR.toLocaleString('en-IN')}
                    <span style={S.pricePeriod}>/month</span>
                  </div>
                  <ul style={S.priceFeatures}>
                    {p.features.map((f) => <li key={f}>✓ {f}</li>)}
                  </ul>
                  <button onClick={() => navigate('/request-access')} style={i === 1 ? S.priceBtnHighlight : S.priceBtn}>
                    Get started
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ FINAL CTA ════════════════════════════════════════ */}
      <section style={S.finalCta}>
        <h2 style={S.finalCtaTitle}>Ready to protect your listings — and your commission?</h2>
        <p style={S.finalCtaSub}>Get your first listing live in under 10 minutes.</p>
        <button onClick={() => navigate('/request-access')} style={S.ctaPrimary}>
          Request access
        </button>
      </section>

      {/* ══ FOOTER ═══════════════════════════════════════════ */}
      <footer style={S.footer}>
        <p style={S.footerTxt}>© {new Date().getFullYear()} WayneState Pro · Made in Ludhiana, Punjab</p>
      </footer>
    </div>
  );
}

const DEALER_FEATURES = [
  { title: 'Address-protected pages', desc: 'Every listing page redacts the exact address until a real buyer messages you.' },
  { title: 'WhatsApp lead inbox', desc: 'Every unlock lands as a threaded chat, tagged by listing, city and buyer intent.' },
  { title: 'AI voice follow-up', desc: 'Auto call-back in Hindi, Punjabi and English within 90 seconds of a new lead.' },
  { title: 'Plot boundary tracing', desc: 'Draw the survey outline once — buyers see dimensions, not just a map pin.' },
  { title: 'One dealer dashboard', desc: 'Listings, unlocks, calls, site visits and payments — one workspace, one team.' },
  { title: 'Rent-vs-buy calculator', desc: 'Embed a calculator on any listing — fewer "what\u2019s the EMI" messages.' },
];

const BUYER_FEATURES = [
  { title: 'Full property information', desc: 'Every spec — dimensions, facing, floor plan, age, and neighbourhood notes — before spending a rupee on travel.' },
  { title: 'Independent document check', desc: 'Sale deed, mutation and encumbrance certificate reviewed by a lawyer panel within 48 hours.' },
  { title: 'Rent-vs-buy calculator', desc: 'Compare EMIs, rent and 10-year outcomes for any listing. No signup, no email traps.' },
];

const S = {
  colors: { ink: '#171B23', paper: '#F5F3EC', stone: '#E7E4DA', brass: '#A9832F', brassDark: '#82611F', teal: '#2F5D53', rust: '#B5502C', rustDark: '#8F3E20' },

  root: { fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: '#171B23', backgroundColor: '#F7F6F1' },

  nav: { borderBottom: '1px solid rgba(23,27,35,0.1)', position: 'sticky', top: 0, backgroundColor: 'rgba(247,246,241,0.92)', backdropFilter: 'blur(8px)', zIndex: 50 },
  navInner: { maxWidth: '1140px', margin: '0 auto', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  navLogo: { display: 'flex', alignItems: 'center', gap: '9px' },
  navLogoMark: { color: '#A9832F', fontSize: '18px' },
  navBrand: { fontFamily: "'Newsreader', serif", fontSize: '19px', fontWeight: 600, color: '#171B23' },
  navBrandAccent: { fontStyle: 'italic', color: '#A9832F' },
  navLinks: { display: 'flex', alignItems: 'center', gap: '28px' },
  navLink: { fontSize: '14px', color: 'rgba(23,27,35,0.7)', fontWeight: 500, textDecoration: 'none' },
  navLoginBtn: { padding: '9px 20px', borderRadius: '2px', border: '1px solid #171B23', background: 'none', color: '#171B23', fontWeight: 600, fontSize: '13px', cursor: 'pointer' },

  hero: { background: '#171B23', padding: '80px 24px 90px', backgroundImage: 'linear-gradient(rgba(245,243,236,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(245,243,236,0.05) 1px, transparent 1px)', backgroundSize: '38px 38px' },
  heroInner: { maxWidth: '1140px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '56px', alignItems: 'center' },
  heroLeft: {},
  heroEyebrow: { display: 'inline-block', fontFamily: "'IBM Plex Mono', monospace", color: '#D4B876', fontSize: '12px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '20px' },
  heroTitle: { fontFamily: "'Newsreader', serif", fontSize: '46px', fontWeight: 500, color: '#F5F3EC', lineHeight: 1.12, margin: '0 0 22px' },
  heroTitleAccent: { fontStyle: 'italic', color: '#A9832F' },
  heroSub: { fontSize: '16px', color: 'rgba(245,243,236,0.7)', lineHeight: 1.65, maxWidth: '480px', margin: '0 0 32px' },
  heroActions: { display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' },
  ctaPrimary: { padding: '14px 26px', borderRadius: '2px', border: 'none', background: '#A9832F', color: '#fff', fontWeight: 600, fontSize: '15px', cursor: 'pointer' },
  ctaSecondary: { color: '#F5F3EC', fontSize: '14px', fontWeight: 600, textDecoration: 'none', opacity: 0.75 },

  heroRight: {},
  plotCard: { background: '#fff', borderRadius: '4px', overflow: 'hidden', boxShadow: '0 30px 60px -20px rgba(0,0,0,0.4)' },
  plotPhoto: { height: '160px', background: 'linear-gradient(160deg, #3A3F47 0%, #171B23 100%)', position: 'relative' },
  protectTag: { position: 'absolute', top: '12px', left: '12px', background: 'rgba(47,93,83,0.92)', color: '#fff', fontFamily: "'IBM Plex Mono', monospace", fontSize: '10.5px', padding: '5px 10px', borderRadius: '2px' },
  plotBody: { padding: '20px' },
  plotTopRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' },
  plotName: { fontFamily: "'Newsreader', serif", fontSize: '18px', fontWeight: 600 },
  plotPrice: { fontFamily: "'IBM Plex Mono', monospace", fontSize: '17px', color: '#82611F' },
  plotMeta: { fontSize: '12.5px', color: 'rgba(23,27,35,0.55)', marginBottom: '14px' },
  plotAddress: { fontFamily: "'IBM Plex Mono', monospace", fontSize: '12.5px', border: '1px dashed rgba(23,27,35,0.25)', borderRadius: '2px', padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' },
  unlockBtn: { fontSize: '11px', fontWeight: 600, color: '#fff', background: '#171B23', border: 'none', borderRadius: '2px', padding: '6px 10px', cursor: 'pointer', whiteSpace: 'nowrap' },

  section: { padding: '80px 24px' },
  sectionInner: { maxWidth: '1140px', margin: '0 auto' },
  sectionEyebrow: { display: 'block', fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#82611F', marginBottom: '12px' },
  sectionTitle: { fontFamily: "'Newsreader', serif", fontSize: '30px', fontWeight: 500, color: '#171B23', margin: '0 0 40px', maxWidth: '640px' },
  sectionSub: { fontSize: '15px', color: 'rgba(23,27,35,0.6)', margin: '-28px 0 40px' },

  featureGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'rgba(23,27,35,0.12)', border: '1px solid rgba(23,27,35,0.12)' },
  featureCard: { backgroundColor: '#fff', padding: '26px 24px' },
  featureTitle: { fontFamily: "'Newsreader', serif", fontSize: '17px', fontWeight: 600, color: '#171B23', margin: '0 0 8px' },
  featureDesc: { fontSize: '13.5px', color: 'rgba(23,27,35,0.6)', lineHeight: 1.6, margin: 0 },

  pricingGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' },
  priceCard: { border: '1px solid rgba(23,27,35,0.12)', borderRadius: '4px', padding: '30px 26px', position: 'relative', display: 'flex', flexDirection: 'column', background: '#fff' },
  priceCardHighlight: { border: '2px solid #A9832F' },
  popularBadge: { position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#A9832F', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '4px 14px', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  priceLabel: { fontSize: '14px', fontWeight: 700, color: 'rgba(23,27,35,0.6)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  priceAmount: { fontFamily: "'IBM Plex Mono', monospace", fontSize: '30px', fontWeight: 500, color: '#171B23', marginBottom: '20px' },
  pricePeriod: { fontSize: '13px', fontWeight: 400, color: 'rgba(23,27,35,0.5)' },
  priceFeatures: { listStyle: 'none', padding: 0, margin: '0 0 26px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'rgba(23,27,35,0.75)', flex: 1 },
  priceBtn: { padding: '12px', borderRadius: '2px', border: '1.5px solid #171B23', background: '#fff', color: '#171B23', fontWeight: 600, fontSize: '14px', cursor: 'pointer' },
  priceBtnHighlight: { padding: '12px', borderRadius: '2px', border: 'none', background: '#171B23', color: '#fff', fontWeight: 600, fontSize: '14px', cursor: 'pointer' },

  finalCta: { textAlign: 'center', padding: '90px 24px', backgroundColor: '#171B23' },
  finalCtaTitle: { fontFamily: "'Newsreader', serif", fontSize: '32px', fontWeight: 500, color: '#F5F3EC', margin: '0 auto 12px', maxWidth: '620px' },
  finalCtaSub: { fontSize: '15px', color: 'rgba(245,243,236,0.6)', margin: '0 0 30px' },

  footer: { textAlign: 'center', padding: '28px', borderTop: '1px solid rgba(23,27,35,0.1)' },
  footerTxt: { fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', color: 'rgba(23,27,35,0.5)', margin: 0 },
};

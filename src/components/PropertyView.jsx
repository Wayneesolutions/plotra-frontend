import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../api/config';
// NEW — Phase 6 monetization
import RentVsBuyCalculator from './RentVsBuyCalculator.jsx';
import AdSlot from './AdSlot.jsx';

export default function PropertyView() {
  const { slug } = useParams();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const visitIdRef = useRef(null);

  const [showPhonePrompt, setShowPhonePrompt] = useState(false);
  const [phoneForm, setPhoneForm]             = useState({ name: '', phone: '' });
  const [phoneSubmitting, setPhoneSubmitting] = useState(false);
  const [phoneSubmitted, setPhoneSubmitted]   = useState(false);
  const [phoneError, setPhoneError]           = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE_URL}/api/v1/public/listings/${slug}`);
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.error?.message || err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  useEffect(() => {
    if (!data?.listing) return;
    axios.post(`${API_BASE_URL}/api/v1/public/listings/${slug}/visit`, {
      referral_source: document.referrer ? 'referral' : 'direct',
    })
      .then(r => { visitIdRef.current = r.data.visitId; })
      .catch(() => {});
  }, [data, slug]);

  const handlePhoneChange = (e) => {
    const { name, value } = e.target;
    setPhoneForm(p => ({ ...p, [name]: value }));
  };

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setPhoneSubmitting(true);
    setPhoneError(null);
    try {
      await axios.post(`${API_BASE_URL}/api/v1/public/listings/${slug}/lead`, {
        name: phoneForm.name,
        phone: phoneForm.phone,
        visitId: visitIdRef.current,
      });
      setPhoneSubmitted(true);
    } catch (err) {
      setPhoneError(err.response?.data?.error?.message || 'Something went wrong. Please try again.');
    } finally {
      setPhoneSubmitting(false);
    }
  };

  /* ── Loading ─────────────────────────────────────── */
  if (loading) return (
    <div style={S.screen}>
      <div style={S.spinRing} />
      <p style={S.screenTxt}>Loading property…</p>
    </div>
  );

  if (error) return (
    <div style={S.screen}>
      <div style={S.errCard}>
        <span style={{ fontSize: '36px' }}>⚠️</span>
        <p style={{ color: '#dc2626', margin: 0, fontSize: '15px' }}>{error}</p>
      </div>
    </div>
  );

  if (!data?.listing) return (
    <div style={S.screen}>
      <p style={S.screenTxt}>Property not found.</p>
    </div>
  );

  const { listing, media, landmarks, dealer } = data;

  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(listing.price);

  const waMeLink = dealer?.whatsappDigits
    ? `https://wa.me/${dealer.whatsappDigits}?text=${encodeURIComponent(
        `Hi, I'm interested in "${listing.title}" (${formattedPrice}) — ${window.location.href}`
      )}`
    : null;

  const ICONS = { school: '🏫', hospital: '🏥', market: '🛒', transit: '🚌' };

  const hasSatellite  = !!media?.satellite_image_url;
  const hasStreetview = !!media?.streetview_image_url;
  const bothImages    = hasSatellite && hasStreetview;
  const photos        = media?.photo_urls || [];

  return (
    <div style={S.root}>

      {/* ══ SITE HEADER ══════════════════════════════════════════ */}
      <header style={S.siteNav}>
        <div style={S.navInner}>
          <div style={S.navLogo}>
            <div style={S.navLogoIcon}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M3 9.5L12 3l9 6.5V21H15v-6H9v6H3V9.5Z" fill="#0c1b2e"/>
              </svg>
            </div>
            <span style={S.navBrand}>WayneState Pro</span>
          </div>
          <span style={S.navLabel}>Property Listing</span>
        </div>
      </header>

      {/* ══ HERO IMAGES ══════════════════════════════════════════ */}
      <section style={{
        ...S.hero,
        flexDirection: bothImages ? 'row' : 'column',
      }}>
        {hasSatellite && (
          <div style={{ ...S.heroSlot, flex: bothImages ? 1 : 'unset', height: bothImages ? '280px' : '260px' }}>
            <img src={media.satellite_image_url} alt="Satellite" style={S.heroImg} />
            <div style={S.heroOverlay} />
            <div style={S.heroBadge}>🛰 Satellite View</div>
          </div>
        )}
        {hasStreetview && (
          <div style={{ ...S.heroSlot, flex: bothImages ? 1 : 'unset', height: bothImages ? '280px' : '260px' }}>
            <img src={media.streetview_image_url} alt="Street View" style={S.heroImg} />
            <div style={S.heroOverlay} />
            <div style={S.heroBadge}>📸 Street View</div>
          </div>
        )}
        {!hasSatellite && !hasStreetview && (
          <div style={S.heroEmpty}>
            <span style={{ fontSize: '48px' }}>🏠</span>
            <p style={{ color: '#94a3b8', margin: '8px 0 0', fontSize: '14px' }}>
              Imagery being processed…
            </p>
          </div>
        )}
      </section>

      {/* ══ ANCHOR STRIP (price + area + type) ══════════════════ */}
      <div style={S.anchor}>
        <div style={S.anchorItem}>
          <span style={S.anchorLbl}>Price</span>
          <span style={S.anchorVal}>{formattedPrice}</span>
        </div>
        <div style={S.anchorDivider} />
        <div style={S.anchorItem}>
          <span style={S.anchorLbl}>Area</span>
          <span style={S.anchorVal}>{listing.plot_area || 'On request'}</span>
        </div>
        <div style={S.anchorDivider} />
        <div style={S.anchorItem}>
          <span style={S.anchorLbl}>Type</span>
          <span style={S.anchorVal}>{listing.property_type}</span>
        </div>
      </div>

      {/* ══ CONTENT ══════════════════════════════════════════════ */}
      <main style={S.content}>

        {/* Property header */}
        <div style={S.propHead}>
          <div style={S.chipRow}>
            <span style={S.typeChip}>{listing.property_type}</span>
            <span style={S.statusChip}>
              <span style={{ color: '#059669', fontSize: '8px' }}>●</span> Available
            </span>
          </div>
          <h1 style={S.propTitle}>{listing.title}</h1>
          <p style={S.propAddr}>📍 {listing.formatted_address || listing.raw_address}</p>
        </div>

        {/* WhatsApp CTA */}
        {waMeLink && (
          <a href={waMeLink} target="_blank" rel="noopener noreferrer"
            className="pve-wa-btn"
            style={S.waCta}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white" style={{ flexShrink: 0 }}>
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            <span>Get full details on WhatsApp</span>
          </a>
        )}

        <div style={S.divider} />

        {/* Description */}
        {listing.description && (
          <div style={S.section}>
            <div style={S.sectionHead}>
              <div style={S.sectionAccent} />
              <h2 style={S.sectionTitle}>About this Property</h2>
            </div>
            <p style={S.descTxt}>{listing.description}</p>
          </div>
        )}

        {/* Property Photos */}
        {photos.length > 0 && (
          <div style={S.section}>
            <div style={S.sectionHead}>
              <div style={S.sectionAccent} />
              <h2 style={S.sectionTitle}>Property Photos</h2>
            </div>
            <div style={S.photoScroll}>
              {photos.map((url, i) => (
                <div key={url} style={S.photoCard}>
                  <img
                    src={url}
                    alt={`Property photo ${i + 1}`}
                    style={S.photoCardImg}
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Landmarks */}
        <div style={S.section}>
          <div style={S.sectionHead}>
            <div style={S.sectionAccent} />
            <h2 style={S.sectionTitle}>Nearby Landmarks</h2>
          </div>

          {landmarks && landmarks.length > 0 ? (
            <div style={S.landmarkList}>
              {landmarks.map((item, i) => (
                <div key={i} className="pve-landmark-row" style={S.landmarkRow}>
                  <div style={S.landmarkLeft}>
                    <div style={S.landmarkIcon}>
                      {ICONS[item.place_type] || '📌'}
                    </div>
                    <div style={S.landmarkText}>
                      <span style={S.lmType}>{item.place_type}</span>
                      <span style={S.lmName}>{item.place_name}</span>
                    </div>
                  </div>
                  <div style={S.landmarkRight}>
                    <span style={S.distPill}>{item.distance_meters}m</span>
                    <span style={S.timeRow}>
                      🚶 {item.walk_minutes}m · 🚗 {item.drive_minutes}m
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={S.emptyNote}>No landmark data for this listing yet.</p>
          )}
        </div>

        {/* NEW — Rent vs Buy Calculator (Phase 6) */}
        <RentVsBuyCalculator
          tenantId={listing.tenant_id}
          propertyId={listing.id}
          defaultPrice={listing.price}
        />

        {/* NEW — Sponsored ad slot (Phase 6) */}
        <AdSlot position="calculator_result" />

        {/* Lead capture */}
        <div style={S.leadCard}>
          {phoneSubmitted ? (
            <div style={S.leadSuccess}>
              <div style={S.successCircle}>✓</div>
              <div>
                <p style={S.successTitle}>Request received!</p>
                <p style={S.successNote}>Our team will reach out on WhatsApp shortly.</p>
              </div>
            </div>
          ) : showPhonePrompt ? (
            <form onSubmit={handlePhoneSubmit} style={S.leadForm}>
              <h3 style={S.leadTitle}>Request a callback</h3>
              <p style={S.leadSub}>We'll reach out on WhatsApp with more details.</p>
              {phoneError && <div style={S.phoneErr}>{phoneError}</div>}
              <input
                type="text" name="name"
                placeholder="Your name (optional)"
                value={phoneForm.name}
                onChange={handlePhoneChange}
                style={S.leadInput}
              />
              <input
                type="tel" name="phone"
                placeholder="Your WhatsApp number"
                value={phoneForm.phone}
                onChange={handlePhoneChange}
                required
                style={S.leadInput}
              />
              <button
                type="submit"
                disabled={phoneSubmitting}
                style={{ ...S.leadBtn, opacity: phoneSubmitting ? 0.72 : 1 }}
              >
                {phoneSubmitting ? 'Submitting…' : 'Share my number'}
              </button>
            </form>
          ) : (
            <div style={S.leadPrompt}>
              <div style={S.promptIcon}>📞</div>
              <div style={{ flex: 1 }}>
                <p style={S.promptTitle}>Interested in this property?</p>
                <p style={S.promptNote}>Get a direct callback from our team.</p>
              </div>
              <button onClick={() => setShowPhonePrompt(true)} style={S.leadTrigger}>
                Get callback
              </button>
            </div>
          )}
        </div>

      </main>

      {/* ══ FOOTER ══════════════════════════════════════════════ */}
      <footer style={S.footer}>
        <div style={S.footerLogoRow}>
          <div style={S.footerIcon}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M3 9.5L12 3l9 6.5V21H15v-6H9v6H3V9.5Z" fill="#c8a96e"/>
            </svg>
          </div>
          <span style={S.footerBrand}>WayneState Pro</span>
        </div>
        <p style={S.footerTxt}>Real Estate Visual Explorer · Dealer Powered Listing</p>
      </footer>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   Styles
   ══════════════════════════════════════════════════ */
const S = {
  root: {
    width: '100%', maxWidth: '720px', margin: '0 auto',
    backgroundColor: '#ffffff', minHeight: '100vh',
    boxShadow: '0 0 60px rgba(12,27,46,0.08)',
  },

  /* Loading / error */
  screen: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    minHeight: '100vh', gap: '16px', backgroundColor: '#f2f5fb',
  },
  spinRing: {
    width: '40px', height: '40px',
    border: '3px solid #e2e8f0', borderTop: '3px solid #0c1b2e',
    borderRadius: '50%', animation: 'spin 0.75s linear infinite',
  },
  screenTxt: { color: '#64748b', fontSize: '14px', margin: 0, fontWeight: '500' },
  errCard: {
    backgroundColor: '#fff', borderRadius: '16px', padding: '40px',
    textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
  },

  /* Site nav */
  siteNav: {
    backgroundColor: '#0c1b2e', height: '52px',
    display: 'flex', alignItems: 'center',
    borderBottom: '1px solid rgba(200,169,110,0.15)',
  },
  navInner: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    width: '100%', padding: '0 18px',
  },
  navLogo: { display: 'flex', alignItems: 'center', gap: '9px' },
  navLogoIcon: {
    width: '26px', height: '26px', borderRadius: '7px',
    backgroundColor: '#c8a96e',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  navBrand: {
    fontSize: '12px', fontWeight: '800', color: '#c8a96e',
    letterSpacing: '2px', textTransform: 'uppercase',
  },
  navLabel: {
    fontSize: '11px', color: 'rgba(255,255,255,0.32)',
    fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px',
  },

  /* Hero */
  hero: {
    display: 'flex',
    backgroundColor: '#050b14',
    overflow: 'hidden',
    gap: '2px',
  },
  heroSlot: {
    position: 'relative', width: '100%', overflow: 'hidden', flexShrink: 0,
  },
  heroImg: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  heroOverlay: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(180deg, transparent 55%, rgba(5,11,20,0.55) 100%)',
  },
  heroBadge: {
    position: 'absolute', top: '12px', left: '12px',
    backgroundColor: 'rgba(5,11,20,0.78)',
    backdropFilter: 'blur(8px)',
    color: '#fff', padding: '5px 11px', borderRadius: '7px',
    fontSize: '11px', fontWeight: '700', letterSpacing: '0.4px',
    border: '1px solid rgba(200,169,110,0.25)',
  },
  heroEmpty: {
    height: '220px', backgroundColor: '#0c1b2e',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', width: '100%',
  },

  /* Anchor strip */
  anchor: {
    backgroundColor: '#0c1b2e',
    display: 'flex', alignItems: 'center',
    padding: '16px 20px', gap: '8px',
  },
  anchorItem: {
    display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, alignItems: 'center',
  },
  anchorLbl: {
    fontSize: '10px', color: 'rgba(255,255,255,0.45)',
    textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700',
  },
  anchorVal: { fontSize: '15px', fontWeight: '800', color: '#ffffff' },
  anchorDivider: { width: '1px', height: '36px', backgroundColor: 'rgba(255,255,255,0.10)', margin: '0 8px' },

  /* Content */
  content: { padding: '24px 20px 32px', display: 'flex', flexDirection: 'column', gap: '20px' },

  /* Property header */
  propHead: { display: 'flex', flexDirection: 'column', gap: '8px' },
  chipRow: { display: 'flex', alignItems: 'center', gap: '8px' },
  typeChip: {
    fontSize: '11px', fontWeight: '700', color: '#0c1b2e',
    backgroundColor: '#f0e9d8', padding: '4px 11px', borderRadius: '20px',
    textTransform: 'uppercase', letterSpacing: '0.5px',
  },
  statusChip: {
    fontSize: '11px', fontWeight: '700', color: '#059669',
    backgroundColor: '#ecfdf5', padding: '4px 11px', borderRadius: '20px',
    display: 'flex', alignItems: 'center', gap: '5px',
    border: '1px solid #a7f3d0',
  },
  propTitle: {
    margin: 0, fontSize: '26px', fontWeight: '900',
    color: '#0c1b2e', lineHeight: '1.22', letterSpacing: '-0.3px',
  },
  propAddr: { margin: 0, fontSize: '14px', color: '#64748b', lineHeight: '1.5' },

  /* WhatsApp CTA */
  waCta: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
    backgroundColor: '#25D366', color: '#fff',
    padding: '16px 20px', borderRadius: '13px',
    fontWeight: '700', textDecoration: 'none', fontSize: '15px',
    letterSpacing: '0.2px',
  },

  divider: { height: '1px', backgroundColor: '#f1f5f9', margin: '4px 0' },

  /* Sections */
  section: {
    border: '1px solid #eff2f8', borderRadius: '14px',
    padding: '18px', backgroundColor: '#fff',
  },
  sectionHead: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' },
  sectionAccent: {
    width: '4px', height: '18px', borderRadius: '2px',
    background: 'linear-gradient(180deg, #c8a96e, #b08848)',
    flexShrink: 0,
  },
  sectionTitle: { margin: 0, fontSize: '13px', fontWeight: '800', color: '#0c1b2e', textTransform: 'uppercase', letterSpacing: '0.8px' },
  descTxt: { margin: 0, fontSize: '14px', color: '#475569', lineHeight: '1.8' },

  /* Landmarks */
  landmarkList: { display: 'flex', flexDirection: 'column' },
  landmarkRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '11px 8px',
    borderBottom: '1px solid #f8fafd',
  },
  landmarkLeft: { display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 },
  landmarkIcon: {
    width: '36px', height: '36px', borderRadius: '9px', backgroundColor: '#f0f4fa',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0,
  },
  landmarkText: { display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 },
  lmType: { fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: '700' },
  lmName: { fontSize: '14px', color: '#0c1b2e', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  landmarkRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px', flexShrink: 0 },
  distPill: {
    fontSize: '13px', fontWeight: '700', color: '#0c1b2e',
    backgroundColor: '#f0f4fa', padding: '3px 9px', borderRadius: '6px',
  },
  timeRow: { fontSize: '11px', color: '#94a3b8' },
  emptyNote: { margin: 0, fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' },

  /* Photo gallery */
  photoScroll: {
    display: 'flex', gap: '10px', overflowX: 'auto',
    paddingBottom: '4px',
    scrollbarWidth: 'thin',
  },
  photoCard: {
    flexShrink: 0, width: '200px', height: '150px',
    borderRadius: '10px', overflow: 'hidden',
    border: '1px solid #e8edf4',
    backgroundColor: '#f1f5f9',
  },
  photoCardImg: {
    width: '100%', height: '100%', objectFit: 'cover', display: 'block',
  },

  /* Lead card */
  leadCard: {
    background: 'linear-gradient(135deg, #f8fafd 0%, #eff4fb 100%)',
    border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px',
  },
  leadSuccess: { display: 'flex', alignItems: 'center', gap: '14px' },
  successCircle: {
    width: '44px', height: '44px', borderRadius: '50%',
    background: 'linear-gradient(135deg, #059669, #047857)',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '20px', fontWeight: '700', flexShrink: 0,
    boxShadow: '0 4px 14px rgba(5,150,105,0.35)',
  },
  successTitle: { margin: '0 0 4px', fontSize: '15px', fontWeight: '700', color: '#059669' },
  successNote:  { margin: 0, fontSize: '13px', color: '#64748b' },

  leadPrompt: { display: 'flex', alignItems: 'center', gap: '14px' },
  promptIcon: {
    width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#e8edf8',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0,
  },
  promptTitle: { margin: '0 0 3px', fontSize: '14px', fontWeight: '700', color: '#0c1b2e' },
  promptNote:  { margin: 0, fontSize: '12px', color: '#64748b' },
  leadTrigger: {
    marginLeft: 'auto', padding: '10px 18px', border: 'none',
    background: 'linear-gradient(135deg, #0c1b2e 0%, #1a3558 100%)',
    color: '#fff', borderRadius: '9px', fontSize: '13px', fontWeight: '700',
    cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
    boxShadow: '0 4px 12px rgba(12,27,46,0.22)',
  },

  leadForm:   { display: 'flex', flexDirection: 'column', gap: '12px' },
  leadTitle:  { margin: '0 0 3px', fontSize: '17px', fontWeight: '800', color: '#0c1b2e' },
  leadSub:    { margin: '0 0 4px', fontSize: '13px', color: '#64748b' },
  leadInput: {
    padding: '12px 14px', fontSize: '14px',
    border: '1.5px solid #e2e8f0', borderRadius: '10px',
    width: '100%', color: '#0c1b2e', backgroundColor: '#ffffff',
  },
  leadBtn: {
    padding: '14px', border: 'none', borderRadius: '10px',
    background: 'linear-gradient(135deg, #0c1b2e 0%, #1a3558 100%)',
    color: '#fff', fontWeight: '700', fontSize: '14px', cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(12,27,46,0.22)',
  },
  phoneErr: {
    backgroundColor: '#fff5f5', color: '#c53030',
    padding: '10px 14px', borderRadius: '8px', fontSize: '13px',
    border: '1px solid #fed7d7',
  },

  /* Footer */
  footer: {
    backgroundColor: '#0c1b2e', padding: '20px',
    textAlign: 'center', borderTop: '1px solid rgba(200,169,110,0.15)',
  },
  footerLogoRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '6px' },
  footerIcon: {
    width: '22px', height: '22px', borderRadius: '6px',
    backgroundColor: 'rgba(200,169,110,0.18)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  footerBrand: { fontSize: '12px', fontWeight: '800', color: '#c8a96e', letterSpacing: '1.5px', textTransform: 'uppercase' },
  footerTxt:   { margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.28)' },
};

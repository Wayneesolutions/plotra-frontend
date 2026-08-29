import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../api/config';
import RentVsBuyCalculator from './RentVsBuyCalculator.jsx';
import { InteractiveSatellite, InteractiveStreetView } from './PropertyMapMedia.jsx';
import AdSlot from './AdSlot.jsx';
import plotraIcon from '../assets/plotra-icon.png';

// Display order + labels for builder_profile_claims.category — keeps the
// developer section reading as distinct topics (delivery record, who runs
// the company, financial standing, legal/criminal matters) rather than one
// undifferentiated list. "rating" claims (prose reputation mentions) are
// folded in last, separate from the numeric overall_rating badge above.
const CLAIM_CATEGORY_ORDER = [
  { key: 'delivery_history', label: 'Past Project Delivery' },
  { key: 'leadership', label: 'Ownership & Leadership' },
  { key: 'financial_condition', label: 'Financial Condition' },
  { key: 'legal_issue', label: 'Legal & Regulatory Record' },
  { key: 'rating', label: 'Reputation & Rankings' },
];

export default function PropertyView() {
  const { slug } = useParams();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  // Builder profile — fetched separately since most listings won't have one
  // (only mega-project/developer listings do); a 404 here is expected and
  // just means "no section to show," not an error.
  const [builderProfile, setBuilderProfile] = useState(null);

  // Phase 3: the visit id this session's page view was logged under, so a
  // later phone-number submission (if any) can be attached to it.
  const visitIdRef = useRef(null);

  const [showPhonePrompt, setShowPhonePrompt] = useState(false);
  const [phoneForm, setPhoneForm]             = useState({ name: '', phone: '' });
  const [phoneSubmitting, setPhoneSubmitting] = useState(false);
  const [phoneSubmitted, setPhoneSubmitted]   = useState(false);
  const [phoneError, setPhoneError]           = useState(null);

  // Manual pin-drag correction — pre-approval only (see the "draggable"
  // prop passed to InteractiveSatellite below, gated on listing.status).
  // draggedPosition holds the pending (unsaved) coordinates after a drag;
  // mapKey is bumped on cancel to force InteractiveSatellite to remount
  // fresh at the listing's actual saved lat/lng, snapping the marker back
  // visually (it's an imperative google.maps.Marker, not something React
  // can just re-render into a new position on its own).
  const [draggedPosition, setDraggedPosition] = useState(null);
  const [savingLocation, setSavingLocation] = useState(false);
  const [locationSaveError, setLocationSaveError] = useState(null);
  const [locationSaved, setLocationSaved] = useState(false);
  const [mapKey, setMapKey] = useState(0);

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

    axios.get(`${API_BASE_URL}/api/v1/public/listings/${slug}/builder-profile`)
      .then((res) => setBuilderProfile(res.data))
      .catch(() => { /* 404 = no builder profile for this listing, expected for most */ });
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

  const handlePinDragEnd = (coords) => {
    setLocationSaved(false);
    setLocationSaveError(null);
    setDraggedPosition(coords);
  };

  const handleCancelPinDrag = () => {
    setDraggedPosition(null);
    setLocationSaveError(null);
    setMapKey((k) => k + 1); // forces InteractiveSatellite to remount at the listing's actual saved position
  };

  const handleSaveLocation = async () => {
    if (!draggedPosition) return;
    setSavingLocation(true);
    setLocationSaveError(null);
    try {
      const res = await axios.patch(`${API_BASE_URL}/api/v1/public/listings/${slug}/location`, {
        lat: draggedPosition.lat,
        lng: draggedPosition.lng,
      });
      // Reflect the corrected position/address immediately rather than
      // waiting on a refetch — landmarks and satellite/street-view media
      // still refresh in the background (same as an address correction in
      // the chat), so those sections may take a moment to catch up.
      setData((prev) => ({
        ...prev,
        listing: {
          ...prev.listing,
          lat: res.data.lat,
          lng: res.data.lng,
          formatted_address: res.data.formatted_address || prev.listing.formatted_address,
        },
      }));
      setDraggedPosition(null);
      setLocationSaved(true);
    } catch (err) {
      setLocationSaveError(err.response?.data?.error?.message || 'Could not save the new location. Please try again.');
    } finally {
      setSavingLocation(false);
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

  // Developer profile / rating / possession record / nearby-comparison
  // content only applies to a unit inside a larger named project — a flat
  // in a residential tower, or a shop/retail unit in a mall. The backend
  // already won't return builderProfile for a plot/villa listing (see
  // builderProfileController.js's BUILDER_ELIGIBLE_TYPES), but this is a
  // second, client-side gate so one never renders this section under any
  // circumstance, including a stale/cached response.
  const showBuilderSection = !!builderProfile && ['Flat', 'Commercial'].includes(listing.property_type);

  const formattedPrice = listing.price != null
    ? new Intl.NumberFormat('en-IN', {
        style: 'currency', currency: 'INR', maximumFractionDigits: 0,
      }).format(listing.price)
    : null;

  const waMeLink = dealer?.whatsappDigits
    ? `https://wa.me/${dealer.whatsappDigits}?text=${encodeURIComponent(
        formattedPrice
          ? `Hi, I'm interested in "${listing.title}" (${formattedPrice}) — ${window.location.href}`
          : `Hi, I'm interested in "${listing.title}" — ${window.location.href}`
      )}`
    : null;

  const ICONS = { school: '🏫', hospital: '🏥', market: '🛒', transit: '🚌' };
  const canAdjustLocation = listing.status !== 'active';
  const hasSatellite  = !!(media?.satellite_image_url || (listing.lat != null && listing.lng != null));
  const hasStreetview = !!(media?.streetview_image_url || (listing.lat != null && listing.lng != null));
  // Satellite is the pin-correction tool — only shown pre-approval while
  // the agent can still drag the pin to fix a geocode that's slightly off.
  // Once confirmed and live, satellite drops away; street view carries
  // forward on its own for buyers.
  const showSatellite  = canAdjustLocation && hasSatellite;
  const showStreetview = hasStreetview;
  const bothImages     = showSatellite && showStreetview;
  const showHeroSection = canAdjustLocation || showStreetview;
  const photos        = media?.photo_urls || [];

  return (
    <div style={S.root}>

      {/* ══ SITE HEADER ══════════════════════════════════════════ */}
      <header style={S.siteNav}>
        <div style={S.navInner}>
          <div style={S.navLogo}>
            <img src={plotraIcon} alt="Plotra" style={{ height: '30px', width: 'auto', flexShrink: 0 }} />
            <span style={S.navBrand}>Plotra</span>
          </div>
          <span style={S.navLabel}>Property Listing</span>
        </div>
      </header>

      {/* ══ HERO — satellite (pre-approval only) + street view ══════
          Satellite is the pin-correction tool: shown only while a dealer
          can still drag the pin to fix a geocode that's slightly off
          (canAdjustLocation, i.e. status !== 'active'). Once the location
          is confirmed and the listing goes live, satellite drops away —
          street view carries forward on its own, pinned to that same
          confirmed lat/lng, so a buyer still gets a real sense of the
          location alongside the dealer's "Property Photos" further down
          the page. Dealers/realtors see and can use the satellite pin
          editor exactly as before while a listing is pending. */}
      {showHeroSection && (
      <section style={{ ...S.hero, flexDirection: bothImages ? 'row' : 'column' }}>
        {showSatellite && (
          <div style={{ ...S.heroSlot, flex: bothImages ? 1 : 'unset', height: bothImages ? '280px' : '260px' }}>
            <InteractiveSatellite
              key={mapKey}
              lat={listing.lat}
              lng={listing.lng}
              fallbackUrl={media?.satellite_image_url}
              draggable={canAdjustLocation}
              onPositionChange={canAdjustLocation ? handlePinDragEnd : undefined}
            />
            <div style={S.heroBadge}>🛰 Satellite View</div>
            {canAdjustLocation && (
              <div style={S.locationEditArea}>
                {draggedPosition ? (
                  <div style={S.locationBanner}>
                    <span>New location set — save it?</span>
                    <div style={S.locationBannerActions}>
                      <button onClick={handleSaveLocation} disabled={savingLocation} style={S.locationSaveBtn}>
                        {savingLocation ? 'Saving…' : 'Save'}
                      </button>
                      <button onClick={handleCancelPinDrag} disabled={savingLocation} style={S.locationCancelBtn}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : locationSaved ? (
                  <div style={S.locationSavedMsg}>✓ Location saved</div>
                ) : (
                  <div style={S.locationHintMsg}>Not quite right? Drag the pin to the exact spot.</div>
                )}
                {locationSaveError && <div style={S.locationErrorMsg}>{locationSaveError}</div>}
              </div>
            )}
          </div>
        )}
        {showStreetview && (
          <div style={{ ...S.heroSlot, flex: bothImages ? 1 : 'unset', height: bothImages ? '280px' : '260px' }}>
            <InteractiveStreetView lat={listing.lat} lng={listing.lng} fallbackUrl={media?.streetview_image_url} />
            <div style={S.heroBadge}>📸 Street View</div>
          </div>
        )}
        {canAdjustLocation && !hasSatellite && !hasStreetview && (
          <div style={S.heroEmpty}>
            <span style={{ fontSize: '48px' }}>🏠</span>
            <p style={{ color: '#94a3b8', margin: '8px 0 0', fontSize: '14px' }}>
              Imagery being processed…
            </p>
          </div>
        )}
      </section>
      )}

      {/* ══ ANCHOR STRIP (price + area + type) ══════════════════ */}
      <div style={S.anchor}>
        <div style={S.anchorItem}>
          <span style={S.anchorLbl}>Price</span>
          <span style={S.anchorVal}>{formattedPrice || 'On request'}</span>
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

        {/* Real property photos the dealer uploaded — via the dashboard or
            the web chat's photo-attach button — distinct from the
            satellite/street-view media above, which are Google Maps
            imagery of the location rather than photos of the property
            itself. */}
        {photos.length > 0 && (
          <div style={S.section}>
            <div style={S.sectionHead}>
              <div style={S.sectionAccent} />
              <h2 style={S.sectionTitle}>Property Photos</h2>
            </div>
            <div style={S.photoScroll}>
              {photos.map((url, i) => (
                <a key={url} href={url} target="_blank" rel="noopener noreferrer" style={S.photoCard}>
                  <img
                    src={url}
                    alt={`Property photo ${i + 1}`}
                    style={S.photoCardImg}
                    loading="lazy"
                  />
                </a>
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

        {/* Local Intelligence — built server-side (localIntelligenceWorker.js /
            groundedResearchService.js) and already returned by this same API
            call. Every item is required to carry a real source_url
            (grounding discipline enforced server-side), so every claim here
            is cited. */}
        {data.localIntelligence && (
          <div style={S.section}>
            <div style={S.sectionHead}>
              <div style={S.sectionAccent} />
              <h2 style={S.sectionTitle}>Local Intelligence</h2>
            </div>
            <LocalIntelSection title="News" items={data.localIntelligence.news} />
            <LocalIntelSection title="Safety" items={data.localIntelligence.safety} />
            <LocalIntelSection title="Seasonal Conditions" items={data.localIntelligence.seasonal} />
          </div>
        )}

        {/* Developer / Builder Due Diligence — only shown once a human has
            explicitly published it (moderation_status='published'); see
            builderProfileController.js's getPublicBuilderProfile. This is
            the section that makes a mega-project/flat listing's page
            materially different from a plain plot/villa listing: a
            developer profile, cited rating, cited possession track
            record, and a comparison against other real nearby options —
            none of that applies to an individual plot with no builder. */}
        {showBuilderSection && (
          <div style={S.section}>
            <div style={S.sectionHead}>
              <div style={S.sectionAccent} />
              <h2 style={S.sectionTitle}>Developer — {builderProfile.builderProfile.company_name}</h2>
            </div>

            {builderProfile.builderProfile.rera_registration_ids?.length > 0 && (
              <p style={{ ...S.descTxt, marginBottom: '14px' }}>
                RERA: {builderProfile.builderProfile.rera_registration_ids.join(', ')}
              </p>
            )}

            {/* Rating + possession track record — the two structured,
                comparable numbers this section adds on top of the prose
                claims below. Both are cited like everything else here;
                neither renders at all if no real published source was
                found (see groundedResearchService.js — never a guessed
                number). */}
            {(builderProfile.builderProfile.overall_rating != null || builderProfile.builderProfile.possession_total_count != null) && (
              <div style={S.devStatsRow}>
                {builderProfile.builderProfile.overall_rating != null && (
                  <div style={S.devStatCard}>
                    <span style={S.devStatLbl}>
                      {builderProfile.builderProfile.rating_is_ai_assessment ? "Plotra's Assessment" : 'Rating'}
                    </span>
                    <span style={S.devStatVal}>★ {Number(builderProfile.builderProfile.overall_rating).toFixed(1)}<span style={S.devStatMax}>/10</span></span>
                    {builderProfile.builderProfile.rating_is_ai_assessment ? (
                      <>
                        <p style={{ ...S.descTxt, fontSize: '12px', margin: '2px 0 0' }}>
                          {builderProfile.builderProfile.rating_basis}
                        </p>
                        <p style={{ ...S.sourceLink, cursor: 'default' }}>
                          AI-generated assessment from the cited facts below — not an official or certified rating.
                        </p>
                      </>
                    ) : (
                      <a href={builderProfile.builderProfile.rating_source_url} target="_blank" rel="noopener noreferrer" style={S.sourceLink}>
                        Source: {builderProfile.builderProfile.rating_source_title || 'link'}
                      </a>
                    )}
                  </div>
                )}
                {builderProfile.builderProfile.possession_total_count != null && (
                  <div style={S.devStatCard}>
                    <span style={S.devStatLbl}>Possession Track Record</span>
                    <span style={S.devStatVal}>
                      {builderProfile.builderProfile.possession_delivered_count}
                      <span style={S.devStatMax}>/{builderProfile.builderProfile.possession_total_count} delivered</span>
                    </span>
                    <a href={builderProfile.builderProfile.possession_source_url} target="_blank" rel="noopener noreferrer" style={S.sourceLink}>
                      Source: {builderProfile.builderProfile.possession_source_title || 'link'}
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Cited claims, grouped so "past projects" and "legal/criminal
                records" read as distinct, scannable sections instead of
                one flat list. */}
            {CLAIM_CATEGORY_ORDER.map(({ key, label }) => {
              const items = builderProfile.claims.filter((c) => c.category === key);
              if (items.length === 0) return null;
              return (
                <div key={key} style={{ marginBottom: '14px' }}>
                  <h4 style={S.intelSubhead}>{label}</h4>
                  {items.map((c, i) => (
                    <div key={i} style={S.citedItem}>
                      <p style={S.descTxt}>{c.claim_text}</p>
                      <a href={c.source_url} target="_blank" rel="noopener noreferrer" style={S.sourceLink}>
                        Source: {c.source_title || c.source_domain}
                      </a>
                    </div>
                  ))}
                </div>
              );
            })}

            {builderProfile.claims.length === 0 && builderProfile.builderProfile.overall_rating == null && builderProfile.builderProfile.possession_total_count == null && (
              <p style={S.emptyNote}>No independently verified information found for this developer yet.</p>
            )}
          </div>
        )}

        {/* Compare Nearby Projects — other mega-project listings within
            ~5km and a similar price band, platform-wide (not just this
            dealer's own listings — a buyer cross-shops across dealers).
            See builderProfileController.js's findSimilarProjects(). */}
        {showBuilderSection && builderProfile.similarProjects?.length > 0 && (
          <div style={S.section}>
            <div style={S.sectionHead}>
              <div style={S.sectionAccent} />
              <h2 style={S.sectionTitle}>Compare Nearby Projects</h2>
            </div>
            <div style={S.compareList}>
              {builderProfile.similarProjects.map((p) => (
                <a key={p.slug} href={`/p/${p.slug}`} style={S.compareRow}>
                  <div style={S.compareMain}>
                    <span style={S.compareTitle}>{p.title}</span>
                    <span style={S.compareMeta}>
                      {p.builder_company_name} · {p.distance_km} km away
                      {p.plot_area ? ` · ${p.plot_area}` : ''}
                    </span>
                  </div>
                  <div style={S.compareRight}>
                    {p.builder_rating != null && (
                      <span style={S.comparePill}>★ {p.builder_rating.toFixed(1)}</span>
                    )}
                    <span style={S.comparePrice}>
                      {p.price != null ? `₹${Number(p.price).toLocaleString('en-IN')}` : 'On request'}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

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
          <img src={plotraIcon} alt="Plotra" style={{ height: '26px', width: 'auto', flexShrink: 0 }} />
          <span style={S.footerBrand}>Plotra</span>
        </div>
        <p style={S.footerTxt}>Real Estate Visual Explorer · Dealer Powered Listing</p>
      </footer>
    </div>
  );
}

function LocalIntelSection({ title, items }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ marginBottom: '14px' }}>
      <h4 style={S.intelSubhead}>{title}</h4>
      {items.map((item, i) => (
        <div key={i} style={S.citedItem}>
          <p style={S.descTxt}>{item.text}</p>
          <a href={item.source_url} target="_blank" rel="noopener noreferrer" style={S.sourceLink}>
            Source: {item.source_title || item.source_url}
          </a>
        </div>
      ))}
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
    zIndex: 1,
  },
  heroEmpty: {
    height: '220px', backgroundColor: '#0c1b2e',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', width: '100%',
  },

  /* Manual pin-drag correction banner, overlaid on the satellite slot */
  locationEditArea: { position: 'absolute', bottom: '12px', left: '12px', right: '12px', zIndex: 1 },
  locationHintMsg: { backgroundColor: 'rgba(17, 24, 39, 0.8)', color: '#e5e7eb', fontSize: '12px', padding: '6px 10px', borderRadius: '6px', display: 'inline-block' },
  locationSavedMsg: { backgroundColor: 'rgba(22, 101, 52, 0.9)', color: '#fff', fontSize: '12px', padding: '6px 10px', borderRadius: '6px', display: 'inline-block' },
  locationErrorMsg: { backgroundColor: 'rgba(153, 27, 27, 0.9)', color: '#fff', fontSize: '12px', padding: '6px 10px', borderRadius: '6px', marginTop: '6px', display: 'inline-block' },
  locationBanner: { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', color: '#111827', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' },
  locationBannerActions: { display: 'flex', gap: '8px', marginTop: '8px' },
  locationSaveBtn: { flex: 1, backgroundColor: '#111827', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '13px', cursor: 'pointer' },
  locationCancelBtn: { flex: 1, backgroundColor: '#f3f4f6', color: '#111827', border: '1px solid #d1d5db', borderRadius: '6px', padding: '6px 12px', fontSize: '13px', cursor: 'pointer' },

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

  /* Local Intelligence / Builder Due Diligence citations */
  intelSubhead: { fontSize: '12px', textTransform: 'uppercase', color: '#6b7280', margin: '0 0 6px 0', fontWeight: '700' },
  citedItem: { borderLeft: '2px solid #eff2f8', paddingLeft: '10px', marginBottom: '10px' },
  citedCategory: { fontSize: '10px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 'bold' },
  sourceLink: { fontSize: '11px', color: '#0c1b2e', fontWeight: '600', textDecoration: 'none' },

  /* Developer rating / possession-record stat cards */
  devStatsRow: { display: 'flex', gap: '12px', marginBottom: '18px', flexWrap: 'wrap' },
  devStatCard: {
    flex: '1 1 160px', border: '1px solid #eff2f8', borderRadius: '12px',
    padding: '14px 16px', backgroundColor: '#fafbfd',
    display: 'flex', flexDirection: 'column', gap: '4px',
  },
  devStatLbl: { fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: '700' },
  devStatVal: { fontSize: '20px', fontWeight: '800', color: '#0c1b2e' },
  devStatMax: { fontSize: '13px', fontWeight: '600', color: '#94a3b8', marginLeft: '2px' },

  /* Compare Nearby Projects */
  compareList: { display: 'flex', flexDirection: 'column', gap: '2px' },
  compareRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px',
    padding: '12px 8px', borderBottom: '1px solid #f8fafd',
    textDecoration: 'none', color: 'inherit',
  },
  compareMain: { display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 },
  compareTitle: { fontSize: '14px', fontWeight: '700', color: '#0c1b2e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  compareMeta: { fontSize: '12px', color: '#94a3b8' },
  compareRight: { display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 },
  comparePill: {
    fontSize: '12px', fontWeight: '700', color: '#92702f',
    backgroundColor: '#fdfbf6', border: '1px solid #eadfc7', borderRadius: '20px', padding: '3px 10px',
  },
  comparePrice: { fontSize: '13px', fontWeight: '700', color: '#0c1b2e' },

  /* Photo gallery */
  photoScroll: {
    display: 'flex', gap: '10px', overflowX: 'auto',
    paddingBottom: '4px',
    scrollbarWidth: 'thin',
  },
  photoCard: {
    display: 'block',
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

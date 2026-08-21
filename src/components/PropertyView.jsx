import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../api/config';
import RentVsBuyCalculator from './RentVsBuyCalculator.jsx';
import { InteractiveSatellite, InteractiveStreetView } from './PropertyMapMedia.jsx';

export default function PropertyView() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Builder profile — fetched separately since most listings won't have one
  // (only mega-project/developer listings do); a 404 here is expected and
  // just means "no section to show," not an error.
  const [builderProfile, setBuilderProfile] = useState(null);

  // Phase 3: the visit id this session's page view was logged under, so a
  // later phone-number submission (if any) can be attached to it.
  const visitIdRef = useRef(null);

  // Phase 3: soft phone-number prompt state
  const [showPhonePrompt, setShowPhonePrompt] = useState(false);
  const [phoneForm, setPhoneForm] = useState({ name: '', phone: '' });
  const [phoneSubmitting, setPhoneSubmitting] = useState(false);
  const [phoneSubmitted, setPhoneSubmitted] = useState(false);
  const [phoneError, setPhoneError] = useState(null);

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
    const fetchPublicListing = async () => {
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

    fetchPublicListing();

    axios.get(`${API_BASE_URL}/api/v1/public/listings/${slug}/builder-profile`)
      .then((res) => setBuilderProfile(res.data))
      .catch(() => { /* 404 = no builder profile for this listing, expected for most */ });
  }, [slug]);

  // Log the visit once the listing is confirmed to exist and be active.
  // Fire-and-forget: a failure here shouldn't block the buyer from seeing the page.
  useEffect(() => {
    if (!data?.listing) return;

    axios.post(`${API_BASE_URL}/api/v1/public/listings/${slug}/visit`, {
      referral_source: document.referrer ? 'referral' : 'direct'
    })
      .then((res) => {
        visitIdRef.current = res.data.visitId;
      })
      .catch(() => { /* non-critical — page still works without this */ });
  }, [data, slug]);

  const handlePhoneFormChange = (e) => {
    const { name, value } = e.target;
    setPhoneForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setPhoneSubmitting(true);
    setPhoneError(null);

    try {
      await axios.post(`${API_BASE_URL}/api/v1/public/listings/${slug}/lead`, {
        name: phoneForm.name,
        phone: phoneForm.phone,
        visitId: visitIdRef.current
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

  if (loading) return <div style={styles.centerScreen}>Loading Property Map Layouts...</div>;
  if (error) return <div style={{ ...styles.centerScreen, color: '#dc2626' }}>Error: {error}</div>;
  if (!data || !data.listing) return <div style={styles.centerScreen}>No details available.</div>;

  const { listing, media, landmarks, dealer } = data;

  const formattedPrice = listing.price != null
    ? new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
      }).format(listing.price)
    : null;

  // Phase 4: free, no-API-cost WhatsApp CTA — opens the buyer's WhatsApp app
  // with a pre-filled message referencing this exact listing.
  const waMeLink = dealer?.whatsappDigits
    ? `https://wa.me/${dealer.whatsappDigits}?text=${encodeURIComponent(
        formattedPrice
          ? `Hi, I'm interested in "${listing.title}" (${formattedPrice}) — ${window.location.href}`
          : `Hi, I'm interested in "${listing.title}" — ${window.location.href}`
      )}`
    : null;

  const canAdjustLocation = listing.status !== 'active';

  return (
    <div style={styles.wrapper}>
      <section style={styles.mediaContainer}>
        {(media?.satellite_image_url || (listing.lat != null && listing.lng != null)) && (
          <div style={styles.imageCard}>
            <span style={styles.imageBadge}>Satellite Perimeter</span>
            <InteractiveSatellite
              key={mapKey}
              lat={listing.lat}
              lng={listing.lng}
              fallbackUrl={media?.satellite_image_url}
              draggable={canAdjustLocation}
              onPositionChange={canAdjustLocation ? handlePinDragEnd : undefined}
            />
            {canAdjustLocation && (
              <div style={styles.locationEditArea}>
                {draggedPosition ? (
                  <div style={styles.locationBanner}>
                    <span>New location set — save it?</span>
                    <div style={styles.locationBannerActions}>
                      <button onClick={handleSaveLocation} disabled={savingLocation} style={styles.locationSaveBtn}>
                        {savingLocation ? 'Saving…' : 'Save'}
                      </button>
                      <button onClick={handleCancelPinDrag} disabled={savingLocation} style={styles.locationCancelBtn}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : locationSaved ? (
                  <div style={styles.locationSavedMsg}>✓ Location saved</div>
                ) : (
                  <div style={styles.locationHintMsg}>Not quite right? Drag the pin to the exact spot.</div>
                )}
                {locationSaveError && <div style={styles.locationErrorMsg}>{locationSaveError}</div>}
              </div>
            )}
          </div>
        )}
        {(media?.streetview_image_url || (listing.lat != null && listing.lng != null)) && (
          <div style={styles.imageCard}>
            <span style={styles.imageBadge}>Street View Access</span>
            <InteractiveStreetView lat={listing.lat} lng={listing.lng} fallbackUrl={media?.streetview_image_url} />
          </div>
        )}
      </section>

      <main style={styles.detailsContainer}>
        <div style={styles.headerBlock}>
          <span style={styles.typeTag}>{listing.property_type}</span>
          <h1 style={styles.mainTitle}>{listing.title}</h1>
          <div style={styles.priceTag}>{formattedPrice || 'Price on request'}</div>
          <p style={styles.addressLabel}>📍 {listing.formatted_address || listing.raw_address}</p>
        </div>

        {/* Phase 4 — free WhatsApp CTA, no BSP cost, works immediately */}
        {waMeLink && (
          <a href={waMeLink} target="_blank" rel="noopener noreferrer" style={styles.whatsappCta}>
            💬 Get more details on WhatsApp
          </a>
        )}

        <hr style={styles.divider} />

        <div style={styles.specGrid}>
          <div style={styles.specItem}>
            <span style={styles.specLabel}>Plot Boundary Area</span>
            <span style={styles.specValue}>{listing.plot_area || 'Standard Dimension'}</span>
          </div>
          <div style={styles.specItem}>
            <span style={styles.specLabel}>Status</span>
            <span style={{ ...styles.specValue, color: '#16a34a', textTransform: 'uppercase', fontSize: '12px' }}>{listing.status}</span>
          </div>
        </div>

        {listing.description && (
          <div style={styles.card}>
            <h3 style={styles.sectionTitle}>Overview Details</h3>
            <p style={styles.descriptionText}>{listing.description}</p>
          </div>
        )}

        {/* Real property photos the dealer uploaded — via the dashboard or
            the web chat's photo-attach button — distinct from the
            satellite/street-view media above, which are Google Maps
            imagery of the location rather than photos of the property
            itself. */}
        {media?.photo_urls?.length > 0 && (
          <div style={styles.card}>
            <h3 style={styles.sectionTitle}>Property Photos</h3>
            <div style={styles.photoGrid}>
              {media.photo_urls.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer" style={styles.photoThumbLink}>
                  <img src={url} alt={`Property photo ${i + 1}`} style={styles.photoThumb} />
                </a>
              ))}
            </div>
          </div>
        )}

        <div style={styles.card}>
          <h3 style={styles.sectionTitle}>Nearby Infrastructure & Landmarks</h3>
          {landmarks && landmarks.length > 0 ? (
            <div style={styles.landmarkList}>
              {landmarks.map((item, index) => (
                <div key={index} style={styles.landmarkItem}>
                  <div style={styles.landmarkLeft}>
                    <span style={styles.landmarkType}>{item.place_type}</span>
                    <strong style={styles.landmarkName}>{item.place_name}</strong>
                  </div>
                  <div style={styles.landmarkRight}>
                    <span>{item.distance_meters}m</span>
                    <span style={styles.timeBreakdown}>
                      (🚶{item.walk_minutes}m / 🚗{item.drive_minutes}m)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={styles.emptyText}>No regional landmarks cataloged for this layout node.</p>
          )}
        </div>

        {/* Local Intelligence — built server-side (localIntelligenceWorker.js /
            groundedResearchService.js) and already returned by this same API
            call, but never rendered anywhere until now. Every item is
            required to carry a real source_url (grounding discipline
            enforced server-side), so every claim here is cited. */}
        {data.localIntelligence && (
          <div style={styles.card}>
            <h3 style={styles.sectionTitle}>Local Intelligence</h3>
            <LocalIntelSection title="News" items={data.localIntelligence.news} />
            <LocalIntelSection title="Safety" items={data.localIntelligence.safety} />
            <LocalIntelSection title="Seasonal Conditions" items={data.localIntelligence.seasonal} />
          </div>
        )}

        {/* Builder Due Diligence — only shown once a human has explicitly
            published it (moderation_status='published'); see
            builderProfileController.js's getPublicBuilderProfile. */}
        {builderProfile && (
          <div style={styles.card}>
            <h3 style={styles.sectionTitle}>Builder — {builderProfile.builderProfile.company_name}</h3>
            {builderProfile.builderProfile.rera_registration_ids?.length > 0 && (
              <p style={styles.descriptionText}>RERA: {builderProfile.builderProfile.rera_registration_ids.join(', ')}</p>
            )}
            <div style={styles.landmarkList}>
              {builderProfile.claims.map((c, i) => (
                <div key={i} style={styles.citedItem}>
                  <span style={styles.citedCategory}>{c.category}</span>
                  <p style={styles.descriptionText}>{c.claim_text}</p>
                  <a href={c.source_url} target="_blank" rel="noopener noreferrer" style={styles.sourceLink}>
                    Source: {c.source_title || c.source_domain}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={styles.card}>
          <h3 style={styles.sectionTitle}>Rent vs. Buy Calculator</h3>
          <RentVsBuyCalculator propertyPrice={listing.price} propertyId={listing.id} />
        </div>

        {/* Phase 3 — soft phone-number prompt: identifies the visit + kicks off
            the automated WhatsApp first-touch (see capturePublicLead on the backend) */}
        <div style={styles.card}>
          {phoneSubmitted ? (
            <p style={{ ...styles.descriptionText, color: '#16a34a', fontWeight: '600' }}>
              ✅ Thanks — our team will reach out on WhatsApp shortly.
            </p>
          ) : showPhonePrompt ? (
            <form onSubmit={handlePhoneSubmit} style={styles.phoneForm}>
              <h3 style={styles.sectionTitle}>Get a callback / WhatsApp update</h3>
              {phoneError && <div style={styles.phoneError}>{phoneError}</div>}
              <input
                type="text"
                name="name"
                placeholder="Your name (optional)"
                value={phoneForm.name}
                onChange={handlePhoneFormChange}
                style={styles.phoneInput}
              />
              <input
                type="tel"
                name="phone"
                placeholder="Your phone number"
                value={phoneForm.phone}
                onChange={handlePhoneFormChange}
                required
                style={styles.phoneInput}
              />
              <button type="submit" disabled={phoneSubmitting} style={styles.phoneSubmitBtn}>
                {phoneSubmitting ? 'Submitting…' : 'Share number'}
              </button>
            </form>
          ) : (
            <button onClick={() => setShowPhonePrompt(true)} style={styles.softPromptBtn}>
              📞 Share your number for a callback
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

function LocalIntelSection({ title, items }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ marginBottom: '14px' }}>
      <h4 style={styles.intelSubhead}>{title}</h4>
      {items.map((item, i) => (
        <div key={i} style={styles.citedItem}>
          <p style={styles.descriptionText}>{item.text}</p>
          <a href={item.source_url} target="_blank" rel="noopener noreferrer" style={styles.sourceLink}>
            Source: {item.source_title || item.source_url}
          </a>
        </div>
      ))}
    </div>
  );
}

const styles = {
  wrapper: { width: '100%', maxWidth: '768px', margin: '0 auto', boxSizing: 'border-box', paddingBottom: '32px' },
  centerScreen: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', fontSize: '16px', fontWeight: '500' },
  mediaContainer: { display: 'flex', flexDirection: 'column', gap: '4px', backgroundColor: '#000' },
  imageCard: { position: 'relative', width: '100%', height: '260px' },
  imageBadge: { position: 'absolute', top: '12px', left: '12px', backgroundColor: 'rgba(17, 24, 39, 0.8)', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.5px' },
  locationEditArea: { position: 'absolute', bottom: '12px', left: '12px', right: '12px' },
  locationHintMsg: { backgroundColor: 'rgba(17, 24, 39, 0.8)', color: '#e5e7eb', fontSize: '12px', padding: '6px 10px', borderRadius: '6px', display: 'inline-block' },
  locationSavedMsg: { backgroundColor: 'rgba(22, 101, 52, 0.9)', color: '#fff', fontSize: '12px', padding: '6px 10px', borderRadius: '6px', display: 'inline-block' },
  locationErrorMsg: { backgroundColor: 'rgba(153, 27, 27, 0.9)', color: '#fff', fontSize: '12px', padding: '6px 10px', borderRadius: '6px', marginTop: '6px', display: 'inline-block' },
  locationBanner: { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', color: '#111827', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' },
  locationBannerActions: { display: 'flex', gap: '8px', marginTop: '8px' },
  locationSaveBtn: { flex: 1, backgroundColor: '#111827', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '13px', cursor: 'pointer' },
  locationCancelBtn: { flex: 1, backgroundColor: '#f3f4f6', color: '#111827', border: '1px solid #d1d5db', borderRadius: '6px', padding: '6px 12px', fontSize: '13px', cursor: 'pointer' },
  mapImage: { width: '100%', height: '100%', objectFit: 'cover' },
  detailsContainer: { padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' },
  headerBlock: { display: 'flex', flexDirection: 'column', gap: '6px' },
  typeTag: { alignSelf: 'flex-start', backgroundColor: '#f3f4f6', color: '#4b5563', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' },
  mainTitle: { margin: 0, fontSize: '22px', color: '#111827', lineHeight: '1.3' },
  priceTag: { fontSize: '24px', fontWeight: '800', color: '#2563eb' },
  addressLabel: { margin: '4px 0 0 0', color: '#4b5563', fontSize: '14px', lineHeight: '1.4' },
  whatsappCta: { display: 'block', textAlign: 'center', backgroundColor: '#16a34a', color: '#fff', padding: '12px', borderRadius: '8px', fontWeight: 'bold', textDecoration: 'none', fontSize: '15px' },
  divider: { border: 0, height: '1px', backgroundColor: '#e5e7eb', margin: '4px 0' },
  specGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  specItem: { backgroundColor: '#fff', border: '1px solid #e5e7eb', padding: '12px', borderRadius: '8px' },
  specLabel: { display: 'block', fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '2px' },
  specValue: { fontSize: '15px', fontWeight: '600', color: '#1f2937' },
  card: { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' },
  sectionTitle: { margin: '0 0 12px 0', fontSize: '15px', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' },
  photoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '8px' },
  photoThumbLink: { display: 'block', borderRadius: '6px', overflow: 'hidden', aspectRatio: '1 / 1' },
  photoThumb: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  descriptionText: { margin: 0, fontSize: '14px', color: '#4b5563', lineHeight: '1.6' },
  landmarkList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  landmarkItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid #f3f4f6' },
  landmarkLeft: { display: 'flex', flexDirection: 'column', gap: '2px', maxWidth: '70%' },
  landmarkType: { fontSize: '10px', textTransform: 'uppercase', color: '#9ca3af', fontWeight: 'bold' },
  landmarkName: { fontSize: '14px', color: '#1f2937', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  landmarkRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '13px', color: '#4b5563', minWidth: '80px' },
  timeBreakdown: { fontSize: '11px', color: '#9ca3af', marginTop: '2px' },
  emptyText: { color: '#9ca3af', fontStyle: 'italic', fontSize: '13px', margin: 0 },
  softPromptBtn: { width: '100%', padding: '12px', border: '1px dashed #2563eb', backgroundColor: '#eff6ff', color: '#2563eb', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' },
  phoneForm: { display: 'flex', flexDirection: 'column', gap: '10px' },
  phoneInput: { padding: '10px', fontSize: '14px', border: '1px solid #d1d5db', borderRadius: '6px', width: '100%', boxSizing: 'border-box' },
  phoneSubmitBtn: { padding: '10px', border: 'none', backgroundColor: '#2563eb', color: '#fff', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' },
  phoneError: { backgroundColor: '#fef2f2', color: '#dc2626', padding: '8px 10px', borderRadius: '6px', fontSize: '13px' },
  intelSubhead: { fontSize: '12px', textTransform: 'uppercase', color: '#6b7280', margin: '0 0 6px 0', fontWeight: '700' },
  citedItem: { borderLeft: '2px solid #e5e7eb', paddingLeft: '10px', marginBottom: '8px' },
  citedCategory: { fontSize: '10px', textTransform: 'uppercase', color: '#9ca3af', fontWeight: 'bold' },
  sourceLink: { fontSize: '11px', color: '#2563eb', textDecoration: 'none' },
};

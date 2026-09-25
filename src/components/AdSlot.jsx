import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../api/config';
import houseExterior from '../assets/house-exterior.jpg';
import heroAerial from '../assets/hero-aerial.jpg';

/**
 * Renders one matching ad for a given placement position (e.g.
 * "calculator_result", "listing_footer").
 *
 * Serving order:
 *   1. A paid campaign running now for this position (backend)
 *   2. The position's default ad set in Admin → Ad Placements (backend)
 *   3. A built-in Plotraa house ad (HOUSE_ADS below) — so slots listed there
 *      ALWAYS show something, even if the API is down or nothing is set.
 * Positions without a house ad still render nothing when unmatched.
 *
 * Fires an 'impression' event once, when a real (DB) ad loads, and a
 * 'click' event when clicked (fire-and-forget via sendBeacon where
 * available, so it doesn't delay the outbound navigation). The built-in
 * house ad has no DB row, so it sends no events.
 */
export default function AdSlot({ position, city, style }) {
  const [ad, setAd] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const firedImpression = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    setImgFailed(false);
    firedImpression.current = false;

    axios.get(`${API_BASE_URL}/api/v1/public/ads/serve`, {
      params: { interfacePosition: position, targetCity: city },
    })
      .then((res) => {
        if (cancelled) return;
        setAd(res.data?.ads?.[0] || null);
      })
      .catch(() => { if (!cancelled) setAd(null); /* ads are non-critical */ })
      .finally(() => { if (!cancelled) setLoaded(true); });

    return () => { cancelled = true; };
  }, [position, city]);

  useEffect(() => {
    if (!ad || firedImpression.current) return;
    firedImpression.current = true;
    sendAdEvent(ad.id, 'impression');
  }, [ad]);

  const house = HOUSE_ADS[position];

  // Real ad (paid or admin default) with a working image
  if (ad && !imgFailed) {
    return (
      <a
        href={ad.click_url}
        target="_blank"
        rel="noopener noreferrer sponsored"
        onClick={() => sendAdEvent(ad.id, 'click')}
        style={{ ...S.wrap, ...style }}
      >
        <img
          src={ad.image_url}
          alt={ad.advertiser_name}
          style={S.img}
          loading="lazy"
          onError={() => setImgFailed(true)}
        />
        <span style={S.badge}>
          {ad.is_default ? ad.advertiser_name : `Sponsored · ${ad.advertiser_name}`}
        </span>
      </a>
    );
  }

  // Built-in fallback — wait for the fetch so it doesn't flash before a paid ad
  if (house && (loaded || imgFailed)) {
    return <HouseAd {...house} style={style} />;
  }

  return null;
}

/* ── Built-in Plotraa house ads ─────────────────────────────── */

const HOUSE_ADS = {
  calculator_result: {
    image: houseExterior,
    eyebrow: 'Plotraa',
    title: 'Buying beats renting? Find your home.',
    text: 'Verified plots, homes and flats from trusted local dealers — with real satellite and street views.',
    cta: 'Explore properties',
    href: '/',
  },
  listing_footer: {
    image: heroAerial,
    eyebrow: 'For property dealers',
    title: 'List your property on WhatsApp in 2 minutes',
    text: 'Send details on WhatsApp — Plotraa builds a shareable listing page with maps, photos and buyer leads.',
    cta: 'Get started',
    href: '/request-access',
  },
};

function HouseAd({ image, eyebrow, title, text, cta, href, style }) {
  return (
    <a href={href} style={{ ...S.house, backgroundImage: `url(${image})`, ...style }}>
      <div style={S.houseOverlay} />
      <div style={S.houseBody}>
        <span style={S.houseEyebrow}>{eyebrow}</span>
        <h3 style={S.houseTitle}>{title}</h3>
        <p style={S.houseText}>{text}</p>
        <span style={S.houseCta}>{cta} →</span>
      </div>
    </a>
  );
}

function sendAdEvent(placementId, eventType) {
  const url = `${API_BASE_URL}/api/v1/public/ads/${placementId}/event`;
  const payload = JSON.stringify({ eventType });

  if (navigator.sendBeacon) {
    const blob = new Blob([payload], { type: 'application/json' });
    navigator.sendBeacon(url, blob);
  } else {
    axios.post(url, { eventType }).catch(() => {});
  }
}

const S = {
  wrap: {
    display: 'block', borderRadius: '14px', overflow: 'hidden',
    border: '1px solid #eff2f8', textDecoration: 'none', position: 'relative',
    boxShadow: '0 6px 20px rgba(12,27,46,0.08)',
  },
  img: { width: '100%', display: 'block', objectFit: 'cover', maxHeight: '320px' },
  badge: {
    position: 'absolute', bottom: '8px', right: '8px',
    backgroundColor: 'rgba(12,27,46,0.75)', color: '#fff',
    fontSize: '10px', fontWeight: '600', padding: '3px 9px', borderRadius: '999px',
    letterSpacing: '0.2px',
  },

  house: {
    display: 'block', position: 'relative', overflow: 'hidden',
    borderRadius: '16px', minHeight: '190px', textDecoration: 'none',
    backgroundSize: 'cover', backgroundPosition: 'center',
    boxShadow: '0 10px 28px rgba(12,27,46,0.18)',
  },
  houseOverlay: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(100deg, rgba(12,27,46,0.94) 0%, rgba(12,27,46,0.78) 45%, rgba(12,27,46,0.25) 100%)',
  },
  houseBody: {
    position: 'relative', padding: '24px 22px', maxWidth: '440px',
    display: 'flex', flexDirection: 'column', gap: '8px',
  },
  houseEyebrow: {
    fontSize: '11px', fontWeight: '800', color: '#c8a96e',
    letterSpacing: '1.5px', textTransform: 'uppercase',
  },
  houseTitle: { margin: 0, fontSize: '20px', lineHeight: 1.25, fontWeight: '800', color: '#fff' },
  houseText: { margin: 0, fontSize: '13px', lineHeight: 1.5, color: 'rgba(255,255,255,0.78)' },
  houseCta: {
    alignSelf: 'flex-start', marginTop: '6px',
    background: 'linear-gradient(135deg, #c8a96e 0%, #e0c48d 100%)', color: '#0c1b2e',
    fontSize: '13px', fontWeight: '800', padding: '10px 16px', borderRadius: '10px',
  },
};

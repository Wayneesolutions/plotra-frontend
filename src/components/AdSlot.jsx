import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../api/config';

/**
 * Renders one matching ad for a given placement position (e.g.
 * "calculator_result", "listing_footer").
 *
 * Serving order (backend): a paid campaign running now for this position,
 * else the position's default ad set in Admin → Ad Placements. If neither
 * exists — or the image fails to load — the slot renders nothing. There is
 * no built-in/house fallback banner.
 *
 * Fires an 'impression' event once, when an ad loads, and a 'click' event
 * when clicked (fire-and-forget via sendBeacon where available).
 */
export default function AdSlot({ position, city, style }) {
  const [ad, setAd] = useState(null);
  const [imgFailed, setImgFailed] = useState(false);
  const firedImpression = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setImgFailed(false);
    firedImpression.current = false;

    axios.get(`${API_BASE_URL}/api/v1/public/ads/serve`, {
      params: { interfacePosition: position, targetCity: city },
    })
      .then((res) => {
        if (cancelled) return;
        setAd(res.data?.ads?.[0] || null);
      })
      .catch(() => { if (!cancelled) setAd(null); /* ads are non-critical */ });

    return () => { cancelled = true; };
  }, [position, city]);

  useEffect(() => {
    if (!ad || firedImpression.current) return;
    firedImpression.current = true;
    sendAdEvent(ad.id, 'impression');
  }, [ad]);


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

  return null;
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

};

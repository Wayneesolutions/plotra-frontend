import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../api/config';

/**
 * Renders one matching ad for a given placement position (e.g.
 * "calculator_result", "listing_sidebar"). Silently renders nothing if no
 * ad matches — this must never break the page it's embedded in.
 *
 * Fires an 'impression' event once, when an ad successfully loads, and a
 * 'click' event when clicked (fire-and-forget via sendBeacon where
 * available, so it doesn't delay the outbound navigation).
 */
export default function AdSlot({ position, city }) {
  const [ad, setAd] = useState(null);
  const firedImpression = useRef(false);

  useEffect(() => {
    let cancelled = false;

    axios.get(`${API_BASE_URL}/api/v1/public/ads/serve`, {
      params: { interfacePosition: position, targetCity: city },
    })
      .then((res) => {
        if (cancelled) return;
        const matched = res.data?.ads?.[0] || null;
        setAd(matched);
      })
      .catch(() => { /* ads are non-critical — fail silently */ });

    return () => { cancelled = true; };
  }, [position, city]);

  useEffect(() => {
    if (!ad || firedImpression.current) return;
    firedImpression.current = true;
    sendAdEvent(ad.id, 'impression');
  }, [ad]);

  const handleClick = () => {
    sendAdEvent(ad.id, 'click');
  };

  if (!ad) return null;

  return (
    <a
      href={ad.click_url}
      target="_blank"
      rel="noopener noreferrer sponsored"
      onClick={handleClick}
      style={S.wrap}
    >
      <img src={ad.image_url} alt={ad.advertiser_name} style={S.img} />
      <span style={S.badge}>Sponsored · {ad.advertiser_name}</span>
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
  },
  img: { width: '100%', display: 'block', objectFit: 'cover' },
  badge: {
    position: 'absolute', bottom: '8px', right: '8px',
    backgroundColor: 'rgba(12,27,46,0.75)', color: '#fff',
    fontSize: '10px', fontWeight: '600', padding: '3px 9px', borderRadius: '999px',
    letterSpacing: '0.2px',
  },
};

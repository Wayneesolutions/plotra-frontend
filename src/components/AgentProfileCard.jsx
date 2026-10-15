import React from 'react';

/**
 * Anonymous agent profile for the public property page: rating, experience
 * and RERA status — deliberately no name. Renders nothing when the backend
 * has no profile data yet (no rating, no experience, not RERA certified).
 */
export default function AgentProfileCard({ profile }) {
  if (!profile) return null;
  const { rating, experienceYears, reraCertified } = profile;
  const hasRating = rating != null;
  const hasExp = experienceYears != null;
  if (!hasRating && !hasExp && !reraCertified) return null;

  const filled = hasRating ? Math.round(rating) : 0;

  return (
    <section style={S.card} aria-label="About the real estate agent">
      <div style={S.title}>Real estate agent</div>
      <div style={S.row}>
        {hasRating && (
          <div style={S.item}>
            <div style={S.val}>
              <span style={S.stars} aria-hidden="true">
                {'★'.repeat(filled)}<span style={{ color: '#d1d5db' }}>{'★'.repeat(5 - filled)}</span>
              </span>
              <span style={{ marginLeft: 6 }}>{rating.toFixed(1)}</span>
            </div>
            <div style={S.lbl}>Rating</div>
          </div>
        )}
        {hasExp && (
          <div style={S.item}>
            <div style={S.val}>{experienceYears} {experienceYears === 1 ? 'year' : 'years'}</div>
            <div style={S.lbl}>Experience</div>
          </div>
        )}
        <div style={S.item}>
          <div style={{ ...S.val, color: reraCertified ? '#047857' : '#6b7280' }}>
            {reraCertified ? '✓ RERA certified' : 'Not RERA certified'}
          </div>
          <div style={S.lbl}>Certification</div>
        </div>
      </div>
    </section>
  );
}

const S = {
  card: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '14px 16px', margin: '0 0 18px' },
  title: { fontSize: 12, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 10 },
  row: { display: 'flex', flexWrap: 'wrap', gap: '14px 28px' },
  item: { minWidth: 110 },
  val: { fontSize: 15, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center' },
  stars: { color: '#f59e0b', letterSpacing: 1 },
  lbl: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
};

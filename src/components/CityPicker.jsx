import React from 'react';

/**
 * Multi-city picker with a primary city.
 *
 * Props:
 *   cities        [{ id, name, state, code?, status? }]  — choices
 *   value         { city_ids: number[], primary_city_id: number|null }
 *   onChange      (next) => void
 *   single        true = pick exactly one (no primary star)
 *   codes         optional { [cityId]: 'LDH-002' } — shown next to a picked city
 *   showPrimary   false = plain multi-select (e.g. an agent's cities)
 *
 * Click a city to add/remove it. With more than one picked, click ★ to make
 * a city the primary one (used for the tenant's main code and default bias).
 */
export default function CityPicker({ cities = [], value, onChange, single = false, codes = {}, disabled = false, showPrimary = true }) {
  const ids = value?.city_ids || [];
  const primary = value?.primary_city_id ?? ids[0] ?? null;

  const toggle = (id) => {
    if (disabled) return;
    if (single) {
      onChange({ city_ids: [id], primary_city_id: id });
      return;
    }
    if (ids.includes(id)) {
      const next = ids.filter((x) => x !== id);
      onChange({ city_ids: next, primary_city_id: primary === id ? (next[0] ?? null) : primary });
    } else {
      const next = [...ids, id];
      onChange({ city_ids: next, primary_city_id: primary ?? id });
    }
  };

  const makePrimary = (e, id) => {
    e.stopPropagation();
    if (!disabled) onChange({ city_ids: ids, primary_city_id: id });
  };

  if (!cities.length) {
    return <div style={S.empty}>No cities yet — add one in Cities &amp; Areas first.</div>;
  }

  return (
    <div style={S.wrap}>
      {cities.map((c) => {
        const on = ids.includes(c.id);
        const isPrimary = on && primary === c.id;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => toggle(c.id)}
            disabled={disabled}
            style={{ ...S.chip, ...(on ? S.chipOn : null), ...(c.status === 'disabled' ? S.chipDisabled : null) }}
            title={on ? 'Click to remove' : 'Click to add'}
          >
            {on && !single && showPrimary && ids.length > 1 && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => makePrimary(e, c.id)}
                style={{ ...S.star, ...(isPrimary ? S.starOn : null) }}
                title={isPrimary ? 'Primary city' : 'Make primary'}
              >
                ★
              </span>
            )}
            <span>{c.name}</span>
            {c.code && <span style={S.code}>{codes[c.id] || c.code}</span>}
            {c.status && c.status !== 'live' && <span style={S.status}>{c.status}</span>}
          </button>
        );
      })}
      {!single && showPrimary && ids.length > 1 && (
        <div style={S.hint}>★ = primary city. Each city gets its own tenant code.</div>
      )}
    </div>
  );
}

const S = {
  wrap: { display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' },
  empty: { fontSize: '13px', color: '#94a3b8' },
  chip: {
    display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 12px', borderRadius: '999px',
    border: '1.5px solid #e2e8f0', background: '#fff', color: '#0c1b2e', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
  },
  chipOn: { borderColor: '#c8a96e', background: '#fdf6e9' },
  chipDisabled: { opacity: 0.5 },
  star: { color: '#cbd5e1', fontSize: '14px', lineHeight: 1, cursor: 'pointer' },
  starOn: { color: '#c8a96e' },
  code: { fontSize: '10.5px', fontWeight: 700, color: '#64748b', background: '#f1f5f9', padding: '1px 6px', borderRadius: '6px' },
  status: { fontSize: '10px', color: '#92400e', background: '#fef3c7', padding: '1px 6px', borderRadius: '6px' },
  hint: { width: '100%', fontSize: '11.5px', color: '#64748b', marginTop: '2px' },
};

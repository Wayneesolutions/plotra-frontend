// Sale / rent / lease display helpers (Nov 2026). Mirrors the backend's
// utils/listingTypes.js formatListingPrice so the dashboard, admin panel and
// public page all say the same thing: "₹55 lakh" for a sale,
// "₹18,000/month + ₹36,000 deposit" for a rental.

export const LISTING_TYPE_LABEL = { sale: 'For Sale', rent: 'For Rent', lease: 'For Lease' };

export function listingTypeOf(listing) {
  const t = listing?.listing_type;
  return t === 'rent' || t === 'lease' ? t : 'sale';
}

export function isRental(listing) {
  return listingTypeOf(listing) !== 'sale';
}

/** 5500000 -> "₹55 lakh", 18000 -> "₹18,000". null when there's no amount. */
export function formatInrShort(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  const trim = (x) => Number(x.toFixed(2)).toString();
  if (n >= 1e7) return `₹${trim(n / 1e7)} crore`;
  if (n >= 1e5) return `₹${trim(n / 1e5)} lakh`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

/** Price line for a listing, or null ("on request"). */
export function formatListingPrice(listing, { withDeposit = true } = {}) {
  if (!listing) return null;
  if (listing.price_display) return listing.price_display;
  if (!isRental(listing)) return formatInrShort(listing.price);
  const rent = formatInrShort(listing.monthly_rent);
  if (!rent) return null;
  const dep = withDeposit ? formatInrShort(listing.security_deposit) : null;
  return `${rent}/month${dep ? ` + ${dep} deposit` : ''}`;
}

/** Colours for the For Sale / For Rent / For Lease badge. */
export const LISTING_TYPE_BADGE = {
  sale: { background: '#eef2ff', color: '#3730a3', border: '1px solid #c7d2fe' },
  rent: { background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' },
  lease: { background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' },
};

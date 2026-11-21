// One place for the public business facts (name, phone, address, dates).
// Footer, legal pages, schema, llms.txt-style copy and the new SEO pages all
// read from here so the NAP (name, address, phone) can never drift again.
// Plain JS so the Node prerender script can import it too.

export const SITE_URL = 'https://plotraa.com';

export const BRAND = 'Plotraa';
export const COMPANY = 'Wayne E Solutions';
export const COMPANY_URL = 'https://wayneesolutions.com';
export const COPYRIGHT_NAME = 'Plotraa · Wayne E Solutions';

export const PHONE_DISPLAY = '+91 93951 90000';
export const PHONE_E164 = '+919395190000';
export const PHONE_SCHEMA = '+91-93951-90000';
export const WHATSAPP_URL = 'https://wa.me/919395190000';
export const EMAIL = 'info@plotraa.com';

export const ADDRESS = {
  street: 'Model Town',
  city: 'Ludhiana',
  region: 'Punjab',
  country: 'India',
  countryCode: 'IN',
};
export const ADDRESS_LINE = 'Model Town, Ludhiana, Punjab, India';

export const INSTAGRAM_URL = 'https://www.instagram.com/plotraa/';

// Only profiles that actually exist. Add Facebook / YouTube / LinkedIn /
// Google Business Profile URLs here once those pages are live.
export const SAME_AS = [INSTAGRAM_URL];

export const CITIES_SERVED = ['Ludhiana', 'Mohali', 'Kharar', 'Jalandhar', 'Patiala', 'Amritsar'];

// Shown as "Last updated" on pricing, FAQ, feature and city pages, and used
// as dateModified in their schema. Bump it whenever that copy changes.
export const CONTENT_UPDATED_ISO = '2026-11-21';
export const CONTENT_UPDATED_LABEL = '21 Nov 2026';

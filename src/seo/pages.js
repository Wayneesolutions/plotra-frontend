// Single source of truth for per-page SEO (title, description, JSON-LD).
// Used in two places:
//   1. vite.config.js (seoPrerender plugin) — writes a static
//      dist/<route>/index.html per page so crawlers that don't run JS
//      (WhatsApp, LinkedIn, Bing, ChatGPT etc.) still get the right <head>.
//   2. src/components/Seo.tsx — keeps <head> correct during client-side
//      navigation inside the SPA.
// Plain JS on purpose so vite.config.js (Node) can import it directly.

export const SITE_URL = 'https://plotraa.com';
export const OG_IMAGE = `${SITE_URL}/og-image.jpg`;

const ORG_ID = `${SITE_URL}/#organization`;

const breadcrumb = (name, path) => ({
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
    { '@type': 'ListItem', position: 2, name, item: `${SITE_URL}${path}` },
  ],
});

export const SEO_PAGES = {
  '/': {
    title: 'WhatsApp Real Estate CRM for Property Dealers | Plotraa',
    description:
      'List a property by sending a WhatsApp message. Plotraa creates a shareable listing with satellite imagery and plot boundary, and tracks every buyer lead.',
    jsonLd: [
      {
        '@type': 'Organization',
        '@id': ORG_ID,
        name: 'Plotraa',
        url: `${SITE_URL}/`,
        logo: `${SITE_URL}/plotraa-logo.png`,
        parentOrganization: { '@type': 'Organization', name: 'Wayne E Solutions' },
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Ludhiana',
          addressRegion: 'Punjab',
          addressCountry: 'IN',
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: `${SITE_URL}/`,
        name: 'Plotraa',
        publisher: { '@id': ORG_ID },
        inLanguage: 'en-IN',
      },
      {
        '@type': 'SoftwareApplication',
        name: 'Plotraa',
        url: `${SITE_URL}/`,
        applicationCategory: 'BusinessApplication',
        applicationSubCategory: 'Real estate CRM',
        operatingSystem: 'Web, WhatsApp',
        description:
          'WhatsApp-native real estate CRM for property dealers: list a property by WhatsApp message, get a shareable listing with satellite imagery and plot boundary, and manage buyer leads.',
        publisher: { '@id': ORG_ID },
      },
    ],
  },
  '/how-it-works': {
    title: 'How Plotraa Works: WhatsApp to Property Listing in Minutes',
    description:
      "Send plot size, location and price on WhatsApp. Plotraa's AI builds a property page with satellite imagery and boundary, and sends every buyer lead to you.",
    jsonLd: [
      {
        '@type': 'HowTo',
        name: 'How to list a property on Plotraa using WhatsApp',
        step: [
          { '@type': 'HowToStep', position: 1, name: 'Send the property', text: 'Text plot size, location and price to your Plotraa WhatsApp number.' },
          { '@type': 'HowToStep', position: 2, name: 'Plotraa understands it', text: 'AI extracts location, price, plot size and property type, then pulls satellite imagery for the parcel.' },
          { '@type': 'HowToStep', position: 3, name: 'Listing goes live', text: 'A property page is generated with photos, boundary, nearby landmarks and your business name.' },
          { '@type': 'HowToStep', position: 4, name: 'Share with buyers', text: 'Forward one link. Every open, enquiry and callback request lands in your Plotraa lead inbox.' },
        ],
      },
      breadcrumb('How It Works', '/how-it-works'),
    ],
  },
  '/pricing': {
    title: 'Plotraa Pricing: Real Estate CRM Plans for Dealers',
    description:
      'Monthly Plotraa plans for property dealers: Starter, Growth and Unlimited. WhatsApp listings, AI property extraction, lead inbox and team access. No lock-in.',
    jsonLd: [breadcrumb('Pricing', '/pricing')],
  },
  '/team': {
    title: 'About Plotraa: The Team Behind the WhatsApp Property CRM',
    description:
      'Plotraa is built by Wayne E Solutions, a small team in Ludhiana, Punjab, building the WhatsApp-native CRM that property dealers actually use every day.',
    jsonLd: [
      {
        '@type': 'AboutPage',
        url: `${SITE_URL}/team`,
        name: 'About Plotraa: The Team Behind the WhatsApp Property CRM',
        about: { '@id': ORG_ID },
      },
      breadcrumb('Team', '/team'),
    ],
  },
  '/legal': {
    title: 'Plotraa Legal: Terms, Privacy, Refund and Cookie Policies',
    description:
      "Plotraa's terms and conditions, privacy policy, refund and cancellation policy, cookie policy, acceptable use policy and grievance contact information.",
    jsonLd: [breadcrumb('Legal', '/legal')],
  },
  '/blog': {
    title: 'Plotraa Blog: Guides for Property Dealers and Buyers',
    description:
      'Practical guides from Plotraa on listing property, pricing plots, checking paperwork and winning buyer leads on WhatsApp.',
    jsonLd: [
      { '@type': 'Blog', url: `${SITE_URL}/blog`, name: 'Plotraa Blog', publisher: { '@id': ORG_ID } },
      breadcrumb('Blog', '/blog'),
    ],
  },
  '/request-access': {
    title: 'Request Access to Plotraa: Property Dealer Sign-Up Form',
    description:
      'Request a Plotraa account for your property business. We onboard dealers city by city with a real setup call and review new requests within one working day.',
    jsonLd: [breadcrumb('Request Access', '/request-access')],
  },
};

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Build the <head> tags for a page as an HTML string (used at build time).
 * Every tag carries data-seo so the runtime <Seo> component can swap them.
 * Pass canonical=false for the SPA fallback HTML (dist/index.html is also
 * served for /p/:slug, /dashboard etc., so it must not claim a canonical).
 */
export function renderHeadHtml(page, path, { canonical = true } = {}) {
  const url = `${SITE_URL}${path}`;
  const tags = [
    `<title>${esc(page.title)}</title>`,
    `<meta data-seo name="description" content="${esc(page.description)}">`,
    canonical ? `<link data-seo rel="canonical" href="${url}">` : '',
    `<meta data-seo name="robots" content="index, follow">`,
    `<meta data-seo property="og:type" content="website">`,
    `<meta data-seo property="og:site_name" content="Plotraa">`,
    `<meta data-seo property="og:title" content="${esc(page.title)}">`,
    `<meta data-seo property="og:description" content="${esc(page.description)}">`,
    canonical ? `<meta data-seo property="og:url" content="${url}">` : '',
    `<meta data-seo property="og:image" content="${OG_IMAGE}">`,
    `<meta data-seo name="twitter:card" content="summary_large_image">`,
    page.jsonLd?.length
      ? `<script data-seo type="application/ld+json">${JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': page.jsonLd,
        }).replace(/</g, '\\u003c')}</script>`
      : '',
  ];
  return tags.filter(Boolean).join('\n    ');
}

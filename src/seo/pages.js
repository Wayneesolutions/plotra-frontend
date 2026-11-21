// Single source of truth for per-page SEO (title, description, JSON-LD).
// Used in two places:
//   1. scripts/prerender.mjs — writes dist/<route>/index.html per page with
//      the full page body AND these <head> tags, so crawlers that don't run
//      JS (ChatGPT, Claude, Perplexity, WhatsApp, Bing…) see real content.
//   2. src/components/Seo.tsx — keeps <head> correct during client-side
//      navigation inside the SPA.
// Plain JS on purpose so Node scripts can import it directly.
//
// jsonLd may be an array, or a function (data) => array, where data is the
// build-time prerender data ({ plans, blogList }) — used for price facts.

import {
  SITE_URL,
  BRAND,
  COMPANY,
  COMPANY_URL,
  EMAIL,
  PHONE_SCHEMA,
  ADDRESS,
  SAME_AS,
  CITIES_SERVED,
  CONTENT_UPDATED_ISO,
} from './site-info.js';
import { faqItems, faqJsonLd, HOME_FAQ_IDS } from '../content/faq.js';
import { pricingFacts } from '../content/pricing-facts.js';
import { CONTENT_PAGES } from '../content/pages.js';

export { SITE_URL };
export const OG_IMAGE = `${SITE_URL}/og-image.jpg`;

const ORG_ID = `${SITE_URL}/#organization`;
const SOFTWARE_ID = `${SITE_URL}/#software`;

const breadcrumb = (name, path, parent) => ({
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
    ...(parent ? [{ '@type': 'ListItem', position: 2, name: parent.name, item: `${SITE_URL}${parent.path}` }] : []),
    { '@type': 'ListItem', position: parent ? 3 : 2, name, item: `${SITE_URL}${path}` },
  ],
});

export const HOW_IT_WORKS_STEPS = [
  { name: 'Send the property on WhatsApp', text: 'Send the size, location, price (optional) and photos to your Plotraa WhatsApp number.' },
  { name: 'Plotraa builds the listing', text: 'Plotraa reads the message and builds the listing.' },
  { name: 'Check the map pin', text: 'Check the map pin and correct it if needed.' },
  { name: 'Share one link', text: 'Share one link with buyers on WhatsApp.' },
  { name: 'Track enquiries', text: 'See every enquiry in your dashboard.' },
];

const homeJsonLd = (data = {}) => {
  const f = pricingFacts(data.plans);
  return [
    {
      '@type': 'Organization',
      '@id': ORG_ID,
      name: BRAND,
      alternateName: ['Plotraa real estate CRM', 'Plotraa.com'],
      url: `${SITE_URL}/`,
      logo: `${SITE_URL}/plotraa-logo.png`,
      slogan: 'Ek Text. Ek Listing.',
      description:
        'Plotraa is WhatsApp-first real estate software for property dealers in India. Dealers list a property with one WhatsApp message and track every buyer enquiry in one dashboard.',
      disambiguatingDescription:
        'Real estate software for property dealers in Punjab, India. Not related to the Plotra comics app.',
      email: EMAIL,
      telephone: PHONE_SCHEMA,
      address: {
        '@type': 'PostalAddress',
        streetAddress: ADDRESS.street,
        addressLocality: ADDRESS.city,
        addressRegion: ADDRESS.region,
        addressCountry: ADDRESS.countryCode,
      },
      areaServed: [...CITIES_SERVED, 'Punjab', 'India'],
      parentOrganization: { '@type': 'Organization', name: COMPANY, url: COMPANY_URL },
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'sales',
        telephone: PHONE_SCHEMA,
        email: EMAIL,
        availableLanguage: ['en', 'hi', 'pa'],
      },
      sameAs: SAME_AS,
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: `${SITE_URL}/`,
      name: BRAND,
      publisher: { '@id': ORG_ID },
      inLanguage: 'en-IN',
    },
    {
      '@type': 'SoftwareApplication',
      '@id': SOFTWARE_ID,
      name: BRAND,
      url: `${SITE_URL}/`,
      applicationCategory: 'BusinessApplication',
      applicationSubCategory: 'Real Estate CRM',
      operatingSystem: 'Web, WhatsApp',
      description:
        'WhatsApp real estate CRM for property dealers: list a property with one WhatsApp message, share a listing link with map location, and track buyer leads.',
      offers: {
        '@type': 'AggregateOffer',
        priceCurrency: 'INR',
        lowPrice: String(f.basicFrom),
        highPrice: String(f.highPrice),
        offerCount: String(f.planCount),
        url: `${SITE_URL}/pricing`,
      },
      publisher: { '@id': ORG_ID },
    },
  ];
};

const contentPageEntries = Object.fromEntries(
  Object.entries(CONTENT_PAGES).map(([path, page]) => {
    const isFeature = path.startsWith('/features/');
    return [
      path,
      {
        title: page.title,
        description: page.description,
        jsonLd: (data = {}) => {
          const items = faqItems(data.plans).filter((it) => page.faqIds.includes(it.id));
          return [
            {
              '@type': 'WebPage',
              url: `${SITE_URL}${path}`,
              name: page.title,
              description: page.description,
              dateModified: CONTENT_UPDATED_ISO,
              about: { '@id': SOFTWARE_ID },
              ...(page.place ? { spatialCoverage: { '@type': 'Place', name: page.place } } : {}),
            },
            breadcrumb(page.breadcrumb, path, isFeature ? { name: 'Features', path: '/how-it-works' } : undefined),
            ...(items.length ? [faqJsonLd(items)] : []),
          ];
        },
      },
    ];
  }),
);

export const SEO_PAGES = {
  '/': {
    title: 'Plotraa – WhatsApp Real Estate CRM for Property Dealers',
    description:
      'Plotraa is WhatsApp-first software for property dealers in Punjab. Send one WhatsApp message, get a shareable listing with photos and a map, and track every buyer lead.',
    jsonLd: (data = {}) => [
      ...homeJsonLd(data),
      faqJsonLd(faqItems(data.plans).filter((it) => HOME_FAQ_IDS.includes(it.id))),
    ],
  },
  '/how-it-works': {
    title: 'How Plotraa Works: WhatsApp Message to Property Listing',
    description:
      'See how Plotraa works: send property details on WhatsApp, Plotraa builds a listing with photos and map location, you share one link and track buyer enquiries.',
    jsonLd: [
      {
        '@type': 'HowTo',
        name: 'How to list a property on Plotraa using WhatsApp',
        step: HOW_IT_WORKS_STEPS.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, name: s.name, text: s.text })),
      },
      breadcrumb('How It Works', '/how-it-works'),
    ],
  },
  '/pricing': {
    title: 'Plotraa Pricing 2026: Plans for Property Dealers (Monthly)',
    description:
      'Plotraa pricing for property dealers in India: monthly plans for one dealer or a team, with or without buyer leads. No lock-in. See what each plan includes.',
    jsonLd: [
      {
        '@type': 'WebPage',
        url: `${SITE_URL}/pricing`,
        name: 'Plotraa pricing',
        dateModified: CONTENT_UPDATED_ISO,
        about: { '@id': SOFTWARE_ID },
      },
      breadcrumb('Pricing', '/pricing'),
    ],
  },
  '/team': {
    title: 'Plotraa Team – Built in Ludhiana by Wayne E Solutions',
    description:
      'Meet the Plotraa team. Plotraa is built by Wayne E Solutions, a software and digital marketing company in Model Town, Ludhiana, Punjab.',
    jsonLd: [breadcrumb('Team', '/team')],
  },
  '/about': {
    title: 'About Plotraa – WhatsApp Real Estate Software from Ludhiana',
    description:
      'Plotraa is real estate software for property dealers in Punjab, built by Wayne E Solutions in Ludhiana. Our story, who we serve and how to reach us.',
    jsonLd: [
      {
        '@type': 'AboutPage',
        url: `${SITE_URL}/about`,
        name: 'About Plotraa',
        about: { '@id': ORG_ID },
        dateModified: CONTENT_UPDATED_ISO,
      },
      breadcrumb('About', '/about'),
    ],
  },
  '/faq': {
    title: 'Plotraa FAQ – WhatsApp Real Estate CRM Questions Answered',
    description:
      'Answers about Plotraa: how WhatsApp listing works, pricing, team plans, buyer leads, cities served and how to get started.',
    jsonLd: (data = {}) => [faqJsonLd(faqItems(data.plans), CONTENT_UPDATED_ISO), breadcrumb('FAQ', '/faq')],
  },
  ...contentPageEntries,
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
  '/sell-property': {
    title: 'Sell Your Property with Plotraa: Get Matched with a Trusted Dealer',
    description:
      'Want to sell a plot, house or flat? Share your property details and Plotraa will connect you with a verified local dealer.',
    jsonLd: [breadcrumb('Sell Property', '/sell-property')],
  },
  '/request-access': {
    title: 'Request Access to Plotraa: Property Dealer Sign-Up Form',
    description:
      'Request a Plotraa account for your property business. We onboard dealers city by city with a real setup call and review new requests within one working day.',
    jsonLd: [breadcrumb('Request Access', '/request-access')],
  },
};

/** Pages that get a "Not found" HTML + noindex (used for dist/404.html). */
export const NOT_FOUND_PAGE = {
  title: 'Page not found | Plotraa',
  description: 'This page does not exist on plotraa.com.',
  jsonLd: [],
  noindex: true,
};

/** Resolve a page's JSON-LD array (static array or function of data). */
export function resolveJsonLd(page, data) {
  const ld = typeof page.jsonLd === 'function' ? page.jsonLd(data || {}) : page.jsonLd;
  return Array.isArray(ld) ? ld : [];
}

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Build the <head> tags for a page as an HTML string (used at build time).
 * Every tag carries data-seo so the runtime <Seo> component can swap them.
 */
export function renderHeadHtml(page, path, { canonical = true, data } = {}) {
  const url = `${SITE_URL}${path}`;
  const jsonLd = resolveJsonLd(page, data);
  const tags = [
    `<title>${esc(page.title)}</title>`,
    `<meta data-seo name="description" content="${esc(page.description)}">`,
    canonical ? `<link data-seo rel="canonical" href="${url}">` : '',
    `<meta data-seo name="robots" content="${page.noindex ? 'noindex, follow' : 'index, follow'}">`,
    `<meta data-seo property="og:type" content="website">`,
    `<meta data-seo property="og:site_name" content="Plotraa">`,
    `<meta data-seo property="og:title" content="${esc(page.title)}">`,
    `<meta data-seo property="og:description" content="${esc(page.description)}">`,
    canonical ? `<meta data-seo property="og:url" content="${url}">` : '',
    `<meta data-seo property="og:image" content="${OG_IMAGE}">`,
    `<meta data-seo name="twitter:card" content="summary_large_image">`,
    jsonLd.length
      ? `<script data-seo type="application/ld+json">${JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': jsonLd,
        }).replace(/</g, '\\u003c')}</script>`
      : '',
  ];
  return tags.filter(Boolean).join('\n    ');
}

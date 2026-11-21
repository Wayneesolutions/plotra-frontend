// Plotraa FAQ — the single source for the /faq page, the FAQ block on the
// home page and the FAQPage JSON-LD. Schema text must match the visible text
// exactly, so both are generated from this list.
import { PHONE_DISPLAY } from '../seo/site-info.js';
import { pricingFacts, inr } from './pricing-facts.js';

export function faqItems(plans) {
  const f = pricingFacts(plans);
  const leadsPart = f.leadsFrom
    ? `, and plans with buyer leads start at ${inr(f.leadsFrom)} a month`
    : '';
  return [
    {
      id: 'what-is-plotraa',
      q: 'What is Plotraa?',
      a: 'Plotraa is WhatsApp-first real estate software for property dealers in India. You send property details as a normal WhatsApp message and Plotraa creates a shareable listing page with photos and a map location. All buyer enquiries are tracked in one dashboard.',
    },
    {
      id: 'who-is-it-for',
      q: 'Who is Plotraa for?',
      a: 'Property dealers, real estate agents and small dealer offices, mainly in Punjab and Chandigarh: Ludhiana, Mohali, Kharar, Jalandhar, Patiala and Amritsar.',
    },
    {
      id: 'how-to-list',
      q: 'How do I list a property on Plotraa?',
      a: 'Send the plot size, location, price (optional) and photos to your Plotraa WhatsApp number. Plotraa builds the listing. You check the map pin, correct it if needed, and share the link with buyers.',
    },
    {
      id: 'app-download',
      q: 'Do I need to download an app?',
      a: 'No. Listing works through WhatsApp. The dashboard opens in any web browser.',
    },
    {
      id: 'cost',
      q: 'How much does Plotraa cost?',
      a: `Plans are monthly with no lock-in. Basic starts at ${inr(f.basicFrom)} a month for one user${leadsPart}. See plotraa.com/pricing for all plans.`,
    },
    {
      id: 'team',
      q: 'Can my whole team use one account?',
      a: 'Yes. Multi-user plans include several users and WhatsApp numbers. The dashboard shows which agent added each listing.',
    },
    {
      id: 'vs-portals',
      q: 'How is Plotraa different from 99acres or MagicBricks?',
      a: 'Portals are marketplaces where your listing sits next to other dealers’ listings. Plotraa is your own tool: you list from WhatsApp, share your own link with your own buyers, and keep every enquiry in your own dashboard. Many dealers use both.',
    },
    {
      id: 'gaj-marla',
      q: 'Can I add plot sizes in gaj or marla?',
      a: 'Yes. Write the size the way you normally do (gaj, marla, square yards or square feet). We suggest stating both the local unit and square feet, because marla sizes vary by area.',
    },
    {
      id: 'start',
      q: 'How do I start?',
      a: `Request access at plotraa.com/request-access or send a WhatsApp message to ${PHONE_DISPLAY}. We onboard dealers city by city.`,
    },
  ];
}

/** FAQPage JSON-LD for a list of items (text identical to what's shown). */
export function faqJsonLd(items, dateModified) {
  return {
    '@type': 'FAQPage',
    ...(dateModified ? { dateModified } : {}),
    mainEntity: items.map((it) => ({
      '@type': 'Question',
      name: it.q,
      acceptedAnswer: { '@type': 'Answer', text: it.a },
    })),
  };
}

/** The four questions shown on the home page. */
export const HOME_FAQ_IDS = ['what-is-plotraa', 'who-is-it-for', 'how-to-list', 'cost'];

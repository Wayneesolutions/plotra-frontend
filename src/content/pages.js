// Long-form SEO pages (features, cities, comparison). Rendered by
// src/pages/ContentPage.tsx; titles/descriptions are also used by
// src/seo/pages.js for the <head>. Plain JS so the build script can read it.
//
// Section blocks:
//   { h2, p: [..] }              paragraphs (may contain {link:...} parts)
//   { h2, ul: [..] } / { h2, ol: [..] }
//   { h2, table: { head: [..], rows: [[..], ..] } }
// Rich text: a string, or an array of strings and { text, to } links.
import { PHONE_DISPLAY } from '../seo/site-info.js';

const CTA = {
  title: 'List your properties with one WhatsApp message',
  text: `WhatsApp ${PHONE_DISPLAY} or request access and we'll set you up.`,
};

export const CONTENT_PAGES = {
  '/features/whatsapp-property-listing': {
    title: 'WhatsApp Property Listing Software for Dealers | Plotraa',
    description:
      'List a property by sending one WhatsApp message. Plotraa creates a listing page with photos and map location you can share with any buyer. Built for Indian dealers.',
    eyebrow: 'Feature',
    h1: 'WhatsApp property listing software for real estate dealers',
    intro:
      'Plotraa lets a property dealer create a listing by sending one WhatsApp message. Send size, location, price (optional) and photos, and Plotraa turns them into a listing page with a map location. You share one link instead of forwarding ten photos.',
    breadcrumb: 'WhatsApp property listing',
    sections: [
      {
        h2: 'What you send',
        p: [
          'A normal WhatsApp message, written the way you already write to buyers. For example: “200 gaj plot, Pakhowal Road Ludhiana, east facing, 30 ft road” plus 3 photos.',
        ],
      },
      {
        h2: 'What you get',
        p: ['A listing page with your photos, the plot size, the location on a map, and an enquiry button for buyers.'],
      },
      {
        h2: 'Correct the map pin',
        p: ['If the location is off, move the pin before you share the link. The buyer only ever sees the corrected location.'],
      },
      {
        h2: 'Share anywhere',
        p: ['Post the link in WhatsApp groups, your Instagram bio or Facebook, or send it directly to an NRI buyer abroad.'],
      },
      {
        h2: 'Why it beats forwarding photos',
        table: {
          head: ['Forwarding photos', 'Plotraa link'],
          rows: [
            ['Photos get lost in long chats', 'One link with every photo'],
            ['No map', 'Map location on the page'],
            ['Can’t tell which version is current', 'Update one listing and the link stays the same'],
          ],
        },
      },
      {
        h2: 'Related',
        p: [
          [
            'See ',
            { text: 'how Plotraa works step by step', to: '/how-it-works' },
            ', how it handles ',
            { text: 'buyer leads', to: '/features/lead-management' },
            ', or read our guide to ',
            { text: 'WhatsApp CRM for real estate in India', to: '/blog/whatsapp-crm-for-real-estate-india' },
            '.',
          ],
        ],
      },
    ],
    faqIds: ['how-to-list', 'app-download', 'gaj-marla', 'cost'],
    cta: CTA,
  },

  '/features/lead-management': {
    title: 'Real Estate Lead Management for Property Dealers | Plotraa',
    description:
      'Track every buyer enquiry from your property listings in one dashboard. See which agent handled which listing. Real estate lead management made for WhatsApp.',
    eyebrow: 'Feature',
    h1: 'Real estate lead management for property dealers',
    intro:
      'Plotraa keeps every buyer enquiry from your listings in one dashboard, so leads don’t get buried in WhatsApp chats. On team plans you see which agent added each listing. Plans with buyer leads also bring new enquiries to you every month.',
    breadcrumb: 'Lead management',
    sections: [
      {
        h2: 'Why dealers lose leads on WhatsApp',
        ul: [
          'Chats get buried under group messages within hours.',
          'No one owns the follow-up, so every agent assumes someone else called back.',
          'There is no record of what the buyer asked, so the second call starts from zero.',
        ],
      },
      {
        h2: 'How Plotraa tracks enquiries',
        p: [
          'Every enquiry from a Plotraa listing page lands in your lead inbox with the listing it came from, so you know exactly which property the buyer is asking about.',
        ],
      },
      {
        h2: 'Team view: listings by agent',
        p: [
          'On multi-user plans each agent lists from their own WhatsApp number. The dashboard shows which agent added each listing, so the right person follows up.',
        ],
      },
      {
        h2: 'Same-day follow-up checklist',
        ol: [
          'Open the lead inbox every morning and every evening.',
          'Reply to every new enquiry the same day, even if only to confirm you received it.',
          'Send the buyer the listing link again with one clear next step (site visit time).',
          'Note what the buyer asked so the next call continues the conversation.',
          'Share two or three similar listings if the first one doesn’t fit.',
        ],
      },
      {
        p: [
          [
            'More detail in our guide on ',
            { text: 'lead follow-up for Punjab dealers', to: '/blog/real-estate-lead-follow-up-punjab-dealers' },
            '. Plans with buyer leads are listed on the ',
            { text: 'pricing page', to: '/pricing' },
            '.',
          ],
        ],
      },
    ],
    faqIds: ['team', 'cost', 'vs-portals'],
    cta: CTA,
  },

  '/property-dealer-software-ludhiana': {
    title: 'Property Dealer Software in Ludhiana – List on WhatsApp | Plotraa',
    description:
      'Plotraa is property dealer software made in Ludhiana. List plots and houses with one WhatsApp message, share one link with buyers and track every enquiry.',
    eyebrow: 'Ludhiana',
    h1: 'Property dealer software in Ludhiana',
    intro:
      'Plotraa is real estate software built in Ludhiana for Ludhiana property dealers. You list plots, kothis and commercial property by sending a WhatsApp message, share a clean link with buyers, and track every enquiry in one dashboard.',
    breadcrumb: 'Ludhiana',
    place: 'Ludhiana, Punjab, India',
    sections: [
      {
        h2: 'Made for how Ludhiana dealers work',
        ul: [
          'You already run your business on WhatsApp groups — Plotraa works inside WhatsApp, no new app.',
          'Write sizes in gaj or marla the way you always do.',
          'Quick site visits: the buyer sees the map location before you drive out, so fewer wasted trips.',
        ],
      },
      {
        h2: 'How to start',
        ol: [
          'Request access at plotraa.com/request-access, or WhatsApp us.',
          'We set up your WhatsApp number on a short call.',
          'Send your first property and share the listing link the same day.',
        ],
      },
      {
        h2: 'Our office',
        p: [
          [
            'Plotraa is built by Wayne E Solutions in Model Town, Ludhiana. ',
            { text: 'Read more about Plotraa', to: '/about' },
            ' or see ',
            { text: 'pricing', to: '/pricing' },
            '.',
          ],
        ],
        map: 'Model Town, Ludhiana, Punjab',
      },
    ],
    faqIds: ['how-to-list', 'gaj-marla', 'cost', 'start'],
    cta: CTA,
  },

  '/property-dealer-software-mohali-kharar': {
    title: 'Property Dealer Software in Mohali & Kharar | Plotraa',
    description:
      'Plotraa is property dealer software for Mohali and Kharar dealers. List plots and flats with one WhatsApp message, share one link with buyers and track every enquiry.',
    eyebrow: 'Mohali & Kharar',
    h1: 'Property dealer software in Mohali & Kharar',
    intro:
      'Plotraa is WhatsApp-first real estate software for property dealers in Mohali and Kharar. You list plots, flats and commercial property by sending a WhatsApp message, share a clean link with buyers, and track every enquiry in one dashboard.',
    breadcrumb: 'Mohali & Kharar',
    place: 'Mohali and Kharar, Punjab, India',
    sections: [
      {
        h2: 'Made for how Mohali & Kharar dealers work',
        ul: [
          'You already share listings in WhatsApp groups — Plotraa works inside WhatsApp, no new app.',
          'Write sizes in gaj, marla, square yards or square feet.',
          'Buyers from Chandigarh, Delhi or abroad see the map location before they call.',
        ],
      },
      {
        h2: 'How to start',
        ol: [
          'Request access at plotraa.com/request-access, or WhatsApp us.',
          'We set up your WhatsApp number on a short call.',
          'Send your first property and share the listing link the same day.',
        ],
      },
      {
        p: [
          [
            'Plotraa is built in Ludhiana by Wayne E Solutions. ',
            { text: 'See pricing', to: '/pricing' },
            ' or ',
            { text: 'read the FAQ', to: '/faq' },
            '.',
          ],
        ],
      },
    ],
    faqIds: ['how-to-list', 'team', 'cost', 'start'],
    cta: CTA,
  },

  '/plotraa-vs-property-portals': {
    title: 'Plotraa vs 99acres & MagicBricks: Which Do Property Dealers Need?',
    description:
      'Plotraa vs property portals like 99acres and MagicBricks: what each is for, who owns the buyer contact, and why many Punjab dealers use a portal for reach and Plotraa for leads.',
    eyebrow: 'Comparison',
    h1: 'Plotraa vs property portals for dealers',
    intro:
      'Portals like 99acres and MagicBricks are marketplaces where buyers search many dealers’ listings. Plotraa is a dealer’s own WhatsApp listing and lead tool. Most dealers get the best results using a portal for reach and Plotraa for managing listings and their own buyers.',
    breadcrumb: 'Plotraa vs portals',
    sections: [
      {
        h2: 'Side-by-side',
        table: {
          head: ['', 'Property portals (99acres, MagicBricks)', 'Plotraa'],
          rows: [
            ['Purpose', 'Marketplace for buyers to search', 'Your own listing and lead tool'],
            ['Where listings live', 'On the portal, next to other dealers’ listings', 'On your own Plotraa link'],
            ['Who owns the buyer contact', 'Enquiries come through the portal', 'Enquiries come straight to your dashboard'],
            ['How you list', 'Fill in the portal’s form', 'Send one WhatsApp message'],
            ['Team tracking', 'Depends on the portal package', 'Listings shown by agent on team plans'],
            ['Pricing model', 'Portal packages — see each portal’s own site', 'Monthly plans, no lock-in'],
          ],
        },
      },
      {
        h2: 'When to use which',
        p: [
          'Use a portal when you need buyers who don’t know you yet. Use Plotraa to list fast, share your own clean link in WhatsApp groups and with past buyers, and make sure no enquiry is lost.',
          [
            'Read more: ',
            { text: 'getting buyer leads without depending only on portals', to: '/blog/buyer-leads-without-property-portals-punjab-dealers' },
            '.',
          ],
        ],
      },
    ],
    faqIds: ['vs-portals', 'what-is-plotraa', 'cost'],
    cta: CTA,
  },
};

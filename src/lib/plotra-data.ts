import heroAerial from "@/assets/hero-aerial.jpg";
import satellitePlot from "@/assets/satellite-plot.jpg";
import houseExterior from "@/assets/house-exterior.jpg";
import plotAerial from "@/assets/plot-aerial.jpg";
import streetView from "@/assets/street-view.jpg";
import nightNeighborhood from "@/assets/night-neighborhood.jpg";

export const media = {
  heroAerial,
  satellitePlot,
  houseExterior,
  plotAerial,
  streetView,
  nightNeighborhood,
};

export type ListingStatus = "Pending" | "Active" | "Awaiting Approval" | "Inactive" | "Sold";

export type Listing = {
  id: string;
  title: string;
  price: string;
  priceValue: number;
  city: string;
  area: string;
  type: string;
  status: ListingStatus;
  visits: number;
  viewsThisWeek: number;
  image: string;
  satellite: string;
  description: string;
  dealer: string;
  boundary: boolean;
};

export const listings: Listing[] = [
  {
    id: "ldh-residential-plot-2000",
    title: "Residential Plot near Pakhowal Road",
    price: "₹1.25 Cr",
    priceValue: 12500000,
    city: "Ludhiana, Punjab",
    area: "2,000 sq.ft",
    type: "Residential Plot",
    status: "Active",
    visits: 412,
    viewsThisWeek: 86,
    image: plotAerial,
    satellite: satellitePlot,
    description:
      "Corner plot in a fully developed sector with wide internal roads, underground wiring and clear title. Walking distance to schools and daily-needs markets.",
    dealer: "Sandhu Property Consultants",
    boundary: true,
  },
  {
    id: "mohali-independent-kothi",
    title: "4 BHK Independent Kothi, Sector 91",
    price: "₹2.40 Cr",
    priceValue: 24000000,
    city: "Mohali, Punjab",
    area: "300 sq.yd",
    type: "Independent House",
    status: "Active",
    visits: 638,
    viewsThisWeek: 141,
    image: houseExterior,
    satellite: satellitePlot,
    description:
      "Newly constructed kothi with modular kitchen, covered parking for two cars and a landscaped front lawn. Ready to move.",
    dealer: "Sandhu Property Consultants",
    boundary: true,
  },
  {
    id: "jalandhar-highway-land",
    title: "Commercial Land on NH-44 Frontage",
    price: "₹4.10 Cr",
    priceValue: 41000000,
    city: "Jalandhar, Punjab",
    area: "1 Acre",
    type: "Commercial Land",
    status: "Awaiting Approval",
    visits: 189,
    viewsThisWeek: 34,
    image: plotAerial,
    satellite: satellitePlot,
    description: "High-visibility highway frontage suited to warehousing, showroom or fuel retail.",
    dealer: "Sandhu Property Consultants",
    boundary: false,
  },
  {
    id: "patiala-street-villa",
    title: "Villa in Gated Colony, Urban Estate",
    price: "₹1.85 Cr",
    priceValue: 18500000,
    city: "Patiala, Punjab",
    area: "250 sq.yd",
    type: "Villa",
    status: "Pending",
    visits: 96,
    viewsThisWeek: 22,
    image: streetView,
    satellite: satellitePlot,
    description: "Quiet tree-lined street inside a gated colony with 24x7 security and power backup.",
    dealer: "Sandhu Property Consultants",
    boundary: false,
  },
  {
    id: "amritsar-sector-plot",
    title: "Sector Plot near Ring Road",
    price: "₹92 Lakh",
    priceValue: 9200000,
    city: "Amritsar, Punjab",
    area: "1,500 sq.ft",
    type: "Residential Plot",
    status: "Sold",
    visits: 720,
    viewsThisWeek: 12,
    image: satellitePlot,
    satellite: satellitePlot,
    description: "Sold in 19 days after listing through Plotra.",
    dealer: "Sandhu Property Consultants",
    boundary: true,
  },
  {
    id: "kharar-corner-plot",
    title: "Corner Plot, New Sunny Enclave",
    price: "₹68 Lakh",
    priceValue: 6800000,
    city: "Kharar, Punjab",
    area: "1,200 sq.ft",
    type: "Residential Plot",
    status: "Inactive",
    visits: 143,
    viewsThisWeek: 5,
    image: nightNeighborhood,
    satellite: satellitePlot,
    description: "Two-side open corner plot with immediate registry possible.",
    dealer: "Sandhu Property Consultants",
    boundary: false,
  },
];

export const plans = [
  {
    name: "Starter",
    price: "₹1,499",
    period: "per month",
    limit: "Up to 15 active listings",
    recommended: false,
    features: [
      "WhatsApp listing creation",
      "AI property extraction",
      "Public listing pages",
      "Lead inbox",
      "1 team member",
    ],
  },
  {
    name: "Growth",
    price: "₹3,999",
    period: "per month",
    limit: "Up to 100 active listings",
    recommended: true,
    features: [
      "Everything in Starter",
      "Satellite plot boundary tracing",
      "AI buyer conversations",
      "Lead scoring & filters",
      "5 team members",
      "Document verification queue",
    ],
  },
  {
    name: "Unlimited",
    price: "₹8,999",
    period: "per month",
    limit: "Unlimited listings",
    recommended: false,
    features: [
      "Everything in Growth",
      "Unlimited team members",
      "AI call log & transcripts",
      "Site visit scheduling",
      "Priority support",
      "Custom domain listings",
    ],
  },
];

export type Lead = {
  id: string;
  name: string;
  phone: string;
  source: "WhatsApp Share" | "Soft Prompt" | "Ad" | "Referral";
  score: number;
  status: "New" | "Contacted" | "Qualified" | "Closed" | "Lost";
  listingId: string;
};

export const leads: Lead[] = [
  { id: "l1", name: "Harpreet Singh", phone: "+91 98140 22114", source: "WhatsApp Share", score: 94, status: "New", listingId: "ldh-residential-plot-2000" },
  { id: "l2", name: "Ritu Bansal", phone: "+91 99887 41220", source: "Ad", score: 88, status: "Contacted", listingId: "mohali-independent-kothi" },
  { id: "l3", name: "Gurdeep Aulakh", phone: "+91 98765 10098", source: "Soft Prompt", score: 76, status: "Qualified", listingId: "jalandhar-highway-land" },
  { id: "l4", name: "Nitin Arora", phone: "+91 90410 55231", source: "Referral", score: 61, status: "Contacted", listingId: "patiala-street-villa" },
  { id: "l5", name: "Simran Kaur", phone: "+91 78370 90112", source: "WhatsApp Share", score: 45, status: "New", listingId: "ldh-residential-plot-2000" },
  { id: "l6", name: "Mohit Jindal", phone: "+91 82880 31447", source: "Ad", score: 28, status: "Lost", listingId: "kharar-corner-plot" },
  { id: "l7", name: "Anmol Sethi", phone: "+91 95010 77820", source: "Referral", score: 82, status: "Qualified", listingId: "mohali-independent-kothi" },
];

export const accessRequests = [
  { id: "r1", business: "Sandhu Property Consultants", owner: "Jaskaran Sandhu", contact: "+91 98140 22114", email: "jaskaran@sandhuproperties.in", date: "12 Aug 2026", status: "Pending" },
  { id: "r2", business: "Malhotra Estates", owner: "Rohit Malhotra", contact: "+91 99887 41220", email: "rohit@malhotraestates.com", date: "13 Aug 2026", status: "Pending" },
  { id: "r3", business: "Doaba Realty", owner: "Kuldeep Bains", contact: "+91 98765 10098", email: "kuldeep@doabarealty.in", date: "14 Aug 2026", status: "Approved" },
  { id: "r4", business: "Tricity Plots Hub", owner: "Manav Gupta", contact: "+91 90410 55231", email: "manav@tricityplots.in", date: "15 Aug 2026", status: "Rejected" },
];

export const tenants = [
  { id: "t1", business: "Sandhu Property Consultants", owner: "Jaskaran Sandhu", plan: "Growth", status: "Active", listings: 42, usage: "1,240 views / mo" },
  { id: "t2", business: "Doaba Realty", owner: "Kuldeep Bains", plan: "Starter", status: "Active", listings: 11, usage: "380 views / mo" },
  { id: "t3", business: "Majha Land Co.", owner: "Simar Dhillon", plan: "Unlimited", status: "Suspended", listings: 130, usage: "8,910 views / mo" },
  { id: "t4", business: "Malwa Property Point", owner: "Rajan Goyal", plan: "Growth", status: "Active", listings: 63, usage: "2,150 views / mo" },
];

export const adPlacements = [
  { id: "a1", name: "Home Bank Loan Banner", placement: "Property page — sidebar", status: "Live", impressions: 48210, clicks: 1932, image: houseExterior },
  { id: "a2", name: "Interior Studio Promo", placement: "Listings grid — inline", status: "Paused", impressions: 21044, clicks: 604, image: streetView },
  { id: "a3", name: "Registry Services", placement: "Lead inbox — footer", status: "Live", impressions: 9880, clicks: 311, image: satellitePlot },
];

export const documents = [
  { id: "d1", type: "Sale Deed", property: "Residential Plot near Pakhowal Road", submittedBy: "Jaskaran Sandhu", status: "Pending", image: satellitePlot },
  { id: "d2", type: "Mutation", property: "4 BHK Independent Kothi, Sector 91", submittedBy: "Team — Ravi", status: "Verified", image: houseExterior },
  { id: "d3", type: "Encumbrance Certificate", property: "Commercial Land on NH-44 Frontage", submittedBy: "Jaskaran Sandhu", status: "Flagged", image: plotAerial },
  { id: "d4", type: "Sale Deed", property: "Villa in Gated Colony, Urban Estate", submittedBy: "Team — Nav", status: "Rejected", image: streetView },
];

export const aiCalls = [
  { id: "c1", lead: "Harpreet Singh", language: "Punjabi", outcome: "Site visit booked", duration: "3m 12s", summary: "Asked about registry status and loan eligibility; agreed to Saturday visit." },
  { id: "c2", lead: "Ritu Bansal", language: "Hindi", outcome: "Callback requested", duration: "1m 48s", summary: "Budget slightly lower; wants similar kothi under ₹2 Cr." },
  { id: "c3", lead: "Gurdeep Aulakh", language: "English", outcome: "Qualified", duration: "4m 30s", summary: "Investor comparing highway frontage parcels; asked for boundary map." },
];

export const siteVisits = [
  { id: "v1", buyer: "Harpreet Singh", property: "Residential Plot near Pakhowal Road", agent: "Ravi Kumar", when: "Sat, 22 Aug · 11:00 AM", status: "Confirmed" },
  { id: "v2", buyer: "Anmol Sethi", property: "4 BHK Independent Kothi, Sector 91", agent: "Nav Preet", when: "Sun, 23 Aug · 4:30 PM", status: "Pending" },
  { id: "v3", buyer: "Nitin Arora", property: "Villa in Gated Colony, Urban Estate", agent: "Ravi Kumar", when: "Mon, 24 Aug · 10:00 AM", status: "Rescheduled" },
];

export const nearby = [
  { name: "Delhi Public School", kind: "School", distance: "1.2 km", walk: "14 min walk", drive: "4 min drive" },
  { name: "SPS Apollo Hospital", kind: "Hospital", distance: "3.4 km", walk: "38 min walk", drive: "9 min drive" },
  { name: "Sarabha Nagar Market", kind: "Market", distance: "2.1 km", walk: "24 min walk", drive: "6 min drive" },
  { name: "Ludhiana Bus Terminal", kind: "Transit", distance: "5.8 km", walk: "—", drive: "15 min drive" },
];

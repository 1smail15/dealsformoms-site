export const SITE = {
  title: 'Deals For Moms',
  tagline: 'Real clearance finds, checked in store.',
  description:
    'Hand-verified Walmart clearance finds, markdown calendars, and store-by-store savings guides from a shopper who actually walks the aisles.',
  url: 'https://dealsformoms.us',
  locale: 'en_US',
  author: {
    name: 'Ismail El Bouhali',
    bio: 'I walk Walmart clearance aisles every week and post what I actually find — price tags, receipts and all.',
    url: 'https://dealsformoms.us/about',
    sameAs: [
      'https://www.facebook.com/DealsForMoms',
    ],
  },
} as const;

/** Where affiliate clicks are routed. Change once, applies site-wide. */
export const GO_BASE = '/go';

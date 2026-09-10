export const SITE = {
  title: 'Deals For Moms',
  tagline: 'Real deals, checked in store.',
  description:
    'Hand-verified clearance finds from Walmart, Target, and more — markdown calendars and store-by-store savings guides from a shopper who actually walks the aisles.',
  url: 'https://dealsformoms.us',
  locale: 'en_US',
  author: {
    name: 'Ismail El Bouhali',
    bio: 'I walk store clearance aisles every week and post what I actually find — price tags, receipts and all.',
    url: 'https://dealsformoms.us/about',
    sameAs: [
      'https://www.facebook.com/profile.php?id=61556553736198',
    ],
  },
} as const;

/** Facebook presence. Page is the verified "Deals For Moms" page; group is the community. */
export const FACEBOOK = {
  page: 'https://www.facebook.com/profile.php?id=61556553736198',
  pageName: 'Deals For Moms',
  group: 'https://www.facebook.com/groups/deals4mama',
  groupName: 'Amazing Deals & Steals for Moms & Families',
} as const;

/** Where affiliate clicks are routed. Change once, applies site-wide. */
export const GO_BASE = '/go';

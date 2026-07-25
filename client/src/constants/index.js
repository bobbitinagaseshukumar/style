import { FiFacebook, FiInstagram, FiTwitter, FiYoutube } from 'react-icons/fi';

export const NAV_LINKS = [
  { name: 'Home', path: '/' },
  { name: 'Categories', path: '/categories' },
  { name: 'About Us', path: '/about' },
  { name: 'Contact', path: '/contact' },
];

export const FOOTER_LINKS = {
  QuickLinks: [
    { name: 'Search', path: '/search' },
    { name: 'About Us', path: '/about' },
    { name: 'Contact Us', path: '/contact' },
    { name: 'FAQ', path: '/faq' },
  ],
  CustomerService: [
    { name: 'Terms & Conditions', path: '/terms' },
    { name: 'Privacy Policy', path: '/privacy-policy' },
    { name: 'Shipping Policy', path: '/shipping-policy' },
    { name: 'Refund Policy', path: '/refund-policy' },
  ]
};

export const SOCIAL_ICONS = [
  { icon: FiFacebook, url: '#', name: 'Facebook' },
  { icon: FiInstagram, url: '#', name: 'Instagram' },
  { icon: FiTwitter, url: '#', name: 'Twitter' },
  { icon: FiYoutube, url: '#', name: 'Youtube' },
];

export const ORDER_STATUS = {
  PENDING: { label: 'Pending', color: 'warning' },
  PROCESSING: { label: 'Processing', color: 'info' },
  SHIPPED: { label: 'Shipped', color: 'primary' },
  DELIVERED: { label: 'Delivered', color: 'success' },
  CANCELLED: { label: 'Cancelled', color: 'error' },
};

export const DEFAULT_PAGINATION = {
  page: 1,
  limit: 12,
};

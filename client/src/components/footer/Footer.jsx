import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FOOTER_LINKS, SOCIAL_ICONS } from '../../constants';

const Footer = () => {
  const { storeSettings } = useSelector((state) => state.settings);

  return (
    <footer className="bg-charcoal-950 text-gray-300 pt-16 pb-8 border-t-4 border-gold-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* Brand & About */}
          <div>
            <Link to="/" className="font-playfair text-3xl font-bold text-gold-500 mb-6 block">
              {storeSettings?.logoText || 'StyleVerse'}
            </Link>
            <p className="text-sm leading-relaxed text-gray-400 mb-6">
              {storeSettings?.footerAboutText || 'Experience luxury fashion redefined. We curate the finest styles for the modern individual.'}
            </p>
            <div className="flex space-x-4">
              {SOCIAL_ICONS.map((social) => (
                <a 
                  key={social.name} 
                  href={storeSettings?.socialLinks?.[social.name.toLowerCase()] || social.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-gold-500 transition-colors"
                >
                  <span className="sr-only">{social.name}</span>
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">Quick Links</h3>
            <ul className="space-y-3">
              {FOOTER_LINKS.QuickLinks.map((link) => (
                <li key={link.name}>
                  <Link to={link.path} className="text-sm hover:text-gold-400 transition-colors">{link.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">Customer Care</h3>
            <ul className="space-y-3">
              {FOOTER_LINKS.CustomerService.map((link) => (
                <li key={link.name}>
                  <Link to={link.path} className="text-sm hover:text-gold-400 transition-colors">{link.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">Stay Updated</h3>
            <p className="text-sm text-gray-400 mb-4">Subscribe to receive updates, access to exclusive deals, and more.</p>
            <form className="flex flex-col space-y-2" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="Enter your email address" 
                className="bg-charcoal-900 border border-charcoal-800 text-white px-4 py-2 rounded focus:outline-none focus:border-gold-500 text-sm"
              />
              <button className="bg-gold-500 hover:bg-gold-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors">
                Subscribe
              </button>
            </form>
          </div>

        </div>

        <div className="border-t border-charcoal-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} {storeSettings?.storeName || 'StyleVerse'}. All rights reserved.
          </p>
          <div className="flex space-x-4 mt-4 md:mt-0 text-gray-500 text-sm">
            <span>Secure Payments</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

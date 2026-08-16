import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { FOOTER_LINKS } from '../../constants';
import { fetchStoreSettings } from '../../redux/settings/settingsSlice';
import NewsletterSubscribe from '../common/NewsletterSubscribe';
import {
  FaInstagram, FaFacebookF, FaTwitter, FaYoutube,
  FaLinkedinIn, FaPinterestP, FaTelegramPlane, FaWhatsapp
} from 'react-icons/fa';

const Footer = () => {
  const dispatch = useDispatch();
  const { storeSettings } = useSelector((state) => state.settings);

  useEffect(() => {
    const handleUpdate = () => {
      dispatch(fetchStoreSettings());
    };

    window.addEventListener('kvlr:content-updated', handleUpdate);
    window.addEventListener('store_settings_updated', handleUpdate);
    return () => {
      window.removeEventListener('kvlr:content-updated', handleUpdate);
      window.removeEventListener('store_settings_updated', handleUpdate);
    };
  }, [dispatch]);

  const socialLinks = [
    { name: 'Instagram', url: storeSettings?.instagramUrl, icon: FaInstagram },
    { name: 'Facebook', url: storeSettings?.facebookUrl, icon: FaFacebookF },
    { name: 'Twitter', url: storeSettings?.twitterUrl, icon: FaTwitter },
    { name: 'YouTube', url: storeSettings?.youtubeUrl, icon: FaYoutube },
    { name: 'LinkedIn', url: storeSettings?.linkedinUrl, icon: FaLinkedinIn },
    { name: 'Pinterest', url: storeSettings?.pinterestUrl, icon: FaPinterestP },
    { name: 'Telegram', url: storeSettings?.telegramUrl, icon: FaTelegramPlane },
    { 
      name: 'WhatsApp', 
      url: storeSettings?.whatsappNumber ? `https://wa.me/${storeSettings.whatsappNumber.replace(/\D/g, '')}` : null, 
      icon: FaWhatsapp 
    },
  ].filter(s => Boolean(s.url));

  const storeName = storeSettings?.storeName || storeSettings?.logoText || 'StyleVerse';
  const footerDesc = storeSettings?.footerDescription || storeSettings?.footerAboutText || 'Experience luxury fashion and handcrafted royal jewellery redefined for the modern connoisseur.';
  const copyright = storeSettings?.copyrightText || `© ${new Date().getFullYear()} ${storeName}. All rights reserved.`;

  return (
    <footer className="bg-charcoal-950 text-gray-300 pt-16 pb-8 border-t-4 border-gold-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* Brand & About */}
          <div>
            <Link to="/" className="font-playfair text-3xl font-bold text-gold-500 mb-4 block flex items-center gap-3">
              {storeSettings?.logoUrl && (
                <img src={storeSettings.logoUrl} alt={storeName} className="h-9 w-auto object-contain rounded" />
              )}
              <span>{storeName}</span>
            </Link>
            <p className="text-sm leading-relaxed text-gray-400 mb-6">
              {footerDesc}
            </p>
            {socialLinks.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {socialLinks.map((social) => (
                  <a 
                    key={social.name} 
                    href={social.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="h-8 w-8 rounded-full bg-charcoal-900 border border-charcoal-700 flex items-center justify-center text-gray-400 hover:text-gold-500 hover:border-gold-500 transition-all"
                    title={social.name}
                  >
                    <span className="sr-only">{social.name}</span>
                    <social.icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            )}
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
              {storeSettings?.contactPhone && (
                <li className="text-xs text-gray-400 pt-2">
                  📞 <span className="text-gray-300 font-semibold">{storeSettings.contactPhone}</span>
                </li>
              )}
              {storeSettings?.contactEmail && (
                <li className="text-xs text-gray-400">
                  ✉️ <span className="text-gray-300 font-semibold">{storeSettings.contactEmail}</span>
                </li>
              )}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">Stay Updated</h3>
            <p className="text-sm text-gray-400 mb-4">Subscribe to receive updates, access to exclusive deals, and more.</p>
            <NewsletterSubscribe variant="footer" />
          </div>

        </div>

        <div className="border-t border-charcoal-800 pt-8 flex flex-col sm:flex-row justify-between items-center text-xs gap-4 sm:gap-0 text-center sm:text-left">
          <p className="text-gray-500">
            {copyright}
          </p>
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-6 text-gray-500">
            <Link to="/admin/login" className="hover:text-gold-400 font-semibold transition-colors flex items-center gap-1 opacity-75 hover:opacity-100">
              🔒 Admin Login
            </Link>
            <span>Secure Payments Verified</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiAward, FiShield, FiHeart, FiCheckCircle } from 'react-icons/fi';
import api from '../../config/api';

const About = () => {
  const [cmsContent, setCmsContent] = useState(null);

  useEffect(() => {
    const fetchAboutPage = async () => {
      try {
        const { data } = await api.get('/cms/pages/about-us');
        if (data?.success && data.data) {
          setCmsContent(data.data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchAboutPage();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Banner */}
      <div className="relative bg-gradient-to-r from-charcoal-900 via-charcoal-800 to-charcoal-900 text-white py-20 px-4 text-center overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10 space-y-4">
          <span className="text-xs font-bold text-gold-400 uppercase tracking-widest">HERITAGE & LUXURY</span>
          <h1 className="text-3xl sm:text-5xl font-serif font-bold">{cmsContent?.title || 'Crafting Indian Elegance & Heritage'}</h1>
          <p className="text-sm sm:text-base text-gray-300 max-w-2xl mx-auto leading-relaxed">
            StyleVerse is an enterprise luxury fashion & jewellery house dedicated to celebrating handwoven silk sarees, pure kundan jewellery, and timeless artisan craftsmanship across India.
          </p>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="max-w-7xl mx-auto px-4 py-16 space-y-16">
        {cmsContent?.content ? (
          <div className="prose max-w-none text-gray-700 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: cmsContent.content }} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-serif font-bold text-charcoal-900">Our Story & Mission</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                Founded in 2024, StyleVerse began with a simple mission: to bridge the gap between master Indian weavers and global fashion connoisseurs. We work directly with over 500+ traditional weaver clusters in Banaras, Kanchipuram, Jaipur, and South India.
              </p>
              <div className="space-y-3">
                {[
                  '100% Certified Pure Silk & Hallmarked Kundan Jewellery',
                  'Direct Artisan Partnerships with Fair-Trade Pricing',
                  'Seamless Worldwide Express Shipping',
                  'Dedicated 24/7 Customer Support',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm font-semibold text-charcoal-900">
                    <FiCheckCircle className="text-gold-500 w-5 h-5 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl overflow-hidden shadow-xl border border-gray-100 aspect-[4/3]">
              <img src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800" alt="StyleVerse Heritage" className="w-full h-full object-cover" />
            </div>
          </div>
        )}

        {/* Brand Values Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 border-t border-gray-100">
          {[
            { icon: FiAward, title: 'Uncompromising Quality', desc: 'Every saree, kurti, and jewellery piece undergoes 5-stage quality audits before dispatch.' },
            { icon: FiHeart, title: 'Artisan First', desc: 'We empower local artisan families with sustainable wages and cultural preservation.' },
            { icon: FiShield, title: 'Authenticity Guaranteed', desc: '100% genuine fabrics with silk mark certification and gold-plated purity tags.' },
          ].map((val, i) => {
            const Icon = val.icon;
            return (
              <div key={i} className="p-6 bg-gray-50 rounded-3xl border border-gray-100 space-y-3 text-center">
                <div className="w-12 h-12 rounded-2xl bg-gold-100 text-gold-700 flex items-center justify-center mx-auto">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-serif font-bold text-lg text-charcoal-900">{val.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{val.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default About;

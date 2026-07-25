import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiArrowRight
} from 'react-icons/fi';

/* ─── Per-Category Data ──────────────────────────────────────── */
const MEGA_DATA = {
  women: {
    label: 'Women\'s Collection',
    accent: '#E8AEB7',
    sections: [
      {
        heading: 'Sarees',
        links: [
          { label: 'Silk Sarees', path: '/categories/silk-sarees' },
          { label: 'Cotton Sarees', path: '/categories/cotton-sarees' },
          { label: 'Designer Sarees', path: '/categories/designer-sarees' },
          { label: 'Wedding Sarees', path: '/categories/wedding-sarees' },
          { label: 'Party Wear', path: '/categories/party-wear-sarees' },
        ],
      },
      {
        heading: 'Ethnic Wear',
        links: [
          { label: 'Lehengas', path: '/categories/lehengas' },
          { label: 'Kurtis', path: '/categories/kurtis' },
          { label: 'Salwar Suits', path: '/categories/salwar-suits' },
          { label: 'Dupattas', path: '/categories/dupattas' },
          { label: 'Blouses', path: '/categories/blouses' },
        ],
      },
      {
        heading: 'Accessories',
        links: [
          { label: 'Handbags', path: '/categories/handbags' },
          { label: 'Footwear', path: '/categories/footwear' },
          { label: 'Scarves', path: '/categories/scarves' },
          { label: 'Belts', path: '/categories/belts' },
        ],
      },
    ],
    featured: {
      image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&q=80',
      title: 'Wedding Collection',
      subtitle: 'Bridal Sarees from ₹2,499',
      badge: '🌸 New Arrivals',
      path: '/categories/wedding-sarees',
    },
  },
  men: {
    label: 'Men\'s Collection',
    accent: '#93B4D4',
    sections: [
      {
        heading: 'Shirts',
        links: [
          { label: 'Formal Shirts', path: '/categories/formal-shirts' },
          { label: 'Casual Shirts', path: '/categories/casual-shirts' },
          { label: 'Premium Shirts', path: '/categories/premium-shirts' },
          { label: 'Polo T-Shirts', path: '/categories/polo-tshirts' },
          { label: 'Round Neck T-Shirts', path: '/categories/tshirts' },
        ],
      },
      {
        heading: 'Bottoms',
        links: [
          { label: 'Jeans', path: '/categories/jeans' },
          { label: 'Formal Pants', path: '/categories/formal-pants' },
          { label: 'Shorts', path: '/categories/shorts' },
          { label: 'Chinos', path: '/categories/chinos' },
        ],
      },
      {
        heading: 'Traditional',
        links: [
          { label: 'Sherwani', path: '/categories/sherwani' },
          { label: 'Kurta Pyjama', path: '/categories/kurta' },
          { label: 'Dhoti', path: '/categories/dhoti' },
        ],
      },
    ],
    featured: {
      image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400&q=80',
      title: 'Premium Shirts',
      subtitle: 'Starting from ₹799',
      badge: '🔥 Best Sellers',
      path: '/categories/shirts',
    },
  },
  jewellery: {
    label: 'Fine Jewellery',
    accent: '#D4AF37',
    sections: [
      {
        heading: 'Gold Jewellery',
        links: [
          { label: 'Gold Chains', path: '/categories/gold-chains' },
          { label: 'Gold Rings', path: '/categories/gold-rings' },
          { label: 'Gold Earrings', path: '/categories/gold-earrings' },
          { label: '1 Gram Gold', path: '/categories/1-gram-gold' },
          { label: 'Temple Jewellery', path: '/categories/temple-jewellery' },
        ],
      },
      {
        heading: 'Bridal',
        links: [
          { label: 'Bridal Sets', path: '/categories/bridal-sets' },
          { label: 'Wedding Necklaces', path: '/categories/wedding-necklaces' },
          { label: 'Bangles & Kadas', path: '/categories/bangles' },
          { label: 'Anklets', path: '/categories/anklets' },
          { label: 'Maang Tikka', path: '/categories/maang-tikka' },
        ],
      },
      {
        heading: 'Silver',
        links: [
          { label: 'Silver Rings', path: '/categories/silver-rings' },
          { label: 'Silver Earrings', path: '/categories/silver-earrings' },
          { label: 'Silver Bracelets', path: '/categories/silver-bracelets' },
        ],
      },
    ],
    featured: {
      image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&q=80',
      title: 'Bridal Jewellery',
      subtitle: 'Exclusive Wedding Collection',
      badge: '💍 Premium',
      path: '/categories/jewellery',
    },
  },
  kids: {
    label: 'Kids\' Collection',
    accent: '#A8D8A8',
    sections: [
      {
        heading: 'Baby Wear',
        links: [
          { label: 'Baby Onesies', path: '/categories/baby-onesies' },
          { label: 'Baby Frocks', path: '/categories/baby-frocks' },
          { label: 'Baby Sets', path: '/categories/baby-sets' },
          { label: 'Infant Wear', path: '/categories/infant-wear' },
        ],
      },
      {
        heading: 'Boys',
        links: [
          { label: 'Shirts & T-Shirts', path: '/categories/boys-shirts' },
          { label: 'Jeans & Pants', path: '/categories/boys-bottoms' },
          { label: 'School Wear', path: '/categories/school-wear' },
          { label: 'Party Wear', path: '/categories/boys-party-wear' },
        ],
      },
      {
        heading: 'Girls',
        links: [
          { label: 'Frocks & Dresses', path: '/categories/girls-frocks' },
          { label: 'Lehenga Sets', path: '/categories/girls-lehenga' },
          { label: 'Party Wear', path: '/categories/girls-party-wear' },
          { label: 'School Wear', path: '/categories/girls-school' },
        ],
      },
    ],
    featured: {
      image: 'https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?w=400&q=80',
      title: 'Festival Collection',
      subtitle: 'Kids\' Ethnic Wear',
      badge: '⭐ New Season',
      path: '/categories/kids',
    },
  },
};

/* ─── Mega Menu Component ────────────────────────────────────── */
const MegaMenu = ({ category, onMouseEnter, onMouseLeave }) => {
  const data = MEGA_DATA[category];
  if (!data) return null;

  const containerVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1], staggerChildren: 0.05 },
    },
    exit: { opacity: 0, y: -10, transition: { duration: 0.15 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="fixed left-0 right-0 z-50 bg-[#0F0F0F]/98 backdrop-blur-2xl border-b border-white/10 shadow-[0_16px_64px_rgba(0,0,0,0.6)]"
      style={{ top: '80px' }}
    >
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Category Sections */}
          <div className="flex-1 grid grid-cols-3 gap-8">
            {data.sections.map((section, si) => (
              <motion.div key={section.heading} variants={itemVariants}>
                <h4 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: data.accent }}>
                  {section.heading}
                </h4>
                <ul className="space-y-2.5">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.path}
                        className="group flex items-center gap-2 text-sm text-white/55 hover:text-white transition-colors duration-200"
                      >
                        <span className="w-0 group-hover:w-3 overflow-hidden transition-all duration-200 inline-block">
                          <FiArrowRight size={10} className="text-yellow-400 flex-shrink-0" />
                        </span>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          {/* Divider */}
          <div className="w-px bg-white/5" />

          {/* Featured Panel */}
          <motion.div variants={itemVariants} className="w-64 flex-shrink-0">
            <div className="relative rounded-2xl overflow-hidden group cursor-pointer">
              <Link to={data.featured.path}>
                <img
                  src={data.featured.image}
                  alt={data.featured.title}
                  className="w-full h-52 object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute inset-0 p-4 flex flex-col justify-end">
                  <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-1 rounded-full bg-white/10 backdrop-blur-sm text-white/80 w-fit mb-2">
                    {data.featured.badge}
                  </span>
                  <h3 className="text-white font-bold text-base leading-tight">{data.featured.title}</h3>
                  <p className="text-white/60 text-xs mt-1">{data.featured.subtitle}</p>
                </div>
              </Link>
            </div>

            {/* Quick CTA */}
            <Link
              to={`/categories/${category}`}
              className="mt-4 flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-white/10 text-white/60 text-sm font-medium hover:border-yellow-400/50 hover:text-yellow-400 transition-all duration-300"
            >
              View All {data.label} <FiArrowRight size={14} />
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default MegaMenu;

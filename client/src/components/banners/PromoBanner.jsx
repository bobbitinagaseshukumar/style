import React from 'react';
import { Link } from 'react-router-dom';

const PromoBanner = ({ image, title, subtitle, link, isLarge = false }) => {
  return (
    <div className={`relative group overflow-hidden rounded-lg bg-gray-100 ${isLarge ? 'md:col-span-2 row-span-2' : ''}`}>
      <img 
        src={image} 
        alt={title} 
        className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105 min-h-[300px]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900/80 to-transparent flex flex-col justify-end p-8">
        <h4 className="text-gold-400 text-sm font-medium tracking-wider mb-2 uppercase">{subtitle}</h4>
        <h3 className="text-white text-2xl font-playfair font-bold mb-4">{title}</h3>
        {link && (
          <div>
            <Link to={link} className="inline-block text-white border-b-2 border-gold-500 pb-1 font-medium hover:text-gold-400 transition-colors">
              Discover
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromoBanner;

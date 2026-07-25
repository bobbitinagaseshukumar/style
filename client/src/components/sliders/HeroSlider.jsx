import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const HeroSlider = ({ banners }) => {
  if (!banners || banners.length === 0) return null;

  return (
    <div className="relative w-full h-[70vh] md:h-[85vh] bg-charcoal-900 overflow-hidden">
      <Swiper
        modules={[Autoplay, Pagination, EffectFade]}
        effect="fade"
        speed={1000}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        pagination={{ clickable: true, dynamicBullets: true }}
        loop={true}
        className="w-full h-full"
      >
        {banners.map((banner) => (
          <SwiperSlide key={banner._id}>
            <div className="relative w-full h-full">
              <div className="absolute inset-0 bg-black/40 z-10" />
              <img 
                src={banner.image?.url} 
                alt={banner.title} 
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
              <div className="relative z-20 w-full h-full flex items-center">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center md:text-left">
                  <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-2xl"
                  >
                    {banner.subtitle && (
                      <span className="text-gold-400 font-medium tracking-widest uppercase text-sm mb-4 block">
                        {banner.subtitle}
                      </span>
                    )}
                    <h2 className="text-4xl md:text-6xl font-playfair font-bold text-white mb-6 leading-tight">
                      {banner.title}
                    </h2>
                    {banner.link && (
                      <Link 
                        to={banner.link} 
                        className="inline-block bg-white text-charcoal-900 hover:bg-gold-500 hover:text-white px-8 py-3 rounded-md font-medium transition-all duration-300"
                      >
                        Shop Now
                      </Link>
                    )}
                  </motion.div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default HeroSlider;

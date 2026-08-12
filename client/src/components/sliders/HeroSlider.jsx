import React, { useState, useRef, useCallback } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight, FiShoppingBag } from 'react-icons/fi';
import FloatingElement from '../common/3D/FloatingElement';

const HeroSlider = ({ banners }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const handleMouseMove = useCallback((e) => {
    if (!containerRef.current || window.innerWidth < 768) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 15;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -15;
    setMousePos({ x, y });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setMousePos({ x: 0, y: 0 });
  }, []);

  if (!banners || banners.length === 0) return null;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full h-[75vh] sm:h-[85vh] lg:h-[90vh] bg-[#0A0A0A] overflow-hidden perspective-1000 select-none"
    >
      {/* ── Soft Moving Radial Ambient Light Stage ─────────────── */}
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        <div
          className="absolute w-[600px] h-[600px] rounded-full bg-radial from-amber-500/15 via-yellow-500/5 to-transparent blur-3xl transition-transform duration-700 ease-out"
          style={{
            top: '20%',
            left: '30%',
            transform: `translate3d(${mousePos.x * 1.5}px, ${mousePos.y * 1.5}px, 0)`,
          }}
        />
      </div>

      <Swiper
        modules={[Autoplay, Pagination, EffectFade]}
        effect="fade"
        speed={1000}
        autoplay={{ delay: 5500, disableOnInteraction: false }}
        pagination={{ clickable: true, dynamicBullets: true }}
        loop={true}
        className="w-full h-full"
      >
        {banners.map((banner) => (
          <SwiperSlide key={banner._id || banner.id || banner.title}>
            <div className="relative w-full h-full flex items-center">
              {/* 3D Background Image Layer with Parallax */}
              <div
                className="absolute inset-0 z-0 transition-transform duration-500 ease-out scale-105"
                style={{
                  transform: `translate3d(${mousePos.x * -0.5}px, ${mousePos.y * -0.5}px, 0) scale(1.05)`,
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-transparent z-10" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-black/40 z-10" />
                <img
                  src={banner.image?.url || banner.image}
                  alt={banner.title}
                  className="w-full h-full object-cover object-center"
                />
              </div>

              {/* 3D Hero Foreground Content Layer */}
              <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div
                  className="max-w-2xl text-center md:text-left transition-transform duration-300 ease-out"
                  style={{
                    transform: `translate3d(${mousePos.x * 0.8}px, ${mousePos.y * 0.8}px, 20px)`,
                  }}
                >
                  {/* Floating Subtitle Badge */}
                  <FloatingElement offsetY={5} duration={4}>
                    {banner.subtitle && (
                      <span className="inline-block px-4 py-1.5 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 font-semibold tracking-widest uppercase text-xs sm:text-sm mb-4 shadow-lg backdrop-blur-md">
                        ✨ {banner.subtitle}
                      </span>
                    )}
                  </FloatingElement>

                  {/* 3D Hero Title */}
                  <motion.h2
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                    className="text-4xl sm:text-6xl lg:text-7xl font-serif font-extrabold text-white mb-6 leading-[1.1] tracking-tight drop-shadow-2xl"
                  >
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-100 to-amber-200">
                      {banner.title}
                    </span>
                  </motion.h2>

                  {/* 3D Elevated CTA Buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="flex flex-wrap items-center justify-center md:justify-start gap-4"
                  >
                    {banner.link && (
                      <Link
                        to={banner.link}
                        className="btn-3d shine-sweep relative inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-gray-950 font-black text-sm uppercase tracking-wider px-8 py-4 rounded-xl shadow-xl shadow-yellow-500/20 hover:shadow-2xl hover:shadow-yellow-500/35 transition-all"
                      >
                        <FiShoppingBag className="w-4 h-4" />
                        <span>Shop Now</span>
                        <FiArrowRight className="w-4 h-4 ml-1" />
                      </Link>
                    )}

                    <Link
                      to="/categories"
                      className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-sm uppercase tracking-wider px-7 py-4 rounded-xl border border-white/20 hover:border-white/40 transition-all backdrop-blur-md shadow-lg hover:-translate-y-0.5"
                    >
                      <span>Explore Collection</span>
                    </Link>
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

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

import { FiArrowRight, FiTruck, FiShield, FiRefreshCw, FiHeadphones, FiZap } from 'react-icons/fi';
import api from '../../config/api';
import { formatCurrency } from '../../utils/formatCurrency';
import ProductCard from '../../components/common/ProductCard';

import AnnouncementBar from '../../components/home/AnnouncementBar';
import FlashSaleSection from '../../components/home/FlashSaleSection';
import CollectionShowcase from '../../components/home/CollectionShowcase';
import BrandShowcase from '../../components/home/BrandShowcase';
import TestimonialsSection from '../../components/home/TestimonialsSection';
import InstagramGallery from '../../components/home/InstagramGallery';
import FAQPreview from '../../components/home/FAQPreview';

const fadeInUp = { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } };
const stagger = { initial: {}, whileInView: { transition: { staggerChildren: 0.08 } }, viewport: { once: true } };

// Luxury Fallbacks
const DEFAULT_HERO_SLIDERS = [
  {
    id: 'hero-1',
    title: 'Royal Kanjeevaram & Silk Sarees',
    subtitle: 'Handcrafted timeless weaves for grand celebrations.',
    imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1600&auto=format&fit=crop',
    linkUrl: '/categories/womens-sarees',
    isActive: true,
    type: 'HERO_SLIDER'
  },
  {
    id: 'hero-2',
    title: 'Imperial Temple & Kundan Jewellery',
    subtitle: 'Certified 22K gold-plated bridal & festive collections.',
    imageUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=1600&auto=format&fit=crop',
    linkUrl: '/categories/jewellery',
    isActive: true,
    type: 'HERO_SLIDER'
  },
  {
    id: 'hero-3',
    title: 'Festive Men’s Heritage Kurtas & Shirts',
    subtitle: 'Royal elegance redefined for modern gentlemen.',
    imageUrl: 'https://images.unsplash.com/photo-1597983073493-88cd35cf03b0?q=80&w=1600&auto=format&fit=crop',
    linkUrl: '/categories/mens-wear',
    isActive: true,
    type: 'HERO_SLIDER'
  }
];

const DEFAULT_CATEGORIES = [
  { id: 'cat-1', name: 'Silk Sarees', slug: 'womens-sarees', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600' },
  { id: 'cat-2', name: 'Royal Jewellery', slug: 'jewellery', image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600' },
  { id: 'cat-3', name: 'Men’s Wear', slug: 'mens-wear', image: 'https://images.unsplash.com/photo-1597983073493-88cd35cf03b0?w=600' },
  { id: 'cat-4', name: 'Kids & Baby Collection', slug: 'kids-wear', image: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=600' },
];

// Premium ProductCard imported from components/common/ProductCard

const Home = () => {
  const [banners, setBanners] = useState(DEFAULT_HERO_SLIDERS);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [products, setProducts] = useState({
    featured: [],
    trending: [],
    newArrivals: [],
    todaysDeals: []
  });
  const [trendingData, setTrendingData] = useState(null);
  const [enableTrending, setEnableTrending] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [bannersRes, categoriesRes, featuredRes, trendingRes, newRes, dealsRes, allProdsRes, trendSelRes, settingsRes] = await Promise.allSettled([
          api.get('/cms/banners?activeOnly=true'),
          api.get('/categories?limit=8'),
          api.get('/products?showOnHomepage=true&featured=true&limit=8'),
          api.get('/products?showOnHomepage=true&trending=true&limit=8'),
          api.get('/products?showOnHomepage=true&newArrival=true&limit=8'),
          api.get('/products?showOnHomepage=true&bestSeller=true&limit=8'),
          api.get('/products?limit=8'),
          api.get('/cms/trending-selection/public'),
          api.get('/cms/settings'),
        ]);

        if (settingsRes.status === 'fulfilled') {
          const cfg = settingsRes.value.data?.data || {};
          if (cfg.enableTrendingProducts === false) setEnableTrending(false);
        }

        if (trendSelRes.status === 'fulfilled' && trendSelRes.value.data?.data) {
          setTrendingData(trendSelRes.value.data.data);
        }

        if (bannersRes.status === 'fulfilled' && bannersRes.value.data?.data?.length > 0) {
          setBanners(bannersRes.value.data.data);
        }
        if (categoriesRes.status === 'fulfilled' && categoriesRes.value.data?.data?.length > 0) {
          setCategories(categoriesRes.value.data.data);
        }

        const fallbackAll = allProdsRes.status === 'fulfilled' ? (allProdsRes.value.data?.data?.products || []) : [];

        const getList = (res) => {
          if (res.status === 'fulfilled' && res.value.data?.data?.products?.length > 0) {
            return res.value.data.data.products;
          }
          return fallbackAll;
        };

        setProducts({
          featured: getList(featuredRes),
          trending: getList(trendingRes),
          newArrivals: getList(newRes),
          todaysDeals: getList(dealsRes),
        });
      } catch (err) {
        console.error('Home page data fetch error:', err);
      }
    };
    fetchHomeData();
  }, []);

  const heroSliders = banners.filter(b => (b.type === 'HERO_SLIDER' || !b.type) && (b.isActive !== false));

  return (
    <div className="min-h-screen bg-white">
      {/* 1. ANNOUNCEMENT BAR */}
      <AnnouncementBar />

      {/* 4. HERO BANNER SLIDER */}
      {heroSliders.length > 0 && (
        <section className="relative">
          <Swiper modules={[Autoplay, Pagination, EffectFade]} effect="fade" autoplay={{ delay: 5000, disableOnInteraction: false }}
            pagination={{ clickable: true }} loop className="w-full h-[350px] sm:h-[450px] lg:h-[550px]">
            {heroSliders.map((banner) => (
              <SwiperSlide key={banner.id}>
                <div className="relative w-full h-full">
                  <img src={banner.imageUrl} alt={banner.title || ''} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
                  <div className="absolute inset-0 flex items-center">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full">
                      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        {banner.title && <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white mb-3 max-w-lg">{banner.title}</h2>}
                        {banner.subtitle && <p className="text-lg text-white/80 mb-6 max-w-md">{banner.subtitle}</p>}
                        {banner.linkUrl && (
                          <Link to={banner.linkUrl} className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-600 text-white px-6 py-3 rounded-full font-semibold transition-colors shadow-lg">
                            Shop Collection <FiArrowRight />
                          </Link>
                        )}
                      </motion.div>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </section>
      )}

      {/* 20. STORE FEATURES / BADGES */}
      <section className="border-b border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: FiTruck, label: 'Free Shipping', desc: 'On orders above ₹999' },
              { icon: FiShield, label: '100% Authentic', desc: 'Certified purity & quality' },
              { icon: FiRefreshCw, label: '7-Day Easy Returns', desc: 'Hassle-free refunds' },
              { icon: FiHeadphones, label: '24/7 Support', desc: 'Dedicated helpline' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-gold-50 flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-gold-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-charcoal-900">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. FEATURED CATEGORIES GRID */}
      {categories.length > 0 && (
        <section className="py-12 lg:py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div {...fadeInUp} className="text-center mb-10">
              <h2 className="text-2xl lg:text-3xl font-serif font-bold text-charcoal-900 mb-2">Shop by Category</h2>
              <p className="text-gray-500">Explore our handcrafted luxury collections</p>
            </motion.div>
            <motion.div {...stagger} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
              {categories.map((cat) => (
                <motion.div key={cat.id} variants={fadeInUp}>
                  <Link to={`/categories/${cat.slug}`}
                    className="group relative block aspect-[4/5] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
                    <img src={cat.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(cat.name)}&size=400&background=D4AF37&color=fff`}
                      alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-lg font-serif font-bold text-white mb-1">{cat.name}</h3>
                      <span className="inline-flex items-center gap-1 text-gold-400 text-xs font-semibold group-hover:gap-2 transition-all">
                        Explore <FiArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* 6. FLASH SALE */}
      <FlashSaleSection />

      {/* 7. FEATURED PRODUCTS */}
      {products.featured.length > 0 && (
        <section className="py-12 lg:py-16">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div {...fadeInUp} className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl lg:text-3xl font-serif font-bold text-charcoal-900">Featured Products</h2>
                <p className="text-gray-500 mt-1">Handpicked for timeless elegance</p>
              </div>
              <Link to="/categories" className="hidden sm:inline-flex items-center gap-1 text-gold-600 hover:text-gold-700 font-medium text-sm">
                View All <FiArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
            <motion.div {...stagger} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-7">
              {products.featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* 10. JEWELLERY COLLECTION SHOWCASE */}
      <CollectionShowcase
        title="Royal Jewellery Collection 💎"
        subtitle="Exquisite Kundan, Gold-Plated & Temple Jewellery"
        categorySlug="jewellery"
        bgLight={true}
      />

      {/* 11. SAREE COLLECTION SHOWCASE */}
      <CollectionShowcase
        title="Banarasi & Silk Sarees 🥻"
        subtitle="Handwoven pure silk sarees with gold zari"
        categorySlug="womens-sarees"
        bgLight={false}
      />

      {/* 15. TODAY'S DEAL */}
      {products.todaysDeals.length > 0 && (
        <section className="py-12 bg-amber-50/50 border-y border-amber-100">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-2 mb-6">
              <FiZap className="w-6 h-6 text-amber-600 fill-amber-600" />
              <h2 className="text-2xl font-serif font-bold text-charcoal-900">Today&apos;s Special Deals</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-7">
              {products.todaysDeals.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 12. MEN'S COLLECTION */}
      <CollectionShowcase
        title="Men's Royal Heritage"
        subtitle="Smart casuals, festive shirts & kurtas"
        categorySlug="mens-wear"
        bgLight={true}
      />

      {/* 13. KIDS COLLECTION */}
      <CollectionShowcase
        title="Kids Wear & Festive Suits"
        subtitle="Charming ethnic and casual wear for kids"
        categorySlug="kids-wear"
        bgLight={false}
      />

      {/* 8. TRENDING PRODUCTS (ADMIN MANUAL SELECTION ONLY) */}
      {enableTrending && trendingData && trendingData.products?.length > 0 && (
        <section className="py-12 lg:py-16 bg-gray-50 border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div {...fadeInUp} className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl lg:text-3xl font-serif font-bold text-charcoal-900">{trendingData.title || 'Trending Products'} 🔥</h2>
                <p className="text-gray-500 mt-1">Handpicked trending styles curated by our fashion editors</p>
              </div>
            </motion.div>
            <motion.div {...stagger} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-7">
              {trendingData.products.slice(0, trendingData.limit || 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* 9. NEW ARRIVALS */}
      {products.newArrivals.length > 0 && (
        <section className="py-12 lg:py-16">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div {...fadeInUp} className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl lg:text-3xl font-serif font-bold text-charcoal-900">New Arrivals ✨</h2>
                <p className="text-gray-500 mt-1">Just arrived in our catalogue</p>
              </div>
            </motion.div>
            <motion.div {...stagger} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-7">
              {products.newArrivals.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* 16. BRAND SHOWCASE */}
      <BrandShowcase />

      {/* 17. CUSTOMER TESTIMONIALS */}
      <TestimonialsSection />

      {/* 18. INSTAGRAM GALLERY */}
      <InstagramGallery />

      {/* 21. FAQ PREVIEW */}
      <FAQPreview />

      {/* 19. NEWSLETTER SECTION */}
      <section className="py-12 lg:py-16 bg-charcoal-900">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <motion.div {...fadeInUp}>
            <h2 className="text-2xl lg:text-3xl font-serif font-bold text-white mb-3">Stay in Style</h2>
            <p className="text-gray-400 mb-6">Subscribe for exclusive festive offers, new arrival alerts, and style updates.</p>
            <div className="flex gap-2 max-w-md mx-auto">
              <input type="email" placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-full bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-gold-500 transition-colors" />
              <button className="px-6 py-3 rounded-full bg-gold-500 hover:bg-gold-600 text-white font-semibold transition-colors shrink-0">
                Subscribe
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;

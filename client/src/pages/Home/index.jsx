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
import { formatImageUrl } from '../../utils/formatImageUrl';
import ProductCard from '../../components/common/ProductCard';
import PersonalizedSections from '../../components/common/PersonalizedSections';
import RecentlyViewedSection from '../../components/home/RecentlyViewedSection';
import FlashSaleSection from '../../components/home/FlashSaleSection';
import CollectionShowcase from '../../components/home/CollectionShowcase';
import BrandShowcase from '../../components/home/BrandShowcase';
import TestimonialsSection from '../../components/home/TestimonialsSection';
import InstagramGallery from '../../components/home/InstagramGallery';
import FAQPreview from '../../components/home/FAQPreview';
import NewsletterSubscribe from '../../components/common/NewsletterSubscribe';

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
  { id: 'cat-1', name: "Women's Sarees", slug: 'womens-sarees', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80' },
  { id: 'cat-2', name: 'Jewellery', slug: 'jewellery', image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&auto=format&fit=crop&q=80' },
  { id: 'cat-3', name: "Men's Wear", slug: 'mens-wear', image: 'https://images.unsplash.com/photo-1597983073493-88cd35cf03b0?w=800&auto=format&fit=crop&q=80' },
  { id: 'cat-4', name: 'Kids Wear', slug: 'kids-wear', image: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=800&auto=format&fit=crop&q=80' },
];

// Smart Category Thumbnail Resolver: uses admin-uploaded photo or high-clarity category image
const getCategoryThumbnail = (cat) => {
  if (!cat) return 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80';
  
  const rawImage = cat.image || cat.imageUrl || cat.coverImage || cat.banner || cat.thumbnail;
  if (rawImage && typeof rawImage === 'string' && rawImage.trim().length > 5) {
    return formatImageUrl(rawImage.trim());
  }

  const slug = String(cat.slug || '').toLowerCase();
  const name = String(cat.name || '').toLowerCase();

  if (slug.includes('jewel') || name.includes('jewel') || slug.includes('kundan') || name.includes('kundan')) {
    return 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&auto=format&fit=crop&q=80';
  }
  if (slug.includes('saree') || name.includes('saree') || slug.includes('women') || name.includes('women') || slug.includes('lehenga') || name.includes('lehenga')) {
    return 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80';
  }
  if (slug.includes('men') || name.includes('men') || slug.includes('kurta') || name.includes('kurta') || slug.includes('shirt') || name.includes('shirt')) {
    return 'https://images.unsplash.com/photo-1597983073493-88cd35cf03b0?w=800&auto=format&fit=crop&q=80';
  }
  if (slug.includes('kid') || name.includes('kid') || slug.includes('child') || name.includes('child') || slug.includes('baby') || name.includes('baby')) {
    return 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=800&auto=format&fit=crop&q=80';
  }
  return 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80';
};

// Persistent Cache Key for instant 0ms loads across browser sessions
const PERSISTENT_CACHE_KEY = '__KVLR_HOME_PERSISTENT_CACHE_V3__';

// Helper: Load initial cache from localStorage (or fallback sessionStorage) for 0ms instantaneous loading
const getCachedHomeData = () => {
  try {
    const rawLocal = localStorage.getItem(PERSISTENT_CACHE_KEY);
    if (rawLocal) return JSON.parse(rawLocal);
  } catch (e) {}
  try {
    const rawSession = sessionStorage.getItem('__KVLR_HOME_CACHE__');
    if (rawSession) return JSON.parse(rawSession);
  } catch (e) {}
  return null;
};

const initialCache = getCachedHomeData();

// Skeleton card for instant layout stability on clean browser cache
const SkeletonCard = () => (
  <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm animate-pulse flex flex-col">
    <div className="w-full aspect-[3/4] bg-gray-200 rounded-xl mb-3" />
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
    <div className="h-3 bg-gray-100 rounded w-1/2 mb-3" />
    <div className="h-5 bg-gray-200 rounded w-1/3 mt-auto" />
  </div>
);

const Home = () => {
  const [banners, setBanners] = useState(initialCache?.banners?.length > 0 ? initialCache.banners : DEFAULT_HERO_SLIDERS);
  const [categories, setCategories] = useState(initialCache?.categories?.length > 0 ? initialCache.categories : DEFAULT_CATEGORIES);
  const [products, setProducts] = useState(initialCache?.products || {
    featured: [],
    trending: [],
    newArrivals: [],
    todaysDeals: [],
    allPublished: []
  });
  const [trendingData, setTrendingData] = useState(initialCache?.trendingData || null);
  const [enableTrending, setEnableTrending] = useState(true);
  const [dynamicSections, setDynamicSections] = useState(initialCache?.dynamicSections || []);
  // If cache exists with any products or categories, start with isLoading = false for 0ms instant display!
  const hasCachedContent = Boolean(
    initialCache &&
    (initialCache.products?.allPublished?.length > 0 ||
     initialCache.products?.featured?.length > 0 ||
     initialCache.categories?.length > 0)
  );
  const [isLoading, setIsLoading] = useState(!hasCachedContent);

  useEffect(() => {
    let isMounted = true;

    const fetchHomeData = async () => {
      try {
        // Fast path: Fetch consolidated homepage bundle in 1 single optimized request
        let bundleSuccess = false;
        try {
          const bundleRes = await api.get('/cms/homepage-bundle');
          if (bundleRes.data?.success && bundleRes.data?.data) {
            const bundle = bundleRes.data.data;
            if (!isMounted) return;

            if (bundle.banners?.length > 0) setBanners(bundle.banners);
            if (bundle.categories?.length > 0) setCategories(bundle.categories);
            if (bundle.products) setProducts(bundle.products);
            if (bundle.trendingData !== undefined) setTrendingData(bundle.trendingData);
            if (bundle.dynamicSections) setDynamicSections(bundle.dynamicSections);
            if (bundle.settings?.enableTrendingProducts === false) setEnableTrending(false);

            setIsLoading(false);
            bundleSuccess = true;

            // Persist to localStorage for 0ms loads across tabs, windows, and phone app restarts
            try {
              const cachePayload = JSON.stringify({
                banners: bundle.banners || [],
                categories: bundle.categories || [],
                products: bundle.products || {},
                trendingData: bundle.trendingData || null,
                dynamicSections: bundle.dynamicSections || [],
                savedAt: Date.now()
              });
              localStorage.setItem(PERSISTENT_CACHE_KEY, cachePayload);
              sessionStorage.setItem('__KVLR_HOME_CACHE__', cachePayload);
            } catch (e) {}
          }
        } catch (bundleErr) {
          // If bundle fails, fall back to individual endpoints
          bundleSuccess = false;
        }

        if (bundleSuccess || !isMounted) return;

        // Fallback parallel requests
        const [bannersRes, categoriesRes, allProductsRes, featuredRes, trendingRes, newArrivalsRes, bestSellerRes, trendSelRes, settingsRes, dynSecRes] = await Promise.allSettled([
          api.get('/cms/banners?activeOnly=true'),
          api.get('/categories?showOnHomepage=true&limit=8'),
          api.get('/products?limit=50&sort=newest'),
          api.get('/products?featured=true&limit=12'),
          api.get('/products?trending=true&limit=12'),
          api.get('/products?newArrival=true&limit=12'),
          api.get('/products?bestSeller=true&limit=12'),
          api.get('/cms/trending-selection/public'),
          api.get('/cms/settings'),
          api.get('/cms/homepage/sections/public'),
        ]);

        if (!isMounted) return;

        let nextDynamicSections = [];
        if (dynSecRes.status === 'fulfilled' && dynSecRes.value.data?.data) {
          nextDynamicSections = dynSecRes.value.data.data;
          setDynamicSections(nextDynamicSections);
        }

        if (settingsRes.status === 'fulfilled') {
          const cfg = settingsRes.value.data?.data || {};
          if (cfg.enableTrendingProducts === false) setEnableTrending(false);
        }

        let nextTrendingData = null;
        if (trendSelRes.status === 'fulfilled' && trendSelRes.value.data?.data) {
          nextTrendingData = trendSelRes.value.data.data;
          setTrendingData(nextTrendingData);
        }

        let nextBanners = DEFAULT_HERO_SLIDERS;
        if (bannersRes.status === 'fulfilled' && bannersRes.value.data?.data?.length > 0) {
          nextBanners = bannersRes.value.data.data;
          setBanners(nextBanners);
        }

        let nextCategories = DEFAULT_CATEGORIES;
        if (categoriesRes.status === 'fulfilled' && categoriesRes.value.data?.data?.length > 0) {
          nextCategories = categoriesRes.value.data.data;
          setCategories(nextCategories);
        }

        // Extract products helper
        const extractProducts = (res) => {
          if (res.status !== 'fulfilled') return [];
          const d = res.value?.data;
          if (Array.isArray(d?.data?.products)) return d.data.products;
          if (Array.isArray(d?.data)) return d.data;
          if (Array.isArray(d?.products)) return d.products;
          if (Array.isArray(d)) return d;
          return [];
        };

        const allProductsList = extractProducts(allProductsRes);
        let featuredList = extractProducts(featuredRes);
        let trendingList = extractProducts(trendingRes);
        let newArrivalsList = extractProducts(newArrivalsRes);
        let bestSellerList = extractProducts(bestSellerRes);

        const resolvedProducts = {
          featured: featuredList.length > 0 ? featuredList.slice(0, 12) : allProductsList.slice(0, 12),
          trending: trendingList.length > 0 ? trendingList.slice(0, 12) : allProductsList.slice(0, 12),
          newArrivals: newArrivalsList.length > 0 ? newArrivalsList.slice(0, 12) : allProductsList.slice(0, 12),
          todaysDeals: bestSellerList.length > 0 ? bestSellerList.slice(0, 12) : allProductsList.slice(0, 12),
          allPublished: allProductsList
        };

        setProducts(resolvedProducts);
        setIsLoading(false);

        // Save to cache
        try {
          const cachePayload = JSON.stringify({
            banners: nextBanners,
            categories: nextCategories,
            products: resolvedProducts,
            trendingData: nextTrendingData,
            dynamicSections: nextDynamicSections,
            savedAt: Date.now()
          });
          localStorage.setItem(PERSISTENT_CACHE_KEY, cachePayload);
          sessionStorage.setItem('__KVLR_HOME_CACHE__', cachePayload);
        } catch (e) {}
      } catch (err) {
        console.error('Home page data fetch error:', err);
        setIsLoading(false);
      }
    };

    fetchHomeData();
    const interval = setInterval(fetchHomeData, 8000); // 8s background sync
    const handleFocus = () => fetchHomeData();
    const handleContentUpdate = () => {
      try {
        localStorage.removeItem(PERSISTENT_CACHE_KEY);
        sessionStorage.removeItem('__KVLR_HOME_CACHE__');
      } catch (e) {}
      fetchHomeData();
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('kvlr:content-updated', handleContentUpdate);
    window.addEventListener('storage', handleContentUpdate);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('kvlr:content-updated', handleContentUpdate);
      window.removeEventListener('storage', handleContentUpdate);
    };
  }, []);

  const heroSliders = banners.filter(b => (b.type === 'HERO_SLIDER' || !b.type) && (b.isActive !== false));

  return (
    <div className="min-h-screen bg-white">
      {/* 4. HERO BANNER SLIDER */}
      {heroSliders.length > 0 && (
        <section className="relative">
          <Swiper modules={[Autoplay, Pagination, EffectFade]} effect="fade" autoplay={{ delay: 5000, disableOnInteraction: false }}
            pagination={{ clickable: true }} loop className="w-full h-[240px] sm:h-[400px] lg:h-[550px]">
            {heroSliders.map((banner) => (
              <SwiperSlide key={banner.id}>
                <div className="relative w-full h-full">
                  <img src={banner.imageUrl} alt={banner.title || ''} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
                  <div className="absolute inset-0 flex items-center">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full">
                      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        {banner.title && <h2 className="text-2xl sm:text-3xl lg:text-5xl font-serif font-bold text-white mb-3 max-w-lg">{banner.title}</h2>}
                        {banner.subtitle && <p className="text-sm sm:text-lg text-white/80 mb-6 max-w-md">{banner.subtitle}</p>}
                        {banner.linkUrl && (
                          <Link to={banner.linkUrl} className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-600 text-white px-5 py-2 sm:px-6 sm:py-3 text-sm sm:text-base rounded-full font-semibold transition-colors shadow-lg">
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
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
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
          <div className="max-w-7xl mx-auto px-3 sm:px-4">
            <motion.div {...fadeInUp} className="text-center mb-10">
              <h2 className="text-2xl lg:text-3xl font-serif font-bold text-charcoal-900 mb-2">Shop by Category</h2>
              <p className="text-gray-500">Explore our handcrafted luxury collections</p>
            </motion.div>
            <motion.div {...stagger} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
              {categories
                .filter(cat => (cat.status || 'PUBLISHED') === 'PUBLISHED' && cat.isVisible !== false && cat.showOnHomepage !== false)
                .map((cat) => (
                <motion.div key={cat.id} variants={fadeInUp}>
                  <Link to={`/categories/${cat.slug}`}
                    className="group relative block aspect-[4/5] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 bg-charcoal-900">
                    <img
                      src={getCategoryThumbnail(cat)}
                      alt={cat.name}
                      loading="lazy"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = getCategoryThumbnail({ slug: cat.slug, name: cat.name });
                      }}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
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

      {/* AI PERSONALIZED RECOMMENDATIONS */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        <PersonalizedSections />
      </div>

      {/* 6. FLASH SALE */}
      <FlashSaleSection />

      {/* 7. FEATURED PRODUCTS & PUBLISHED CATALOG */}
      {isLoading ? (
        <section className="py-12 lg:py-16">
          <div className="max-w-7xl mx-auto px-3 sm:px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="h-8 bg-gray-200 rounded-lg w-56 animate-pulse mb-2" />
                <div className="h-4 bg-gray-100 rounded w-40 animate-pulse" />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <SkeletonCard key={n} />
              ))}
            </div>
          </div>
        </section>
      ) : products.featured.length > 0 ? (
        <section className="py-12 lg:py-16">
          <div className="max-w-7xl mx-auto px-3 sm:px-4">
            <motion.div {...fadeInUp} className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl lg:text-3xl font-serif font-bold text-charcoal-900">Featured Collection</h2>
                <p className="text-gray-500 mt-1">Handpicked luxury creations curated for you</p>
              </div>
              <Link to="/categories" className="hidden sm:inline-flex items-center gap-1 text-amber-600 hover:text-amber-700 font-bold text-sm">
                View All <FiArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
            <motion.div {...stagger} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {products.featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </motion.div>
          </div>
        </section>
      ) : null}

      {/* 15. TODAY'S DEAL */}
      {products.todaysDeals.length > 0 && (
        <section className="py-12 bg-amber-50/50 border-y border-amber-100">
          <div className="max-w-7xl mx-auto px-3 sm:px-4">
            <div className="flex items-center gap-2 mb-6">
              <FiZap className="w-6 h-6 text-amber-600 fill-amber-600" />
              <h2 className="text-2xl font-serif font-bold text-charcoal-900">Today&apos;s Special Deals</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {products.todaysDeals.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 8. TRENDING PRODUCTS */}
      {enableTrending && trendingData && trendingData.products?.length > 0 && (
        <section className="py-12 lg:py-16 bg-gray-50 border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-3 sm:px-4">
            <motion.div {...fadeInUp} className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl lg:text-3xl font-serif font-bold text-charcoal-900">{trendingData.title || 'Trending Styles'} 🔥</h2>
                <p className="text-gray-500 mt-1">Handpicked trending styles curated by our fashion editors</p>
              </div>
            </motion.div>
            <motion.div {...stagger} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {trendingData.products.slice(0, trendingData.limit || 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* 9. NEW ARRIVALS & LATEST PUBLISHED CREATIONS */}
      {products.newArrivals.length > 0 && (
        <section className="py-12 lg:py-16">
          <div className="max-w-7xl mx-auto px-3 sm:px-4">
            <motion.div {...fadeInUp} className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl lg:text-3xl font-serif font-bold text-charcoal-900">New Arrivals ✨</h2>
                <p className="text-gray-500 mt-1">Freshly published additions to our catalog</p>
              </div>
              <Link to="/categories" className="hidden sm:inline-flex items-center gap-1 text-amber-600 hover:text-amber-700 font-bold text-sm">
                Explore All <FiArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
            <motion.div {...stagger} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {products.newArrivals.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* 10. PUBLISHED PRODUCTS SHOWCASE — Guarantees all published admin products are displayed */}
      {(() => {
        const allList = products.allPublished || [];
        if (allList.length === 0) return null;

        const displayedIds = new Set([
          ...(products.featured || []).map(p => p.id),
          ...(products.newArrivals || []).map(p => p.id),
          ...(products.todaysDeals || []).map(p => p.id),
        ]);

        const remainingPublished = allList.filter(p => !displayedIds.has(p.id));
        const listToDisplay = remainingPublished.length > 0 ? remainingPublished : allList;

        return (
          <section className="py-12 lg:py-16 bg-white border-t border-gray-100">
            <div className="max-w-7xl mx-auto px-3 sm:px-4">
              <motion.div {...fadeInUp} className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl lg:text-3xl font-serif font-bold text-charcoal-900">Explore Our Catalog 🛍️</h2>
                  <p className="text-gray-500 mt-1">Discover all our published luxury creations</p>
                </div>
                <Link to="/categories" className="hidden sm:inline-flex items-center gap-1 text-amber-600 hover:text-amber-700 font-bold text-sm">
                  View All <FiArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
              <motion.div {...stagger} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                {listToDisplay.slice(0, 16).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </motion.div>
            </div>
          </section>
        );
      })()}

      {/* DYNAMIC DATABASE-DRIVEN HOMEPAGE SECTIONS */}
      {dynamicSections.map((sec) => {
        if (!sec.products || sec.products.length === 0) return null;

        const gridCols = sec.productsPerRow === 2
          ? 'grid-cols-2'
          : sec.productsPerRow === 3
          ? 'grid-cols-2 md:grid-cols-3'
          : sec.productsPerRow === 5
          ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5'
          : sec.productsPerRow === 6
          ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6'
          : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';

        return (
          <section
            key={sec.id}
            style={{ backgroundColor: sec.bgColor || '#FFFFFF', color: sec.textColor || '#111827' }}
            className="py-12 lg:py-16 border-t border-gray-100 transition-colors"
          >
            <div className="max-w-7xl mx-auto px-3 sm:px-4">
              {/* Optional Section Banner */}
              {sec.bannerUrl && (
                <div className="relative rounded-2xl overflow-hidden mb-8 h-48 sm:h-64 shadow-md">
                  <img src={formatImageUrl(sec.bannerUrl)} alt={sec.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-transparent flex items-center p-6 lg:p-10">
                    <div className="max-w-lg text-white">
                      <span className="text-xs font-bold text-gold-400 uppercase tracking-widest">SPECIAL COLLECTION</span>
                      <h2 className="text-2xl sm:text-3xl font-serif font-bold mt-1">{sec.title}</h2>
                      {sec.subtitle && <p className="text-sm text-gray-200 mt-1">{sec.subtitle}</p>}
                      {sec.description && <p className="text-xs text-gray-300 mt-2 line-clamp-2 leading-relaxed">{sec.description}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Section Header */}
              {!sec.bannerUrl && (
                <motion.div {...fadeInUp} className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl lg:text-3xl font-serif font-bold" style={{ color: sec.textColor || '#111827' }}>
                      {sec.title}
                    </h2>
                    {sec.subtitle && <p className="text-gray-500 text-sm mt-1">{sec.subtitle}</p>}
                  </div>
                  {sec.buttonText && (
                    <Link
                      to={sec.buttonLink || '/categories'}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-gold-600 hover:text-gold-700 transition"
                    >
                      {sec.buttonText} <FiArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </motion.div>
              )}

              {/* Products Grid */}
              <motion.div {...stagger} className={`grid ${gridCols} gap-3 sm:gap-4 lg:gap-6`}>
                {sec.products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </motion.div>
            </div>
          </section>
        );
      })}

      {/* 16. BRAND SHOWCASE */}
      <BrandShowcase />

      {/* 17. CUSTOMER TESTIMONIALS */}
      <TestimonialsSection />

      {/* 18. INSTAGRAM GALLERY */}
      <InstagramGallery />

      {/* 21. FAQ PREVIEW */}
      <FAQPreview />

      {/* 22. RECENTLY VIEWED PRODUCTS (PLACED AT THE BOTTOM OF HOMEPAGE) */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        <RecentlyViewedSection />
      </div>

      {/* 19. NEWSLETTER SECTION */}
      <section className="py-14 lg:py-20 bg-[#0c0c10] border-t border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.06)_0%,transparent_70%)] pointer-events-none" />
        <div className="max-w-2xl mx-auto px-4 text-center relative z-10">
          <motion.div {...fadeInUp}>
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-amber-400 font-serif mb-2 inline-block">Exclusive Access</span>
            <h2 className="text-2xl lg:text-4xl font-serif font-bold text-white mb-3 tracking-tight">Stay in Style</h2>
            <p className="text-gray-400 text-xs sm:text-sm mb-7 max-w-md mx-auto leading-relaxed">
              Subscribe to receive instant alerts when new collections drop, private festive sale access, and curated style recommendations.
            </p>
            <NewsletterSubscribe variant="section" />
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;

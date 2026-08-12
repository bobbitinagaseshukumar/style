import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';
import api from '../../config/api';
import ProductCard from '../common/ProductCard';

const fadeInUp = { initial: { opacity: 0, y: 25 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } };

const FALLBACK_COLLECTION_PRODUCTS = {
  jewellery: [
    {
      id: 'col-j1',
      name: '22K Gold Plated Royal Kundan Choker Necklace Set',
      slug: 'royal-kundan-choker-necklace-set',
      price: 11999,
      discountPrice: 8499,
      discountPercent: 29,
      images: [{ url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600' }]
    },
    {
      id: 'col-j2',
      name: 'Antique Temple Work Gold Plated Bangles Set',
      slug: 'antique-temple-gold-plated-bangles',
      price: 3999,
      discountPrice: 2999,
      discountPercent: 25,
      images: [{ url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600' }]
    },
    {
      id: 'col-j3',
      name: 'Royal Heritage Peacock Design Jhumka Earrings',
      slug: 'peacock-jhumka-earrings',
      price: 2499,
      discountPrice: 1899,
      discountPercent: 24,
      images: [{ url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600' }]
    },
    {
      id: 'col-j4',
      name: 'Solitaire Accent Royal Engagement Ring',
      slug: 'royal-engagement-ring',
      price: 5499,
      discountPrice: 3999,
      discountPercent: 27,
      images: [{ url: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=600' }]
    }
  ],
  'womens-sarees': [
    {
      id: 'col-s1',
      name: 'Kanjivaram Pure Silk Saree with Zari Border',
      slug: 'kanjivaram-pure-silk-saree',
      price: 18999,
      discountPrice: 14999,
      discountPercent: 21,
      images: [{ url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600' }]
    },
    {
      id: 'col-s2',
      name: 'Banarasi Brocade Silk Saree in Crimson Red',
      slug: 'banarasi-brocade-silk-saree',
      price: 15999,
      discountPrice: 11999,
      discountPercent: 25,
      images: [{ url: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600' }]
    },
    {
      id: 'col-s3',
      name: 'Designer Chanderi Cotton Silk Printed Saree',
      slug: 'chanderi-cotton-silk-saree',
      price: 4999,
      discountPrice: 3499,
      discountPercent: 30,
      images: [{ url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600' }]
    },
    {
      id: 'col-s4',
      name: 'Royal Bridal Weave Pure Tissue Organza Saree',
      slug: 'bridal-tissue-organza-saree',
      price: 12999,
      discountPrice: 9499,
      discountPercent: 27,
      images: [{ url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600' }]
    }
  ],
  default: [
    {
      id: 'col-d1',
      name: 'Handcrafted Heritage Art Silk Kurta Set',
      slug: 'heritage-art-silk-kurta-set',
      price: 5999,
      discountPrice: 4299,
      discountPercent: 28,
      images: [{ url: 'https://images.unsplash.com/photo-1597983073493-88cd35cf03b0?w=600' }]
    },
    {
      id: 'col-d2',
      name: 'Luxury Cotton Linen Casual Buttoned Shirt',
      slug: 'cotton-linen-shirt',
      price: 2999,
      discountPrice: 1999,
      discountPercent: 33,
      images: [{ url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600' }]
    },
    {
      id: 'col-d3',
      name: 'Kids Festive Traditional Silk Suit',
      slug: 'kids-silk-suit',
      price: 3499,
      discountPrice: 2499,
      discountPercent: 28,
      images: [{ url: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=600' }]
    },
    {
      id: 'col-d4',
      name: 'Designer Slim Fit Chino Trousers',
      slug: 'slim-fit-chinos',
      price: 3299,
      discountPrice: 2299,
      discountPercent: 30,
      images: [{ url: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600' }]
    }
  ]
};

const CollectionShowcase = ({ title, subtitle, categorySlug, bannerImage, bgLight = false }) => {
  // FIX: Start with empty products — only show real products from the database
  const [products, setProducts] = useState([]);
  const [isHidden, setIsHidden] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const catRes = await api.get('/categories?includeAll=true');
        const foundCat = catRes.data?.data?.find((c) => c.slug === categorySlug || c.id === categorySlug);
        if (foundCat) {
          if (foundCat.showOnHomepage === false || foundCat.isVisible === false || foundCat.status === 'HIDDEN' || foundCat.status === 'ARCHIVED') {
            setIsHidden(true);
            return;
          }
          const prodRes = await api.get(`/products?category=${foundCat.id}&limit=4`);
          const realProducts = prodRes.data?.data?.products || [];
          setProducts(realProducts);
        } else {
          // Category not found in DB — hide the section
          setIsHidden(true);
        }
      } catch (err) {
        console.error(`Failed to load ${categorySlug}:`, err);
      } finally {
        setLoaded(true);
      }
    };
    fetchData();
  }, [categorySlug]);

  // Hide section if category is hidden or no real products exist
  if (isHidden) return null;
  if (loaded && products.length === 0) return null;

  return (
    <section className={`py-12 lg:py-16 ${bgLight ? 'bg-gray-50' : 'bg-white'}`}>
      <div className="max-w-7xl mx-auto px-4">
        {bannerImage && (
          <div className="relative rounded-2xl overflow-hidden mb-8 h-48 sm:h-64 shadow-md">
            <img src={bannerImage} alt={title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent flex items-center p-6 lg:p-10">
              <div className="max-w-md text-white">
                <span className="text-xs font-bold text-gold-400 uppercase tracking-widest">CURATED COLLECTION</span>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold mt-1">{title}</h2>
                {subtitle && <p className="text-sm text-gray-200 mt-2">{subtitle}</p>}
              </div>
            </div>
          </div>
        )}

        {!bannerImage && (
          <motion.div {...fadeInUp} className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal-900">{title}</h2>
              {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
            </div>
            <Link
              to={`/categories/${categorySlug}`}
              className="inline-flex items-center gap-1 text-sm font-semibold text-gold-600 hover:text-gold-700 transition"
            >
              Explore Collection <FiArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-7">
          {products.map((product) => {
            if (!product) return null;
            return (
              <ProductCard key={product.id || Math.random()} product={product} />
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CollectionShowcase;

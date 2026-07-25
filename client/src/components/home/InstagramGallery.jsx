import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiInstagram } from 'react-icons/fi';
import api from '../../config/api';

const DEFAULT_INSTAGRAM = [
  { id: 'i1', caption: 'Handcrafted elegance for festive celebrations ✨', imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400', productUrl: '/categories/womens-sarees' },
  { id: 'i2', caption: 'Regal 22K Kundan Choker Set 💎', imageUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400', productUrl: '/categories/jewellery' },
  { id: 'i3', caption: 'Heritage Silk Kurtas for Gentlemen 🤵', imageUrl: 'https://images.unsplash.com/photo-1597983073493-88cd35cf03b0?w=400', productUrl: '/categories/mens-wear' },
  { id: 'i4', caption: 'Kids Festive Traditional Suit 🌸', imageUrl: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=400', productUrl: '/categories/kids-wear' },
];

const InstagramGallery = () => {
  const [posts, setPosts] = useState(DEFAULT_INSTAGRAM);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data } = await api.get('/cms/instagram');
        if (data?.success && data.data?.length > 0) setPosts(data.data);
      } catch (err) {
        console.error('Instagram gallery error:', err);
      }
    };
    fetchPosts();
  }, []);

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-pink-600 font-semibold text-xs tracking-wider uppercase mb-2">
            <FiInstagram className="w-4 h-4" /> @StyleVerseFashion
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal-900">
            Follow Us On Instagram
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {posts.map((post) => (
            <motion.a
              key={post.id}
              href={post.productUrl || '#'}
              whileHover={{ scale: 1.03 }}
              className="group relative aspect-square rounded-2xl overflow-hidden shadow-sm"
            >
              <img
                src={post.imageUrl}
                alt={post.caption || 'StyleVerse Instagram'}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4 text-center text-white">
                <p className="text-xs font-medium line-clamp-3">{post.caption}</p>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default InstagramGallery;

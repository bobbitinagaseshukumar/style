import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiInstagram } from 'react-icons/fi';
import api from '../../config/api';

const InstagramGallery = () => {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data } = await api.get('/cms/instagram');
        if (data?.success) setPosts(data.data || []);
      } catch (err) {
        console.error('Instagram gallery error:', err);
      }
    };
    fetchPosts();
  }, []);

  if (posts.length === 0) return null;

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

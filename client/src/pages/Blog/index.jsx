import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiBookOpen, FiClock, FiUser, FiArrowRight } from 'react-icons/fi';
import api from '../../config/api';

const Blog = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/blog');
        setPosts(data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 space-y-8">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold text-gold-600 uppercase tracking-widest bg-gold-50 px-3 py-1 rounded-full border border-gold-200 inline-block">
            Editorial & Style Trends
          </span>
          <h1 className="text-3xl font-serif font-bold text-charcoal-900">StyleVerse Journal</h1>
          <p className="text-sm text-gray-500 max-w-xl mx-auto">
            Discover saree draping guides, wedding jewellery styling tips, and bridal fashion trends.
          </p>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading articles...</div>
        ) : posts.length === 0 ? (
          <div className="p-12 text-center text-gray-400 bg-gray-50 rounded-3xl border border-gray-100 max-w-md mx-auto">
            No blog articles published yet. Check back soon!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {posts.map((post) => (
              <motion.div
                key={post.id}
                whileHover={{ y: -6 }}
                className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm flex flex-col group"
              >
                <div className="aspect-[16/10] bg-gray-100 overflow-hidden relative">
                  <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                  <span className="absolute top-3 left-3 bg-charcoal-900/80 text-gold-400 text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-md uppercase">
                    {post.category}
                  </span>
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-[11px] text-gray-400 font-medium">
                      <span className="flex items-center gap-1"><FiUser /> {post.author}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><FiClock /> 5 min read</span>
                    </div>
                    <h3 className="text-base font-serif font-bold text-charcoal-900 group-hover:text-gold-600 transition line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{post.excerpt}</p>
                  </div>
                  <Link
                    to={`/blog/${post.slug}`}
                    className="text-xs font-bold text-gold-600 hover:text-gold-700 flex items-center gap-1 border-t pt-3"
                  >
                    Read Article <FiArrowRight />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Blog;

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiStar } from 'react-icons/fi';
import api from '../../config/api';

const DEFAULT_TESTIMONIALS = [
  { id: 't1', name: 'Priya Sharma', location: 'Mumbai', rating: 5, comment: 'The Kanjivaram silk saree exceeded my expectations! Rich zari texture and breathtaking packaging.' },
  { id: 't2', name: 'Ananya Reddy', location: 'Hyderabad', rating: 5, comment: 'The Kundan necklace set looked regal on my wedding day. Quick delivery and 100% authentic.' },
  { id: 't3', name: 'Rajesh Verma', location: 'Bangalore', rating: 5, comment: 'Exceptional quality kurta shirt! Fits perfectly and fabric feels extremely premium.' },
];

const TestimonialsSection = () => {
  const [reviews, setReviews] = useState([]);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [revRes, setRes] = await Promise.allSettled([
          api.get('/cms/reviews/public'),
          api.get('/cms/settings'),
        ]);

        if (setRes.status === 'fulfilled') {
          const cfg = setRes.value.data?.data || {};
          if (cfg.enableCustomerReviews === false) {
            setEnabled(false);
            return;
          }
        }

        if (revRes.status === 'fulfilled' && revRes.value.data?.success) {
          setReviews(revRes.value.data.data || []);
        }
      } catch (err) {
        console.error('Testimonials error:', err);
      }
    };
    fetchData();
  }, []);

  if (!enabled || reviews.length === 0) return null;

  return (
    <section className="py-12 lg:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center max-w-xl mx-auto mb-10">
          <h2 className="text-2xl lg:text-3xl font-serif font-bold text-charcoal-900 mb-2">
            What Our Customers Say
          </h2>
          <p className="text-gray-500 text-sm">
            Real stories from verified shoppers across India
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((t) => (
            <motion.div
              key={t.id}
              whileHover={{ y: -4 }}
              className="bg-gray-50 p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex gap-1 text-gold-500 mb-4">
                  {[...Array(t.rating || 5)].map((_, i) => (
                    <FiStar key={i} className="w-4 h-4 fill-gold-500 text-gold-500" />
                  ))}
                </div>
                {t.heading && <h4 className="font-bold text-gray-900 text-sm mb-1">&quot;{t.heading}&quot;</h4>}
                <p className="text-gray-700 text-sm italic mb-6">&ldquo;{t.comment}&rdquo;</p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-gray-200/60">
                <img
                  src={t.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.customerName || 'Customer')}&background=D4AF37&color=fff`}
                  alt={t.customerName || 'Customer'}
                  className="w-10 h-10 rounded-full object-cover border"
                />
                <div>
                  <h4 className="text-sm font-semibold text-charcoal-900">{t.customerName || 'Valued Customer'}</h4>
                  <p className="text-xs text-gray-400">{t.location || 'Verified Buyer'}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;

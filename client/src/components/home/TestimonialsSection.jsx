import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiStar } from 'react-icons/fi';
import api from '../../config/api';

const TestimonialsSection = () => {
  const [testimonials, setTestimonials] = useState([]);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const { data } = await api.get('/cms/testimonials');
        if (data?.success) setTestimonials(data.data || []);
      } catch (err) {
        console.error('Testimonials error:', err);
      }
    };
    fetchTestimonials();
  }, []);

  if (testimonials.length === 0) return null;

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
          {testimonials.map((t) => (
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
                <p className="text-gray-700 text-sm italic mb-6">&ldquo;{t.comment}&rdquo;</p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-gray-200/60">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-white font-bold text-base shadow">
                  {t.name[0]}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-charcoal-900">{t.name}</h4>
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

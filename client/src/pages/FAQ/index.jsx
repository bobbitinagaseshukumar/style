import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown, FiHelpCircle, FiSearch } from 'react-icons/fi';
import api from '../../config/api';

const FAQ = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [openIndex, setOpenIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/cms/faqs');
        setFaqs(data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchFAQs();
  }, []);

  const categories = ['ALL', ...new Set(faqs.map(f => f.category || 'General'))];

  const filteredFaqs = faqs.filter(f => {
    const matchesCat = activeCategory === 'ALL' || f.category === activeCategory;
    const matchesQuery = !searchQuery || f.question.toLowerCase().includes(searchQuery.toLowerCase()) || f.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-4xl mx-auto px-4 space-y-8">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold text-gold-600 uppercase tracking-widest block">HELP & KNOWLEDGE BASE</span>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-charcoal-900">Frequently Asked Questions</h1>
          <p className="text-xs sm:text-sm text-gray-500">Find quick answers to common questions about shipping, returns, saree sizing, and jewellery care.</p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-lg mx-auto">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search FAQs..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-200 focus:ring-2 focus:ring-gold-500 focus:outline-none text-xs shadow-sm"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setOpenIndex(null); }}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition ${
                activeCategory === cat ? 'bg-charcoal-900 text-gold-400 shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Accordion List */}
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading FAQs...</div>
        ) : filteredFaqs.length === 0 ? (
          <div className="p-12 text-center text-gray-500 bg-gray-50 rounded-3xl border border-gray-100">
            No matching questions found.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFaqs.map((faq, idx) => {
              const isOpen = openIndex === idx;
              return (
                <div key={faq.id} className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex justify-between items-center gap-4 hover:bg-gray-50/50 transition"
                  >
                    <span className="font-serif font-bold text-sm text-charcoal-900">{faq.question}</span>
                    <FiChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180 text-gold-600' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-gray-100 bg-gray-50/50"
                      >
                        <div className="p-5 text-xs text-gray-600 leading-relaxed">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FAQ;

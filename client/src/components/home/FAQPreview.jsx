import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiChevronDown, FiHelpCircle } from 'react-icons/fi';
import api from '../../config/api';

const DEFAULT_FAQS = [
  { id: 'f1', question: 'Are all silk sarees certified pure handloom?', answer: 'Yes! All our silk sarees come with Silk Mark Certification for 100% pure silk quality.' },
  { id: 'f2', question: 'How does WhatsApp Ordering work?', answer: 'Simply select WhatsApp Order at checkout. Your order details will pre-fill on WhatsApp to message our store representative directly.' },
  { id: 'f3', question: 'What is the estimated delivery time?', answer: 'Standard delivery takes 3 to 5 business days across India. Express shipping is also available.' },
  { id: 'f4', question: 'What is your return & exchange policy?', answer: 'We offer hassle-free 7-day easy returns and exchanges for un-worn items with original tags intact.' },
];

const FAQPreview = () => {
  const [faqs, setFaqs] = useState(DEFAULT_FAQS);
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const { data } = await api.get('/cms/faqs');
        if (data?.success && data.data?.length > 0) setFaqs((data.data).slice(0, 4));
      } catch (err) {
        console.error('FAQ error:', err);
      }
    };
    fetchFaqs();
  }, []);

  return (
    <section className="py-12 lg:py-16 bg-white">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-50 text-gold-700 text-xs font-bold mb-2">
            <FiHelpCircle className="w-4 h-4" /> FREQUENTLY ASKED QUESTIONS
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal-900">
            Have Questions? We Have Answers
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div
                key={faq.id}
                className="border border-gray-200 rounded-2xl overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenId(isOpen ? null : faq.id)}
                  className="w-full p-5 text-left font-semibold text-charcoal-900 flex justify-between items-center bg-gray-50/50 hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm sm:text-base">{faq.question}</span>
                  <FiChevronDown
                    className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${
                      isOpen ? 'rotate-180 text-gold-600' : ''
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="p-5 pt-0 text-sm text-gray-600 border-t border-gray-100 bg-white"
                    >
                      <p className="mt-2">{faq.answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-8">
          <Link
            to="/faq"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-gray-300 text-sm font-semibold text-charcoal-900 hover:bg-charcoal-900 hover:text-white transition-colors"
          >
            View All FAQs
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FAQPreview;

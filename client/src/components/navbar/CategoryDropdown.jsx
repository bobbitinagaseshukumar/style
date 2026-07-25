import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown } from 'react-icons/fi';

const CategoryDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { categories } = useSelector((state) => state.category);

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button className="flex items-center text-gray-700 hover:text-gold-500 font-medium transition-colors py-4">
        Categories <FiChevronDown className="ml-1 h-4 w-4" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute left-0 w-[600px] bg-white shadow-2xl rounded-b-lg border-t-2 border-gold-500 p-6 z-50 grid grid-cols-3 gap-6"
          >
            {categories?.slice(0, 6).map((cat) => (
              <div key={cat._id} className="group cursor-pointer">
                <Link to={`/categories/${cat.slug}`} className="block">
                  <div className="aspect-square bg-gray-100 rounded-md overflow-hidden mb-2">
                    <img 
                      src={cat.image?.url || 'https://via.placeholder.com/150'} 
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <h4 className="font-medium text-charcoal-900 group-hover:text-gold-500">{cat.name}</h4>
                </Link>
              </div>
            ))}
            <div className="col-span-3 text-center mt-2 pt-4 border-t">
              <Link to="/categories" className="text-gold-600 hover:text-gold-700 font-medium">View All Categories &rarr;</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CategoryDropdown;

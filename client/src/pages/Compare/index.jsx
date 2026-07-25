import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiX, FiCheck, FiShoppingBag, FiLayers } from 'react-icons/fi';
import { useDispatch } from 'react-redux';
import api from '../../config/api';
import { addToCart } from '../../redux/cart/cartSlice';
import { formatCurrency } from '../../utils/formatCurrency';
import { toast } from 'react-toastify';

const Compare = () => {
  const dispatch = useDispatch();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompareProducts = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/products?limit=4');
        setProducts(data.data?.products || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCompareProducts();
  }, []);

  const handleRemoveCompare = (id) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const handleAddToCart = (product) => {
    dispatch(addToCart({
      id: product.id,
      name: product.name,
      price: product.discountPrice || product.price,
      image: product.images?.[0]?.url,
      quantity: 1,
    }));
    toast.success(`Added '${product.name}' to cart!`);
  };

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal-900 flex items-center gap-2">
            <FiLayers className="text-gold-600" /> Side-by-Side Product Comparison
          </h1>
          <p className="text-xs text-gray-500 mt-1">Compare materials, occasion, specifications, and prices across items</p>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading product matrix...</div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-gray-500 bg-gray-50 rounded-3xl border border-gray-100 max-w-lg mx-auto">
            No products selected for comparison.
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-3xl overflow-x-auto shadow-sm">
            <table className="min-w-full text-xs text-left divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-4 w-44 font-bold text-gray-700 uppercase">Features</th>
                  {products.map(p => (
                    <th key={p.id} className="p-4 min-w-[200px] relative">
                      <button
                        onClick={() => handleRemoveCompare(p.id)}
                        className="absolute top-2 right-2 text-gray-400 hover:text-red-600 p-1"
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                      <img src={p.images?.[0]?.url} alt="" className="w-24 h-32 object-cover rounded-xl bg-white mb-2 mx-auto" />
                      <span className="font-bold text-sm text-charcoal-900 block line-clamp-1 text-center">{p.name}</span>
                      <span className="font-bold text-gold-600 block text-center mt-1">{formatCurrency(p.discountPrice || p.price)}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                <tr>
                  <td className="p-4 font-bold text-charcoal-900">Category</td>
                  {products.map(p => <td key={p.id} className="p-4 text-gray-600">{p.category?.name || 'General'}</td>)}
                </tr>
                <tr>
                  <td className="p-4 font-bold text-charcoal-900">Fabric & Material</td>
                  {products.map(p => <td key={p.id} className="p-4 text-gray-600">{p.material || 'Silk / Zari'}</td>)}
                </tr>
                <tr>
                  <td className="p-4 font-bold text-charcoal-900">Occasion</td>
                  {products.map(p => <td key={p.id} className="p-4 text-gray-600">{p.occasion || 'Festive / Wedding'}</td>)}
                </tr>
                <tr>
                  <td className="p-4 font-bold text-charcoal-900">Stock Availability</td>
                  {products.map(p => (
                    <td key={p.id} className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${p.stock > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                        {p.stock > 0 ? `${p.stock} Available` : 'Out of Stock'}
                      </span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 font-bold text-charcoal-900">Action</td>
                  {products.map(p => (
                    <td key={p.id} className="p-4 text-center">
                      <button
                        onClick={() => handleAddToCart(p)}
                        className="px-4 py-2 rounded-full bg-gold-500 hover:bg-gold-600 text-white font-bold text-xs shadow-md inline-flex items-center gap-1"
                      >
                        <FiShoppingBag /> Add to Cart
                      </button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Compare;

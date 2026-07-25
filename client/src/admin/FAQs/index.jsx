import React, { useState, useEffect } from 'react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import api from '../../config/api';
import { FiPlus, FiTrash2, FiHelpCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';

const AdminFAQs = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'General',
    sortOrder: '0',
  });

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/cms/faqs');
      setFaqs(data.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.question || !formData.answer) {
      toast.error('Question and Answer are required');
      return;
    }

    try {
      await api.post('/cms/faqs', {
        ...formData,
        sortOrder: parseInt(formData.sortOrder || 0),
      });
      toast.success('FAQ created & published!');
      setIsModalOpen(false);
      setFormData({ question: '', answer: '', category: 'General', sortOrder: '0' });
      fetchFaqs();
    } catch (err) {
      toast.error('Failed to create FAQ');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this FAQ?')) return;
    try {
      await api.delete(`/cms/faqs/${id}`);
      toast.success('FAQ deleted');
      setFaqs(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      toast.error('Failed to delete FAQ');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">FAQ Management</h1>
          <p className="text-sm text-gray-500">Manage frequently asked questions displayed on the store</p>
        </div>
        <Button icon={FiPlus} onClick={() => setIsModalOpen(true)}>Add FAQ</Button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading FAQs...</div>
      ) : (
        <div className="space-y-4">
          {faqs.map((faq) => (
            <div key={faq.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex justify-between items-start">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-gold-50 text-gold-700 text-xs font-bold mb-2">
                  {faq.category}
                </span>
                <h3 className="font-semibold text-charcoal-900 text-base">{faq.question}</h3>
                <p className="text-sm text-gray-600 mt-1">{faq.answer}</p>
              </div>
              <button onClick={() => handleDelete(faq.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition">
                <FiTrash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create FAQ">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Question" name="question" value={formData.question} onChange={handleChange} required placeholder="e.g. What is the delivery timeframe?" />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Answer</label>
            <textarea rows={4} name="answer" value={formData.answer} onChange={handleChange} required className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-gold-500 focus:outline-none text-sm" placeholder="Provide a detailed answer..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Category Tag" name="category" value={formData.category} onChange={handleChange} placeholder="Shipping / Payment / Returns" />
            <Input label="Display Priority" name="sortOrder" type="number" value={formData.sortOrder} onChange={handleChange} placeholder="0" />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Publish FAQ</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminFAQs;

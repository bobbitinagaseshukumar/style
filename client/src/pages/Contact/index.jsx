import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiMail, FiPhone, FiMapPin, FiClock, FiSend } from 'react-icons/fi';
import api from '../../config/api';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { toast } from 'react-toastify';

const Contact = () => {
  const [storeSettings, setStoreSettings] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await api.get('/cms/settings');
        if (data?.success) setStoreSettings(data.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.subject || !formData.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const { data } = await api.post('/cms/contact', formData);
      toast.success(data.message || 'Message sent successfully!');
      setFormData({ fullName: '', email: '', phone: '', subject: '', message: '' });
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 space-y-12">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-bold text-gold-600 uppercase tracking-widest block mb-1">CUSTOMER HELPLINE</span>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-charcoal-900">Get in Touch With Us</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-2">Have a question about an order, custom sizing, or bridal collection? We are here to help!</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Details Column */}
          <div className="space-y-6 bg-gray-50 p-8 rounded-3xl border border-gray-100 h-fit">
            <h3 className="font-serif font-bold text-xl text-charcoal-900 border-b pb-3">Store Contact Info</h3>

            <div className="space-y-4 text-xs text-gray-600">
              <div className="flex items-start gap-3">
                <FiMapPin className="w-5 h-5 text-gold-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-charcoal-900">Registered Office Address:</strong>
                  <p>{storeSettings?.address || '123 Fashion Street, Cyber City, Hyderabad, India'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FiPhone className="w-5 h-5 text-gold-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-charcoal-900">Phone Support:</strong>
                  <p>{storeSettings?.contactPhone || '+91 98765 43210'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FiMail className="w-5 h-5 text-gold-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-charcoal-900">Email Inquiry:</strong>
                  <p>{storeSettings?.contactEmail || 'support@styleverse.com'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FiClock className="w-5 h-5 text-gold-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-charcoal-900">Working Hours:</strong>
                  <p>Monday – Saturday: 10:00 AM – 8:00 PM IST</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form Column */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
            <h3 className="font-serif font-bold text-xl text-charcoal-900 border-b pb-4 mb-6">Send Us a Message</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Your Name *" name="fullName" value={formData.fullName} onChange={handleChange} required placeholder="Priya Sharma" />
                <Input label="Email Address *" type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="priya@example.com" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Phone Number" name="phone" value={formData.phone} onChange={handleChange} placeholder="+91 98765 43210" />
                <Input label="Subject *" name="subject" value={formData.subject} onChange={handleChange} required placeholder="Order inquiry / Sizing question" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                <textarea
                  rows={5}
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  className="w-full p-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-gold-500 focus:outline-none text-sm"
                  placeholder="How can we assist you today?"
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" loading={loading} icon={FiSend}>
                  Submit Inquiry
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiBriefcase, FiCheckCircle, FiShield, FiTrendingUp } from 'react-icons/fi';
import api from '../../config/api';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { toast } from 'react-toastify';

const VendorRegister = () => {
  const [form, setForm] = useState({
    storeName: '',
    ownerName: '',
    email: '',
    phone: '',
    gstin: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.post('/marketplace/vendor-register', form);
      setSubmitted(true);
      toast.success('Vendor application submitted successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 space-y-8">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold text-gold-600 uppercase tracking-widest bg-gold-50 px-3 py-1 rounded-full border border-gold-200 inline-block">
            Merchant & Seller Hub
          </span>
          <h1 className="text-3xl font-serif font-bold text-charcoal-900">Partner with StyleVerse Marketplace</h1>
          <p className="text-sm text-gray-500 max-w-xl mx-auto">
            Sell your silk sarees, ethnic wear, and luxury jewellery to millions of verified customers across India.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-2 text-center">
            <FiTrendingUp className="w-8 h-8 text-gold-600 mx-auto" />
            <h3 className="font-bold text-sm text-charcoal-900">Reach Millions</h3>
            <p className="text-xs text-gray-500">Instant access to nationwide customer base and luxury buyers.</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-2 text-center">
            <FiShield className="w-8 h-8 text-gold-600 mx-auto" />
            <h3 className="font-bold text-sm text-charcoal-900">Secure Weekly Payouts</h3>
            <p className="text-xs text-gray-500">Automated bank settlements with transparent low commission fees.</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-2 text-center">
            <FiBriefcase className="w-8 h-8 text-gold-600 mx-auto" />
            <h3 className="font-bold text-sm text-charcoal-900">Seller Dashboard</h3>
            <p className="text-xs text-gray-500">Real-time inventory management, order processing, and analytics.</p>
          </div>
        </div>

        {/* Application Form */}
        <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm max-w-2xl mx-auto">
          {submitted ? (
            <div className="text-center py-8 space-y-4">
              <FiCheckCircle className="w-16 h-16 text-emerald-500 mx-auto" />
              <h2 className="text-2xl font-serif font-bold text-charcoal-900">Application Received!</h2>
              <p className="text-xs text-gray-600">
                Our seller onboarding manager will inspect your GSTIN details and reach out to <strong>{form.email}</strong> within 24 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="text-xl font-serif font-bold text-charcoal-900 mb-4">Vendor Onboarding Application</h2>
              <Input
                label="Store / Business Name"
                value={form.storeName}
                onChange={e => setForm({ ...form, storeName: e.target.value })}
                required
                placeholder="e.g. Royal Silk Handlooms"
              />
              <Input
                label="Owner / Contact Person Name"
                value={form.ownerName}
                onChange={e => setForm({ ...form, ownerName: e.target.value })}
                required
                placeholder="Full Name"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Business Email"
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                  placeholder="seller@business.com"
                />
                <Input
                  label="Contact Phone / WhatsApp"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  required
                  placeholder="+91 98765 43210"
                />
              </div>
              <Input
                label="GSTIN / Business Registration Number"
                value={form.gstin}
                onChange={e => setForm({ ...form, gstin: e.target.value })}
                required
                placeholder="36AAAAA0000A1Z5"
              />
              <Button type="submit" loading={loading} className="w-full py-3.5 mt-4">
                Submit Merchant Application
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorRegister;

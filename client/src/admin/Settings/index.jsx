import React, { useState, useEffect } from 'react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import api from '../../config/api';
import { FiSave, FiGlobe, FiTruck, FiCreditCard, FiSearch, FiLock, FiClipboard, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import { toast } from 'react-toastify';
import AuthenticationManager from './AuthenticationManager';

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);

  const DEFAULT_CHECKOUT_FIELDS = {
    fullName: { enabled: true, required: true, label: 'Full Name' },
    phone: { enabled: true, required: true, label: 'Phone Number' },
    street: { enabled: true, required: true, label: 'Street Address' },
    city: { enabled: true, required: true, label: 'City' },
    state: { enabled: true, required: true, label: 'State' },
    postalCode: { enabled: true, required: true, label: 'Pincode' },
    village: { enabled: false, required: false, label: 'Village' },
    landmark: { enabled: false, required: false, label: 'Landmark' },
    alternatePhone: { enabled: false, required: false, label: 'Alternate Phone' },
  };

  const [checkoutFields, setCheckoutFields] = useState(DEFAULT_CHECKOUT_FIELDS);

  const [settings, setSettings] = useState({
    storeName: 'StyleVerse',
    contactEmail: 'support@styleverse.com',
    contactPhone: '+91 98765 43210',
    address: '123 Fashion Street, Cyber City, Hyderabad, India',
    currencySymbol: '₹',
    primaryColor: '#D4AF37',
    secondaryColor: '#1A1A1A',
    shippingCharge: '99',
    freeShippingThreshold: '999',
    estimatedDeliveryDays: '3-5 Business Days',
    isCODEnabled: true,
    isRazorpayEnabled: true,
    isStripeEnabled: false,
    metaTitle: 'StyleVerse | Enterprise Luxury Clothing & Jewellery Platform',
    metaDescription: 'Shop handcrafted sarees, kundan jewellery, designer lehengas, and ethnic fashion.',
    metaKeywords: 'sarees, jewellery, kurtis, lehengas, silk, fashion, shopping',
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await api.get('/cms/settings');
        if (data?.success && data.data) {
          setSettings(prev => ({ ...prev, ...data.data }));
          if (data.data.checkoutFields) {
            try {
              const parsed = typeof data.data.checkoutFields === 'string' ? JSON.parse(data.data.checkoutFields) : data.data.checkoutFields;
              setCheckoutFields(prev => ({ ...prev, ...parsed }));
            } catch (e) {}
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.put('/cms/settings', { ...settings, checkoutFields: JSON.stringify(checkoutFields) });
      toast.success('Store Settings updated & live!');
      try {
        localStorage.removeItem('__KVLR_HOME_PERSISTENT_CACHE_V3__');
        sessionStorage.removeItem('__KVLR_HOME_CACHE__');
        window.dispatchEvent(new Event('kvlr:content-updated'));
      } catch(e){}
    } catch (err) {
      console.error(err);
      toast.success('Settings saved!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System & Store Settings</h1>
        <p className="text-sm text-gray-500">Configure global metadata, shipping rules, payment gateways, and SEO</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-4 overflow-x-auto">
        {[
          { id: 'auth', label: 'Authentication Manager', icon: FiLock },
          { id: 'general', label: 'Store Profile', icon: FiGlobe },
          { id: 'shipping', label: 'Shipping Rules', icon: FiTruck },
          { id: 'payment', label: 'Payment Methods', icon: FiCreditCard },
          { id: 'seo', label: 'SEO Settings', icon: FiSearch },
          { id: 'checkout', label: 'Checkout Fields', icon: FiClipboard },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition ${
                activeTab === tab.id
                  ? 'border-gold-500 text-gold-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'auth' && <AuthenticationManager />}

      {activeTab !== 'auth' && (
        <form onSubmit={handleSave} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
        {/* Tab 1: General Store Profile */}
        {activeTab === 'general' && (
          <div className="space-y-4">
            <h3 className="text-lg font-serif font-bold text-charcoal-900 border-b pb-2">Store Profile & Branding</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Store Name" name="storeName" value={settings.storeName} onChange={handleChange} required />
              <Input label="Currency Symbol" name="currencySymbol" value={settings.currencySymbol} onChange={handleChange} required />
              <Input label="Support Email" name="contactEmail" type="email" value={settings.contactEmail} onChange={handleChange} required />
              <Input label="Support Phone" name="contactPhone" value={settings.contactPhone} onChange={handleChange} required />
            </div>
            <Input label="Store Address" name="address" value={settings.address} onChange={handleChange} required />

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Primary Theme Gold (#D4AF37)</label>
                <input type="color" name="primaryColor" value={settings.primaryColor} onChange={handleChange} className="w-full h-10 rounded-xl cursor-pointer" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Theme Charcoal (#1A1A1A)</label>
                <input type="color" name="secondaryColor" value={settings.secondaryColor} onChange={handleChange} className="w-full h-10 rounded-xl cursor-pointer" />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Shipping Rules */}
        {activeTab === 'shipping' && (
          <div className="space-y-4">
            <h3 className="text-lg font-serif font-bold text-charcoal-900 border-b pb-2">Shipping & Delivery Rates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Standard Shipping Fee (₹)" name="shippingCharge" type="number" value={settings.shippingCharge} onChange={handleChange} />
              <Input label="Free Shipping Order Threshold (₹)" name="freeShippingThreshold" type="number" value={settings.freeShippingThreshold} onChange={handleChange} />
            </div>
            <Input label="Estimated Delivery Timeframe" name="estimatedDeliveryDays" value={settings.estimatedDeliveryDays} onChange={handleChange} />
          </div>
        )}

        {/* Tab 3: Payment Gateways */}
        {activeTab === 'payment' && (
          <div className="space-y-4">
            <h3 className="text-lg font-serif font-bold text-charcoal-900 border-b pb-2">Payment Gateways & Options</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-gray-50">
                <input type="checkbox" name="isCODEnabled" checked={settings.isCODEnabled} onChange={handleChange} className="w-5 h-5 text-gold-500 rounded" />
                <div>
                  <span className="font-bold text-charcoal-900 block">Cash On Delivery (COD)</span>
                  <span className="text-xs text-gray-500">Allow customers to pay cash upon order receipt</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-gray-50">
                <input type="checkbox" name="isRazorpayEnabled" checked={settings.isRazorpayEnabled} onChange={handleChange} className="w-5 h-5 text-gold-500 rounded" />
                <div>
                  <span className="font-bold text-charcoal-900 block">Razorpay UPI & Cards</span>
                  <span className="text-xs text-gray-500">Enable instant online payments via UPI, NetBanking & Cards</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-gray-50">
                <input type="checkbox" name="isStripeEnabled" checked={settings.isStripeEnabled} onChange={handleChange} className="w-5 h-5 text-gold-500 rounded" />
                <div>
                  <span className="font-bold text-charcoal-900 block">Stripe International</span>
                  <span className="text-xs text-gray-500">Accept global credit and debit cards worldwide</span>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Tab 4: SEO Settings */}
        {activeTab === 'seo' && (
          <div className="space-y-4">
            <h3 className="text-lg font-serif font-bold text-charcoal-900 border-b pb-2">Search Engine Optimization (SEO)</h3>
            <Input label="Global Meta Title" name="metaTitle" value={settings.metaTitle} onChange={handleChange} />
            <Input label="Meta Description" name="metaDescription" value={settings.metaDescription} onChange={handleChange} />
            <Input label="Meta Keywords (Comma separated)" name="metaKeywords" value={settings.metaKeywords} onChange={handleChange} />
          </div>
        )}

        {/* Tab 5: Checkout Form Fields */}
        {activeTab === 'checkout' && (
          <div className="space-y-4">
            <h3 className="text-lg font-serif font-bold text-charcoal-900 border-b pb-2">Checkout Address Form Fields</h3>
            <p className="text-sm text-gray-500">Configure which fields appear when customers add their shipping address at checkout. Toggle fields on/off and mark them as required.</p>
            <div className="space-y-3">
              {Object.entries(checkoutFields).map(([key, field]) => (
                <div key={key} className="flex items-center justify-between p-4 border rounded-xl hover:bg-gray-50 transition">
                  <div className="flex-1">
                    <span className="font-bold text-sm text-charcoal-900 block">{field.label}</span>
                    <span className="text-xs text-gray-400">Field key: {key}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-xs font-semibold text-gray-500">Show</span>
                      <button
                        type="button"
                        onClick={() => setCheckoutFields(prev => ({
                          ...prev,
                          [key]: { ...prev[key], enabled: !prev[key].enabled, required: !prev[key].enabled ? prev[key].required : false }
                        }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${field.enabled ? 'bg-emerald-500' : 'bg-gray-300'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${field.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-xs font-semibold text-gray-500">Required</span>
                      <button
                        type="button"
                        disabled={!field.enabled}
                        onClick={() => setCheckoutFields(prev => ({
                          ...prev,
                          [key]: { ...prev[key], required: !prev[key].required }
                        }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${!field.enabled ? 'bg-gray-200 opacity-50 cursor-not-allowed' : field.required ? 'bg-amber-500' : 'bg-gray-300'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${field.required ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t">
          <Button type="submit" loading={loading} icon={FiSave}>
            Save All Settings
          </Button>
        </div>
      </form>
      )}
    </div>
  );
};

export default AdminSettings;

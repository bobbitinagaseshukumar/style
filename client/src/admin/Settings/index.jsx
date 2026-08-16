import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import api from '../../config/api';
import {
  FiSave, FiGlobe, FiTruck, FiCreditCard, FiSearch, FiLock, FiClipboard,
  FiPlus, FiTrash2, FiCheck, FiX, FiTag, FiDollarSign, FiCode
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { setStoreSettings } from '../../redux/settings/settingsSlice';
import AuthenticationManager from './AuthenticationManager';

const DEFAULT_CHECKOUT_FIELDS = {
  fullName: { enabled: true, required: true, label: 'Full Name', type: 'text', placeholder: 'Full Name' },
  phone: { enabled: true, required: true, label: 'Phone Number', type: 'tel', placeholder: '+91 98765 43210' },
  street: { enabled: true, required: true, label: 'Street Address', type: 'text', placeholder: 'Flat, House no., Building, Street' },
  city: { enabled: true, required: true, label: 'City', type: 'text', placeholder: 'City / District' },
  state: { enabled: true, required: true, label: 'State', type: 'text', placeholder: 'State' },
  postalCode: { enabled: true, required: true, label: 'Pincode', type: 'text', placeholder: '6-digit Pincode' },
  village: { enabled: false, required: false, label: 'Village', type: 'text', placeholder: 'Village / Town' },
  landmark: { enabled: false, required: false, label: 'Landmark', type: 'text', placeholder: 'E.g. Near Apollo Pharmacy' },
  alternatePhone: { enabled: false, required: false, label: 'Alternate Phone', type: 'tel', placeholder: 'Optional Secondary Phone' },
};

const AdminSettings = () => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);

  const [checkoutFields, setCheckoutFields] = useState(DEFAULT_CHECKOUT_FIELDS);
  const [customPaymentMethods, setCustomPaymentMethods] = useState([]);
  const [customShippingTiers, setCustomShippingTiers] = useState([]);
  const [customSeoTags, setCustomSeoTags] = useState([]);

  // Modals for Adding New Elements
  const [showAddCheckoutFieldModal, setShowAddCheckoutFieldModal] = useState(false);
  const [newCheckoutField, setNewCheckoutField] = useState({ key: '', label: '', placeholder: '', type: 'text', required: false, enabled: true });

  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [newPaymentMethod, setNewPaymentMethod] = useState({ id: '', name: '', description: '', fee: 0, enabled: true });

  const [showAddShippingModal, setShowAddShippingModal] = useState(false);
  const [newShippingTier, setNewShippingTier] = useState({ id: '', name: '', price: 0, deliveryDays: '1-2 Business Days', freeThreshold: 0, enabled: true });

  const [showAddSeoModal, setShowAddSeoModal] = useState(false);
  const [newSeoTag, setNewSeoTag] = useState({ type: 'name', key: '', value: '', enabled: true });

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
    isCashfreeEnabled: false,
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
          if (data.data.customPaymentMethods) {
            try {
              const parsed = typeof data.data.customPaymentMethods === 'string' ? JSON.parse(data.data.customPaymentMethods) : data.data.customPaymentMethods;
              if (Array.isArray(parsed)) setCustomPaymentMethods(parsed);
            } catch (e) {}
          }
          if (data.data.customShippingTiers) {
            try {
              const parsed = typeof data.data.customShippingTiers === 'string' ? JSON.parse(data.data.customShippingTiers) : data.data.customShippingTiers;
              if (Array.isArray(parsed)) setCustomShippingTiers(parsed);
            } catch (e) {}
          }
          if (data.data.customSeoTags) {
            try {
              const parsed = typeof data.data.customSeoTags === 'string' ? JSON.parse(data.data.customSeoTags) : data.data.customSeoTags;
              if (Array.isArray(parsed)) setCustomSeoTags(parsed);
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
    if (e && e.preventDefault) e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        ...settings,
        checkoutFields: JSON.stringify(checkoutFields),
        customPaymentMethods: JSON.stringify(customPaymentMethods),
        customShippingTiers: JSON.stringify(customShippingTiers),
        customSeoTags: JSON.stringify(customSeoTags),
      };
      const res = await api.put('/cms/settings', payload);
      toast.success('Store Settings updated & live throughout the website!');
      if (res.data?.data) {
        setSettings(prev => ({ ...prev, ...res.data.data }));
        dispatch(setStoreSettings(res.data.data));
      }
      try {
        localStorage.removeItem('__KVLR_HOME_PERSISTENT_CACHE_V3__');
        sessionStorage.removeItem('__KVLR_HOME_CACHE__');
        window.dispatchEvent(new Event('kvlr:content-updated'));
        window.dispatchEvent(new CustomEvent('settings_updated', { detail: res.data?.data }));
      } catch(e){}
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  // Add Checkout Field
  const handleAddCheckoutField = (e) => {
    e.preventDefault();
    const cleanKey = newCheckoutField.key.trim().replace(/[^a-zA-Z0-9]/g, '');
    if (!cleanKey || !newCheckoutField.label) {
      return toast.error('Please enter a valid Field Key and Label');
    }
    if (checkoutFields[cleanKey]) {
      return toast.error('A checkout field with this key already exists');
    }
    setCheckoutFields(prev => ({
      ...prev,
      [cleanKey]: {
        label: newCheckoutField.label.trim(),
        placeholder: newCheckoutField.placeholder.trim(),
        type: newCheckoutField.type || 'text',
        required: Boolean(newCheckoutField.required),
        enabled: true,
        isCustom: true,
      }
    }));
    setShowAddCheckoutFieldModal(false);
    setNewCheckoutField({ key: '', label: '', placeholder: '', type: 'text', required: false, enabled: true });
    toast.success(`Checkout field "${newCheckoutField.label}" added! Click "Save All Settings" to persist.`);
  };

  const removeCheckoutField = (key) => {
    setCheckoutFields(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    toast.info(`Field "${key}" removed`);
  };

  // Add Payment Method
  const handleAddPaymentMethod = (e) => {
    e.preventDefault();
    const cleanId = newPaymentMethod.id.trim().toUpperCase().replace(/\s+/g, '_');
    if (!cleanId || !newPaymentMethod.name) {
      return toast.error('Please enter a Gateway ID and Name');
    }
    if (customPaymentMethods.some(p => p.id === cleanId)) {
      return toast.error('This Payment Method ID already exists');
    }
    const item = {
      id: cleanId,
      name: newPaymentMethod.name.trim(),
      description: newPaymentMethod.description.trim() || 'Online / Offline Payment',
      fee: parseFloat(newPaymentMethod.fee) || 0,
      enabled: true,
      isCustom: true,
    };
    setCustomPaymentMethods(prev => [...prev, item]);
    setShowAddPaymentModal(false);
    setNewPaymentMethod({ id: '', name: '', description: '', fee: 0, enabled: true });
    toast.success(`Payment method "${item.name}" added! Click "Save All Settings" to persist.`);
  };

  const removePaymentMethod = (id) => {
    setCustomPaymentMethods(prev => prev.filter(p => p.id !== id));
    toast.info('Payment method removed');
  };

  const toggleCustomPayment = (id) => {
    setCustomPaymentMethods(prev => prev.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p));
  };

  // Add Shipping Tier
  const handleAddShippingTier = (e) => {
    e.preventDefault();
    const cleanId = newShippingTier.id.trim() || `tier_${Date.now()}`;
    if (!newShippingTier.name) {
      return toast.error('Please enter a Shipping Tier Name');
    }
    const item = {
      id: cleanId,
      name: newShippingTier.name.trim(),
      price: parseFloat(newShippingTier.price) || 0,
      deliveryDays: newShippingTier.deliveryDays.trim() || '2-4 Days',
      freeThreshold: parseFloat(newShippingTier.freeThreshold) || 0,
      enabled: true,
      isCustom: true,
    };
    setCustomShippingTiers(prev => [...prev, item]);
    setShowAddShippingModal(false);
    setNewShippingTier({ id: '', name: '', price: 0, deliveryDays: '1-2 Business Days', freeThreshold: 0, enabled: true });
    toast.success(`Shipping tier "${item.name}" added! Click "Save All Settings" to persist.`);
  };

  const removeShippingTier = (id) => {
    setCustomShippingTiers(prev => prev.filter(s => s.id !== id));
    toast.info('Shipping tier removed');
  };

  const toggleCustomShipping = (id) => {
    setCustomShippingTiers(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  // Add SEO Tag
  const handleAddSeoTag = (e) => {
    e.preventDefault();
    if (!newSeoTag.key || !newSeoTag.value) {
      return toast.error('Please enter a Tag Key and Value');
    }
    const item = {
      id: `seo_${Date.now()}`,
      type: newSeoTag.type,
      key: newSeoTag.key.trim(),
      value: newSeoTag.value.trim(),
      enabled: true,
    };
    setCustomSeoTags(prev => [...prev, item]);
    setShowAddSeoModal(false);
    setNewSeoTag({ type: 'name', key: '', value: '', enabled: true });
    toast.success(`SEO tag added! Click "Save All Settings" to persist.`);
  };

  const removeSeoTag = (id) => {
    setCustomSeoTags(prev => prev.filter(t => t.id !== id));
    toast.info('SEO tag removed');
  };

  const toggleCustomSeo = (id) => {
    setCustomSeoTags(prev => prev.map(t => t.id === id ? { ...t, enabled: !t.enabled } : t));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System & Store Settings</h1>
          <p className="text-sm text-gray-500">Configure global metadata, shipping rules, payment gateways, and SEO</p>
        </div>
        {activeTab !== 'auth' && (
          <Button type="button" onClick={handleSave} loading={loading} icon={FiSave}>
            Save All Settings
          </Button>
        )}
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
              className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition cursor-pointer ${
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
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-amber-500/10 via-gold-500/10 to-transparent p-4 rounded-2xl border border-gold-500/30">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gold-700">⚡ Real-Time Storefront Live Link</span>
                  </div>
                  <h3 className="text-base font-serif font-bold text-charcoal-900 mt-0.5">Store Profile & Global Branding</h3>
                  <p className="text-xs text-gray-500">Controls store name, support contacts, address, currency symbol, and primary/secondary color schemes across all pages.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Store Name" name="storeName" value={settings.storeName} onChange={handleChange} required />
                <Input label="Currency Symbol" name="currencySymbol" value={settings.currencySymbol} onChange={handleChange} required />
                <Input label="Support Email" name="contactEmail" type="email" value={settings.contactEmail} onChange={handleChange} required />
                <Input label="Support Phone" name="contactPhone" value={settings.contactPhone} onChange={handleChange} required />
              </div>
              <Input label="Store Address" name="address" value={settings.address} onChange={handleChange} required />

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Primary Theme Gold ({settings.primaryColor})</label>
                  <div className="flex items-center gap-3">
                    <input type="color" name="primaryColor" value={settings.primaryColor} onChange={handleChange} className="w-14 h-11 rounded-xl cursor-pointer border" />
                    <span className="text-xs font-mono font-bold text-gray-700">{settings.primaryColor}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Theme Charcoal ({settings.secondaryColor})</label>
                  <div className="flex items-center gap-3">
                    <input type="color" name="secondaryColor" value={settings.secondaryColor} onChange={handleChange} className="w-14 h-11 rounded-xl cursor-pointer border" />
                    <span className="text-xs font-mono font-bold text-gray-700">{settings.secondaryColor}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Shipping Rules */}
          {activeTab === 'shipping' && (
            <div className="space-y-6">
              {/* Connection Banner + Add Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-amber-500/10 via-gold-500/10 to-transparent p-5 rounded-2xl border border-gold-500/30">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gold-700">⚡ Live Connected to: Cart & Checkout Delivery Speed</span>
                  </div>
                  <h3 className="text-base font-serif font-bold text-charcoal-900 mt-0.5">Shipping Rules & Delivery Tiers</h3>
                  <p className="text-xs text-gray-500">Configure standard delivery rates and add custom shipping options (Express, Same-Day, VIP Courier).</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddShippingModal(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-charcoal-900 to-black hover:from-black hover:to-charcoal-900 text-gold-400 font-extrabold text-xs shadow-lg transition-all cursor-pointer shrink-0 border border-gold-500/30"
                >
                  <FiPlus className="w-4 h-4 text-gold-400" /> + Add Shipping Tier
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Standard Shipping Fee (₹)" name="shippingCharge" type="number" value={settings.shippingCharge} onChange={handleChange} />
                <Input label="Free Shipping Order Threshold (₹)" name="freeShippingThreshold" type="number" value={settings.freeShippingThreshold} onChange={handleChange} />
              </div>
              <Input label="Estimated Delivery Timeframe" name="estimatedDeliveryDays" value={settings.estimatedDeliveryDays} onChange={handleChange} />

              {/* Custom Shipping Tiers */}
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-charcoal-900">Custom Delivery Tiers / Express Options</h4>
                  <button
                    type="button"
                    onClick={() => setShowAddShippingModal(true)}
                    className="text-xs font-bold text-gold-600 hover:text-gold-700 cursor-pointer flex items-center gap-1"
                  >
                    <FiPlus className="w-3.5 h-3.5" /> Add Tier
                  </button>
                </div>

                {customShippingTiers.length === 0 ? (
                  <div
                    onClick={() => setShowAddShippingModal(true)}
                    className="p-6 rounded-2xl border-2 border-dashed border-gray-300 hover:border-gold-500 bg-gray-50 hover:bg-gold-50/20 text-center transition cursor-pointer"
                  >
                    <FiTruck className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-xs font-bold text-charcoal-900">No custom shipping tiers added yet</p>
                    <p className="text-[11px] text-gray-500 mt-1">Click here or the button above to add Express Delivery, Next-Day Air, or VIP Courier options.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {customShippingTiers.map((tier) => (
                      <div key={tier.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-charcoal-900">{tier.name}</p>
                          <p className="text-xs text-gray-500">₹{tier.price} • {tier.deliveryDays}</p>
                          {tier.freeThreshold > 0 && (
                            <span className="text-[10px] text-emerald-600 font-semibold">Free above ₹{tier.freeThreshold}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => toggleCustomShipping(tier.id)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                              tier.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'
                            }`}
                          >
                            {tier.enabled ? 'Active' : 'Inactive'}
                          </button>
                          <button
                            type="button"
                            onClick={() => removeShippingTier(tier.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer transition"
                            title="Delete tier"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 3: Payment Gateways */}
          {activeTab === 'payment' && (
            <div className="space-y-6">
              {/* Connection Banner + Add Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-amber-500/10 via-gold-500/10 to-transparent p-5 rounded-2xl border border-gold-500/30">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gold-700">⚡ Live Connected to: Storefront Checkout (Step 3: Payment Options)</span>
                  </div>
                  <h3 className="text-base font-serif font-bold text-charcoal-900 mt-0.5">Payment Gateways & Options</h3>
                  <p className="text-xs text-gray-500">Enable or add payment options that customers can choose at checkout.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddPaymentModal(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-charcoal-900 to-black hover:from-black hover:to-charcoal-900 text-gold-400 font-extrabold text-xs shadow-lg transition-all cursor-pointer shrink-0 border border-gold-500/30"
                >
                  <FiPlus className="w-4 h-4 text-gold-400" /> + Add Payment Option
                </button>
              </div>

              {/* Standard Gateways */}
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-gray-50 transition">
                  <input type="checkbox" name="isCODEnabled" checked={settings.isCODEnabled} onChange={handleChange} className="w-5 h-5 text-gold-500 rounded" />
                  <div>
                    <span className="font-bold text-charcoal-900 block">Cash On Delivery (COD)</span>
                    <span className="text-xs text-gray-500">Allow customers to pay cash upon order receipt</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-gray-50 transition">
                  <input type="checkbox" name="isRazorpayEnabled" checked={settings.isRazorpayEnabled} onChange={handleChange} className="w-5 h-5 text-gold-500 rounded" />
                  <div>
                    <span className="font-bold text-charcoal-900 block">Razorpay UPI & Cards</span>
                    <span className="text-xs text-gray-500">Enable instant online payments via UPI, NetBanking & Cards</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-gray-50 transition">
                  <input type="checkbox" name="isStripeEnabled" checked={settings.isStripeEnabled} onChange={handleChange} className="w-5 h-5 text-gold-500 rounded" />
                  <div>
                    <span className="font-bold text-charcoal-900 block">Stripe International</span>
                    <span className="text-xs text-gray-500">Accept global credit and debit cards worldwide</span>
                  </div>
                </label>
              </div>

              {/* Custom Gateways */}
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-charcoal-900">Custom Payment Gateways & Methods</h4>
                  <button
                    type="button"
                    onClick={() => setShowAddPaymentModal(true)}
                    className="text-xs font-bold text-gold-600 hover:text-gold-700 cursor-pointer flex items-center gap-1"
                  >
                    <FiPlus className="w-3.5 h-3.5" /> Add Payment Method
                  </button>
                </div>

                {customPaymentMethods.length === 0 ? (
                  <div
                    onClick={() => setShowAddPaymentModal(true)}
                    className="p-6 rounded-2xl border-2 border-dashed border-gray-300 hover:border-gold-500 bg-gray-50 hover:bg-gold-50/20 text-center transition cursor-pointer"
                  >
                    <FiCreditCard className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-xs font-bold text-charcoal-900">No custom payment gateways added</p>
                    <p className="text-[11px] text-gray-500 mt-1">Click here or the button above to add PhonePe UPI, Cashfree, Direct Bank Transfer, or Crypto Checkout.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {customPaymentMethods.map((pm) => (
                      <div key={pm.id} className="flex items-center justify-between p-4 border rounded-xl bg-gray-50/50">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-charcoal-900">{pm.name}</span>
                            <span className="text-[10px] font-mono bg-gray-200 text-gray-700 px-2 py-0.5 rounded">{pm.id}</span>
                          </div>
                          <span className="text-xs text-gray-500">{pm.description}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => toggleCustomPayment(pm.id)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                              pm.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'
                            }`}
                          >
                            {pm.enabled ? 'Active' : 'Inactive'}
                          </button>
                          <button
                            type="button"
                            onClick={() => removePaymentMethod(pm.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer transition"
                            title="Delete method"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 4: SEO Settings */}
          {activeTab === 'seo' && (
            <div className="space-y-6">
              {/* Connection Banner + Add Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-amber-500/10 via-gold-500/10 to-transparent p-5 rounded-2xl border border-gold-500/30">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gold-700">⚡ Live Connected to: Global HTML &lt;head&gt; & Search Previews</span>
                  </div>
                  <h3 className="text-base font-serif font-bold text-charcoal-900 mt-0.5">Search Engine Optimization (SEO)</h3>
                  <p className="text-xs text-gray-500">Configure global metadata and custom meta tags for search engines & social previews.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddSeoModal(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-charcoal-900 to-black hover:from-black hover:to-charcoal-900 text-gold-400 font-extrabold text-xs shadow-lg transition-all cursor-pointer shrink-0 border border-gold-500/30"
                >
                  <FiPlus className="w-4 h-4 text-gold-400" /> + Add Meta / SEO Tag
                </button>
              </div>

              <Input label="Global Meta Title" name="metaTitle" value={settings.metaTitle} onChange={handleChange} />
              <Input label="Meta Description" name="metaDescription" value={settings.metaDescription} onChange={handleChange} />
              <Input label="Meta Keywords (Comma separated)" name="metaKeywords" value={settings.metaKeywords} onChange={handleChange} />

              {/* Custom SEO Tags List */}
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-charcoal-900">Custom SEO & Open Graph Tags</h4>
                  <button
                    type="button"
                    onClick={() => setShowAddSeoModal(true)}
                    className="text-xs font-bold text-gold-600 hover:text-gold-700 cursor-pointer flex items-center gap-1"
                  >
                    <FiPlus className="w-3.5 h-3.5" /> Add Tag
                  </button>
                </div>

                {customSeoTags.length === 0 ? (
                  <div
                    onClick={() => setShowAddSeoModal(true)}
                    className="p-6 rounded-2xl border-2 border-dashed border-gray-300 hover:border-gold-500 bg-gray-50 hover:bg-gold-50/20 text-center transition cursor-pointer"
                  >
                    <FiSearch className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-xs font-bold text-charcoal-900">No custom meta tags added</p>
                    <p className="text-[11px] text-gray-500 mt-1">Click here or the button above to add custom tags (e.g. og:image, twitter:card, author, canonical).</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {customSeoTags.map((tag) => (
                      <div key={tag.id} className="flex items-center justify-between p-3.5 border rounded-xl bg-gray-50 text-xs">
                        <div className="flex-1 pr-4">
                          <span className="font-mono font-bold text-gold-700 bg-gold-50 px-2 py-0.5 rounded border border-gold-200 mr-2">
                            {tag.type}:{tag.key}
                          </span>
                          <span className="text-gray-700 font-mono break-all">{tag.value}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleCustomSeo(tag.id)}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer ${
                              tag.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'
                            }`}
                          >
                            {tag.enabled ? 'Active' : 'Disabled'}
                          </button>
                          <button
                            type="button"
                            onClick={() => removeSeoTag(tag.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded cursor-pointer"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 5: Checkout Form Fields */}
          {activeTab === 'checkout' && (
            <div className="space-y-6">
              {/* Connection Banner + Add Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-amber-500/10 via-gold-500/10 to-transparent p-5 rounded-2xl border border-gold-500/30">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gold-700">⚡ Live Connected to: Storefront Checkout (Address Form & Validation)</span>
                  </div>
                  <h3 className="text-base font-serif font-bold text-charcoal-900 mt-0.5">Checkout Address Form Fields</h3>
                  <p className="text-xs text-gray-500">Configure which fields appear when customers add their shipping address at checkout.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddCheckoutFieldModal(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-charcoal-900 to-black hover:from-black hover:to-charcoal-900 text-gold-400 font-extrabold text-xs shadow-lg transition-all cursor-pointer shrink-0 border border-gold-500/30"
                >
                  <FiPlus className="w-4 h-4 text-gold-400" /> + Add Checkout Field
                </button>
              </div>

              <div className="space-y-3">
                {Object.entries(checkoutFields).map(([key, field]) => (
                  <div key={key} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-xl hover:bg-gray-50 transition gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-charcoal-900">{field.label}</span>
                        {field.isCustom && (
                          <span className="text-[10px] uppercase font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">Custom Field</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 font-mono">Field key: {key} • {field.type || 'text'}</span>
                    </div>

                    <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <span className="text-xs font-semibold text-gray-500">Show</span>
                        <button
                          type="button"
                          onClick={() => setCheckoutFields(prev => ({
                            ...prev,
                            [key]: { ...prev[key], enabled: !prev[key].enabled, required: !prev[key].enabled ? prev[key].required : false }
                          }))}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${field.enabled ? 'bg-emerald-500' : 'bg-gray-300'}`}
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
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${!field.enabled ? 'bg-gray-200 opacity-50 cursor-not-allowed' : field.required ? 'bg-amber-500' : 'bg-gray-300'}`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${field.required ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </label>

                      {field.isCustom && (
                        <button
                          type="button"
                          onClick={() => removeCheckoutField(key)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer transition"
                          title="Delete Custom Field"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      )}
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

      {/* Modal: Add Checkout Field */}
      {showAddCheckoutFieldModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-serif font-bold text-lg text-charcoal-900">Add New Checkout Address Field</h3>
              <button onClick={() => setShowAddCheckoutFieldModal(false)} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
            </div>
            <form onSubmit={handleAddCheckoutField} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-charcoal-900 uppercase mb-1">Field Identifier Key *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. apartment, floorNumber, gstNumber, landmark"
                  value={newCheckoutField.key}
                  onChange={(e) => setNewCheckoutField({ ...newCheckoutField, key: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono bg-gray-50 focus:bg-white focus:outline-none focus:border-gold-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-charcoal-900 uppercase mb-1">Display Label *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apartment / Suite / Floor, GST Number"
                  value={newCheckoutField.label}
                  onChange={(e) => setNewCheckoutField({ ...newCheckoutField, label: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border text-xs bg-gray-50 focus:bg-white focus:outline-none focus:border-gold-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-charcoal-900 uppercase mb-1">Field Type</label>
                  <select
                    value={newCheckoutField.type}
                    onChange={(e) => setNewCheckoutField({ ...newCheckoutField, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border text-xs bg-gray-50 focus:bg-white"
                  >
                    <option value="text">Text</option>
                    <option value="tel">Phone / Number</option>
                    <option value="textarea">Textarea</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-charcoal-900 uppercase mb-1">Placeholder</label>
                  <input
                    type="text"
                    placeholder="e.g. Near Big Bazaar"
                    value={newCheckoutField.placeholder}
                    onChange={(e) => setNewCheckoutField({ ...newCheckoutField, placeholder: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border text-xs bg-gray-50 focus:bg-white"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 pt-2 text-xs font-bold text-charcoal-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newCheckoutField.required}
                  onChange={(e) => setNewCheckoutField({ ...newCheckoutField, required: e.target.checked })}
                  className="w-4 h-4 rounded text-gold-500"
                />
                <span>Mandatory / Required for Customer</span>
              </label>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowAddCheckoutFieldModal(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl text-xs font-extrabold bg-gold-500 hover:bg-gold-400 text-charcoal-900 shadow">Add Checkout Field</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Payment Method */}
      {showAddPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-serif font-bold text-lg text-charcoal-900">Add Custom Payment Option</h3>
              <button onClick={() => setShowAddPaymentModal(false)} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
            </div>
            <form onSubmit={handleAddPaymentMethod} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-charcoal-900 uppercase mb-1">Gateway ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PHONEPE_UPI, CASHFREE, BANK_TRANSFER"
                  value={newPaymentMethod.id}
                  onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, id: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono uppercase bg-gray-50 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-charcoal-900 uppercase mb-1">Display Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PhonePe UPI & Wallets, Direct Bank Transfer"
                  value={newPaymentMethod.name}
                  onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border text-xs bg-gray-50 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-charcoal-900 uppercase mb-1">Instructions / Description</label>
                <input
                  type="text"
                  placeholder="e.g. Instant QR Scan & UPI Payment"
                  value={newPaymentMethod.description}
                  onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border text-xs bg-gray-50 focus:bg-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowAddPaymentModal(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl text-xs font-extrabold bg-gold-500 hover:bg-gold-400 text-charcoal-900 shadow">Add Payment Option</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Shipping Tier */}
      {showAddShippingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-serif font-bold text-lg text-charcoal-900">Add Delivery / Shipping Tier</h3>
              <button onClick={() => setShowAddShippingModal(false)} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
            </div>
            <form onSubmit={handleAddShippingTier} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-charcoal-900 uppercase mb-1">Tier Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Express Next-Day Air, Same-Day Courier, Store VIP Pickup"
                  value={newShippingTier.name}
                  onChange={(e) => setNewShippingTier({ ...newShippingTier, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border text-xs bg-gray-50 focus:bg-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-charcoal-900 uppercase mb-1">Cost (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 199"
                    value={newShippingTier.price}
                    onChange={(e) => setNewShippingTier({ ...newShippingTier, price: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border text-xs bg-gray-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-charcoal-900 uppercase mb-1">Delivery Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 24 Hours, 1-2 Days"
                    value={newShippingTier.deliveryDays}
                    onChange={(e) => setNewShippingTier({ ...newShippingTier, deliveryDays: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border text-xs bg-gray-50 focus:bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-charcoal-900 uppercase mb-1">Free Shipping Above (₹) (Optional)</label>
                <input
                  type="number"
                  placeholder="e.g. 2499 (0 for no free threshold)"
                  value={newShippingTier.freeThreshold}
                  onChange={(e) => setNewShippingTier({ ...newShippingTier, freeThreshold: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border text-xs bg-gray-50 focus:bg-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowAddShippingModal(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl text-xs font-extrabold bg-gold-500 hover:bg-gold-400 text-charcoal-900 shadow">Add Shipping Tier</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add SEO Tag */}
      {showAddSeoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-serif font-bold text-lg text-charcoal-900">Add Custom SEO / Meta Tag</h3>
              <button onClick={() => setShowAddSeoModal(false)} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
            </div>
            <form onSubmit={handleAddSeoTag} className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-charcoal-900 uppercase mb-1">Tag Type</label>
                  <select
                    value={newSeoTag.type}
                    onChange={(e) => setNewSeoTag({ ...newSeoTag, type: e.target.value })}
                    className="w-full px-2 py-2.5 rounded-xl border text-xs bg-gray-50 focus:bg-white"
                  >
                    <option value="name">name</option>
                    <option value="property">property (og:)</option>
                    <option value="http-equiv">http-equiv</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-charcoal-900 uppercase mb-1">Tag Key / Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. og:image, twitter:card, author"
                    value={newSeoTag.key}
                    onChange={(e) => setNewSeoTag({ ...newSeoTag, key: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border text-xs font-mono bg-gray-50 focus:bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-charcoal-900 uppercase mb-1">Content / Value *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. https://domain.com/og-banner.jpg or summary_large_image"
                  value={newSeoTag.value}
                  onChange={(e) => setNewSeoTag({ ...newSeoTag, value: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border text-xs bg-gray-50 focus:bg-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowAddSeoModal(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl text-xs font-extrabold bg-gold-500 hover:bg-gold-400 text-charcoal-900 shadow">Add Meta Tag</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;

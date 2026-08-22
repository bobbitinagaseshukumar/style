import React, { useMemo } from 'react';
import { FiTrendingUp, FiDollarSign } from 'react-icons/fi';

const NumInput = ({ label, value, onChange, prefix, suffix, hint, required, disabled }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    <div className="relative">
      {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">{prefix}</span>}
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-yellow-400 focus:outline-none ${prefix ? 'pl-8' : 'px-4'} ${suffix ? 'pr-10' : ''} ${disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}`}
        placeholder="0"
      />
      {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{suffix}</span>}
    </div>
    {hint && <p className={`text-xs mt-1 ${disabled ? 'text-amber-500 font-semibold' : 'text-gray-400'}`}>{hint}</p>}
  </div>
);

const StatCard = ({ label, value, sub, color = 'gray' }) => {
  const colors = {
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    green: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    gray: 'bg-gray-50 border-gray-200 text-gray-700',
  };
  return (
    <div className={`px-4 py-3 rounded-xl border ${colors[color]}`}>
      <p className="text-xs font-semibold uppercase tracking-wider opacity-70">{label}</p>
      <p className="text-xl font-black mt-0.5">{value}</p>
      {sub && <p className="text-[11px] opacity-60 mt-0.5">{sub}</p>}
    </div>
  );
};

const GST_RATES = ['0%', '5%', '12%', '18%', '28%'];
const SHIPPING_CLASSES = ['Standard', 'Express', 'Free', 'Heavy', 'Fragile'];

const PricingStep = ({ form, onChange }) => {
  const handle = (key) => (val) => onChange(key, val);

  const mrp = parseFloat(form.mrp) || 0;
  const costPrice = parseFloat(form.costPrice) || 0;
  const discPct = parseFloat(form.discountPercent) || 0;
  const gstRate = parseFloat((form.gst || '0%').replace('%', '')) || 0;
  const weight = parseFloat(form.weight) || 0;

  const sellingPrice = useMemo(() => {
    if (form.sellingPrice) return parseFloat(form.sellingPrice);
    return mrp > 0 && discPct > 0 ? +(mrp * (1 - discPct / 100)).toFixed(2) : mrp;
  }, [form.sellingPrice, mrp, discPct]);

  const discountAmount = mrp - sellingPrice;
  const gstAmount = +(sellingPrice * gstRate / 100).toFixed(2);
  const finalPrice = +(sellingPrice + gstAmount).toFixed(2);
  const profit = costPrice > 0 ? +(sellingPrice - costPrice).toFixed(2) : null;
  const margin = profit !== null && costPrice > 0 ? +((profit / costPrice) * 100).toFixed(1) : null;

  // Sync calculated sellingPrice back
  const handleMRP = (v) => {
    onChange('mrp', v);
    if (!form.sellingPrice) {
      const sp = parseFloat(v) * (1 - discPct / 100);
      if (!isNaN(sp)) onChange('sellingPrice', sp.toFixed(2));
    }
  };
  const handleDisc = (v) => {
    onChange('discountPercent', v);
    if (mrp > 0) onChange('sellingPrice', (mrp * (1 - parseFloat(v || 0) / 100)).toFixed(2));
  };

  const fmtINR = (n) => isNaN(n) || n === 0 ? '—' : `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Pricing & Inventory</h2>
        <p className="text-sm text-gray-500 mt-0.5">Set pricing and stock. Per-color pricing can be overridden in Color Variants.</p>
      </div>

      {/* Pricing */}
      <div className="bg-gray-50 rounded-2xl p-5 space-y-4">
        <h3 className="font-bold text-gray-700 text-sm uppercase tracking-widest">Base Pricing</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <NumInput label="MRP" required value={form.mrp} onChange={handleMRP} prefix="₹" hint="Maximum Retail Price (on label)" />
          <NumInput label="Selling Price" required value={form.sellingPrice} onChange={handle('sellingPrice')} prefix="₹" hint="What customer pays (after discount)" />
          <NumInput label="Cost Price" value={form.costPrice} onChange={handle('costPrice')} prefix="₹" hint="Your purchase cost (private)" />
          <NumInput label="Discount %" value={form.discountPercent} onChange={handleDisc} suffix="%" hint="Auto-calculates selling price from MRP" />
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">GST Rate</label>
            <select
              value={form.gst}
              onChange={e => onChange('gst', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-yellow-400 focus:outline-none bg-white"
            >
              {GST_RATES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <NumInput label="Min Purchase Qty" value={form.minQty} onChange={handle('minQty')} hint="Default: 1" />
        </div>
      </div>

      {/* Auto Calculations */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="MRP" value={fmtINR(mrp)} color="gray" />
        <StatCard label="Selling Price" value={fmtINR(sellingPrice)} color="yellow" />
        <StatCard label="Discount" value={fmtINR(discountAmount)} sub={discPct > 0 ? `${discPct}% off` : ''} color="blue" />
        <StatCard label="Final (incl. GST)" value={fmtINR(finalPrice)} sub={gstRate > 0 ? `GST: ₹${gstAmount}` : ''} color="green" />
        {profit !== null && <StatCard label="Profit per unit" value={fmtINR(profit)} color={profit >= 0 ? 'green' : 'red'} />}
        {margin !== null && <StatCard label="Margin" value={`${margin}%`} color={margin >= 20 ? 'green' : margin >= 0 ? 'yellow' : 'red'} />}
      </div>

      {/* Inventory */}
      <div className="bg-gray-50 rounded-2xl p-5 space-y-4">
        <h3 className="font-bold text-gray-700 text-sm uppercase tracking-widest">Inventory</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <NumInput label="Base Stock" required value={form.stock} onChange={handle('stock')} hint="Total units available" />
          <NumInput label="Low Stock Alert" value={form.lowStockAlert} onChange={handle('lowStockAlert')} hint="Alert when stock falls below this" />
          <NumInput label="Max Purchase Limit" value={form.maxQty} onChange={handle('maxQty')} hint="Per-order limit per customer" />
        </div>
        <div className="flex flex-wrap gap-4 pt-2">
          {[
            { key: 'freeShipping', label: '🚚 Free Shipping' },
            { key: 'cashOnDelivery', label: '💵 Cash on Delivery' },
            { key: 'preOrder', label: '⏳ Pre-Order' },
            { key: 'backOrder', label: '🔄 Back Order' },
            { key: 'returnAvailable', label: '↩️ Returns Accepted' },
            { key: 'replacementAvailable', label: '🔁 Replacement' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2.5 cursor-pointer group">
              <div
                className={`w-10 h-5 rounded-full transition-colors relative ${form[key] ? 'bg-yellow-400' : 'bg-gray-200'}`}
                onClick={() => onChange(key, !form[key])}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form[key] ? 'left-5' : 'left-0.5'}`} />
              </div>
              <span className="text-sm font-medium text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Shipping Dimensions & Fee */}
      <div className="bg-gray-50 rounded-2xl p-5 space-y-4">
        <h3 className="font-bold text-gray-700 text-sm uppercase tracking-widest">Shipping Details</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <NumInput label="Weight" value={form.weight} onChange={handle('weight')} suffix="kg" />
          <NumInput label="Length" value={form.length} onChange={handle('length')} suffix="cm" />
          <NumInput label="Width" value={form.width} onChange={handle('width')} suffix="cm" />
          <NumInput label="Height" value={form.height} onChange={handle('height')} suffix="cm" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <NumInput
            label="Shipping / Delivery Fee"
            value={form.freeShipping ? 0 : (form.shippingFee || '')}
            onChange={handle('shippingFee')}
            prefix="₹"
            disabled={!!form.freeShipping}
            hint={form.freeShipping ? '⚠️ Turn OFF "Free Shipping" toggle above to set a custom delivery fee' : 'Per-unit delivery charge — this amount is added at checkout'}
          />
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Shipping Class</label>
            <select value={form.shippingClass} onChange={e => onChange('shippingClass', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-yellow-400 focus:outline-none bg-white">
              {SHIPPING_CLASSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Estimated Delivery</label>
            <input type="text" value={form.estimatedDelivery} onChange={e => onChange('estimatedDelivery', e.target.value)}
              placeholder="e.g. 3-5 Business Days"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-yellow-400 focus:outline-none" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingStep;

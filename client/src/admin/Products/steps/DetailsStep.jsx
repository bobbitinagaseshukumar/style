import React from 'react';
import { FiInfo } from 'react-icons/fi';

const Field = ({ label, required, children, hint }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    {children}
    {hint && <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><FiInfo size={10}/>{hint}</p>}
  </div>
);

const TextInput = ({ value, onChange, placeholder, name, ...rest }) => (
  <input
    type="text"
    name={name}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:ring-2 focus:ring-yellow-400 focus:outline-none transition bg-white"
    {...rest}
  />
);

const TextArea = ({ value, onChange, placeholder, rows = 3 }) => (
  <textarea
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    rows={rows}
    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:ring-2 focus:ring-yellow-400 focus:outline-none transition bg-white resize-none"
  />
);

const SelectInput = ({ value, onChange, options, placeholder }) => (
  <select
    value={value}
    onChange={onChange}
    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:ring-2 focus:ring-yellow-400 focus:outline-none transition bg-white"
  >
    <option value="">{placeholder || 'Select...'}</option>
    {options.map(o => (
      <option key={typeof o === 'string' ? o : o.value} value={typeof o === 'string' ? o : o.value}>
        {typeof o === 'string' ? o : o.label}
      </option>
    ))}
  </select>
);

const DetailsStep = ({ form, onChange }) => {
  const handle = (key) => (e) => onChange(key, e.target.value);

  const genderOptions = ['Male', 'Female', 'Unisex', 'Boys', 'Girls', 'Infants'];
  const occasionOptions = ['Casual', 'Formal', 'Party', 'Wedding', 'Festival', 'Sports', 'Ethnic', 'Daily Wear'];
  const seasonOptions = ['All Season', 'Summer', 'Winter', 'Monsoon', 'Spring'];
  const ageGroups = ['All Ages', 'Infants (0-1yr)', 'Toddler (1-3yr)', 'Kids (3-10yr)', 'Teen (10-18yr)', 'Adult (18+)'];
  const fabricOptions = ['Cotton', 'Silk', 'Polyester', 'Linen', 'Wool', 'Denim', 'Chiffon', 'Georgette', 'Rayon', 'Velvet', 'Nylon', 'Blended'];
  const patternOptions = ['Solid', 'Printed', 'Striped', 'Checkered', 'Floral', 'Abstract', 'Embroidered', 'Woven', 'Self Design'];
  const fitOptions = ['Regular Fit', 'Slim Fit', 'Loose Fit', 'Oversized', 'Tailored Fit'];
  const sleeveOptions = ['Full Sleeve', 'Half Sleeve', 'Sleeveless', 'Three-Quarter Sleeve', 'Cap Sleeve'];
  const neckOptions = ['Round Neck', 'V-Neck', 'Collar', 'Turtle Neck', 'Boat Neck', 'Polo Collar', 'Hooded'];

  const autoSKU = `SV-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Product Details</h2>
        <p className="text-sm text-gray-500 mt-0.5">Enter complete product information for best search visibility</p>
      </div>

      {/* Basic Info */}
      <div className="bg-gray-50 rounded-2xl p-5 space-y-4">
        <h3 className="font-bold text-gray-700 text-sm uppercase tracking-widest">Basic Information</h3>

        <Field label="Product Name" required>
          <TextInput value={form.name} onChange={handle('name')} placeholder="e.g. Premium Designer Silk Saree" />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Brand / Label">
            <TextInput value={form.brand} onChange={handle('brand')} placeholder="e.g. StyleVerse, Handmade" />
          </Field>
          <Field label="SKU" hint="Leave blank to auto-generate">
            <div className="flex gap-2">
              <TextInput value={form.sku} onChange={handle('sku')} placeholder={autoSKU} />
              <button
                type="button"
                onClick={() => onChange('sku', autoSKU)}
                className="px-3 py-2 rounded-xl border border-yellow-300 bg-yellow-50 text-yellow-700 text-xs font-bold hover:bg-yellow-100 transition whitespace-nowrap"
              >
                Auto
              </button>
            </div>
          </Field>
        </div>

        <Field label="Short Description" required hint="Shown on product cards — keep under 100 characters">
          <TextInput value={form.shortDesc} onChange={handle('shortDesc')} placeholder="e.g. Handcrafted banarasi silk saree with golden zari work" />
        </Field>

        <Field label="Full Description" required>
          <TextArea rows={5} value={form.description} onChange={handle('description')} placeholder="Detailed product description with features, benefits, and styling tips..." />
        </Field>
      </div>

      {/* Fabric & Material */}
      <div className="bg-gray-50 rounded-2xl p-5 space-y-4">
        <h3 className="font-bold text-gray-700 text-sm uppercase tracking-widest">Fabric & Material</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Fabric Type">
            <SelectInput value={form.fabric} onChange={handle('fabric')} options={fabricOptions} placeholder="Select fabric" />
          </Field>
          <Field label="Material">
            <TextInput value={form.material} onChange={handle('material')} placeholder="e.g. 100% Pure Silk" />
          </Field>
          <Field label="Pattern">
            <SelectInput value={form.pattern} onChange={handle('pattern')} options={patternOptions} placeholder="Select pattern" />
          </Field>
          <Field label="Wash Care">
            <TextInput value={form.washCare} onChange={handle('washCare')} placeholder="e.g. Dry Clean Only" />
          </Field>
        </div>
      </div>

      {/* Style & Fit */}
      <div className="bg-gray-50 rounded-2xl p-5 space-y-4">
        <h3 className="font-bold text-gray-700 text-sm uppercase tracking-widest">Style & Fit</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Fit Type">
            <SelectInput value={form.fit} onChange={handle('fit')} options={fitOptions} placeholder="Select fit" />
          </Field>
          <Field label="Sleeve Type">
            <SelectInput value={form.sleeve} onChange={handle('sleeve')} options={sleeveOptions} placeholder="Select sleeve" />
          </Field>
          <Field label="Neck / Collar">
            <SelectInput value={form.neck} onChange={handle('neck')} options={neckOptions} placeholder="Select neckline" />
          </Field>
          <Field label="Occasion">
            <SelectInput value={form.occasion} onChange={handle('occasion')} options={occasionOptions} placeholder="Select occasion" />
          </Field>
        </div>
      </div>

      {/* Classification */}
      <div className="bg-gray-50 rounded-2xl p-5 space-y-4">
        <h3 className="font-bold text-gray-700 text-sm uppercase tracking-widest">Classification</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Gender" required>
            <SelectInput value={form.gender} onChange={handle('gender')} options={genderOptions} placeholder="Select gender" />
          </Field>
          <Field label="Age Group">
            <SelectInput value={form.ageGroup} onChange={handle('ageGroup')} options={ageGroups} placeholder="Select age group" />
          </Field>
          <Field label="Season">
            <SelectInput value={form.season} onChange={handle('season')} options={seasonOptions} placeholder="Select season" />
          </Field>
          <Field label="Country of Origin">
            <TextInput value={form.countryOfOrigin} onChange={handle('countryOfOrigin')} placeholder="e.g. India" />
          </Field>
          <Field label="Manufacturer">
            <TextInput value={form.manufacturer} onChange={handle('manufacturer')} placeholder="e.g. Kumar Textiles Pvt Ltd" />
          </Field>
          <Field label="Warranty">
            <TextInput value={form.warranty} onChange={handle('warranty')} placeholder="e.g. 7 days return policy" />
          </Field>
        </div>
      </div>
    </div>
  );
};

export default DetailsStep;

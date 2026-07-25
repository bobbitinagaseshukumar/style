import React, { useState } from 'react';
import Modal from './Modal';

const sizeData = {
  Kurtis: [
    { size: 'S', bust: '34"', waist: '30"', hip: '38"' },
    { size: 'M', bust: '36"', waist: '32"', hip: '40"' },
    { size: 'L', bust: '38"', waist: '34"', hip: '42"' },
    { size: 'XL', bust: '40"', waist: '36"', hip: '44"' },
    { size: 'XXL', bust: '42"', waist: '38"', hip: '46"' },
  ],
  Sarees: [
    { item: 'Saree Length', length: '5.5 Meters (6.0 Yards)' },
    { item: 'Blouse Piece Length', length: '0.8 Meters (Unstitched)' },
    { item: 'Saree Width', length: '44 Inches (1.1 Meters)' },
  ],
  Jewellery: [
    { item: 'Necklace Choker Length', length: '14 - 16 Inches (Adjustable Dori)' },
    { item: 'Earring Drop Length', length: '2.5 - 3.5 Inches' },
    { item: 'Bangle Size 2.4', length: '2.25 Inches Inner Diameter' },
    { item: 'Bangle Size 2.6', length: '2.37 Inches Inner Diameter' },
  ],
};

const SizeGuideModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('Kurtis');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Interactive Size & Fit Guide">
      <div className="space-y-4 text-xs">
        {/* Category Selector Tabs */}
        <div className="flex gap-2 border-b pb-2">
          {Object.keys(sizeData).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`px-3 py-1.5 rounded-full font-bold transition ${
                activeTab === cat ? 'bg-gold-500 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Table Content */}
        <div className="border rounded-2xl overflow-hidden bg-gray-50/50">
          {activeTab === 'Kurtis' && (
            <table className="w-full text-left">
              <thead className="bg-gray-100 font-bold text-charcoal-900">
                <tr>
                  <th className="p-3">Size Tag</th>
                  <th className="p-3">Bust (Inches)</th>
                  <th className="p-3">Waist (Inches)</th>
                  <th className="p-3">Hip (Inches)</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sizeData.Kurtis.map((row) => (
                  <tr key={row.size} className="hover:bg-white">
                    <td className="p-3 font-bold text-gold-700">{row.size}</td>
                    <td className="p-3">{row.bust}</td>
                    <td className="p-3">{row.waist}</td>
                    <td className="p-3">{row.hip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'Sarees' && (
            <table className="w-full text-left">
              <thead className="bg-gray-100 font-bold text-charcoal-900">
                <tr>
                  <th className="p-3">Component</th>
                  <th className="p-3">Standard Dimensions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sizeData.Sarees.map((row, i) => (
                  <tr key={i} className="hover:bg-white">
                    <td className="p-3 font-bold text-charcoal-900">{row.item}</td>
                    <td className="p-3 text-gold-700 font-medium">{row.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'Jewellery' && (
            <table className="w-full text-left">
              <thead className="bg-gray-100 font-bold text-charcoal-900">
                <tr>
                  <th className="p-3">Jewellery Type</th>
                  <th className="p-3">Standard Fit & Sizing</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sizeData.Jewellery.map((row, i) => (
                  <tr key={i} className="hover:bg-white">
                    <td className="p-3 font-bold text-charcoal-900">{row.item}</td>
                    <td className="p-3 text-gold-700 font-medium">{row.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <p className="text-[11px] text-gray-400 font-medium">
          💡 Tip: Measurements are body measurements. For relaxed kurtis, choose one size larger.
        </p>
      </div>
    </Modal>
  );
};

export default SizeGuideModal;

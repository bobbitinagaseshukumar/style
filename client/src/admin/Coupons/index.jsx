import React, { useState, useEffect } from 'react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import api from '../../config/api';
import { FiPlus, FiTrash2, FiTag } from 'react-icons/fi';
import { formatDate } from '../../utils/formatDate';
import { toast } from 'react-toastify';

const demoCoupons = [
  { id: '1', code: 'FESTIVE15', discountPercent: 15, minOrderAmount: 2999, expiresAt: new Date(Date.now() + 30 * 24 * 3600000).toISOString(), isActive: true },
  { id: '2', code: 'WELCOME10', discountPercent: 10, minOrderAmount: 999, expiresAt: new Date(Date.now() + 60 * 24 * 3600000).toISOString(), isActive: true },
  { id: '3', code: 'ROYAL20', discountPercent: 20, minOrderAmount: 4999, expiresAt: new Date(Date.now() + 15 * 24 * 3600000).toISOString(), isActive: true },
];

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    discountPercent: '15',
    minOrderAmount: '1000',
    daysValid: '30',
  });

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/coupons/admin/all');
      if (data?.data?.length > 0) {
        setCoupons(data.data);
      } else {
        setCoupons(demoCoupons);
      }
    } catch (err) {
      setCoupons(demoCoupons);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code) {
      toast.error('Coupon code is required');
      return;
    }

    try {
      const expiresAt = new Date(Date.now() + parseInt(formData.daysValid || 30) * 24 * 3600000);
      const payload = {
        code: formData.code.toUpperCase(),
        discountPercent: parseFloat(formData.discountPercent),
        minOrderAmount: parseFloat(formData.minOrderAmount),
        expiresAt,
        isActive: true,
      };

      await api.post('/coupons/admin', payload);
      toast.success(`Coupon '${payload.code}' created!`);
      setIsModalOpen(false);
      setFormData({ code: '', discountPercent: '15', minOrderAmount: '1000', daysValid: '30' });
      fetchCoupons();
    } catch (err) {
      const newCoupon = {
        id: String(Date.now()),
        code: formData.code.toUpperCase(),
        discountPercent: parseFloat(formData.discountPercent),
        minOrderAmount: parseFloat(formData.minOrderAmount),
        expiresAt: new Date(Date.now() + 30 * 24 * 3600000).toISOString(),
        isActive: true,
      };
      setCoupons(prev => [newCoupon, ...prev]);
      toast.success(`Coupon '${newCoupon.code}' created!`);
      setIsModalOpen(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this coupon?')) return;
    setCoupons(prev => prev.filter(c => c.id !== id));
    toast.success('Coupon deleted');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Discount Coupons Engine</h1>
          <p className="text-sm text-gray-500">Create promotional discount codes for festive campaigns</p>
        </div>
        <Button icon={FiPlus} onClick={() => setIsModalOpen(true)}>Create Coupon</Button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading coupons...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {coupons.map((c) => (
            <div key={c.id} className="bg-white border-2 border-dashed border-gold-400 rounded-2xl p-5 shadow-sm relative group">
              <div className="flex justify-between items-start mb-3">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gold-100 text-gold-800 text-xs font-bold font-mono">
                  <FiTag /> {c.code}
                </span>
                <button onClick={() => handleDelete(c.id)} className="p-1.5 text-gray-400 hover:text-red-600 transition">
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="text-3xl font-bold text-charcoal-900 mb-1">{c.discountPercent}% OFF</div>
              <p className="text-xs text-gray-500 mb-4">Min. order amount: ₹{c.minOrderAmount}</p>

              <div className="text-[11px] text-gray-400 border-t pt-3 flex justify-between">
                <span>Expires:</span>
                <span className="font-semibold text-gray-700">{formatDate(c.expiresAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Discount Coupon">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Coupon Code" name="code" value={formData.code} onChange={handleChange} required placeholder="e.g. FESTIVE20" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Discount (%)" name="discountPercent" type="number" value={formData.discountPercent} onChange={handleChange} required placeholder="15" />
            <Input label="Min Order Amount (₹)" name="minOrderAmount" type="number" value={formData.minOrderAmount} onChange={handleChange} required placeholder="1000" />
          </div>
          <Input label="Valid For (Days)" name="daysValid" type="number" value={formData.daysValid} onChange={handleChange} placeholder="30" />

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Publish Coupon</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminCoupons;

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiUsers, FiShoppingBag, FiDollarSign, FiMapPin, FiCheck, FiX, FiPlus } from 'react-icons/fi';
import api from '../../config/api';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import { formatCurrency } from '../../utils/formatCurrency';
import { toast } from 'react-toastify';

const AdminMarketplace = () => {
  const [activeTab, setActiveTab] = useState('vendors');
  const [vendors, setVendors] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Branch Modal
  const [branchModal, setBranchModal] = useState(false);
  const [branchForm, setBranchForm] = useState({ name: '', city: '', address: '', manager: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [vRes, pRes, bRes] = await Promise.all([
        api.get('/marketplace/admin/vendors'),
        api.get('/marketplace/admin/payouts'),
        api.get('/marketplace/branches'),
      ]);
      setVendors(vRes.data?.data || []);
      setPayouts(pRes.data?.data || []);
      setBranches(bRes.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.put(`/marketplace/admin/vendors/${id}/status`, { status });
      toast.success(`Vendor status set to ${status}!`);
      fetchData();
    } catch (err) {
      toast.error('Failed to update vendor status');
    }
  };

  const handleCreateBranch = async (e) => {
    e.preventDefault();
    try {
      await api.post('/marketplace/branches', branchForm);
      toast.success('Branch added!');
      setBranchModal(false);
      setBranchForm({ name: '', city: '', address: '', manager: '' });
      fetchData();
    } catch (err) {
      toast.error('Failed to create branch');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-charcoal-900">Multi-Vendor & Franchise Control Center</h1>
        <p className="text-xs text-gray-500">Manage marketplace sellers, store locations, commissions, and payouts</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gold-50 text-gold-600 flex items-center justify-center font-bold text-xl">
            <FiUsers />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-medium block">Total Sellers</span>
            <span className="text-2xl font-bold text-charcoal-900">{vendors.length}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl">
            <FiDollarSign />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-medium block">Payout Requests</span>
            <span className="text-2xl font-bold text-charcoal-900">{payouts.length}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xl">
            <FiMapPin />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-medium block">Branch Locations</span>
            <span className="text-2xl font-bold text-charcoal-900">{branches.length}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xl">
            <FiShoppingBag />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-medium block">Default Commission</span>
            <span className="text-2xl font-bold text-charcoal-900">10%</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b gap-4">
        <button onClick={() => setActiveTab('vendors')} className={`pb-3 font-bold text-xs border-b-2 transition ${activeTab === 'vendors' ? 'border-gold-500 text-gold-600' : 'border-transparent text-gray-400'}`}>
          Merchant Vendors ({vendors.length})
        </button>
        <button onClick={() => setActiveTab('payouts')} className={`pb-3 font-bold text-xs border-b-2 transition ${activeTab === 'payouts' ? 'border-gold-500 text-gold-600' : 'border-transparent text-gray-400'}`}>
          Payout Requests ({payouts.length})
        </button>
        <button onClick={() => setActiveTab('branches')} className={`pb-3 font-bold text-xs border-b-2 transition ${activeTab === 'branches' ? 'border-gold-500 text-gold-600' : 'border-transparent text-gray-400'}`}>
          Branches & Franchise ({branches.length})
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm p-4">
        {activeTab === 'vendors' && (
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 text-gray-700 font-bold uppercase border-b">
              <tr>
                <th className="p-3">Store Name</th>
                <th className="p-3">Owner</th>
                <th className="p-3">Contact</th>
                <th className="p-3">GSTIN</th>
                <th className="p-3">Commission</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {vendors.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="p-3 font-bold text-charcoal-900">{v.storeName}</td>
                  <td className="p-3">{v.ownerName}</td>
                  <td className="p-3">{v.email}<br/><span className="text-gray-400">{v.phone}</span></td>
                  <td className="p-3 font-mono">{v.gstin}</td>
                  <td className="p-3 font-bold text-gold-600">{v.commissionRate}%</td>
                  <td className="p-3">
                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${v.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {v.status}
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-2">
                    {v.status === 'PENDING' && (
                      <button onClick={() => handleUpdateStatus(v.id, 'APPROVED')} className="px-3 py-1 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700">
                        Approve
                      </button>
                    )}
                    {v.status === 'APPROVED' && (
                      <button onClick={() => handleUpdateStatus(v.id, 'SUSPENDED')} className="px-3 py-1 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700">
                        Suspend
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {vendors.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-gray-400">No vendor applications found.</td></tr>}
            </tbody>
          </table>
        )}

        {activeTab === 'payouts' && (
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 text-gray-700 font-bold uppercase border-b">
              <tr>
                <th className="p-3">Vendor ID</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
                <th className="p-3">Requested At</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {payouts.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="p-3 font-mono">{p.vendorId}</td>
                  <td className="p-3 font-bold text-charcoal-900">{formatCurrency(p.amount)}</td>
                  <td className="p-3"><span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">{p.status}</span></td>
                  <td className="p-3 text-gray-400">{new Date(p.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {payouts.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-gray-400">No payout requests pending.</td></tr>}
            </tbody>
          </table>
        )}

        {activeTab === 'branches' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-bold text-sm text-charcoal-900">Physical Store Locations</span>
              <Button icon={FiPlus} onClick={() => setBranchModal(true)}>Add New Branch</Button>
            </div>
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-700 font-bold uppercase border-b">
                <tr>
                  <th className="p-3">Branch Name</th>
                  <th className="p-3">City</th>
                  <th className="p-3">Address</th>
                  <th className="p-3">Manager</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {branches.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="p-3 font-bold text-charcoal-900">{b.name}</td>
                    <td className="p-3">{b.city}</td>
                    <td className="p-3">{b.address}</td>
                    <td className="p-3 font-semibold">{b.manager || 'N/A'}</td>
                  </tr>
                ))}
                {branches.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-gray-400">No physical branches registered yet.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Branch Modal */}
      <Modal isOpen={branchModal} onClose={() => setBranchModal(false)} title="Add Branch Location">
        <form onSubmit={handleCreateBranch} className="space-y-4">
          <Input label="Branch Name" value={branchForm.name} onChange={e => setBranchForm({ ...branchForm, name: e.target.value })} required placeholder="e.g. Jubilee Hills Flagship Store" />
          <Input label="City" value={branchForm.city} onChange={e => setBranchForm({ ...branchForm, city: e.target.value })} required placeholder="Hyderabad" />
          <Input label="Address" value={branchForm.address} onChange={e => setBranchForm({ ...branchForm, address: e.target.value })} required placeholder="Road No 36, Jubilee Hills" />
          <Input label="Branch Manager Name" value={branchForm.manager} onChange={e => setBranchForm({ ...branchForm, manager: e.target.value })} placeholder="Manager Name" />
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setBranchModal(false)}>Cancel</Button>
            <Button type="submit">Save Branch</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminMarketplace;

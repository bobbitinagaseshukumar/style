import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import {
  FiUser, FiShield, FiSmartphone, FiMonitor, FiLogOut, FiTrash2,
  FiClock, FiCheck, FiRefreshCw, FiKey, FiLock, FiGlobe
} from 'react-icons/fi';
import api from '../../config/api';
import { formatDate } from '../../utils/formatDate';

const AdminProfile = () => {
  const { user } = useSelector(state => state.auth);

  const [activeTab, setActiveTab] = useState('sessions'); // 'sessions' | 'history' | 'security'
  const [trustedDevices, setTrustedDevices] = useState([]);
  const [loginHistory, setLoginHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resSessions, resHistory] = await Promise.all([
        api.get('/admin/auth/sessions'),
        api.get('/admin/auth/history')
      ]);
      setTrustedDevices(resSessions.data?.data || []);
      setLoginHistory(resHistory.data?.data || []);
    } catch {
      toast.error('Failed to load security logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRevokeSession = async (id) => {
    try {
      setActionLoading(true);
      await api.delete(`/admin/auth/sessions/${id}`);
      toast.success('Trusted device session revoked!');
      fetchData();
    } catch {
      toast.error('Revoke session failed');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Admin Profile Header */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-md">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <img
            src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Admin')}&size=120&background=D4AF37&color=fff`}
            alt=""
            className="w-20 h-20 rounded-2xl object-cover border-2 border-amber-400 shadow-md shrink-0"
          />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-gray-900">{user?.fullName || 'Administrator'}</h1>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500 text-black uppercase shadow-sm">
                {user?.adminRole || user?.role || 'SUPER_ADMIN'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-3">
              <span>Email: <strong>{user?.email}</strong></span>
              <span>• Status: <strong className="text-emerald-600">ACTIVE</strong></span>
              <span>• 2FA: <strong className="text-blue-600">Email OTP Enabled</strong></span>
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        {[
          { id: 'sessions', label: `📱 Active Sessions & Trusted Devices (${trustedDevices.length})`, icon: FiSmartphone },
          { id: 'history', label: `📜 Login Audit History (${loginHistory.length})`, icon: FiClock },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-xs font-extrabold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 border-b-2 ${
              activeTab === tab.id
                ? 'border-amber-500 text-amber-600 bg-amber-50/50'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Trusted Devices */}
      {activeTab === 'sessions' && (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <FiShield className="text-amber-500" /> 30-Day Trusted Devices & Recognized Sessions
            </h3>
            <button onClick={fetchData} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs">
              <FiRefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {trustedDevices.length === 0 ? (
            <p className="text-xs text-gray-400 py-8 text-center">No 30-day trusted devices stored. OTP is required on every login.</p>
          ) : (
            <div className="space-y-3">
              {trustedDevices.map(dev => (
                <div key={dev.id} className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-amber-100 text-amber-900 rounded-xl">
                      <FiMonitor size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{dev.deviceName || 'Browser Session'}</p>
                      <p className="text-[10px] text-gray-500 font-mono mt-0.5">IP: {dev.ipAddress} • Trusted until: {formatDate(dev.trustedUntil)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRevokeSession(dev.id)}
                    disabled={actionLoading}
                    className="px-3 py-1.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <FiTrash2 size={13} /> Revoke Trust
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Login Audit History */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <FiClock className="text-amber-500" /> Admin Security Login Audit Log
          </h3>

          {loginHistory.length === 0 ? (
            <p className="text-xs text-gray-400 py-8 text-center">No login attempts recorded yet.</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1 text-xs">
              {loginHistory.map(log => (
                <div key={log.id} className="p-3 rounded-xl border border-gray-100 bg-gray-50/50 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-gray-900">{log.adminEmail}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        log.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' :
                        log.status === 'OTP_REQUIRED' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {log.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 font-mono">IP: {log.ipAddress} • {log.browser?.substring(0, 45)}...</p>
                  </div>
                  <span className="text-[10px] text-gray-400 shrink-0">{formatDate(log.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminProfile;

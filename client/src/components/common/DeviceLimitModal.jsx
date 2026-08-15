import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMonitor, FiSmartphone, FiGlobe, FiLogOut, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../config/api';

const DeviceLimitModal = ({ isOpen, onClose, activeSessions = [], userId, email, onSessionTerminated }) => {
  const [terminatingId, setTerminatingId] = useState(null);
  const [terminatingAll, setTerminatingAll] = useState(false);

  if (!isOpen) return null;

  const handleTerminateOne = async (sessionId) => {
    try {
      setTerminatingId(sessionId);
      await api.post('/auth/terminate-session', { sessionId, userId, email });
      toast.success('Device logged out successfully! Retrying login...');
      if (onSessionTerminated) onSessionTerminated();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to terminate session. Please try again.');
    } finally {
      setTerminatingId(null);
    }
  };

  const handleTerminateAll = async () => {
    try {
      setTerminatingAll(true);
      await api.post('/auth/terminate-session', { userId, email, terminateAllExceptCurrent: true });
      toast.success('Logged out from all other devices successfully! Retrying login...');
      if (onSessionTerminated) onSessionTerminated();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to log out other devices.');
    } finally {
      setTerminatingAll(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-lg bg-[#111116] border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.9)] text-white relative overflow-hidden"
        >
          {/* Top Gold Shimmer Bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600" />

          {/* Header Warning Icon */}
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-4 text-amber-400">
            <FiAlertTriangle size={28} />
          </div>

          <div className="text-center space-y-1.5 mb-6">
            <h3 className="text-xl font-bold tracking-wide text-white">Device Limit Exceeded (3/3 Active)</h3>
            <p className="text-xs text-gray-300 leading-relaxed max-w-md mx-auto">
              Your account is logged in on <strong className="text-amber-400">3 maximum allowed devices</strong>. Select a device below to log out from to continue on this device.
            </p>
          </div>

          {/* Active Sessions List */}
          <div className="space-y-3 max-h-60 overflow-y-auto pr-1 mb-6">
            {activeSessions.map((session, idx) => {
              const isMobile = session.deviceName?.toLowerCase().includes('mobile') || session.browser?.toLowerCase().includes('mobile');
              return (
                <div
                  key={session.id || idx}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-400/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center shrink-0">
                      {isMobile ? <FiSmartphone size={18} /> : <FiMonitor size={18} />}
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-white truncate max-w-[180px] sm:max-w-[220px]">
                        {session.deviceName || `Device ${idx + 1}`}
                      </p>
                      <p className="text-[11px] text-gray-400 flex items-center gap-1">
                        <FiGlobe size={11} /> {session.browser || 'Web Browser'} ({session.ipAddress || 'IP Saved'})
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleTerminateOne(session.id)}
                    disabled={terminatingId === session.id || terminatingAll}
                    className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white border border-red-500/30 text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    {terminatingId === session.id ? 'Logging out...' : <><FiLogOut size={12} /> Log Out</>}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="space-y-2.5">
            <button
              onClick={handleTerminateAll}
              disabled={terminatingAll}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {terminatingAll ? 'Logging out all...' : <><FiLogOut size={14} /> Log Out From All Other 3 Devices</>}
            </button>

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs font-bold transition cursor-pointer"
            >
              Cancel Login
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DeviceLimitModal;

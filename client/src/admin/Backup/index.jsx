import React, { useState, useEffect } from 'react';
import api from '../../config/api';
import Button from '../../components/common/Button';
import { FiDatabase, FiPlus, FiDownload, FiCheckCircle, FiShield, FiClock } from 'react-icons/fi';
import { toast } from 'react-toastify';

const AdminBackup = () => {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchBackups = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/admin/backups');
      setBackups(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleCreateBackup = async () => {
    try {
      setCreating(true);
      const { data } = await api.post('/admin/backup');
      toast.success(data.message || 'Database snapshot generated!');
      fetchBackups();
    } catch (err) {
      toast.error('Failed to create backup');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Database Backup & Disaster Recovery</h1>
          <p className="text-sm text-gray-500">Create automated SQLite/PostgreSQL database snapshots and manage recovery points</p>
        </div>
        <Button icon={FiPlus} loading={creating} onClick={handleCreateBackup}>Create Snapshot Now</Button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading backup history...</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-500 uppercase">Snapshot Filename</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-500 uppercase">File Size</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-500 uppercase">Triggered By</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-500 uppercase">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {backups.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-mono font-bold text-charcoal-900 flex items-center gap-2">
                    <FiDatabase className="text-gold-600 w-4 h-4" /> {b.filename}
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-600">{b.fileSize}</td>
                  <td className="px-6 py-4">
                    <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold inline-flex items-center gap-1">
                      <FiCheckCircle /> {b.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{b.createdBy}</td>
                  <td className="px-6 py-4 text-right text-gray-400 font-mono">{new Date(b.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {backups.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400">No backup snapshots generated yet. Click &apos;Create Snapshot Now&apos;.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminBackup;

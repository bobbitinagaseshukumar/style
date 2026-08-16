import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { useSelector, useDispatch } from 'react-redux';
import {
  FiUser, FiShield, FiSmartphone, FiMonitor, FiLogOut, FiTrash2,
  FiClock, FiCheck, FiRefreshCw, FiKey, FiLock, FiGlobe, FiMail,
  FiEdit2, FiCamera, FiAlertTriangle, FiCheckCircle, FiXCircle,
  FiLayers, FiActivity, FiEye, FiEyeOff, FiRotateCw, FiZoomIn
} from 'react-icons/fi';
import api from '../../config/api';

/* ═══ HELPERS ═══ */
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const fmtDateTime = d => d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Never';

/* ═══ PASSWORD STRENGTH CHECKER ═══ */
const checkPasswordStrength = (pass) => {
  const checks = {
    length: pass.length >= 8,
    upper: /[A-Z]/.test(pass),
    lower: /[a-z]/.test(pass),
    number: /[0-9]/.test(pass),
    special: /[^A-Za-z0-9]/.test(pass),
  };
  const score = Object.values(checks).filter(Boolean).length;
  return { checks, score };
};

/* ═══════════════════════════════════════════════════════════
   MAIN ADMIN ACCOUNT SECURITY COMPONENT
═══════════════════════════════════════════════════════════ */
export default function AdminProfile() {
  const { user: authUser } = useSelector(state => state.auth);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [activeTab, setActiveTab] = useState('profile'); // profile | email | password | 2fa | sessions | history | logs

  // Active Sessions & History
  const [sessions, setSessions] = useState([]);
  const [loginHistory, setLoginHistory] = useState([]);
  const [securityLogs, setSecurityLogs] = useState([]);

  // Profile Edit State
  const [profileForm, setProfileForm] = useState({ fullName: '', phone: '', alternatePhone: '', whatsappNumber: '', avatar: '' });
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [tempImage, setTempImage] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Email Change State
  const [emailStep, setEmailStep] = useState(1); // 1: input, 2: OTP
  const [newEmail, setNewEmail] = useState('');
  const [emailOTP, setEmailOTP] = useState('');
  const [emailOTPDemo, setEmailOTPDemo] = useState('');

  // Password Change State
  const [passStep, setPassStep] = useState(1); // 1: input, 2: OTP
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [passOTP, setPassOTP] = useState('');
  const [passOTPDemo, setPassOTPDemo] = useState('');

  // Fetch Admin Data
  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [resProfile, resSessions, resHistory, resLogs] = await Promise.all([
        api.get('/admin/auth/me').catch(() => null),
        api.get('/admin/auth/sessions').catch(() => null),
        api.get('/admin/auth/history').catch(() => null),
        api.get('/admin/auth/security-logs').catch(() => null),
      ]);

      const adminData = resProfile?.data?.data || authUser || {};
      setProfile(adminData);
      setProfileForm({
        fullName: adminData.fullName || '',
        phone: adminData.phone || '',
        alternatePhone: adminData.alternatePhone || '',
        whatsappNumber: adminData.whatsappNumber || '',
        avatar: adminData.avatar || ''
      });

      setSessions(resSessions?.data?.data || []);
      setLoginHistory(resHistory?.data?.data || []);
      setSecurityLogs(resLogs?.data?.data || []);
    } catch (err) {
      toast.error('Failed to load admin profile data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  /* ── 1. Update Profile Details ── */
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await api.put('/admin/auth/profile', profileForm);
      toast.success('Admin profile updated successfully!');
      setProfile(res.data?.data);
      fetchAdminData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setActionLoading(false);
    }
  };

  /* ── Image Upload & Crop ── */
  const handleImageFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setTempImage(reader.result);
        setZoom(1);
        setRotation(0);
        setCropModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveCroppedImage = () => {
    if (tempImage) {
      setProfileForm(f => ({ ...f, avatar: tempImage }));
      setCropModalOpen(false);
      toast.success('Profile photo updated! Click "Save Changes" to apply.');
    }
  };

  /* ── 2. Request Email Change OTP ── */
  const handleRequestEmailOTP = async (e) => {
    e.preventDefault();
    if (!newEmail.trim()) return toast.error('Please enter a new email address');
    try {
      setActionLoading(true);
      const res = await api.post('/admin/auth/change-email/request-otp', { newEmail });
      toast.success(res.data.message);
      setEmailOTPDemo(res.data.data?.otpCode || '');
      setEmailStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setActionLoading(false);
    }
  };

  /* ── 2. Verify Email Change OTP ── */
  const handleVerifyEmailOTP = async (e) => {
    e.preventDefault();
    if (!emailOTP.trim()) return toast.error('Please enter the verification OTP');
    try {
      setActionLoading(true);
      const res = await api.post('/admin/auth/change-email/verify-otp', { otpCode: emailOTP });
      toast.success(res.data.message);
      setEmailStep(1);
      setNewEmail('');
      setEmailOTP('');
      fetchAdminData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed');
    } finally {
      setActionLoading(false);
    }
  };

  /* ── 3. Request Password Change OTP ── */
  const handleRequestPasswordOTP = async (e, forceForgot = false) => {
    if (e) e.preventDefault();
    const forgot = forceForgot || isForgotFlow;
    if (!newPassword || !confirmPassword) return toast.error('Please fill all new password fields');
    if (newPassword !== confirmPassword) return toast.error('New passwords do not match');

    const { score } = checkPasswordStrength(newPassword);
    if (score < 5) return toast.error('Password does not meet all security complexity requirements');

    if (!forgot && !currentPassword) {
      return toast.error('Current password is required or click "Forgot Current Password?"');
    }

    try {
      setActionLoading(true);
      const res = await api.post('/admin/auth/change-password/request-otp', {
        currentPassword,
        newPassword,
        confirmNewPassword: confirmPassword,
        isForgotFlow: forgot
      });
      toast.success(res.data.message);
      setPassOTPDemo(res.data.data?.otpCode || '');
      setIsForgotFlow(forgot);
      setPassStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to request OTP');
    } finally {
      setActionLoading(false);
    }
  };

  /* ── 3. Verify Password Change OTP ── */
  const handleVerifyPasswordOTP = async (e) => {
    e.preventDefault();
    if (!passOTP.trim()) return toast.error('Please enter the 6-digit verification code');
    try {
      setActionLoading(true);
      const res = await api.post('/admin/auth/change-password/verify-otp', {
        currentPassword,
        newPassword,
        confirmNewPassword: confirmPassword,
        otpCode: passOTP.trim(),
        isForgotFlow
      });
      toast.success(res.data.message);
      if (res.data.data?.token) {
        localStorage.setItem('adminToken', res.data.data.token);
      }
      setPassStep(1);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPassOTP('');
      setIsForgotFlow(false);
      fetchAdminData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password update failed');
    } finally {
      setActionLoading(false);
    }
  };

  /* ── 4. Toggle 2FA ── */
  const handleToggle2FA = async (enabled) => {
    try {
      setActionLoading(true);
      const res = await api.put('/admin/auth/2fa', { enabled });
      toast.success(res.data.message);
      setProfile(p => ({ ...p, twoFactorEnabled: enabled }));
    } catch (err) {
      toast.error('Failed to toggle 2FA');
    } finally {
      setActionLoading(false);
    }
  };

  /* ── 5. Revoke Single Session ── */
  const handleRevokeSession = async (id) => {
    try {
      setActionLoading(true);
      await api.delete(`/admin/auth/sessions/${id}`);
      toast.success('Session revoked.');
      fetchAdminData();
    } catch (err) {
      toast.error('Failed to revoke session');
    } finally {
      setActionLoading(false);
    }
  };

  /* ── 5. Revoke All Other Sessions ── */
  const handleRevokeAllSessions = async () => {
    try {
      setActionLoading(true);
      const res = await api.post('/admin/auth/revoke-all-sessions');
      toast.success(res.data.message);
      if (res.data.data?.token) {
        localStorage.setItem('adminToken', res.data.data.token);
      }
      fetchAdminData();
    } catch (err) {
      toast.error('Failed to revoke sessions');
    } finally {
      setActionLoading(false);
    }
  };

  /* ═══ STYLES ═══ */
  const S = {
    card: { background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 24, marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,.04)' },
    tabBtn: (active) => ({
      padding: '12px 18px', borderRadius: 12, border: active ? '1px solid #D4AF37' : '1px solid #e5e7eb',
      background: active ? '#FBF7EF' : '#fff', color: active ? '#91711A' : '#555',
      fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all .15s'
    }),
    label: { display: 'block', fontSize: 11, fontWeight: 700, color: '#555', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.03em' },
    input: { width: '100%', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 14px', fontSize: 13, outline: 'none', background: '#fafafa' },
    btnGold: { padding: '10px 22px', borderRadius: 10, border: 'none', background: '#D4AF37', color: '#111', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
    btnOutline: { padding: '10px 20px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff', color: '#555', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
    badge: (bg, color) => ({ padding: '4px 10px', borderRadius: 20, background: bg, color, fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }),
  };

  if (loading && !profile) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '100px 0', color: '#aaa', gap: 10 }}>
        <FiRefreshCw className="animate-spin" style={{ width: 22, height: 22 }} /> Loading Account Security Settings…
      </div>
    );
  }

  const { checks: passChecks, score: passScore } = checkPasswordStrength(newPassword);

  return (
    <div style={{ minHeight: '100%', paddingBottom: 40 }}>
      {/* ─── Header Summary ─── */}
      <div style={S.card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <img
              src={profileForm.avatar || profile?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.fullName || 'Admin')}&size=120&background=D4AF37&color=111`}
              alt=""
              style={{ width: 80, height: 80, borderRadius: 20, objectFit: 'cover', border: '3px solid #D4AF37', boxShadow: '0 4px 12px rgba(0,0,0,.1)' }}
            />
            <label htmlFor="avatar-upload" style={{ position: 'absolute', bottom: -4, right: -4, background: '#111', color: '#fff', padding: 6, borderRadius: '50%', cursor: 'pointer', display: 'flex', border: '2px solid #fff' }}>
              <FiCamera style={{ width: 14, height: 14 }} />
            </label>
            <input type="file" id="avatar-upload" accept="image/*" onChange={handleImageFileSelect} style={{ display: 'none' }} />
          </div>

          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111' }}>{profile?.fullName || 'Administrator'}</h1>
              <span style={S.badge('#FBF7EF', '#91711A')}>
                <FiShield style={{ width: 12, height: 12 }} /> {profile?.adminRole || profile?.role || 'SUPER_ADMIN'}
              </span>
              <span style={S.badge(profile?.status === 'ACTIVE' ? '#ECFDF5' : '#FEF2F2', profile?.status === 'ACTIVE' ? '#059669' : '#DC2626')}>
                {profile?.status || 'ACTIVE'}
              </span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 8, fontSize: 12, color: '#666' }}>
              <span>✉️ <strong>{profile?.email}</strong></span>
              <span>📱 <strong>{profile?.phone || 'Not set'}</strong></span>
              <span>🔐 2FA: <strong style={{ color: profile?.twoFactorEnabled ? '#059669' : '#DC2626' }}>{profile?.twoFactorEnabled ? 'ENABLED' : 'DISABLED'}</strong></span>
              <span>🕒 Last Login: <strong>{fmtDateTime(profile?.lastLoginAt)}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Tab Navigation ─── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
        {[
          { id: 'profile', label: 'My Profile', icon: FiUser },
          { id: 'email', label: 'Change Email', icon: FiMail },
          { id: 'password', label: 'Change Password', icon: FiKey },
          { id: '2fa', label: 'Two-Factor (2FA)', icon: FiShield },
          { id: 'sessions', label: `Active Sessions (${sessions.length})`, icon: FiMonitor },
          { id: 'history', label: `Login History (${loginHistory.length})`, icon: FiClock },
          { id: 'logs', label: `Security Logs (${securityLogs.length})`, icon: FiActivity },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={S.tabBtn(activeTab === t.id)}>
            <t.icon style={{ width: 16, height: 16 }} /> {t.label}
          </button>
        ))}
      </div>

      {/* ══════════════════ TAB 1: MY PROFILE ══════════════════ */}
      {activeTab === 'profile' && (
        <div style={S.card}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111', marginBottom: 16 }}>My Profile Information</h2>
          <form onSubmit={handleSaveProfile}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 20 }}>
              <div><label style={S.label}>Full Name</label><input value={profileForm.fullName} onChange={e => setProfileForm(f => ({ ...f, fullName: e.target.value }))} style={S.input} required /></div>
              <div><label style={S.label}>Mobile Number</label><input value={profileForm.phone} onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 9876543210" style={S.input} /></div>
              <div><label style={S.label}>Alternate Phone</label><input value={profileForm.alternatePhone} onChange={e => setProfileForm(f => ({ ...f, alternatePhone: e.target.value }))} style={S.input} /></div>
              <div><label style={S.label}>WhatsApp Number</label><input value={profileForm.whatsappNumber} onChange={e => setProfileForm(f => ({ ...f, whatsappNumber: e.target.value }))} style={S.input} /></div>
            </div>

            <div style={{ background: '#fafafa', borderRadius: 12, padding: 16, marginBottom: 20, border: '1px solid #f0f0f0' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', marginBottom: 10 }}>Account Specifications (Read Only)</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, fontSize: 12, color: '#444' }}>
                <div><span style={{ color: '#888' }}>Admin ID:</span> <br/><strong>{profile?.id}</strong></div>
                <div><span style={{ color: '#888' }}>Customer ID:</span> <br/><strong>{profile?.customerId || 'N/A'}</strong></div>
                <div><span style={{ color: '#888' }}>Username:</span> <br/><strong>{profile?.username || 'admin'}</strong></div>
                <div><span style={{ color: '#888' }}>Role:</span> <br/><strong>{profile?.adminRole || profile?.role}</strong></div>
                <div><span style={{ color: '#888' }}>Date Joined:</span> <br/><strong>{fmtDate(profile?.createdAt)}</strong></div>
                <div><span style={{ color: '#888' }}>Time Zone:</span> <br/><strong>{profile?.timeZone || 'UTC (+05:30 IST)'}</strong></div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" disabled={actionLoading} style={S.btnGold}>
                {actionLoading ? 'Saving…' : '💾 Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ══════════════════ TAB 2: CHANGE EMAIL ADDRESS ══════════════════ */}
      {activeTab === 'email' && (
        <div style={S.card}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111', marginBottom: 6 }}>Change Email Address</h2>
          <p style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>
            To update your registered admin email address, enter your new email. A 6-digit OTP will be sent to the new email address for verification.
          </p>

          <div style={{ background: '#FBF7EF', border: '1px solid #F6EED8', padding: '12px 16px', borderRadius: 10, fontSize: 12, color: '#6C5314', marginBottom: 20 }}>
            🔒 Current Registered Email: <strong>{profile?.email}</strong>
          </div>

          {emailStep === 1 ? (
            <form onSubmit={handleRequestEmailOTP} style={{ maxWidth: 450 }}>
              <div style={{ marginBottom: 16 }}>
                <label style={S.label}>New Email Address</label>
                <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="e.g. admin.new@styleverse.com" style={S.input} required />
              </div>
              <button type="submit" disabled={actionLoading} style={S.btnGold}>
                {actionLoading ? 'Sending OTP…' : '📩 Request Verification OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyEmailOTP} style={{ maxWidth: 450 }}>
              {emailOTPDemo && (
                <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '10px 14px', borderRadius: 10, fontSize: 12, color: '#065F46', marginBottom: 16 }}>
                  ✨ OTP Code generated: <strong style={{ fontSize: 14 }}>{emailOTPDemo}</strong> (Enter below to verify)
                </div>
              )}
              <div style={{ marginBottom: 16 }}>
                <label style={S.label}>Enter 6-Digit OTP Code sent to {newEmail}</label>
                <input value={emailOTP} onChange={e => setEmailOTP(e.target.value)} placeholder="123456" maxLength={6} style={{ ...S.input, fontSize: 18, letterSpacing: 4, textAlign: 'center', fontWeight: 800 }} required />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setEmailStep(1)} style={S.btnOutline}>Back</button>
                <button type="submit" disabled={actionLoading} style={S.btnGold}>
                  {actionLoading ? 'Verifying…' : '✅ Verify OTP & Change Email'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ══════════════════ TAB 3: CHANGE PASSWORD ══════════════════ */}
      {activeTab === 'password' && (
        <div style={S.card}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111', marginBottom: 6 }}>Change Admin Password</h2>
          <p style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>
            Every password change requires your current password plus a 6-digit OTP sent to your registered email address. Changing your password will log out all other active sessions.
          </p>

          {passStep === 1 ? (
            <form onSubmit={handleRequestPasswordOTP} style={{ maxWidth: 480 }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={S.label}>Current Password</label>
                  <button
                    type="button"
                    onClick={(e) => {
                      setIsForgotFlow(true);
                      handleRequestPasswordOTP(e, true);
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: '#D97706', textDecoration: 'underline' }}
                  >
                    Forgot Current Password?
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    style={{ ...S.input, paddingRight: 36 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(s => !s)}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#888' }}
                  >
                    {showCurrentPass ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={S.label}>New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    style={{ ...S.input, paddingRight: 36 }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(s => !s)}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#888' }}
                  >
                    {showPass ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              {/* Strength checklist */}
              {newPassword && (
                <div style={{ background: '#fafafa', border: '1px solid #eee', borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 11 }}>
                  <p style={{ fontWeight: 700, marginBottom: 6, color: '#555' }}>Password Security Requirements:</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                    <span style={{ color: passChecks.length ? '#059669' : '#888' }}>{passChecks.length ? '✓' : '○'} Min 8 characters</span>
                    <span style={{ color: passChecks.upper ? '#059669' : '#888' }}>{passChecks.upper ? '✓' : '○'} Uppercase letter</span>
                    <span style={{ color: passChecks.lower ? '#059669' : '#888' }}>{passChecks.lower ? '✓' : '○'} Lowercase letter</span>
                    <span style={{ color: passChecks.number ? '#059669' : '#888' }}>{passChecks.number ? '✓' : '○'} Number (0-9)</span>
                    <span style={{ color: passChecks.special ? '#059669' : '#888' }}>{passChecks.special ? '✓' : '○'} Special (@$!%*?&)</span>
                  </div>
                </div>
              )}

              <div style={{ marginBottom: 20 }}>
                <label style={S.label}>Confirm New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    style={{ ...S.input, paddingRight: 36 }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(s => !s)}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#888' }}
                  >
                    {showConfirmPass ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={actionLoading} style={S.btnGold}>
                {actionLoading ? 'Verifying…' : '🔑 Verify Password & Request OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyPasswordOTP} style={{ maxWidth: 450 }}>
              {passOTPDemo && (
                <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '10px 14px', borderRadius: 10, fontSize: 12, color: '#065F46', marginBottom: 16 }}>
                  ✨ OTP Code generated: <strong style={{ fontSize: 14 }}>{passOTPDemo}</strong> (Sent to {profile?.email})
                </div>
              )}
              <div style={{ marginBottom: 16 }}>
                <label style={S.label}>Enter 6-Digit Verification OTP</label>
                <input value={passOTP} onChange={e => setPassOTP(e.target.value)} placeholder="123456" maxLength={6} style={{ ...S.input, fontSize: 18, letterSpacing: 4, textAlign: 'center', fontWeight: 800 }} required />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setPassStep(1)} style={S.btnOutline}>Back</button>
                <button type="submit" disabled={actionLoading} style={S.btnGold}>
                  {actionLoading ? 'Updating…' : '🔐 Verify OTP & Update Password'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ══════════════════ TAB 4: TWO-FACTOR AUTHENTICATION ══════════════════ */}
      {activeTab === '2fa' && (
        <div style={S.card}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111', marginBottom: 6 }}>Two-Factor Authentication (2FA)</h2>
          <p style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>
            Protect your admin account with an extra layer of security. When enabled, signing in requires a 6-digit OTP sent to your registered email address.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 20, border: '1px solid #e5e7eb', borderRadius: 14, background: profile?.twoFactorEnabled ? '#ECFDF5' : '#FEF2F2' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiShield style={{ width: 20, height: 20, color: profile?.twoFactorEnabled ? '#059669' : '#DC2626' }} />
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>Email OTP Verification</h3>
              </div>
              <p style={{ fontSize: 12, color: '#555', marginTop: 4 }}>
                {profile?.twoFactorEnabled ? 'Your account is protected by 2FA. Every login attempt from a new device will require an Email OTP.' : '2FA is currently disabled. Enable it to prevent unauthorized account access.'}
              </p>
            </div>
            <button
              onClick={() => handleToggle2FA(!profile?.twoFactorEnabled)}
              disabled={actionLoading}
              style={{
                padding: '10px 20px', borderRadius: 10, border: 'none',
                background: profile?.twoFactorEnabled ? '#DC2626' : '#059669', color: '#fff',
                fontSize: 13, fontWeight: 700, cursor: 'pointer'
              }}
            >
              {profile?.twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════ TAB 5: ACTIVE SESSIONS ══════════════════ */}
      {activeTab === 'sessions' && (
        <div style={S.card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>Active Sessions & Trusted Devices</h2>
              <p style={{ fontSize: 13, color: '#666' }}>Manage devices that have active access to your admin account.</p>
            </div>
            <button onClick={handleRevokeAllSessions} disabled={actionLoading} style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: '#DC2626', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              🚫 Logout All Other Devices
            </button>
          </div>

          {sessions.length === 0 ? (
            <p style={{ fontSize: 13, color: '#aaa', textAlign: 'center', padding: '30px 0' }}>No other active trusted device sessions found.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sessions.map(s => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 14, border: '1px solid #eee', borderRadius: 12, background: '#fafafa' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <FiMonitor style={{ width: 20, height: 20, color: '#4F46E5' }} />
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{s.deviceName || 'Browser Session'}</p>
                      <p style={{ fontSize: 11, color: '#777' }}>IP: {s.ipAddress} • {s.browser?.slice(0, 40)}</p>
                    </div>
                  </div>
                  <button onClick={() => handleRevokeSession(s.id)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #DC2626', background: '#fff', color: '#DC2626', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                    Revoke
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════ TAB 6: LOGIN HISTORY ══════════════════ */}
      {activeTab === 'history' && (
        <div style={S.card}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111', marginBottom: 16 }}>Login Audit History</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#fafafa', borderBottom: '1px solid #eee', textAlign: 'left', color: '#888', textTransform: 'uppercase', fontSize: 10 }}>
                  <th style={{ padding: 10 }}>Date & Time</th>
                  <th style={{ padding: 10 }}>Device / Browser</th>
                  <th style={{ padding: 10 }}>IP Address</th>
                  <th style={{ padding: 10 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {loginHistory.map(h => (
                  <tr key={h.id} style={{ borderBottom: '1px solid #f7f7f7' }}>
                    <td style={{ padding: 10, fontWeight: 600 }}>{fmtDateTime(h.createdAt)}</td>
                    <td style={{ padding: 10, color: '#555' }}>{h.device} ({h.browser?.slice(0, 30)})</td>
                    <td style={{ padding: 10, fontFamily: 'monospace', color: '#4F46E5' }}>{h.ipAddress}</td>
                    <td style={{ padding: 10 }}>
                      <span style={S.badge(h.status === 'SUCCESS' ? '#ECFDF5' : '#FEF2F2', h.status === 'SUCCESS' ? '#059669' : '#DC2626')}>
                        {h.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════ TAB 7: SECURITY AUDIT LOGS ══════════════════ */}
      {activeTab === 'logs' && (
        <div style={S.card}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111', marginBottom: 16 }}>Security Activity Audit Logs</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#fafafa', borderBottom: '1px solid #eee', textAlign: 'left', color: '#888', textTransform: 'uppercase', fontSize: 10 }}>
                  <th style={{ padding: 10 }}>Date & Time</th>
                  <th style={{ padding: 10 }}>Action</th>
                  <th style={{ padding: 10 }}>Reason / Details</th>
                  <th style={{ padding: 10 }}>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {securityLogs.map(l => (
                  <tr key={l.id} style={{ borderBottom: '1px solid #f7f7f7' }}>
                    <td style={{ padding: 10, fontWeight: 600 }}>{fmtDateTime(l.createdAt)}</td>
                    <td style={{ padding: 10 }}>
                      <span style={S.badge('#EEF2FF', '#4F46E5')}>{l.action}</span>
                    </td>
                    <td style={{ padding: 10, color: '#555' }}>{l.reason} {l.details ? `(${l.details})` : ''}</td>
                    <td style={{ padding: 10, fontFamily: 'monospace', color: '#888' }}>{l.ipAddress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════ CROP / ZOOM MODAL ══════════════════ */}
      {cropModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 24, maxWidth: 420, width: '100%', textAlign: 'center' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Crop & Adjust Profile Photo</h3>

            <div style={{ width: 200, height: 200, borderRadius: '50%', margin: '0 auto 20px', overflow: 'hidden', border: '3px solid #D4AF37', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img
                src={tempImage}
                alt="Preview"
                style={{
                  width: '100%', height: '100%', objectFit: 'cover',
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transition: 'transform 0.1s ease'
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#555', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                <FiZoomIn /> Zoom
              </label>
              <input type="range" min="1" max="3" step="0.1" value={zoom} onChange={e => setZoom(parseFloat(e.target.value))} style={{ width: '80%' }} />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 20 }}>
              <button onClick={() => setRotation(r => (r + 90) % 360)} style={S.btnOutline}>
                <FiRotateCw /> Rotate 90°
              </button>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setCropModalOpen(false)} style={{ ...S.btnOutline, flex: 1 }}>Cancel</button>
              <button onClick={handleSaveCroppedImage} style={{ ...S.btnGold, flex: 1 }}>Save Photo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

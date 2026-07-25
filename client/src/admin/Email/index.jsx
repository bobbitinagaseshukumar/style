import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSend, FiMail, FiUsers, FiEye, FiZap, FiCalendar,
  FiEdit3, FiCheckCircle, FiAlertCircle, FiLoader, FiX
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../config/api';

/* ─── Campaign type presets ─────────────────────────────────── */
const CAMPAIGN_TYPES = [
  { id: 'offer', label: 'Offer / Promo', emoji: '🎁', desc: 'Discount offers with coupon codes' },
  { id: 'new_arrivals', label: 'New Arrivals', emoji: '✨', desc: 'Announce new product collections' },
  { id: 'newsletter', label: 'Newsletter', emoji: '📰', desc: 'Regular newsletter & fashion tips' },
  { id: 'custom', label: 'Custom Email', emoji: '✉️', desc: 'Write custom HTML email body' },
];

const TEST_TYPES = [
  { id: 'otp', label: 'OTP Verification' },
  { id: 'welcome', label: 'Welcome Email' },
  { id: 'order_placed', label: 'Order Placed' },
  { id: 'offer', label: 'Offer / Promo' },
  { id: 'abandoned_cart', label: 'Abandoned Cart' },
  { id: 'newsletter', label: 'Newsletter' },
];

const TARGET_OPTIONS = [
  { id: 'all', label: 'All Registered Users' },
  { id: 'verified', label: 'Verified Customers Only' },
  { id: 'subscribed', label: 'Subscribed to Emails' },
];

/* ─── Input helper ──────────────────────────────────────────── */
const Field = ({ label, children, hint }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
    {children}
    {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
  </div>
);

const Input = (props) => (
  <input {...props} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-yellow-400 focus:outline-none" />
);

const Textarea = (props) => (
  <textarea {...props} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-yellow-400 focus:outline-none resize-none" />
);

/* ─── Quick stats ─────────────────────────────────────────────── */
const StatCard = ({ label, value, icon: Icon, color = 'yellow' }) => {
  const colors = {
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    green: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
  };
  return (
    <div className={`flex items-center gap-4 p-4 rounded-2xl border ${colors[color]}`}>
      <div className="w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center flex-shrink-0">
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xs font-semibold opacity-70 uppercase tracking-widest">{label}</p>
        <p className="text-xl font-black">{value}</p>
      </div>
    </div>
  );
};

/* ─── Main Email Dashboard ──────────────────────────────────── */
const AdminEmail = () => {
  const [activeTab, setActiveTab] = useState('campaign');

  // Campaign state
  const [campaignType, setCampaignType] = useState('offer');
  const [form, setForm] = useState({
    title: '',
    subject: '',
    target: 'all',
    sendNow: true,
    scheduledAt: '',
    // Offer fields
    offerTitle: '',
    discount: '',
    couponCode: '',
    endDate: '',
    description: '',
    // Newsletter
    bodyHtml: '',
  });
  const [sending, setSending] = useState(false);

  // Test email state
  const [testEmail, setTestEmail] = useState('');
  const [testType, setTestType] = useState('otp');
  const [testSending, setTestSending] = useState(false);

  const handleChange = (key) => (e) =>
    setForm(f => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleSendCampaign = async () => {
    if (!form.title || !form.subject || !campaignType) {
      toast.error('Please fill in Title and Subject');
      return;
    }
    if (!form.sendNow && !form.scheduledAt) {
      toast.error('Please choose Send Now or set a scheduled date');
      return;
    }
    try {
      setSending(true);
      const payload = {
        ...form,
        type: campaignType,
        discount: parseFloat(form.discount) || 0,
      };
      const { data } = await api.post('/email/campaign', payload);
      toast.success(data.message || 'Campaign launched!');
      // Reset form
      setForm(f => ({ ...f, title: '', subject: '', couponCode: '', offerTitle: '', discount: '', description: '', bodyHtml: '' }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send campaign');
    } finally {
      setSending(false);
    }
  };

  const handleSendTest = async () => {
    if (!testEmail) { toast.error('Enter a recipient email'); return; }
    try {
      setTestSending(true);
      await api.post('/email/test', { to: testEmail, type: testType });
      toast.success(`Test "${testType}" email sent to ${testEmail}!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send test email');
    } finally {
      setTestSending(false);
    }
  };

  const tabs = [
    { id: 'campaign', label: 'Send Campaign', icon: FiSend },
    { id: 'test', label: 'Test Emails', icon: FiZap },
    { id: 'guide', label: 'Email Guide', icon: FiMail },
  ];

  return (
    <div className="space-y-6" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-900">Email Campaign Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Send premium email campaigns and manage customer notifications</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Automated Emails" value="9 Types" icon={FiCheckCircle} color="green" />
        <StatCard label="Queue System" value="Active" icon={FiLoader} color="blue" />
        <StatCard label="Audience Options" value="3 Targets" icon={FiUsers} color="purple" />
        <StatCard label="Test Previews" value="6 Templates" icon={FiEye} color="yellow" />
      </div>

      {/* Tab Nav */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition
              ${activeTab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>

          {/* ── CAMPAIGN TAB ──────────────────────────────── */}
          {activeTab === 'campaign' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Left: Campaign Builder */}
              <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-5">
                <h2 className="text-lg font-black text-gray-900">Campaign Builder</h2>

                {/* Type selector */}
                <Field label="Campaign Type">
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {CAMPAIGN_TYPES.map(t => (
                      <button key={t.id} onClick={() => setCampaignType(t.id)}
                        className={`flex items-start gap-3 p-3 rounded-2xl border-2 text-left transition
                          ${campaignType === t.id ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200 hover:border-gray-300'}`}>
                        <span className="text-xl">{t.emoji}</span>
                        <div>
                          <p className="font-bold text-gray-800 text-sm">{t.label}</p>
                          <p className="text-[10px] text-gray-500">{t.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Campaign Name *">
                    <Input value={form.title} onChange={handleChange('title')} placeholder="e.g. Diwali Sale 2026" />
                  </Field>
                  <Field label="Email Subject Line *">
                    <Input value={form.subject} onChange={handleChange('subject')} placeholder="e.g. 🎁 40% OFF this Diwali!" />
                  </Field>
                </div>

                {/* Type-specific fields */}
                {(campaignType === 'offer') && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 space-y-3">
                    <p className="text-xs font-bold text-yellow-700 uppercase tracking-widest">Offer Details</p>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Offer Title">
                        <Input value={form.offerTitle} onChange={handleChange('offerTitle')} placeholder="e.g. Diwali Mega Sale" />
                      </Field>
                      <Field label="Discount %">
                        <Input type="number" value={form.discount} onChange={handleChange('discount')} placeholder="e.g. 40" />
                      </Field>
                      <Field label="Coupon Code">
                        <Input value={form.couponCode} onChange={handleChange('couponCode')} placeholder="e.g. DIWALI40" />
                      </Field>
                      <Field label="Valid Until">
                        <Input type="date" value={form.endDate} onChange={handleChange('endDate')} />
                      </Field>
                    </div>
                    <Field label="Offer Description">
                      <Textarea rows={2} value={form.description} onChange={handleChange('description')} placeholder="Short message for the email body..." />
                    </Field>
                  </div>
                )}

                {(campaignType === 'newsletter' || campaignType === 'custom') && (
                  <Field label="Email Body (HTML allowed)" hint="You can use basic HTML tags for formatting">
                    <Textarea rows={6} value={form.bodyHtml} onChange={handleChange('bodyHtml')}
                      placeholder="<p>Hello! We have exciting news...</p><p>Check out our latest collections...</p>" />
                  </Field>
                )}

                {/* Audience */}
                <Field label="Target Audience">
                  <div className="flex flex-wrap gap-2 mt-1">
                    {TARGET_OPTIONS.map(t => (
                      <button key={t.id} onClick={() => setForm(f => ({ ...f, target: t.id }))}
                        className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition
                          ${form.target === t.id ? 'border-yellow-400 bg-yellow-50 text-yellow-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </Field>

                {/* Timing */}
                <Field label="Send Timing">
                  <div className="flex gap-3 mt-1">
                    <button onClick={() => setForm(f => ({ ...f, sendNow: true }))}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-bold transition
                        ${form.sendNow ? 'border-yellow-400 bg-yellow-50 text-yellow-700' : 'border-gray-200 text-gray-600'}`}>
                      <FiZap size={13} /> Send Now
                    </button>
                    <button onClick={() => setForm(f => ({ ...f, sendNow: false }))}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-bold transition
                        ${!form.sendNow ? 'border-yellow-400 bg-yellow-50 text-yellow-700' : 'border-gray-200 text-gray-600'}`}>
                      <FiCalendar size={13} /> Schedule Later
                    </button>
                  </div>
                  {!form.sendNow && (
                    <Input type="datetime-local" className="mt-2 w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm"
                      value={form.scheduledAt} onChange={handleChange('scheduledAt')} />
                  )}
                </Field>

                {/* Send button */}
                <button
                  onClick={handleSendCampaign}
                  disabled={sending}
                  className="w-full py-4 rounded-2xl bg-yellow-400 text-black font-black text-sm hover:bg-yellow-300 transition shadow-lg shadow-yellow-100 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {sending
                    ? <><span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Launching Campaign...</>
                    : <><FiSend size={15} /> {form.sendNow ? 'Launch Campaign Now' : 'Schedule Campaign'}</>
                  }
                </button>
              </div>

              {/* Right: Help panel */}
              <div className="space-y-4">
                <div className="bg-gray-50 border border-gray-100 rounded-3xl p-5">
                  <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-widest">Automated Emails</h3>
                  <p className="text-xs text-gray-500 mb-3">These fire automatically without manual campaigns:</p>
                  <div className="space-y-2">
                    {[
                      { emoji: '🔐', label: 'OTP Verification' },
                      { emoji: '🎉', label: 'Welcome Email' },
                      { emoji: '🔑', label: 'Forgot Password' },
                      { emoji: '🔒', label: 'Password Changed' },
                      { emoji: '✅', label: 'Order Placed' },
                      { emoji: '🚚', label: 'Order Shipped' },
                      { emoji: '📦', label: 'Order Delivered' },
                      { emoji: '❌', label: 'Order Cancelled' },
                      { emoji: '🔔', label: 'Back in Stock' },
                    ].map(e => (
                      <div key={e.label} className="flex items-center gap-2 text-sm">
                        <span>{e.emoji}</span>
                        <span className="text-gray-700">{e.label}</span>
                        <span className="ml-auto text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">Auto</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-3xl p-5">
                  <h3 className="font-bold text-blue-800 mb-2 text-sm">SMTP Setup</h3>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    Configure your .env file:<br/><br/>
                    <code className="bg-blue-100 px-1 rounded">SMTP_HOST=smtp.gmail.com</code><br/>
                    <code className="bg-blue-100 px-1 rounded">SMTP_USER=your@gmail.com</code><br/>
                    <code className="bg-blue-100 px-1 rounded">SMTP_PASS=app-password</code><br/>
                    <code className="bg-blue-100 px-1 rounded">FROM_EMAIL=noreply@yourdomain.com</code><br/><br/>
                    For production, use <strong>Resend</strong> with:<br/>
                    <code className="bg-blue-100 px-1 rounded">RESEND_API_KEY=re_xxxxx</code>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── TEST EMAIL TAB ────────────────────────────── */}
          {activeTab === 'test' && (
            <div className="max-w-lg bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-5">
              <h2 className="text-lg font-black text-gray-900">Send Test Email</h2>
              <p className="text-sm text-gray-500">Preview any email template before sending it to customers.</p>

              <Field label="Template to Test">
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {TEST_TYPES.map(t => (
                    <button key={t.id} onClick={() => setTestType(t.id)}
                      className={`px-3 py-2.5 rounded-xl border-2 text-sm font-bold text-left transition
                        ${testType === t.id ? 'border-yellow-400 bg-yellow-50 text-yellow-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Send To (Email Address)">
                <Input
                  type="email"
                  value={testEmail}
                  onChange={e => setTestEmail(e.target.value)}
                  placeholder="your@email.com"
                />
              </Field>

              <button
                onClick={handleSendTest}
                disabled={testSending}
                className="w-full py-4 rounded-2xl bg-gray-900 text-yellow-400 font-black text-sm hover:bg-gray-800 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {testSending
                  ? <><span className="w-4 h-4 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin" /> Sending...</>
                  : <><FiZap size={15} /> Send Test Email</>
                }
              </button>
            </div>
          )}

          {/* ── GUIDE TAB ────────────────────────────────── */}
          {activeTab === 'guide' && (
            <div className="max-w-3xl space-y-4">
              {[
                {
                  title: '🔐 OTP & Security Emails',
                  items: ['Email OTP fires on Register, Login (OTP mode), and Forgot Password', 'OTP is 6-digit, valid for 5 minutes, one-time use only', 'Max 5 attempts before OTP is invalidated', 'Password Changed email fires automatically on successful reset'],
                },
                {
                  title: '📦 Order Lifecycle Emails',
                  items: ['Order Placed: Sent immediately with full order summary and item table', 'Order Shipped: Triggered when admin marks as shipped (with tracking number)', 'Order Delivered: Sent on delivery confirmation with review prompt', 'Order Cancelled: Sent with reason and refund status'],
                },
                {
                  title: '📣 Campaign Emails',
                  items: ['Offers: Include coupon code, discount %, and expiry date', 'New Arrivals: Shows up to 3 product images with prices', 'Newsletter: Supports custom HTML in email body', 'Custom: Fully flexible HTML content', 'Target: All users / Verified only / Subscribed only'],
                },
                {
                  title: '🔔 Trigger-based Emails',
                  items: ['Back in Stock: Sends to users who clicked "Notify Me"', 'Abandoned Cart: Can be triggered via cron job after X hours', 'Wishlist Alert: Fires when wishlisted product goes on sale'],
                },
                {
                  title: '⚙️ Email Queue & Reliability',
                  items: ['High-priority emails (OTP, security) are sent instantly, not queued', 'Bulk campaign emails use an in-memory queue with 100ms throttle', 'Failed emails are retried up to 3 times with exponential backoff', 'Batch sending for large campaigns with 1-second pause between batches'],
                },
              ].map(section => (
                <div key={section.title} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-3">{section.title}</h3>
                  <ul className="space-y-1.5">
                    {section.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <FiCheckCircle size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default AdminEmail;

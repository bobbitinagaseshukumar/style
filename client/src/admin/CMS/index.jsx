import React, { useState, useEffect } from 'react';
import api from '../../config/api';
import Button from '../../components/common/Button';
import { FiFileText, FiMessageSquare, FiMail, FiDownload, FiSave, FiCheck, FiSearch } from 'react-icons/fi';
import { toast } from 'react-toastify';

const cmsPagesList = [
  { slug: 'about-us', name: 'About Us Page' },
  { slug: 'contact-us', name: 'Contact Us Page' },
  { slug: 'privacy-policy', name: 'Privacy Policy' },
  { slug: 'terms-conditions', name: 'Terms & Conditions' },
  { slug: 'shipping-policy', name: 'Shipping Policy' },
  { slug: 'refund-policy', name: 'Refund Policy' },
];

const AdminCMS = () => {
  const [activeTab, setActiveTab] = useState('pages');

  // Tab 1: CMS Pages
  const [selectedSlug, setSelectedSlug] = useState('about-us');
  const [pageTitle, setPageTitle] = useState('');
  const [pageContent, setPageContent] = useState('');
  const [savingPage, setSavingPage] = useState(false);

  // Tab 2: Contact Messages
  const [contactMessages, setContactMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Tab 3: Newsletter Subscribers
  const [subscribers, setSubscribers] = useState([]);
  const [loadingSubscribers, setLoadingSubscribers] = useState(false);

  useEffect(() => {
    if (activeTab === 'pages') {
      const fetchPage = async () => {
        try {
          const { data } = await api.get(`/cms/pages/${selectedSlug}`);
          if (data?.data) {
            setPageTitle(data.data.title || '');
            setPageContent(data.data.content || '');
          } else {
            setPageTitle('');
            setPageContent('');
          }
        } catch (err) {
          setPageTitle('');
          setPageContent('');
        }
      };
      fetchPage();
    } else if (activeTab === 'messages') {
      const fetchMessages = async () => {
        try {
          setLoadingMessages(true);
          const { data } = await api.get('/cms/contact/admin/messages');
          setContactMessages(data.data || []);
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingMessages(false);
        }
      };
      fetchMessages();
    } else if (activeTab === 'subscribers') {
      const fetchSubscribers = async () => {
        try {
          setLoadingSubscribers(true);
          const { data } = await api.get('/cms/newsletter/admin/subscribers');
          setSubscribers(data.data || []);
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingSubscribers(false);
        }
      };
      fetchSubscribers();
    }
  }, [activeTab, selectedSlug]);

  const handleSavePage = async (e) => {
    e.preventDefault();
    try {
      setSavingPage(true);
      await api.put(`/cms/pages/${selectedSlug}`, { title: pageTitle, content: pageContent });
      toast.success(`Page '${selectedSlug}' updated successfully!`);
    } catch (err) {
      toast.error('Failed to update page');
    } finally {
      setSavingPage(false);
    }
  };

  const handleExportCSV = () => {
    if (subscribers.length === 0) {
      toast.info('No subscribers to export');
      return;
    }

    const csvRows = ['ID,Email,SubscribedAt'];
    subscribers.forEach(s => {
      csvRows.push(`"${s.id}","${s.email}","${s.createdAt}"`);
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `styleverse_subscribers_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    toast.success('Subscriber CSV exported!');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">CMS & Dynamic Page Manager</h1>
        <p className="text-sm text-gray-500">Edit legal policy pages, view customer inquiries, and export newsletter subscribers</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('pages')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'pages' ? 'border-gold-500 text-gold-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FiFileText /> Page Content Editor
        </button>
        <button
          onClick={() => setActiveTab('messages')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'messages' ? 'border-gold-500 text-gold-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FiMessageSquare /> Customer Inquiries ({contactMessages.length})
        </button>
        <button
          onClick={() => setActiveTab('subscribers')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'subscribers' ? 'border-gold-500 text-gold-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FiMail /> Newsletter Subscribers ({subscribers.length})
        </button>
      </div>

      {/* TAB 1: PAGE EDITOR */}
      {activeTab === 'pages' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-2 h-fit">
            <span className="text-xs font-bold text-gray-400 uppercase block mb-2">Select Page</span>
            {cmsPagesList.map((p) => (
              <button
                key={p.slug}
                onClick={() => setSelectedSlug(p.slug)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  selectedSlug === p.slug ? 'bg-gold-50 text-gold-700 font-bold border border-gold-200' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>

          <form onSubmit={handleSavePage} className="lg:col-span-3 bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Page Title</label>
              <input
                type="text"
                value={pageTitle}
                onChange={e => setPageTitle(e.target.value)}
                placeholder="Page Heading Title"
                className="w-full p-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-gold-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Page HTML Content</label>
              <textarea
                rows={12}
                value={pageContent}
                onChange={e => setPageContent(e.target.value)}
                placeholder="Write HTML content or text for this page..."
                className="w-full p-4 rounded-xl border border-gray-300 font-mono text-xs focus:ring-2 focus:ring-gold-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" loading={savingPage} icon={FiSave}>
                Save Page Content
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: CONTACT MESSAGES */}
      {activeTab === 'messages' && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          {loadingMessages ? (
            <div className="p-8 text-center text-gray-500">Loading messages...</div>
          ) : contactMessages.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No customer contact inquiries yet.</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {contactMessages.map((msg) => (
                <div key={msg.id} className="p-6 space-y-2 hover:bg-gray-50/50">
                  <div className="flex justify-between items-start">
                    <div>
                      <strong className="text-sm text-gray-900">{msg.fullName}</strong>
                      <span className="text-xs text-gray-400 block font-mono">{msg.email} | Phone: {msg.phone || 'N/A'}</span>
                    </div>
                    <span className="text-xs text-gray-400">{new Date(msg.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs font-bold text-gold-600">Subject: {msg.subject}</p>
                  <p className="text-xs text-gray-700 bg-gray-50 p-3 rounded-xl border">{msg.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: NEWSLETTER SUBSCRIBERS */}
      {activeTab === 'subscribers' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Total Subscribers: <strong>{subscribers.length}</strong></span>
            <Button icon={FiDownload} onClick={handleExportCSV}>Export CSV</Button>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-500">Email Address</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-500">Status</th>
                  <th className="px-6 py-3 text-right font-semibold text-gray-500">Subscribed Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {subscribers.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-semibold text-gray-900">{sub.email}</td>
                    <td className="px-6 py-4">
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">Active</span>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-500">{new Date(sub.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCMS;

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiLifeBuoy, FiPlus, FiMessageSquare, FiSend, FiCheckCircle } from 'react-icons/fi';
import api from '../../config/api';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import { toast } from 'react-toastify';

const Support = () => {
  const [tickets, setTickets] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // New Ticket Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [ticketForm, setTicketForm] = useState({ subject: '', category: 'Orders & Delivery', priority: 'MEDIUM', message: '' });

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/support/my-tickets');
      setTickets(data.data || []);
      if (data.data?.length > 0 && !activeTicket) {
        setActiveTicket(data.data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/support/tickets', ticketForm);
      toast.success('Ticket created!');
      setModalOpen(false);
      setTicketForm({ subject: '', category: 'Orders & Delivery', priority: 'MEDIUM', message: '' });
      fetchTickets();
    } catch (err) {
      toast.error('Failed to create ticket');
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;
    try {
      await api.post(`/support/tickets/${activeTicket.id}/reply`, { message: replyMessage });
      setReplyMessage('');
      fetchTickets();
    } catch (err) {
      toast.error('Failed to send reply');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-serif font-bold text-charcoal-900 flex items-center gap-2">
              <FiLifeBuoy className="text-gold-600" /> Customer Support Center
            </h1>
            <p className="text-xs text-gray-500">Track inquiries, order assistance, and support ticket threads</p>
          </div>
          <Button icon={FiPlus} onClick={() => setModalOpen(true)}>Open New Support Ticket</Button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading support portal...</div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center text-gray-400 bg-white rounded-3xl border border-gray-200 max-w-lg mx-auto">
            No support tickets found. Click above to open a ticket if you need assistance.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Ticket List */}
            <div className="bg-white rounded-3xl border border-gray-200 p-4 space-y-3 shadow-sm h-[600px] overflow-y-auto">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">My Tickets ({tickets.length})</span>
              {tickets.map(t => (
                <div
                  key={t.id}
                  onClick={() => setActiveTicket(t)}
                  className={`p-4 rounded-2xl border transition cursor-pointer space-y-2 ${
                    activeTicket?.id === t.id ? 'border-gold-500 bg-gold-50/50 shadow-sm' : 'border-gray-100 hover:border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-mono font-bold text-gold-700">{t.ticketNo}</span>
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${t.status === 'OPEN' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                      {t.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-charcoal-900 line-clamp-1">{t.subject}</h4>
                  <span className="text-[10px] text-gray-400 block">{new Date(t.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>

            {/* Message Thread */}
            {activeTicket && (
              <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-200 shadow-sm flex flex-col h-[600px] overflow-hidden">
                <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                  <div>
                    <span className="text-xs font-mono font-bold text-gold-600">{activeTicket.ticketNo}</span>
                    <h3 className="font-serif font-bold text-base text-charcoal-900">{activeTicket.subject}</h3>
                  </div>
                  <span className="px-3 py-1 bg-gray-200 rounded-full font-bold text-xs text-gray-700">{activeTicket.category}</span>
                </div>

                <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-gray-50/30">
                  {activeTicket.messages?.map(m => (
                    <div
                      key={m.id}
                      className={`max-w-md p-4 rounded-2xl text-xs space-y-1 shadow-sm ${
                        m.senderRole === 'CUSTOMER' ? 'ml-auto bg-charcoal-900 text-white rounded-br-none' : 'mr-auto bg-white border text-charcoal-900 rounded-bl-none'
                      }`}
                    >
                      <div className="flex justify-between items-center font-bold opacity-80 text-[10px]">
                        <span>{m.senderName} ({m.senderRole})</span>
                        <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p>{m.message}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendReply} className="p-3 border-t bg-white flex gap-2">
                  <input
                    type="text"
                    placeholder="Type your reply message..."
                    value={replyMessage}
                    onChange={e => setReplyMessage(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-full border border-gray-200 text-xs focus:ring-2 focus:ring-gold-500 focus:outline-none"
                  />
                  <Button type="submit" icon={FiSend}>Reply</Button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>

      {/* New Ticket Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Open Support Ticket">
        <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
          <Input label="Subject / Issue Title" value={ticketForm.subject} onChange={e => setTicketForm({ ...ticketForm, subject: e.target.value })} required placeholder="e.g. Order Tracking Query" />
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Issue Category</label>
            <select value={ticketForm.category} onChange={e => setTicketForm({ ...ticketForm, category: e.target.value })} className="w-full p-2.5 rounded-xl border border-gray-300">
              <option value="Orders & Delivery">Orders & Delivery</option>
              <option value="Payments & Refunds">Payments & Refunds</option>
              <option value="Product & Fit Enquiry">Product & Fit Enquiry</option>
              <option value="Returns & Exchange">Returns & Exchange</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Detailed Message</label>
            <textarea rows={4} value={ticketForm.message} onChange={e => setTicketForm({ ...ticketForm, message: e.target.value })} required className="w-full p-3 rounded-xl border border-gray-300" placeholder="Describe your issue..." />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">Submit Ticket</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Support;

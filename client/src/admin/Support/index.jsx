import React, { useState, useEffect } from 'react';
import { FiLifeBuoy, FiMessageSquare, FiSend, FiCheck } from 'react-icons/fi';
import api from '../../config/api';
import Button from '../../components/common/Button';
import { toast } from 'react-toastify';

const AdminSupport = () => {
  const [tickets, setTickets] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/support/admin/tickets');
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

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;
    try {
      await api.post(`/support/tickets/${activeTicket.id}/reply`, { message: replyMessage });
      setReplyMessage('');
      fetchTickets();
      toast.success('Support response sent to customer!');
    } catch (err) {
      toast.error('Failed to send reply');
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.put(`/support/admin/tickets/${id}/status`, { status });
      toast.success(`Ticket status set to ${status}!`);
      fetchTickets();
    } catch (err) {
      toast.error('Failed to update ticket status');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-charcoal-900">Support Ticket Inbox</h1>
        <p className="text-xs text-gray-500">Manage customer support tickets, inquiries, and resolution threads</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket List */}
        <div className="bg-white rounded-3xl border border-gray-200 p-4 space-y-3 shadow-sm h-[600px] overflow-y-auto">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Inbox ({tickets.length})</span>
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
              <span className="text-[10px] text-gray-400 block">{t.user?.fullName} ({t.user?.email})</span>
            </div>
          ))}
          {tickets.length === 0 && <p className="text-xs text-center text-gray-400 py-8">No customer tickets in inbox.</p>}
        </div>

        {/* Message Thread & Reply */}
        {activeTicket && (
          <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-200 shadow-sm flex flex-col h-[600px] overflow-hidden">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <div>
                <span className="text-xs font-mono font-bold text-gold-600">{activeTicket.ticketNo}</span>
                <h3 className="font-serif font-bold text-base text-charcoal-900">{activeTicket.subject}</h3>
              </div>
              <div className="flex items-center gap-2">
                {activeTicket.status === 'OPEN' ? (
                  <button onClick={() => handleUpdateStatus(activeTicket.id, 'RESOLVED')} className="px-3 py-1 bg-emerald-600 text-white font-bold text-xs rounded-full">
                    Mark Resolved
                  </button>
                ) : (
                  <button onClick={() => handleUpdateStatus(activeTicket.id, 'OPEN')} className="px-3 py-1 bg-amber-600 text-white font-bold text-xs rounded-full">
                    Reopen Ticket
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-gray-50/30">
              {activeTicket.messages?.map(m => (
                <div
                  key={m.id}
                  className={`max-w-md p-4 rounded-2xl text-xs space-y-1 shadow-sm ${
                    m.senderRole === 'SUPPORT' ? 'ml-auto bg-gold-600 text-white rounded-br-none' : 'mr-auto bg-white border text-charcoal-900 rounded-bl-none'
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
                placeholder="Type official support reply..."
                value={replyMessage}
                onChange={e => setReplyMessage(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-full border border-gray-200 text-xs focus:ring-2 focus:ring-gold-500 focus:outline-none"
              />
              <Button type="submit" icon={FiSend}>Send Reply</Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSupport;

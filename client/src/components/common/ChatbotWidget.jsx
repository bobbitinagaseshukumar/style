import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiMessageSquare, FiX, FiSend, FiShoppingBag, FiTruck,
  FiRefreshCw, FiZap, FiTrash2, FiDownload, FiUser, FiCpu,
  FiCheckCircle, FiHeart, FiTag, FiStar
} from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addToCart } from '../../redux/cart/cartSlice';
import api from '../../config/api';
import { toast } from 'react-toastify';

const QUICK_ACTIONS = [
  { label: '🚚 Track My Order', query: 'Where is my order?' },
  { label: '🔍 Find a Product', query: 'Show me trending luxury items' },
  { label: '🔄 Return & Refund', query: 'What is your return policy?' },
  { label: '📦 Shipping Info', query: 'What are the delivery times and charges?' },
  { label: '💳 Payment Help', query: 'What payment options do you support?' },
  { label: '🎟️ Offers & Coupons', query: 'Show available coupons and offers' },
  { label: '👨‍💻 Human Support', query: 'I want to speak with human customer support' },
];

/**
 * AI Shopping Assistant Chatbot Widget
 * Controlled dynamically by Admin Chatbot Settings in Admin Dashboard!
 */
const ChatbotWidget = () => {
  const [settings, setSettings] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [unread, setUnread] = useState(1);

  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/chatbot-setting/settings');
        const s = res.data?.data;
        setSettings(s);
        if (s?.welcomeMessage) {
          setMessages([
            {
              id: 'init-1',
              sender: 'BOT',
              text: s.welcomeMessage,
              type: 'GREETING',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        }
      } catch (err) {}
    };
    fetchSettings();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      setUnread(0);
      scrollToBottom();
    }
  }, [isOpen, messages]);

  // Hide if disabled by Admin or hidden on current device view or checkout
  const isMobileView = typeof window !== 'undefined' && window.innerWidth < 768;
  if (settings) {
    if (settings.isEnabled === false) return null;
    if (isMobileView && settings.showOnMobile === false) return null;
    if (!isMobileView && settings.showOnDesktop === false) return null;
  }
  if (settings?.hideOnCheckout && location.pathname.startsWith('/checkout')) return null;

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputValue;
    if (!text || !text.trim()) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'USER',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      const res = await api.post('/chatbot/message', { message: text.trim() });
      const botData = res.data?.data || {};

      const botMsg = {
        id: `bot-${Date.now()}`,
        sender: 'BOT',
        text: botData.reply || 'I found some matching details for you.',
        data: botData,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'BOT',
          text: 'I apologize, I am temporarily reconnecting. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const posClass = settings?.position === 'bottom-left'
    ? 'bottom-20 left-4 sm:bottom-6 sm:left-6'
    : 'bottom-20 right-4 sm:bottom-6 sm:right-6';

  return (
    <>
      {/* TRIGGER BUTTON */}
      <div className={`fixed ${posClass} z-50`}>
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-14 h-14 rounded-full bg-charcoal-900 border-2 border-gold-500 text-gold-400 shadow-[0_8px_30px_rgba(212,175,55,0.4)] flex items-center justify-center cursor-pointer group backdrop-blur-md"
          aria-label="Open AI Shopping Assistant"
        >
          {isOpen ? (
            <FiX className="w-6 h-6 text-white" />
          ) : (
            <div className="relative">
              <FiCpu className="w-7 h-7 text-gold-400 group-hover:rotate-12 transition-transform duration-300" />
              <motion.span
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-charcoal-900"
              />
            </div>
          )}

          {!isOpen && unread > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600 text-white font-black text-[10px] flex items-center justify-center border border-black shadow">
              1
            </span>
          )}
        </motion.button>
      </div>

      {/* CHAT WINDOW */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`fixed ${posClass} mb-16 z-50 w-[92vw] sm:w-[400px] h-[540px] bg-[#0D0D0D]/95 border border-gold-500/30 backdrop-blur-2xl rounded-3xl shadow-[0_16px_50px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden`}
          >
            {/* HEADER */}
            <div className="px-5 py-3.5 bg-charcoal-950 border-b border-white/10 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gold-500/10 border border-gold-500/40 text-gold-400 flex items-center justify-center relative">
                  <FiCpu className="w-5 h-5" />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-black" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    KVLR AI Assistant <FiStar className="w-3.5 h-3.5 text-gold-400 fill-gold-400" />
                  </h3>
                  <span className="text-[10px] text-emerald-400 font-semibold">● Online • 24/7 Active</span>
                </div>
              </div>

              <button onClick={() => setIsOpen(false)} title="Close" className="text-gray-400 hover:text-white p-1 rounded-lg">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* MESSAGES BODY */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin">
              {messages.map((m) => (
                <div key={m.id} className={`flex flex-col ${m.sender === 'USER' ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-sm ${
                      m.sender === 'USER'
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-semibold rounded-br-none'
                        : 'bg-white/10 border border-white/10 text-white rounded-bl-none'
                    }`}
                  >
                    <p className="whitespace-pre-line">{m.text}</p>
                  </div>
                  <span className="text-[9px] text-gray-500 mt-1 px-1">{m.timestamp}</span>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-1.5 bg-white/10 border border-white/10 rounded-2xl rounded-bl-none px-3 py-2 w-fit">
                  <span className="w-1.5 h-1.5 bg-gold-400 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-gold-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-gold-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* QUICK ACTIONS */}
            <div className="px-3 py-2 bg-charcoal-950 border-t border-white/5 flex gap-1.5 overflow-x-auto scrollbar-none shrink-0">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  onClick={() => handleSendMessage(action.query)}
                  className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-gold-500/20 border border-white/10 text-gray-300 hover:text-gold-400 text-[10px] font-semibold whitespace-nowrap transition"
                >
                  {action.label}
                </button>
              ))}
            </div>

            {/* INPUT FORM */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 bg-black border-t border-white/10 flex items-center gap-2 shrink-0"
            >
              <input
                type="text"
                placeholder="Ask about products, orders..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:ring-1 focus:ring-gold-500"
              />
              <button
                type="submit"
                className="p-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-amber-600 text-black font-bold hover:from-gold-400 transition cursor-pointer"
              >
                <FiSend className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatbotWidget;

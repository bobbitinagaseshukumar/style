import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiX, FiMic } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../config/api';
import { toast } from 'react-toastify';

const SearchBar = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get(`/ai/suggestions?q=${encodeURIComponent(query)}`);
        setSuggestions(data.data?.products || []);
      } catch (err) {
        console.error(err);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSearch = (e) => {
    e?.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
      onClose();
    }
  };

  const startVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice search is not supported in this browser. Try Google Chrome.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        setIsListening(false);
        navigate(`/search?q=${encodeURIComponent(transcript)}`);
        onClose();
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch (err) {
      setIsListening(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="bg-white border-b overflow-hidden relative shadow-lg"
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-3">
          <form onSubmit={handleSearch} className="relative flex items-center">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-5 w-5 text-gold-600" />
            </div>
            <input
              type="text"
              autoFocus
              className="block w-full pl-10 pr-20 py-3 border border-gray-300 rounded-full leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500 text-sm transition"
              placeholder={isListening ? 'Listening... Speak now...' : 'Search sarees, jewellery, kurtis, lehengas...'}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="absolute right-3 flex items-center gap-2">
              <button
                type="button"
                onClick={startVoiceSearch}
                className={`p-1.5 rounded-full transition ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'text-gray-400 hover:text-gold-600'}`}
                title="Voice Search"
              >
                <FiMic className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
          </form>

          {/* Quick Suggestions Dropdown */}
          {suggestions.length > 0 && (
            <div className="bg-gray-50 border rounded-2xl p-3 space-y-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Suggestions</span>
              {suggestions.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    navigate(`/product/${p.slug}`);
                    onClose();
                  }}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-white cursor-pointer transition"
                >
                  <img src={p.images?.[0]?.url || 'https://via.placeholder.com/40'} alt="" className="w-8 h-10 object-cover rounded" />
                  <span className="text-xs font-semibold text-charcoal-900 truncate flex-1">{p.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SearchBar;

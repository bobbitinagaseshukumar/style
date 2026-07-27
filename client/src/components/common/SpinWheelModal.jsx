import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiGift, FiCopy, FiCheck, FiSparkles, FiZap } from 'react-icons/fi';
import Modal from './Modal';
import { toast } from 'react-toastify';

const PRIZES = [
  { label: '10% OFF', code: 'KVLR10', bg: '#D4AF37', text: '#000' },
  { label: '₹500 FLAT', code: 'FLAT500', bg: '#121212', text: '#FFF' },
  { label: '15% VIP', code: 'VIP15', bg: '#B8860B', text: '#FFF' },
  { label: 'FREE SHIPPING', code: 'FREESHIP', bg: '#1E293B', text: '#FFF' },
  { label: '20% LUXURY', code: 'LUXURY20', bg: '#DC2626', text: '#FFF' },
  { label: 'EXTRA 5%', code: 'EXTRA5', bg: '#059669', text: '#FFF' },
];

/**
 * Interactive Lucky Spin Coupon Wheel
 * Features GPU-accelerated SVG wheel rotation, decelerating deceleration curve, prize claim & 1-click promo code copy.
 */
const SpinWheelModal = ({ isOpen, onClose }) => {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonPrize, setWonPrize] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleSpin = () => {
    if (spinning || wonPrize) return;

    setSpinning(true);
    setWonPrize(null);

    // Pick random prize index (0 to 5)
    const prizeIndex = Math.floor(Math.random() * PRIZES.length);
    const segmentAngle = 360 / PRIZES.length;
    
    // Calculate total rotation: 5 full spins (1800 deg) + offset to segment
    const targetDegree = 1800 + (360 - (prizeIndex * segmentAngle + segmentAngle / 2));
    setRotation(targetDegree);

    setTimeout(() => {
      setSpinning(false);
      setWonPrize(PRIZES[prizeIndex]);
      toast.success(`🎉 Congratulations! You won ${PRIZES[prizeIndex].label}!`);
    }, 4500);
  };

  const handleCopyCode = () => {
    if (!wonPrize) return;
    navigator.clipboard.writeText(wonPrize.code);
    setCopied(true);
    toast.success(`Coupon code ${wonPrize.code} copied!`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🎁 Spin & Win Exclusive Discount">
      <div className="flex flex-col items-center justify-center p-4 text-center select-none">
        <p className="text-xs text-gray-500 mb-6 font-medium">
          Spin the luxury wheel to unlock your exclusive instant checkout discount!
        </p>

        {/* WHEEL CONTAINER */}
        <div className="relative w-64 h-64 sm:w-80 sm:h-80 my-2">
          {/* Wheel Pointer Pin */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-amber-500 drop-shadow-md" />

          {/* SVG Rotating Wheel */}
          <motion.div
            animate={{ rotate: rotation }}
            transition={{ duration: 4.5, ease: [0.15, 0.9, 0.2, 1] }}
            className="w-full h-full rounded-full border-4 border-amber-500 shadow-2xl overflow-hidden relative"
          >
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              {PRIZES.map((prize, idx) => {
                const angle = 360 / PRIZES.length;
                const startAngle = idx * angle;
                const endAngle = (idx + 1) * angle;

                const x1 = 50 + 50 * Math.cos((Math.PI * startAngle) / 180);
                const y1 = 50 + 50 * Math.sin((Math.PI * startAngle) / 180);
                const x2 = 50 + 50 * Math.cos((Math.PI * endAngle) / 180);
                const y2 = 50 + 50 * Math.sin((Math.PI * endAngle) / 180);

                const d = `M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`;
                const textAngle = startAngle + angle / 2;
                const textX = 50 + 32 * Math.cos((Math.PI * textAngle) / 180);
                const textY = 50 + 32 * Math.sin((Math.PI * textAngle) / 180);

                return (
                  <g key={idx}>
                    <path d={d} fill={prize.bg} stroke="#ffffff" strokeWidth="0.5" />
                    <text
                      x={textX}
                      y={textY}
                      fill={prize.text}
                      fontSize="4.2"
                      fontWeight="900"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(${textAngle + 90}, ${textX}, ${textY})`}
                    >
                      {prize.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </motion.div>

          {/* Center Hub Button */}
          <button
            onClick={handleSpin}
            disabled={spinning || !!wonPrize}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-charcoal-900 font-black text-xs shadow-xl border-4 border-white flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition disabled:opacity-80"
          >
            {spinning ? 'SPINNING...' : wonPrize ? 'WON!' : 'SPIN NOW'}
          </button>
        </div>

        {/* PRIZE CLAIM CARD */}
        <AnimatePresence>
          {wonPrize && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/40 w-full max-w-sm flex items-center justify-between"
            >
              <div className="text-left">
                <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest block">Your Reward Code</span>
                <p className="text-lg font-black text-gray-900">{wonPrize.code}</p>
              </div>

              <button
                onClick={handleCopyCode}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs flex items-center gap-1.5 shadow transition"
              >
                {copied ? <FiCheck className="w-4 h-4" /> : <FiCopy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy Code'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  );
};

export default SpinWheelModal;

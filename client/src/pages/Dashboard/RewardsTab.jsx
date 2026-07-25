import React from 'react';
import { motion } from 'framer-motion';
import { FiStar, FiGift, FiAward, FiTrendingUp, FiLock } from 'react-icons/fi';

const TIERS = [
  { name: 'Bronze', min: 0, max: 999, color: '#CD7F32', emoji: '🥉' },
  { name: 'Silver', min: 1000, max: 4999, color: '#C0C0C0', emoji: '🥈' },
  { name: 'Gold', min: 5000, max: 14999, color: '#D4AF37', emoji: '🥇' },
  { name: 'Platinum', min: 15000, max: Infinity, color: '#E5E4E2', emoji: '💎' },
];

const PERKS = [
  { icon: FiGift, label: 'Birthday Bonus', value: '200 pts', locked: false },
  { icon: FiTrendingUp, label: 'Earn on Orders', value: '1 pt per ₹10', locked: false },
  { icon: FiAward, label: 'Silver Perks', value: 'Free shipping', locked: true },
  { icon: FiStar, label: 'Gold Perks', value: 'Priority support', locked: true },
];

const RewardsTab = () => {
  const points = 0; // Replace with real data when API ready
  const currentTier = TIERS.find(t => points >= t.min && points <= t.max) || TIERS[0];
  const nextTier = TIERS[TIERS.findIndex(t => t === currentTier) + 1];
  const progress = nextTier ? Math.min(100, ((points - currentTier.min) / (nextTier.min - currentTier.min)) * 100) : 100;

  return (
    <div className="p-6">
      <div className="mb-6 pb-4 border-b border-white/5">
        <h2 className="text-xl font-bold text-white">Reward Points</h2>
        <p className="text-white/40 text-sm">Earn points with every purchase</p>
      </div>

      {/* Points Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden rounded-2xl p-6 mb-6"
        style={{ background: `linear-gradient(135deg, ${currentTier.color}20, ${currentTier.color}05)`, border: `1px solid ${currentTier.color}30` }}
      >
        <div className="absolute top-0 right-0 text-8xl opacity-10 select-none pointer-events-none">{currentTier.emoji}</div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">{currentTier.emoji}</span>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: currentTier.color }}>{currentTier.name} Member</p>
              <p className="text-white/50 text-xs">StyleVerse Loyalty Club</p>
            </div>
          </div>
          <div className="flex items-end gap-2 mb-4">
            <span className="text-5xl font-bold text-white">{points.toLocaleString('en-IN')}</span>
            <span className="text-white/40 text-sm mb-2">points</span>
          </div>
          {nextTier && (
            <>
              <div className="flex justify-between text-xs text-white/40 mb-1.5">
                <span>{currentTier.name}</span>
                <span>{nextTier.name} — {(nextTier.min - points).toLocaleString('en-IN')} pts to go</span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${currentTier.color}, ${nextTier.color})` }}
                />
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Tiers Overview */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {TIERS.map((tier, i) => (
          <div
            key={tier.name}
            className={`text-center p-3 rounded-xl border transition-all ${tier === currentTier ? 'border-yellow-400/30 bg-yellow-400/5' : 'border-white/5 bg-white/2'}`}
          >
            <div className="text-2xl mb-1">{tier.emoji}</div>
            <p className="text-xs font-bold text-white/70">{tier.name}</p>
            <p className="text-[10px] text-white/30 mt-0.5">{tier.min === 0 ? '0' : tier.min.toLocaleString()}+</p>
          </div>
        ))}
      </div>

      {/* Perks */}
      <div>
        <h3 className="text-sm font-bold text-white/70 uppercase tracking-widest mb-3">Member Perks</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {PERKS.map((perk, i) => (
            <motion.div
              key={perk.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all ${perk.locked ? 'border-white/5 bg-white/2 opacity-50' : 'border-yellow-400/20 bg-yellow-400/5'}`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${perk.locked ? 'bg-white/5' : 'bg-yellow-400/10'}`}>
                {perk.locked ? <FiLock size={14} className="text-white/30" /> : <perk.icon size={14} className="text-yellow-400" />}
              </div>
              <div>
                <p className="text-sm font-medium text-white/70">{perk.label}</p>
                <p className="text-xs text-white/30">{perk.value}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RewardsTab;

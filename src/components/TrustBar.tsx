import React from 'react';
import { motion } from 'motion/react';
import { Zap, ShieldCheck, Star, Headset } from 'lucide-react';

export const TrustBar: React.FC = () => {
  const trustItems = [
    {
      icon: Zap,
      title: 'Instant Delivery',
      subtitle: 'Immediate download links & license keys',
      iconColor: 'text-amber-400',
      badgeBg: 'bg-amber-500/10 border-amber-500/20'
    },
    {
      icon: ShieldCheck,
      title: 'Secure Checkout',
      subtitle: 'JazzCash, EasyPaisa, Cards & USDT',
      iconColor: 'text-[#28B9FF]',
      badgeBg: 'bg-[#0D6EFD]/10 border-[#28B9FF]/25'
    },
    {
      icon: Headset,
      title: 'Lifetime Support',
      subtitle: 'Free updates & fast WhatsApp assistance',
      iconColor: 'text-[#22C55E]',
      badgeBg: 'bg-[#22C55E]/10 border-[#22C55E]/20'
    }
  ];

  return (
    <section id="trust-bar" className="relative z-10 -mt-3 mb-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative overflow-hidden rounded-2xl bg-slate-900/85 border border-slate-800/80 shadow-xl shadow-slate-950/50 backdrop-blur-xl transition-all duration-300 hover:border-slate-700/80"
        >
          
          {/* Subtle Ambient Top Border Highlight */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#28B9FF]/50 via-emerald-400/40 to-transparent pointer-events-none" />

          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-800/70 p-4 sm:p-5 lg:p-6">
            {trustItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <div 
                  key={index} 
                  className={`flex items-center gap-3.5 group transition-colors ${
                    index === 0 ? '' : 'pt-4 sm:pt-0 sm:pl-4 lg:pl-6'
                  }`}
                >
                  <div className={`p-2.5 sm:p-3 rounded-xl border ${item.badgeBg} ${item.iconColor} shrink-0 group-hover:scale-105 transition-transform duration-200 shadow-sm`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-white tracking-tight group-hover:text-[#28B9FF] transition-colors truncate">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-400 font-normal mt-0.5 leading-snug">
                      {item.subtitle}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

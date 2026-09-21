import React from 'react';
import { motion } from 'motion/react';
import { Search, ShoppingBag, CreditCard, Download, ArrowRight } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      num: '01',
      icon: Search,
      title: 'Browse & Choose',
      desc: 'Explore courses, templates, softwares, and pro tool subscriptions curated for your growth.',
      color: 'text-[#28B9FF] bg-[#28B9FF]/10 border-[#28B9FF]/30'
    },
    {
      num: '02',
      icon: ShoppingBag,
      title: 'Buy Now',
      desc: 'Click Buy Now and confirm your items directly via instant checkout or 1-click WhatsApp.',
      color: 'text-amber-400 bg-amber-400/10 border-amber-400/30'
    },
    {
      num: '03',
      icon: CreditCard,
      title: 'Pay Securely',
      desc: 'Send payment via JazzCash, EasyPaisa, NayaPay, SadaPay, Local Bank, or Binance Crypto.',
      color: 'text-[#0D6EFD] bg-[#0D6EFD]/10 border-[#0D6EFD]/30'
    },
    {
      num: '04',
      icon: Download,
      title: 'Get Instant Access',
      desc: 'Download links, serial keys, or email invites are instantly generated in your dashboard!',
      color: 'text-[#22C55E] bg-[#22C55E]/10 border-[#22C55E]/30'
    }
  ];

  return (
    <section id="how-it-works" className="py-16 relative bg-slate-950/80 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-12"
        >
          <span className="text-xs font-bold tracking-widest uppercase text-[#28B9FF] bg-[#0D6EFD]/10 px-3 py-1 rounded-full border border-[#0D6EFD]/20">
            Simple 4-Step Process
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mt-3">
            How It Works
          </h2>
          <p className="text-sm sm:text-base text-slate-400 mt-2">
            No long waiting periods. From selection to download in under 3 minutes.
          </p>
        </motion.div>

        {/* 4 Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative flex flex-col justify-between hover:border-slate-700 transition-all group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3.5 rounded-xl border ${step.color} group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-2xl font-black text-slate-700 group-hover:text-slate-500 transition-colors">
                    {step.num}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-base text-white mb-2 group-hover:text-[#28B9FF] transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-xs text-slate-400 font-normal leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                {index < 3 && (
                  <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                    <ArrowRight className="w-5 h-5 text-slate-600" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

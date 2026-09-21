import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Lock, Smartphone, Globe, CreditCard, Wallet } from 'lucide-react';

export const PaymentMethods: React.FC = () => {
  const methods = [
    {
      name: 'JazzCash',
      badge: 'PKR Mobile Wallet',
      icon: Wallet,
      color: 'text-red-400 bg-red-400/10 border-red-400/30',
      subtitle: 'Local Instant Transfer',
      desc: 'Instant PKR mobile wallet transfer via JazzCash App or USSD *786#.'
    },
    {
      name: 'EasyPaisa',
      badge: 'PKR Mobile Wallet',
      icon: Smartphone,
      color: 'text-[#22C55E] bg-[#22C55E]/10 border-[#22C55E]/30',
      subtitle: 'Local Instant Transfer',
      desc: 'Send payment directly via EasyPaisa App or USSD *786#.'
    },
    {
      name: 'NayaPay',
      badge: 'PKR Digital Wallet',
      icon: CreditCard,
      color: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
      subtitle: 'Zero Fee Transfer',
      desc: 'Instant zero-fee transfer via NayaPay app or digital wallet.'
    },
    {
      name: 'Binance Pay',
      badge: 'Global Crypto',
      icon: Globe,
      color: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
      subtitle: 'Global Crypto Payment',
      desc: 'Pay globally with 0% fee using Binance Pay or USDT TRC20.'
    }
  ];

  return (
    <section id="payment-methods" className="py-16 relative bg-slate-950/80 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-12"
        >
          <span className="text-xs font-bold tracking-widest uppercase text-[#28B9FF] bg-[#0D6EFD]/10 px-3.5 py-1.5 rounded-full border border-[#0D6EFD]/20 inline-flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[#22C55E]" />
            <span>256-Bit SSL Encrypted Checkout</span>
          </span>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mt-3">
            Supported Payment Gateways
          </h2>

          <p className="text-sm sm:text-base text-slate-400 mt-2">
            Secure checkout via local Pakistani mobile wallets and global crypto.
          </p>
        </motion.div>

        {/* Methods Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 relative">
          {methods.map((method, index) => {
            const Icon = method.icon;
            return (
              <motion.div
                key={method.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative flex flex-col justify-between hover:border-slate-700 transition-all group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3.5 rounded-xl border ${method.color} group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-slate-950/80 border border-slate-800 text-slate-300">
                    {method.badge}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-base text-white mb-1 group-hover:text-[#28B9FF] transition-colors">
                    {method.name}
                  </h3>
                  <span className="text-[11px] font-semibold text-[#28B9FF] block mb-2">
                    {method.subtitle}
                  </span>
                  <p className="text-xs text-slate-400 font-normal leading-relaxed">
                    {method.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="mt-8 flex items-center justify-center gap-2 text-xs sm:text-sm text-slate-400 text-center">
          <ShieldCheck className="w-4 h-4 text-[#22C55E]" />
          <span>Instant verification on WhatsApp within 5 minutes. 100% money-back guarantee.</span>
        </div>

      </div>
    </section>
  );
};

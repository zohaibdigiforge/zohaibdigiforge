import React from 'react';
import { motion } from 'motion/react';
import { Tag, Zap, ShieldCheck, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { Currency } from '../types';
import { usePricing } from '../context/PricingContext';

interface FlatPriceBannerProps {
  currency?: Currency;
  onBrowseClick?: () => void;
}

export const FlatPriceBanner: React.FC<FlatPriceBannerProps> = ({
  currency = 'PKR',
  onBrowseClick
}) => {
  const { formatCombinedPrice } = usePricing();
  const priceDisplay = formatCombinedPrice();

  return (
    <section aria-label="Flat Rate Pricing Guarantee" className="py-6 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border border-[#22C55E]/40 p-5 sm:p-7 shadow-2xl shadow-[#22C55E]/10"
        >
          
          {/* Subtle Ambient Background Lighting */}
          <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-[#22C55E]/20 via-emerald-500/10 to-transparent blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-32 bg-[#0D6EFD]/10 blur-xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
            
            {/* Left Content */}
            <div className="flex items-start sm:items-center gap-4 text-left">
              <div className="p-3.5 rounded-2xl bg-[#22C55E]/20 border border-[#22C55E]/40 text-[#22C55E] shrink-0 shadow-inner">
                <Tag className="w-7 h-7 text-[#22C55E]" />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/40 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#22C55E]" />
                    Unbeatable Value Guarantee
                  </span>
                  <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                    • No subscriptions, no hidden fees
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight leading-snug">
                  Every Resource. One Price.{' '}
                  <span className="text-[#22C55E] underline decoration-[#22C55E]/40 decoration-wavy underline-offset-4">
                    {priceDisplay}
                  </span>
                </h2>

                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-normal leading-relaxed">
                  Unlock instant Google Drive access to any course, graphics bundle, template, software or e-book for a single flat rate.{' '}
                  <span className="text-amber-300/90 font-medium text-xs bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 inline-block mt-1 sm:mt-0 sm:inline">
                    *Note: Pro tool accounts are priced separately and not at flat rate
                  </span>
                </p>
              </div>
            </div>

            {/* Right Badges & Optional CTA */}
            <div className="flex flex-wrap items-center justify-center lg:justify-end gap-3 shrink-0 w-full lg:w-auto pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800/80">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 text-xs font-semibold">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Instant Drive Delivery</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
                <span>Lifetime Access</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-[#28B9FF]" />
                <span>100% Virus-Free</span>
              </div>

              {onBrowseClick && (
                <button
                  onClick={onBrowseClick}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#22C55E] hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md hover:shadow-[#22C55E]/30 min-h-[44px]"
                >
                  <span>Explore All ({priceDisplay})</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

          </div>

        </motion.div>
      </div>
    </section>
  );
};

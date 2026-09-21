import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Users, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

interface CommunityCalloutProps {
  onNavigateResources?: (category?: string) => void;
  onNavigateJoinUs?: () => void;
  title?: string;
  subtitle?: string;
  description?: string;
  className?: string;
}

export const CommunityCallout: React.FC<CommunityCalloutProps> = ({
  onNavigateResources,
  onNavigateJoinUs,
  title = "Unlock Premium Digital Tools & Join Our Creator Hub",
  subtitle = "Curated Resources & VIP Community",
  description = "Get instant access to hand-picked developer toolkits, verified discount codes, and join creators in the Zohaib DigiForge circle.",
  className = ""
}) => {
  const handleResources = () => {
    if (onNavigateResources) {
      onNavigateResources('all');
    } else {
      window.location.href = '/#resources';
    }
  };

  const handleJoin = () => {
    if (onNavigateJoinUs) {
      onNavigateJoinUs();
    } else {
      window.open('https://wa.me/923406070632?text=Hi%20Zohaib!%20I%20want%20to%20join%20the%20DigiForge%20Community.', '_blank');
    }
  };

  return (
    <section className={`py-8 sm:py-10 ${className}`}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-slate-700 transition-all shadow-sm"
        >
          {/* Left Text Box */}
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0D6EFD]/10 border border-[#0D6EFD]/25 text-[#28B9FF] text-[11px] font-bold tracking-wider uppercase">
              <Sparkles className="w-3 h-3 text-[#28B9FF]" />
              <span>{subtitle}</span>
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {title}
            </h3>

            <p className="text-xs sm:text-sm text-slate-400 font-normal leading-relaxed">
              {description}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#22C55E]" /> Verified Tools
              </span>
              <span className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Instant Access
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]"></span> Free Community
              </span>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-stretch sm:items-center gap-2.5 flex-shrink-0">
            <button
              type="button"
              onClick={handleResources}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0D6EFD] to-[#28B9FF] hover:from-[#0b5ed7] hover:to-[#1fa8ea] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-[#0D6EFD]/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
            >
              <span>Resources</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleJoin}
              className="px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-700 hover:border-[#22C55E]/40 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
            >
              <Users className="w-3.5 h-3.5 text-[#22C55E]" />
              <span>Join Us</span>
            </button>
          </div>
        </motion.div>

      </div>
    </section>
  );
};

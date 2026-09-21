import React, { useState, useEffect } from 'react';
import { ShieldCheck, Zap, ArrowRight, Play, Sparkles, CheckCircle, Download, Users, Wrench, Crown, Package, Layers } from 'lucide-react';

interface HeroProps {
  onBrowseClick: () => void;
  onHowItWorksClick: () => void;
  onJoinUsClick?: () => void;
  totalAssetsCount?: number;
}

export const Hero: React.FC<HeroProps> = ({ 
  onBrowseClick, 
  onHowItWorksClick, 
  onJoinUsClick,
  totalAssetsCount = 0
}) => {
  const assetCount = totalAssetsCount;

  const handleJoinUsClick = () => {
    if (onJoinUsClick) {
      onJoinUsClick();
    } else {
      const el = document.getElementById('footer-join-us-btn');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <section id="hero" className="relative pt-8 pb-16 md:pt-16 md:pb-24 overflow-hidden">
      {/* Background Subtle Radial Lighting Accent */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-[#0D6EFD]/20 via-[#28B9FF]/15 to-[#22C55E]/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        
        {/* Dynamic Counter & Community Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {/* Dynamic Live Asset Counter */}
          <button
            onClick={onBrowseClick}
            id="hero-dynamic-asset-counter"
            className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-[#22C55E]/40 hover:border-[#22C55E] text-xs sm:text-sm font-medium text-slate-100 shadow-md shadow-emerald-950/40 hover:scale-[1.02] transition-all cursor-pointer backdrop-blur-md group"
            title="Click to view all digital assets"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22C55E] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#22C55E]"></span>
            </span>
            <Package className="w-3.5 h-3.5 text-[#22C55E] group-hover:rotate-6 transition-transform" />
            <span className="flex items-center gap-1.5">
              <span className="font-extrabold text-[#22C55E] text-sm sm:text-base tabular-nums">
                {assetCount}+
              </span>
              <span className="text-white font-semibold">Digital Products Listed</span>
            </span>
            <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
          </button>

          {/* Community Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-[#28B9FF]/30 text-xs sm:text-sm font-medium text-slate-200 shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-[#28B9FF]" />
            <span>Built to Stop Overpriced Digital Tools</span>
          </div>
        </div>

        {/* Main Headline (Instant LCP Paint) */}
        <h1 
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15]"
        >
          Premium Digital Resources &amp; Pro Tools —{' '}
          <span className="bg-gradient-to-r from-[#28B9FF] via-[#0D6EFD] to-[#22C55E] bg-clip-text text-transparent">
            Delivered Instantly, Anywhere.
          </span>
        </h1>

        {/* Subheadline */}
        <p 
          className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed"
        >
          Premium Courses, Amazing Templates, Pro Level Software, Stunning Graphics Assets, and Expert E-Books curated for students, professionals, and creators around the world.
        </p>

        {/* CTA Action Buttons - Primary (Solid Green) & Secondary (Join Us) */}
        <div 
          className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button
            onClick={onBrowseClick}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#22C55E] hover:bg-[#1fbd58] text-slate-950 font-bold text-base shadow-xl shadow-[#22C55E]/25 hover:shadow-[#22C55E]/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group cursor-pointer"
          >
            <span>Browse Resources</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={handleJoinUsClick}
            className="w-full sm:w-auto px-7 py-4 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 hover:border-[#28B9FF]/60 text-white font-semibold text-base transition-all flex items-center justify-center gap-2.5 cursor-pointer group shadow-lg shadow-black/20"
          >
            <Users className="w-4 h-4 text-[#28B9FF] group-hover:text-[#22C55E] transition-colors" />
            <span>Join Us</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-[#22C55E] border border-emerald-500/30 font-bold ml-0.5">Community</span>
          </button>
        </div>

        {/* Mini Trust Highlights */}
        <div 
          className="pt-4 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-slate-400 font-medium"
        >
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-[#22C55E]" />
            <span>{assetCount}+ Verified Digital Assets</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-[#22C55E]" />
            <span>Instant Download &amp; Key Activation</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-[#22C55E]" />
            <span>JazzCash, EasyPaisa, Bank &amp; Crypto</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-[#22C55E]" />
            <span>Rapid WhatsApp Support</span>
          </div>
        </div>

      </div>
    </section>
  );
};

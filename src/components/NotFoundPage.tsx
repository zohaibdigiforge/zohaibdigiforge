import React, { useState } from 'react';
import { 
  Home, 
  ShoppingBag, 
  Sparkles, 
  MessageCircle, 
  Search, 
  ArrowRight, 
  ExternalLink,
  BookOpen,
  Info,
  Phone,
  HelpCircle,
  Compass,
  FileQuestion,
  ChevronRight
} from 'lucide-react';
import { LegalDocId } from '../types';

interface NotFoundPageProps {
  onNavigateHome: () => void;
  onNavigateResources: (categorySlug?: string, subcategorySlug?: string, searchQuery?: string) => void;
  onNavigateMembership: () => void;
  onNavigateAbout?: () => void;
  onNavigateContact?: () => void;
  onNavigateLegal?: (docId: LegalDocId) => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  onNavigateHome,
  onNavigateResources,
  onNavigateMembership,
  onNavigateAbout,
  onNavigateContact,
  onNavigateLegal
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigateResources('all', 'all', searchQuery.trim());
    } else {
      onNavigateResources('all', 'all');
    }
  };

  const handleQuickTagClick = (tag: string) => {
    onNavigateResources('all', 'all', tag);
  };

  const popularTags = [
    'CapCut Pro',
    'Full-Stack Dev',
    'Notion OS',
    'Video Editing LUTs',
    'Trading Course',
    'Canva Assets'
  ];

  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
  const waHelpText = encodeURIComponent(
    `Hi Zohaib DigiForge! I ran into a missing page (${currentPath || '404'}) on your website and need help finding a resource.`
  );
  const waUrl = `https://wa.me/923406070632?text=${waHelpText}`;

  return (
    <div className="min-h-[85vh] bg-[#0A0F1D] text-slate-100 py-12 sm:py-16 px-4 sm:px-6 lg:px-8 font-sans selection:bg-[#0D6EFD]/30 selection:text-white flex flex-col justify-center">
      <div className="max-w-4xl mx-auto w-full space-y-10">

        {/* ═════════════════════════════════════════════════════════════
           1. HERO 404 VISUAL & CORE MESSAGE
           ═════════════════════════════════════════════════════════════ */}
        <div className="text-center space-y-5 relative">
          
          {/* Subtle Ambient Glows */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-tr from-[#0D6EFD]/15 via-[#28B9FF]/10 to-[#22C55E]/10 rounded-full blur-3xl pointer-events-none -z-10" />

          {/* Styled "404" Numeral with Brand "D" Motif and Multi-Layer Gradient */}
          <div className="inline-flex items-center justify-center relative select-none">
            <div className="relative">
              {/* Outer Glow Text */}
              <span className="text-7xl sm:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#0D6EFD] via-[#28B9FF] to-[#22C55E] opacity-90 drop-shadow-[0_10px_35px_rgba(13,110,253,0.35)]">
                4<span className="inline-block relative">
                  {/* Styled center "0" with DigiForge 'D' shield motif */}
                  <span className="opacity-95">0</span>
                  <span className="absolute inset-0 flex items-center justify-center text-xs sm:text-sm font-black text-white bg-slate-900/90 border border-[#28B9FF]/40 rounded-lg sm:rounded-xl px-1.5 py-0.5 transform -translate-y-0.5 shadow-md">
                    D
                  </span>
                </span>4
              </span>
            </div>
          </div>

          {/* Plain-Language Core Message (No blame, no jargon) */}
          <div className="space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-semibold text-slate-300 shadow-sm">
              <FileQuestion className="w-3.5 h-3.5 text-[#28B9FF]" />
              <span>HTTP 404 &bull; Page Not Found</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              This Page Took a Wrong Turn.
            </h1>

            <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed max-w-xl mx-auto">
              The page you're looking for doesn't exist — it may have been moved, renamed, or the link might be off. Let's get you back on track.
            </p>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════
           2. FUNCTIONAL SEARCH BAR (Connects to Resources Catalog)
           ═════════════════════════════════════════════════════════════ */}
        <div className="max-w-2xl mx-auto w-full">
          <form 
            onSubmit={handleSearchSubmit}
            className="relative flex items-center shadow-xl rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-950/90 focus-within:border-[#0D6EFD] focus-within:ring-2 focus-within:ring-[#0D6EFD]/30 transition-all"
          >
            <div className="pl-4 sm:pl-5 text-slate-400">
              <Search className="w-5 h-5 text-[#28B9FF]" />
            </div>
            
            <input
              id="404-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a resource, tool, or page..."
              className="w-full py-4 pl-3 pr-24 sm:pr-32 bg-transparent text-sm sm:text-base text-white placeholder:text-slate-500 focus:outline-none"
            />

            <button
              id="404-search-submit-btn"
              type="submit"
              className="absolute right-2 top-2 bottom-2 px-4 sm:px-6 rounded-xl bg-gradient-to-r from-[#0D6EFD] to-[#28B9FF] hover:opacity-95 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer min-h-[40px]"
            >
              <span>Search</span>
              <ArrowRight className="w-3.5 h-3.5 hidden sm:inline" />
            </button>
          </form>

          {/* Quick Search Suggestions */}
          <div className="mt-3 flex items-center justify-center flex-wrap gap-1.5 sm:gap-2">
            <span className="text-[11px] text-slate-400 font-medium mr-1">Popular searches:</span>
            {popularTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleQuickTagClick(tag)}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════
           3. LIGHT BRAND PERSONALITY & 4 RECOVERY PATHS
           ═════════════════════════════════════════════════════════════ */}
        <div className="space-y-4 max-w-3xl mx-auto w-full">
          {/* Subtle On-Brand Punchline */}
          <p className="text-center text-xs sm:text-sm text-slate-400 font-medium">
            Even we couldn't find this one — but we know exactly where the good stuff is 👇
          </p>

          {/* 4 Clear Destination Cards/Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            
            {/* 1. Go to Homepage */}
            <button
              id="404-recovery-home-btn"
              onClick={onNavigateHome}
              className="group p-4 sm:p-5 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 flex items-center justify-between text-left transition-all shadow-md cursor-pointer min-h-[56px]"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-300 group-hover:text-[#28B9FF] group-hover:border-[#0D6EFD]/40 transition-colors shrink-0">
                  <Home className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white group-hover:text-[#28B9FF] transition-colors">
                    Go to Homepage
                  </h3>
                  <p className="text-xs text-slate-400 truncate">
                    Return to the main store and curated picks
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0 ml-2" />
            </button>

            {/* 2. Browse Resources (Core Catalog — Highest-Value Recovery Path) */}
            <button
              id="404-recovery-resources-btn"
              onClick={() => onNavigateResources('all', 'all')}
              className="group p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#0D6EFD]/20 via-slate-900/90 to-slate-900/90 hover:from-[#0D6EFD]/30 border border-[#0D6EFD]/40 hover:border-[#28B9FF]/60 flex items-center justify-between text-left transition-all shadow-lg shadow-[#0D6EFD]/10 cursor-pointer min-h-[56px] relative overflow-hidden"
            >
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#22C55E] text-[9px] font-extrabold uppercase tracking-wider hidden sm:block">
                Top Pick
              </div>
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-[#0D6EFD]/20 border border-[#0D6EFD]/40 flex items-center justify-center text-[#28B9FF] shrink-0">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white group-hover:text-[#28B9FF] transition-colors flex items-center gap-1.5">
                    <span>Browse Resources</span>
                  </h3>
                  <p className="text-xs text-slate-400 truncate">
                    Verified courses, templates &amp; assets
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#28B9FF] group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
            </button>

            {/* 3. See Membership & Bundles */}
            <button
              id="404-recovery-membership-btn"
              onClick={onNavigateMembership}
              className="group p-4 sm:p-5 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 flex items-center justify-between text-left transition-all shadow-md cursor-pointer min-h-[56px]"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-amber-400 group-hover:border-amber-500/40 transition-colors shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                    See Membership &amp; Bundles
                  </h3>
                  <p className="text-xs text-slate-400 truncate">
                    Unlock all-access vault passes &amp; curated bundles
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0 ml-2" />
            </button>

            {/* 4. Need Help? Message Us on WhatsApp */}
            <a
              id="404-recovery-whatsapp-btn"
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group p-4 sm:p-5 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-[#22C55E]/40 flex items-center justify-between text-left transition-all shadow-md cursor-pointer min-h-[56px]"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-[#22C55E]/15 border border-[#22C55E]/30 flex items-center justify-center text-[#22C55E] shrink-0">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white group-hover:text-[#22C55E] transition-colors flex items-center gap-1">
                    <span>Need Help? WhatsApp Us</span>
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </h3>
                  <p className="text-xs text-slate-400 truncate">
                    Direct 1-on-1 assistance (+92 340 6070632)
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-[#22C55E] group-hover:translate-x-1 transition-all shrink-0 ml-2" />
            </a>

          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════
           4. POPULAR LINKS (Secondary Tier, Clean Row)
           ═════════════════════════════════════════════════════════════ */}
        <div className="pt-2 border-t border-slate-800/80 text-center">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs text-slate-400">
            <span className="text-slate-500 font-semibold">Quick Links:</span>

            {onNavigateAbout && (
              <button
                onClick={onNavigateAbout}
                className="hover:text-white transition-colors cursor-pointer"
              >
                About Us
              </button>
            )}

            {onNavigateContact && (
              <button
                onClick={onNavigateContact}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Contact Us
              </button>
            )}

            {onNavigateContact && (
              <button
                onClick={() => {
                  onNavigateContact();
                  setTimeout(() => {
                    const el = document.getElementById('faq-section') || document.getElementById('faq');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }, 150);
                }}
                className="hover:text-white transition-colors cursor-pointer"
              >
                FAQ
              </button>
            )}

            {onNavigateLegal && (
              <button
                onClick={() => onNavigateLegal('refund')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Refund Policy
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

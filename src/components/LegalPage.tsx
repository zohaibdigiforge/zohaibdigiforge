import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  FileText, 
  RefreshCw, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  AlertTriangle, 
  Phone, 
  Mail, 
  Copy, 
  Check, 
  ExternalLink, 
  ChevronRight, 
  ChevronDown, 
  Clock, 
  ArrowLeft, 
  Sparkles, 
  BookOpen, 
  HelpCircle,
  Share2,
  Menu,
  X,
  MessageCircle,
  CheckCheck
} from 'lucide-react';
import { LegalDocId, LegalPageData, SiteSettings } from '../types';
import { 
  getLegalPageFromDb, 
  getSiteSettingsFromDb, 
  DEFAULT_SITE_SETTINGS 
} from '../services/firestoreService';
import { DEFAULT_LEGAL_DATA } from '../data/legalData';

interface LegalPageProps {
  initialDocId?: LegalDocId;
  onNavigateHome: () => void;
  onNavigateContact: () => void;
  onNavigateResources?: () => void;
}

export const LegalPage: React.FC<LegalPageProps> = ({
  initialDocId = 'refund',
  onNavigateHome,
  onNavigateContact,
  onNavigateResources
}) => {
  const [activeDocId, setActiveDocId] = useState<LegalDocId>(initialDocId);
  const [pageData, setPageData] = useState<LegalPageData>(DEFAULT_LEGAL_DATA[initialDocId]);
  const [loading, setLoading] = useState(false);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [activeSectionId, setActiveSectionId] = useState<string>('');
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [mobileTocOpen, setMobileTocOpen] = useState(false);

  // Sync with prop change if navigation triggered
  useEffect(() => {
    if (initialDocId && initialDocId !== activeDocId) {
      setActiveDocId(initialDocId);
    }
  }, [initialDocId]);

  // Load site settings
  useEffect(() => {
    getSiteSettingsFromDb().then(settings => {
      if (settings) setSiteSettings(settings);
    }).catch(() => {});
  }, []);

  // Fetch active legal page document from Firestore (or cache/fallback)
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    
    // Set immediate default to prevent blank screen
    setPageData(DEFAULT_LEGAL_DATA[activeDocId]);

    getLegalPageFromDb(activeDocId)
      .then(data => {
        if (isMounted && data) {
          setPageData(data);
          if (data.sections && data.sections.length > 0) {
            setActiveSectionId(data.sections[0].id);
          }
        }
      })
      .catch(err => {
        console.warn('Error fetching legal doc:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    // Update URL param without full reload
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('view', activeDocId);
      window.history.replaceState({}, '', url.toString());
    } catch (e) {}

    // Scroll to top on doc switch
    window.scrollTo({ top: 0, behavior: 'smooth' });

    return () => {
      isMounted = false;
    };
  }, [activeDocId]);

  // Active section scroll spy
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!pageData || !pageData.sections) return;
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY + 180;
          for (let i = pageData.sections.length - 1; i >= 0; i--) {
            const section = pageData.sections[i];
            const el = document.getElementById(section.id);
            if (el) {
              const top = el.offsetTop;
              if (scrollY >= top) {
                setActiveSectionId(prev => prev !== section.id ? section.id : prev);
                break;
              }
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pageData]);


  const scrollToSection = (id: string) => {
    setActiveSectionId(id);
    setMobileTocOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const offset = 90;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(siteSettings.email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const docTabs: { id: LegalDocId; title: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'refund', title: 'Refund Policy', icon: RefreshCw },
    { id: 'privacy', title: 'Privacy Policy', icon: Lock },
    { id: 'terms', title: 'Terms & Conditions', icon: FileText }
  ];

  return (
    <div className="min-h-screen bg-[#0A0F1D] text-white selection:bg-[#0D6EFD] selection:text-white pb-24">
      
      {/* Background Subtle Gradient Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#0D6EFD]/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 right-5 w-[450px] h-[450px] bg-[#28B9FF]/5 rounded-full blur-[130px]" />
        <div className="absolute bottom-10 left-5 w-[400px] h-[400px] bg-[#22C55E]/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        
        {/* ═════════════════════════════════════════════════════
            1. BREADCRUMBS & TOP NAVIGATION BAR
        ═════════════════════════════════════════════════════ */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 border-b border-slate-800/80 pb-4">
          <button
            onClick={onNavigateHome}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-[#28B9FF]" />
            <span>Back to Marketplace</span>
          </button>

          {/* Sticky-Style Last Updated Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-semibold text-slate-300 shadow-sm">
            <Clock className="w-3.5 h-3.5 text-[#28B9FF]" />
            <span>Last Updated: <strong className="text-white">{pageData.lastUpdated || 'August 2026'}</strong></span>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════
            2. DOCUMENT SWITCHER TABS (Refund, Privacy, Terms)
        ═════════════════════════════════════════════════════ */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md max-w-full overflow-x-auto no-scrollbar shadow-xl">
            {docTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeDocId === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`legal-tab-${tab.id}`}
                  onClick={() => setActiveDocId(tab.id)}
                  className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all duration-200 cursor-pointer ${
                    isActive 
                      ? 'bg-gradient-to-r from-[#0D6EFD] to-[#28B9FF] text-white shadow-lg shadow-[#0D6EFD]/25' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{tab.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════
            3. DOCUMENT HEADER (Hero Banner)
        ═════════════════════════════════════════════════════ */}
        <motion.div 
          key={`header-${activeDocId}`}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center max-w-3xl mx-auto mb-10 sm:mb-14"
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0D6EFD]/10 border border-[#0D6EFD]/30 text-[#28B9FF] text-xs font-semibold uppercase tracking-wider mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{pageData.eyebrow}</span>
          </span>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4 leading-tight">
            {pageData.title}
          </h1>

          <p className="text-slate-300 text-sm sm:text-base md:text-lg leading-relaxed max-w-2xl mx-auto font-normal">
            {pageData.intro}
          </p>
        </motion.div>

        {/* ═════════════════════════════════════════════════════
            4. MOBILE TABLE OF CONTENTS (Dropdown Accordion)
        ═════════════════════════════════════════════════════ */}
        <div className="lg:hidden mb-8">
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-lg">
            <button
              onClick={() => setMobileTocOpen(!mobileTocOpen)}
              className="w-full p-4 flex items-center justify-between text-left font-bold text-xs sm:text-sm text-slate-200"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#28B9FF]" />
                <span>Jump to Section ({pageData.sections.length})</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${mobileTocOpen ? 'rotate-180 text-[#28B9FF]' : ''}`} />
            </button>

            {mobileTocOpen && (
              <div className="p-3 pt-0 border-t border-slate-800/80 space-y-1 max-h-60 overflow-y-auto">
                {pageData.sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                      activeSectionId === section.id
                        ? 'bg-[#0D6EFD]/20 text-[#28B9FF] font-bold'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span className="truncate">{section.title}</span>
                    {activeSectionId === section.id && <ChevronRight className="w-3 h-3 shrink-0 ml-2" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════
            5. MAIN LAYOUT: STICKY SIDEBAR (TOC) + CONTENT BODY
        ═════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* ────────────────────────────────────────────────
              LEFT COLUMN: STICKY TABLE OF CONTENTS (Desktop)
          ──────────────────────────────────────────────── */}
          <div className="hidden lg:block lg:col-span-4 sticky top-24">
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-5">
              
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-[#28B9FF]" />
                  <span>Table of Contents</span>
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                  {pageData.sections.length} Sections
                </span>
              </div>

              <nav className="space-y-1 max-h-[calc(100vh-280px)] overflow-y-auto pr-1 no-scrollbar">
                {pageData.sections.map((section) => {
                  const isCurrent = activeSectionId === section.id;
                  return (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs transition-all duration-200 flex items-center justify-between group cursor-pointer ${
                        isCurrent
                          ? 'bg-gradient-to-r from-[#0D6EFD]/20 to-transparent border-l-2 border-[#28B9FF] text-[#28B9FF] font-bold pl-4'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                      }`}
                    >
                      <span className="truncate leading-relaxed">{section.shortTitle || section.title}</span>
                      <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${isCurrent ? 'text-[#28B9FF] translate-x-0.5' : 'text-slate-600 opacity-0 group-hover:opacity-100'}`} />
                    </button>
                  );
                })}
              </nav>

              {/* Quick Help Box in Sidebar */}
              <div className="pt-4 border-t border-slate-800/80">
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs space-y-2">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-[#22C55E]" />
                    <span>Need Immediate Clarification?</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Our WhatsApp concierge answers policy and delivery questions in under 1 hour.
                  </p>
                  <a
                    href={`https://wa.me/${siteSettings.whatsappNumber}?text=Hi%20Zohaib%20DigiForge!%20I%20have%20a%20question%20about%20the%20${encodeURIComponent(pageData.title)}.`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#22C55E] hover:underline pt-1"
                  >
                    <span>Chat on WhatsApp</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

            </div>
          </div>

          {/* ────────────────────────────────────────────────
              RIGHT COLUMN: PLAIN-LANGUAGE CONTENT COLUMN
              (Centered max-w-~800px aesthetic with clear hierarchy)
          ──────────────────────────────────────────────── */}
          <div className="lg:col-span-8 space-y-8">
            
            <AnimatePresence mode="wait">
              <motion.div
                key={`doc-body-${activeDocId}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-6 sm:space-y-8"
              >
                {pageData.sections.map((section, idx) => (
                  <article
                    key={section.id}
                    id={section.id}
                    className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl relative scroll-mt-24 transition-colors hover:border-slate-700/80"
                  >
                    {/* Section Title */}
                    <div className="flex items-start justify-between gap-4 mb-4 border-b border-slate-800/80 pb-3">
                      <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
                        <span className="w-2 h-2 rounded-full bg-[#28B9FF] shrink-0" />
                        <span>{section.title}</span>
                      </h2>
                    </div>

                    {/* Section Primary Content */}
                    <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-4 font-normal">
                      {section.content}
                    </p>

                    {/* Optional Bulleted List */}
                    {section.bullets && section.bullets.length > 0 && (
                      <div className="space-y-2.5 my-4">
                        {section.bullets.map((bullet, bIdx) => (
                          <div 
                            key={bIdx} 
                            className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs sm:text-sm text-slate-300 leading-relaxed"
                          >
                            <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" />
                            <span>{bullet}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Optional Step-by-Step Numbered Cards (e.g. How to Request Refund) */}
                    {section.steps && section.steps.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-5">
                        {section.steps.map((step) => (
                          <div 
                            key={step.step}
                            className="p-4 rounded-2xl bg-slate-950 border border-slate-800/90 relative flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="w-6 h-6 rounded-lg bg-[#0D6EFD]/20 border border-[#0D6EFD]/40 text-[#28B9FF] text-xs font-bold flex items-center justify-center">
                                  {step.step}
                                </span>
                                <h4 className="text-xs sm:text-sm font-bold text-white">
                                  {step.title}
                                </h4>
                              </div>
                              <p className="text-xs text-slate-300 leading-relaxed">
                                {step.desc}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Optional Callout Card (Info / Success / Warning) */}
                    {section.callout && (
                      <div className={`p-4 rounded-2xl border flex items-start gap-3 mt-4 ${
                        section.callout.type === 'success' 
                          ? 'bg-[#22C55E]/10 border-[#22C55E]/30 text-emerald-300'
                          : section.callout.type === 'warning'
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                          : 'bg-[#0D6EFD]/10 border-[#0D6EFD]/30 text-[#28B9FF]'
                      }`}>
                        {section.callout.type === 'success' && <CheckCheck className="w-5 h-5 text-[#22C55E] shrink-0 mt-0.5" />}
                        {section.callout.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />}
                        {section.callout.type === 'info' && <Info className="w-5 h-5 text-[#28B9FF] shrink-0 mt-0.5" />}
                        
                        <p className="text-xs sm:text-sm leading-relaxed">
                          {section.callout.text}
                        </p>
                      </div>
                    )}

                    {/* Special Reusable Contact Box embedded for Section 6/9/12 */}
                    {section.id.includes('contact') && (
                      <div className="mt-5 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950/30 border border-slate-800 space-y-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#22C55E]">Direct Verification &amp; Support</span>
                            <h4 className="font-bold text-white text-sm sm:text-base">Speak Directly with DigiForge Concierge</h4>
                          </div>
                          <span className="text-[11px] px-2 py-0.5 rounded bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E] font-semibold">
                            ⚡ Avg Reply: &lt; 1 Hour
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          {/* WhatsApp Direct Action */}
                          <a
                            id="legal-contact-whatsapp-btn"
                            href={`https://wa.me/${siteSettings.whatsappNumber}?text=Hi%20Zohaib%20DigiForge!%20I%20have%20a%20question%20regarding%20the%20${encodeURIComponent(pageData.title)}.`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-3 rounded-xl bg-[#22C55E] hover:bg-[#1eb053] text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-[#22C55E]/20"
                          >
                            <MessageCircle className="w-4 h-4 fill-slate-950" />
                            <span>WhatsApp: {siteSettings.whatsappDisplay}</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          {/* Email Direct Action */}
                          <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <Mail className="w-4 h-4 text-[#28B9FF] shrink-0" />
                              <span className="text-xs text-slate-200 font-semibold truncate">
                                {siteSettings.email}
                              </span>
                            </div>
                            <button
                              onClick={handleCopyEmail}
                              className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs flex items-center gap-1 shrink-0"
                              title="Copy Email"
                            >
                              {copiedEmail ? <Check className="w-3 h-3 text-[#22C55E]" /> : <Copy className="w-3 h-3" />}
                              <span className="text-[10px]">{copiedEmail ? 'Copied' : 'Copy'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                  </article>
                ))}
              </motion.div>
            </AnimatePresence>

            {/* ═════════════════════════════════════════════════════
                6. NON-LEGAL-ADVICE MANDATORY DISCLAIMER
            ═════════════════════════════════════════════════════ */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-400 flex items-start gap-3">
              <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong className="text-slate-300">Notice:</strong> This policy is provided for informational purposes. For specific legal concerns, please consult a qualified professional.
              </p>
            </div>

            {/* ═════════════════════════════════════════════════════
                7. CROSS-DOCUMENT FOOTER NAVIGATION
            ═════════════════════════════════════════════════════ */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#28B9FF]">DigiForge Trust Center</span>
                  <h3 className="text-base sm:text-lg font-bold text-white">Explore Other Legal Policies</h3>
                </div>
                <button
                  onClick={onNavigateContact}
                  className="text-xs font-semibold text-[#28B9FF] hover:underline inline-flex items-center gap-1"
                >
                  <span>Need personalized support? Visit Contact Page</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {docTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isCurrent = activeDocId === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveDocId(tab.id)}
                      disabled={isCurrent}
                      className={`p-4 rounded-2xl text-left transition-all flex flex-col justify-between border ${
                        isCurrent
                          ? 'bg-[#0D6EFD]/10 border-[#0D6EFD]/40 cursor-default opacity-80'
                          : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850 cursor-pointer group'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isCurrent ? 'bg-[#0D6EFD] text-white' : 'bg-slate-800 text-slate-400 group-hover:text-white'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        {isCurrent ? (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#0D6EFD]/20 text-[#28B9FF]">
                            Viewing
                          </span>
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
                        )}
                      </div>

                      <span className={`text-xs font-bold ${isCurrent ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                        {tab.title}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                <span>© {new Date().getFullYear()} Zohaib DigiForge. All rights reserved.</span>
                <button
                  onClick={onNavigateHome}
                  className="text-slate-300 hover:text-white font-semibold flex items-center gap-1"
                >
                  <span>Return to Home</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

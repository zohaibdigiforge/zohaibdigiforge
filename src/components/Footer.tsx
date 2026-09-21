import React, { useState } from 'react';
import { 
  Phone, 
  Mail, 
  MapPin, 
  ExternalLink, 
  Heart, 
  Users, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  Wrench, 
  Star, 
  Search, 
  Send,
  Home,
  FolderOpen,
  Info,
  MessageSquare,
  FileText,
  RotateCcw,
  Lock,
  ArrowUp,
  Compass
} from 'lucide-react';
import { LegalDocId } from '../types';
import { subscribeNewsletterDb } from '../services/firestoreService';
import { BRAND_ICON } from '../lib/brandAssets';

interface FooterProps {
  onOpenLegalModal: (docType: 'Privacy Policy' | 'Terms & Conditions' | 'Refund Policy') => void;
  onOpenMembershipModal?: () => void;
  onNavigateHome?: () => void;
  onNavigateResources?: () => void;
  onNavigateMembership?: () => void;
  onNavigateAbout?: () => void;
  onNavigateContact?: () => void;
  onNavigateFaq?: () => void;
  onNavigateSitemap?: () => void;

  onNavigateLegal?: (docId: LegalDocId) => void;
  onNavigateReviews?: (productId?: string) => void;
  onNavigateJoinUs?: () => void;
  onOpenTrackerModal: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenLegalModal,
  onOpenMembershipModal,
  onNavigateHome,
  onNavigateResources,
  onNavigateMembership,
  onNavigateAbout,
  onNavigateFaq,
  onNavigateSitemap,

  onNavigateContact,
  onNavigateLegal,
  onNavigateReviews,
  onNavigateJoinUs,
  onOpenTrackerModal
}) => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) return;

    setNewsletterStatus('loading');
    try {
      await subscribeNewsletterDb(newsletterEmail);
      setNewsletterStatus('success');
      setNewsletterEmail('');
      setTimeout(() => setNewsletterStatus('idle'), 4000);
    } catch (err) {
      console.error(err);
      setNewsletterStatus('idle');
    }
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else if (onNavigateHome) {
      onNavigateHome();
      setTimeout(() => {
        const target = document.getElementById(id);
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    }
  };

  const handleMembershipClick = () => {
    if (onNavigateMembership) {
      onNavigateMembership();
    } else if (onOpenMembershipModal) {
      onOpenMembershipModal();
    }
  };

  const handleHomeClick = () => {
    if (onNavigateHome) {
      onNavigateHome();
    } else {
      scrollTo('hero');
    }
  };

  const handleResourcesClick = () => {
    if (onNavigateResources) {
      onNavigateResources();
    } else {
      scrollTo('products');
    }
  };

  return (
    <footer id="main-footer" className="bg-slate-950 border-t border-slate-800 text-slate-400 text-xs pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Grid Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
          
          {/* 1. Brand Column */}
          <div className="space-y-4">
            <div 
              className="flex items-center gap-3 cursor-pointer group"
              onClick={handleHomeClick}
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#0D6EFD] via-[#28B9FF] to-[#22C55E] p-0.5 shadow-md shadow-[#0D6EFD]/20 shrink-0">
                <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center overflow-hidden p-0.5">
                  <img 
                    src={BRAND_ICON} 
                    alt="Zohaib DigiForge Icon" 
                    width="36"
                    height="36"
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-contain rounded-full group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (target.src !== window.location.origin + '/icon.png') {
                        target.src = '/icon.png';
                      }
                    }}
                  />
                </div>
              </div>
              <span className="font-extrabold text-lg text-white tracking-tight">
                Zohaib <span className="text-[#28B9FF]">DigiForge</span>
              </span>
            </div>

            <p className="text-slate-300 font-normal leading-relaxed text-xs">
              &quot;Empowering Learning. Powering Success.&quot; Premium digital resources, courses, templates, and pro subscriptions delivered instantly to students, creators, and professionals worldwide.
            </p>

            <div className="pt-2 space-y-2.5 text-slate-300 text-xs">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#22C55E] shrink-0" />
                <span>WhatsApp: <strong className="text-white">+92 340 6070632</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#28B9FF] shrink-0" />
                <span>Email: <strong className="text-white">zohaibdigiforge@gmail.com</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                <span>Serving Pakistan &amp; International Customers</span>
              </div>
            </div>
          </div>

          {/* 2. Navigation Links List */}
          <div>
            <h4 className="font-bold text-sm text-white mb-4 flex items-center gap-1.5">
              <span>Quick Links</span>
            </h4>
            <ul className="space-y-2.5">
              <li>
                <button 
                  onClick={handleHomeClick} 
                  className="hover:text-white text-slate-300 transition-colors flex items-center gap-2 text-left group"
                >
                  <Home className="w-3.5 h-3.5 text-[#28B9FF] group-hover:scale-110 transition-transform shrink-0" />
                  <span>Home</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => {
                    if (onNavigateAbout) onNavigateAbout();
                    else handleHomeClick();
                  }} 
                  className="hover:text-indigo-400 text-slate-300 transition-colors flex items-center gap-2 text-left group"
                >
                  <Info className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform shrink-0" />
                  <span>About Us</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={handleResourcesClick} 
                  className="hover:text-[#28B9FF] text-slate-300 transition-colors flex items-center gap-2 text-left group"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-[#28B9FF] group-hover:scale-110 transition-transform shrink-0" />
                  <span>Resources</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => {
                    if (onNavigateContact) onNavigateContact();
                    else handleHomeClick();
                  }} 
                  className="hover:text-teal-400 text-slate-300 transition-colors flex items-center gap-2 text-left group"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-teal-400 group-hover:scale-110 transition-transform shrink-0" />
                  <span>Contact Us</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => {
                    if (onNavigateFaq) onNavigateFaq();
                    else handleHomeClick();
                  }} 
                  className="hover:text-amber-400 text-slate-300 transition-colors flex items-center gap-2 text-left group"
                >
                  <Info className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform shrink-0" />
                  <span>FAQ &amp; Help Center</span>
                </button>
              </li>
            </ul>
          </div>

          {/* 3. Legal & Policy List + Public Links List (Adjusted Underneath) */}
          <div className="space-y-7">
            {/* Legal & Policy */}
            <div>
              <h4 className="font-bold text-sm text-white mb-3.5 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#28B9FF]" />
                <span>Legal &amp; Policy</span>
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <button 
                    onClick={() => {
                      if (onNavigateLegal) onNavigateLegal('privacy');
                      else onOpenLegalModal('Privacy Policy');
                    }} 
                    className="hover:text-[#28B9FF] text-slate-300 transition-colors flex items-center gap-2 text-left group"
                  >
                    <Lock className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#28B9FF] transition-colors shrink-0" />
                    <span>Privacy policy</span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => {
                      if (onNavigateLegal) onNavigateLegal('terms');
                      else onOpenLegalModal('Terms & Conditions');
                    }} 
                    className="hover:text-[#28B9FF] text-slate-300 transition-colors flex items-center gap-2 text-left group"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#28B9FF] transition-colors shrink-0" />
                    <span>Terms &amp; Conditions</span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => {
                      if (onNavigateLegal) onNavigateLegal('refund');
                      else onOpenLegalModal('Refund Policy');
                    }} 
                    className="hover:text-[#28B9FF] text-slate-300 transition-colors flex items-center gap-2 text-left group"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#28B9FF] transition-colors shrink-0" />
                    <span>Refund &amp; Replacement Policy</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Public Links (Placed Under Legal & Policy) */}
            <div className="pt-2 border-t border-slate-800/80">
              <h4 className="font-bold text-sm text-white mb-3.5 flex items-center gap-1.5">
                <span>Public Links</span>
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <button 
                    onClick={onOpenTrackerModal} 
                    className="hover:text-[#22C55E] text-slate-300 transition-colors flex items-center gap-2 text-left group"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#28B9FF] group-hover:scale-110 transition-transform shrink-0" />
                    <span>Track Your Status</span>
                  </button>
                </li>
                <li>
                  <button 
                    id="footer-sitemap-btn"
                    onClick={() => {
                      if (onNavigateSitemap) onNavigateSitemap();
                      else window.location.href = '/sitemap';
                    }} 
                    className="hover:text-[#28B9FF] text-slate-300 transition-colors flex items-center gap-2 text-left group"
                  >
                    <Compass className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform shrink-0" />
                    <span>HTML Sitemap</span>
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* 4. Newsletter & Socials */}
          <div className="space-y-5">
            {/* Newsletter Section */}
            <div className="space-y-2.5">
              <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#28B9FF]" />
                <span>Newsletter &amp; Updates</span>
              </h4>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Get notified for exclusive deals, new digital tools &amp; student guides.
              </p>

              {newsletterStatus === 'success' ? (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span className="font-medium">Subscribed successfully!</span>
                </div>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="space-y-1.5">
                  <div className="flex gap-1.5">
                    <div className="relative flex-1">
                      <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                      <input
                        id="footer-newsletter-email"
                        type="email"
                        name="email"
                        aria-label="Email address for newsletter updates"
                        required
                        value={newsletterEmail}
                        onChange={(e) => setNewsletterEmail(e.target.value)}
                        placeholder="Your email address..."
                        className="w-full pl-8 pr-2.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#28B9FF] transition-all"
                      />
                    </div>
                    <button
                      id="footer-newsletter-submit-btn"
                      type="submit"
                      aria-label="Subscribe to newsletter"
                      disabled={newsletterStatus === 'loading'}
                      className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-[#0D6EFD] to-[#28B9FF] hover:from-[#0b5ed7] hover:to-[#1fa8ea] text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60 shrink-0"
                    >
                      {newsletterStatus === 'loading' ? (
                        <span>...</span>
                      ) : (
                        <>
                          <span>Join</span>
                          <Send className="w-3 h-3" />
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    🔒 Zero spam. Unsubscribe anytime.
                  </p>
                </form>
              )}
            </div>

            {/* Social Handles & Join Us */}
            <div className="space-y-3 pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white">Socials &amp; Community</span>
                <span className="text-[10px] text-slate-400">@zohaibdigiforge</span>
              </div>
            
              {/* Social Icons & Badges */}
              <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold">
                <a
                  href="https://whatsapp.com/channel/0029Vb8d4rs8KMqosD9EIa0Z"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Join Zohaib DigiForge Official WhatsApp Channel"
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-[#22C55E] transition-colors flex items-center gap-1.5"
                  title="WhatsApp Channel"
                >
                  <Send className="w-3 h-3 text-[#22C55E]" />
                  <span>WhatsApp</span>
                </a>

                <a
                  href="https://t.me/zohaibdigiforge"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Join Zohaib DigiForge Official Telegram Channel"
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-sky-400 transition-colors flex items-center gap-1.5"
                  title="Telegram"
                >
                  <span>Telegram</span>
                </a>
              </div>

              {/* JOIN US BUTTON (Linktree Hub Link) */}
              <div className="pt-1">
                <button
                  id="footer-join-us-btn"
                  onClick={() => {
                    if (onNavigateJoinUs) {
                      onNavigateJoinUs();
                    } else {
                      window.location.href = '/join-us';
                    }
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-[#0D6EFD] via-[#28B9FF] to-[#22C55E] hover:opacity-95 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-md shadow-[#0D6EFD]/20 border border-white/10 transition-all hover:scale-[1.01] active:scale-[0.98] group"
                >
                  <Users className="w-3.5 h-3.5 text-white group-hover:scale-110 transition-transform" />
                  <span>Join Us (All Channels &amp; Links)</span>
                  <ExternalLink className="w-3 h-3 opacity-80" />
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <p>© {new Date().getFullYear()} Zohaib DigiForge. All rights reserved.</p>

          {/* Go To Top Button */}
          <button
            id="footer-go-to-top-btn"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-[#28B9FF]/50 text-slate-200 hover:text-white font-bold text-xs flex items-center gap-2 shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer group"
            title="Scroll back to top"
          >
            <span>Go to top</span>
            <ArrowUp className="w-3.5 h-3.5 text-[#28B9FF] group-hover:-translate-y-0.5 transition-transform" />
          </button>

          <p className="flex items-center gap-1">
            Built for Pakistani Students &amp; Global Creators with <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
          </p>
        </div>

      </div>
    </footer>
  );
};

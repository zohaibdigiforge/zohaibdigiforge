import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  ExternalLink, 
  Copy, 
  Check, 
  Share2, 
  ArrowLeft, 
  Sparkles, 
  Users, 
  MessageSquare, 
  Youtube, 
  Instagram, 
  Send, 
  Facebook, 
  Twitter, 
  Mail, 
  ShieldCheck, 
  ShoppingBag, 
  Star, 
  ArrowRight,
  Zap,
  Globe,
  Radio,
  Heart,
  Flame,
  Gift,
  CheckCheck,
  GraduationCap,
  Lock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { JoinPageLink, JoinPageSettings, SiteSettings } from '../types';
import { 
  getJoinPageLinksFromDb, 
  getJoinPageSettingsFromDb,
  trackJoinPageLinkClick, 
  subscribeNewsletterDb, 
  DEFAULT_SITE_SETTINGS,
  DEFAULT_JOIN_PAGE_SETTINGS
} from '../services/firestoreService';
import { BRAND_ICON } from '../lib/brandAssets';

interface JoinUsPageProps {
  onNavigateHome: () => void;
  onNavigateResources: () => void;
  onNavigateContact: () => void;
  siteSettings?: SiteSettings;
}

export const JoinUsPage: React.FC<JoinUsPageProps> = ({
  onNavigateHome,
  onNavigateResources,
  onNavigateContact,
  siteSettings = DEFAULT_SITE_SETTINGS
}) => {
  const [links, setLinks] = useState<JoinPageLink[]>([]);
  const [pageSettings, setPageSettings] = useState<JoinPageSettings>(DEFAULT_JOIN_PAGE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedProfile, setCopiedProfile] = useState(false);
  const [expandedSocials, setExpandedSocials] = useState(true);

  // Email capture state for Newsletter link type
  const [emailInput, setEmailInput] = useState('');
  const [emailSubscribed, setEmailSubscribed] = useState(false);
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  const [emailError, setEmailError] = useState('');

  const bioUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/join-us` 
    : 'https://zohaibdigiforge.store/join-us';

  // Load links and settings dynamically from Firestore
  useEffect(() => {
    let isMounted = true;
    const fetchPageData = async () => {
      try {
        const [linksData, settingsData] = await Promise.all([
          getJoinPageLinksFromDb(),
          getJoinPageSettingsFromDb()
        ]);
        if (isMounted) {
          setLinks(linksData.filter(l => l.isActive));
          setPageSettings(settingsData);
          setLoading(false);
        }
      } catch (e) {
        if (isMounted) setLoading(false);
      }
    };
    fetchPageData();
    return () => { isMounted = false; };
  }, []);

  const handleCopyProfile = () => {
    try {
      navigator.clipboard.writeText(bioUrl);
      setCopiedProfile(true);
      setTimeout(() => setCopiedProfile(false), 2500);
    } catch (e) {}
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${pageSettings.headline || 'Zohaib DigiForge'} - Official Link in Bio`,
          text: pageSettings.tagline || 'Digital resources, free hacks & tools for students who don\'t want to overpay.',
          url: bioUrl
        });
      } catch (e) {
        handleCopyProfile();
      }
    } else {
      handleCopyProfile();
    }
  };

  const handleCopyLink = (e: React.MouseEvent, id: string, targetUrl: string) => {
    e.stopPropagation();
    try {
      navigator.clipboard.writeText(targetUrl);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {}
  };

  const handleLinkClick = (link: JoinPageLink) => {
    // 1. Fire and forget click tracking in Firestore
    trackJoinPageLinkClick(link.id);

    // 2. Handle internal routing or external link
    const url = (link.url || '').trim();

    if (url === 'resources' || url === '/resources' || url === '#resources' || url === 'membership' || url === 'reviews') {
      onNavigateResources();
    } else if (url === 'contact' || url === '/contact' || url === '#contact') {
      onNavigateContact();
    } else if (url === 'socials') {
      setExpandedSocials(prev => !prev);
    } else if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:') || url.startsWith('tel:')) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      onNavigateResources();
    }
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = emailInput.trim();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setEmailSubmitting(true);
    setEmailError('');
    try {
      await subscribeNewsletterDb(cleanEmail);
      setEmailSubscribed(true);
      setEmailInput('');
    } catch (err) {
      setEmailSubscribed(true); // Graceful fallback
    } finally {
      setEmailSubmitting(false);
    }
  };

  // Helper to render platform/type specific icons
  const renderItemIcon = (link: JoinPageLink) => {
    const type = link.linkType;
    const iconName = link.icon;

    if (type === 'WhatsApp Channel') {
      if (iconName === 'Flame') return <Flame className="w-5 h-5 text-[#22C55E]" />;
      if (iconName === 'GraduationCap') return <GraduationCap className="w-5 h-5 text-[#22C55E]" />;
      if (iconName === 'Lock') return <Lock className="w-5 h-5 text-[#22C55E]" />;
      return <Radio className="w-5 h-5 text-[#22C55E]" />;
    }
    if (type === 'WhatsApp Community') {
      return <Users className="w-5 h-5 text-[#22C55E]" />;
    }
    if (type === 'Social' || link.url === 'socials') {
      return <Globe className="w-5 h-5 text-[#28B9FF]" />;
    }
    if (type === 'Store' || iconName === 'ShoppingBag') {
      return <ShoppingBag className="w-5 h-5 text-[#22C55E]" />;
    }

    switch (iconName) {
      case 'Flame': return <Flame className="w-5 h-5 text-amber-400" />;
      case 'Radio': return <Radio className="w-5 h-5 text-[#22C55E]" />;
      case 'Users': return <Users className="w-5 h-5 text-[#22C55E]" />;
      case 'GraduationCap': return <GraduationCap className="w-5 h-5 text-[#28B9FF]" />;
      case 'Lock': return <Lock className="w-5 h-5 text-slate-300" />;
      case 'MessageSquare': return <MessageSquare className="w-5 h-5 text-[#22C55E]" />;
      case 'Gift': return <Gift className="w-5 h-5 text-[#28B9FF]" />;
      case 'Sparkles': return <Sparkles className="w-5 h-5 text-amber-300" />;
      case 'Star': return <Star className="w-5 h-5 text-amber-400 fill-amber-400" />;
      case 'Zap': return <Zap className="w-5 h-5 text-sky-400" />;
      case 'ShoppingBag': return <ShoppingBag className="w-5 h-5 text-[#22C55E]" />;
      case 'Mail': return <Mail className="w-5 h-5 text-[#28B9FF]" />;
      default: return <Globe className="w-5 h-5 text-[#28B9FF]" />;
    }
  };

  // Separate Primary Hero CTA from Secondary Links
  const primaryLink = links.find(l => l.isPrimary) || links.find(l => l.linkType === 'Store') || links[0];
  const secondaryLinks = links.filter(l => l.id !== primaryLink?.id);

  // Social Links List from settings
  const socials = [
    {
      id: 'instagram',
      name: 'Instagram',
      icon: Instagram,
      url: pageSettings.socials?.instagram || siteSettings.socials?.instagram || 'https://instagram.com/zohaibdigiforge',
      color: 'hover:text-pink-400 hover:border-pink-500/40 hover:bg-pink-500/10'
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      icon: Radio,
      url: pageSettings.socials?.tiktok || siteSettings.socials?.tiktok || 'https://tiktok.com/@zohaibdigiforge',
      color: 'hover:text-cyan-400 hover:border-cyan-500/40 hover:bg-cyan-500/10'
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: MessageSquare,
      url: pageSettings.socials?.whatsapp || `https://wa.me/${siteSettings.whatsappNumber}?text=Hi%20Zohaib%20DigiForge!%20I%20found%20you%20via%20your%20bio%20link.`,
      color: 'hover:text-[#22C55E] hover:border-emerald-500/40 hover:bg-emerald-500/10'
    },
    {
      id: 'youtube',
      name: 'YouTube',
      icon: Youtube,
      url: pageSettings.socials?.youtube || 'https://youtube.com/@zohaibdigiforge',
      color: 'hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/10'
    },
    {
      id: 'telegram',
      name: 'Telegram',
      icon: Send,
      url: pageSettings.socials?.telegram || siteSettings.socials?.telegram || 'https://t.me/zohaibdigiforge',
      color: 'hover:text-sky-400 hover:border-sky-500/40 hover:bg-sky-500/10'
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: Facebook,
      url: pageSettings.socials?.facebook || siteSettings.socials?.facebook || 'https://facebook.com/zohaibdigiforge',
      color: 'hover:text-blue-400 hover:border-blue-500/40 hover:bg-blue-500/10'
    },
    {
      id: 'x',
      name: 'X (Twitter)',
      icon: Twitter,
      url: pageSettings.socials?.x || siteSettings.socials?.x || 'https://x.com/zohaibdigiforge',
      color: 'hover:text-slate-200 hover:border-slate-500 hover:bg-slate-800'
    }
  ];

  return (
    <div id="join-bio-page" className="min-h-screen bg-[#0A0F1D] text-slate-100 py-8 px-4 sm:px-6 relative overflow-hidden font-sans selection:bg-[#0D6EFD] selection:text-white">
      
      {/* Background Subtle Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-80 bg-gradient-to-b from-[#22C55E]/15 via-[#0D6EFD]/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-64 h-64 bg-[#22C55E]/10 blur-3xl pointer-events-none" />

      <div className="max-w-md mx-auto relative z-10 space-y-6">
        
        {/* ═════════════════════════════════════════════════════
            1. TOP UTILITY BAR (Back to Store & Share Hub)
        ═════════════════════════════════════════════════════ */}
        <div className="flex items-center justify-between pt-1">
          <button
            id="bio-back-to-store-btn"
            onClick={onNavigateHome}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold backdrop-blur-md transition-all shadow-sm group min-h-[44px]"
            aria-label="Back to Storefront"
          >
            <ArrowLeft className="w-4 h-4 text-[#28B9FF] group-hover:-translate-x-0.5 transition-transform" />
            <span>Store</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              id="bio-share-hub-btn"
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold backdrop-blur-md transition-all shadow-sm min-h-[44px]"
              title="Share Bio Link"
              aria-label="Share Bio Link"
            >
              <Share2 className="w-3.5 h-3.5 text-[#28B9FF]" />
              <span className="hidden xs:inline">Share</span>
            </button>

            <button
              id="bio-copy-link-btn"
              onClick={handleCopyProfile}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#22C55E]/20 hover:bg-[#22C55E]/30 border border-[#22C55E]/40 text-white text-xs font-semibold backdrop-blur-md transition-all shadow-sm min-h-[44px]"
              title="Copy Bio URL"
              aria-label="Copy Bio URL"
            >
              {copiedProfile ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#22C55E]" />
                  <span className="text-[#22C55E]">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#22C55E]" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════
            2. HEADER (Logo, Name, Headline & Tagline)
        ═════════════════════════════════════════════════════ */}
        <header className="text-center space-y-3.5 pt-2">
          
          {/* Verified Avatar with Glowing Gradient */}
          <div className="relative inline-block mx-auto">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-[#22C55E] via-[#28B9FF] to-[#0D6EFD] p-1 shadow-xl shadow-[#22C55E]/20">
              <div className="w-full h-full bg-[#0A0F1D] rounded-full flex items-center justify-center relative overflow-hidden">
                {pageSettings.profilePhoto ? (
                  <img
                    src={pageSettings.profilePhoto}
                    alt={pageSettings.headline || 'Zohaib DigiForge'}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <span className="text-4xl sm:text-5xl font-black bg-gradient-to-br from-white via-[#22C55E] to-[#28B9FF] bg-clip-text text-transparent select-none">
                    D
                  </span>
                )}
              </div>
            </div>
            {/* Verified Badge */}
            <div className="absolute -bottom-1 -right-1 bg-[#0A0F1D] p-1 rounded-full border border-slate-800 shadow-md">
              <div className="w-6 h-6 bg-[#22C55E] rounded-full flex items-center justify-center text-slate-950">
                <CheckCircle2 className="w-4 h-4 fill-white text-[#22C55E]" />
              </div>
            </div>
          </div>

          {/* Profile Name & Taglines */}
          <div className="space-y-1.5">
            <div className="inline-flex items-center justify-center gap-1.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {pageSettings.headline || 'Zohaib DigiForge'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-[#22C55E] text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-[#22C55E]" />
                Official Bio
              </span>
            </div>

            {/* Subheadline / Handle */}
            <p className="text-xs sm:text-sm font-semibold text-[#28B9FF]">
              {pageSettings.subheadline || '@zohaibdigiforge • "Empowering Learning. Powering Success."'}
            </p>

            {/* Tagline Hook */}
            <p className="text-xs sm:text-sm text-slate-300 max-w-sm mx-auto leading-relaxed pt-0.5">
              {pageSettings.tagline || 'Digital resources, free hacks & tools for students who don\'t want to overpay.'}
            </p>
          </div>

          {/* Value Feature Chips */}
          <div className="grid grid-cols-3 gap-2 max-w-sm mx-auto pt-1">
            <div className="py-2 px-2 rounded-xl bg-slate-900/80 border border-slate-800/80 text-center">
              <div className="text-sm sm:text-base font-black text-white">Flat Rate</div>
              <div className="text-[10px] text-slate-400 font-medium">Affordable</div>
            </div>
            <div className="py-2 px-2 rounded-xl bg-slate-900/80 border border-slate-800/80 text-center">
              <div className="text-sm sm:text-base font-black text-amber-400">100%</div>
              <div className="text-[10px] text-slate-400 font-medium">Verified Links</div>
            </div>
            <div className="py-2 px-2 rounded-xl bg-slate-900/80 border border-slate-800/80 text-center">
              <div className="text-sm sm:text-base font-black text-[#22C55E]">Instant</div>
              <div className="text-[10px] text-slate-400 font-medium">Drive Access</div>
            </div>
          </div>

        </header>

        {/* ═════════════════════════════════════════════════════
            3. PRIMARY HERO CTA ("Visit the Store" — Visually Dominant, Green)
        ═════════════════════════════════════════════════════ */}
        {primaryLink && (
          <section aria-label="Featured Primary Action" className="pt-2">
            <button
              id={`bio-hero-cta-${primaryLink.id}`}
              onClick={() => handleLinkClick(primaryLink)}
              className="w-full relative group overflow-hidden p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500 via-[#22C55E] to-teal-400 text-slate-950 text-left transition-all duration-200 transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-[#22C55E]/40 border border-white/40 min-h-[60px] flex items-center justify-between gap-3 shadow-xl shadow-[#22C55E]/20"
            >
              <div className="relative z-10 flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-slate-950/90 text-[#22C55E] border border-emerald-400/50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-inner">
                  <ShoppingBag className="w-6 h-6 text-[#22C55E]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base sm:text-lg font-black tracking-tight text-slate-950 drop-shadow-sm">
                      {primaryLink.label}
                    </span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-950 text-emerald-400 border border-emerald-400/40 uppercase tracking-wider">
                      {primaryLink.badge || 'Official Store'}
                    </span>
                  </div>
                  {primaryLink.subtitle && (
                    <p className="text-xs text-slate-900 font-bold opacity-90 truncate mt-0.5">
                      {primaryLink.subtitle}
                    </p>
                  )}
                </div>
              </div>

              <div className="relative z-10 shrink-0 w-10 h-10 rounded-xl bg-slate-950 group-hover:bg-slate-900 text-white flex items-center justify-center transition-all shadow-md">
                <ArrowRight className="w-5 h-5 text-[#22C55E] group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          </section>
        )}

        {/* ═════════════════════════════════════════════════════
            4. LINK LIST (6 Admin-managed entries with WhatsApp Branding)
        ═════════════════════════════════════════════════════ */}
        <section aria-label="Secondary Resources & Channels" className="space-y-3 pt-1">
          {secondaryLinks.map((link) => {
            const isWhatsAppChannel = link.linkType === 'WhatsApp Channel';
            const isWhatsAppCommunity = link.linkType === 'WhatsApp Community';
            const isNewsletter = link.linkType === 'Newsletter';
            const isSocialGroup = link.linkType === 'Social' || link.url === 'socials';

            // 1. WhatsApp Channel & Community Treatment (Recognizable Green WhatsApp Styling)
            if (isWhatsAppChannel || isWhatsAppCommunity) {
              return (
                <div
                  key={link.id}
                  id={`bio-link-${link.id}`}
                  onClick={() => handleLinkClick(link)}
                  className="group relative p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 hover:from-emerald-950/90 border border-[#22C55E]/40 hover:border-[#22C55E] transition-all duration-200 cursor-pointer hover:-translate-y-0.5 shadow-md shadow-[#22C55E]/10 min-h-[52px]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-[#22C55E]/20 border border-[#22C55E]/40 text-[#22C55E] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        {renderItemIcon(link)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <h2 className="text-xs sm:text-sm font-bold text-white group-hover:text-[#22C55E] transition-colors truncate">
                            {link.label}
                          </h2>
                          <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/40 uppercase tracking-wider">
                            {link.badge || (isWhatsAppCommunity ? 'Join Community' : 'Follow Channel')}
                          </span>
                        </div>
                        {link.subtitle && (
                          <p className="text-[11px] text-slate-300 line-clamp-1 leading-relaxed">
                            {link.subtitle}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="w-8 h-8 rounded-xl bg-[#22C55E] group-hover:bg-emerald-400 text-slate-950 flex items-center justify-center transition-all font-bold shadow-sm">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            // 2. All Social Media Handles (Sub-row of icons for Instagram, TikTok, Facebook, X, Telegram, Threads)
            if (isSocialGroup) {
              return (
                <div
                  key={link.id}
                  id={`bio-link-${link.id}`}
                  className="group relative p-3.5 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-[#0D6EFD]/50 transition-all duration-200 shadow-md min-h-[52px] space-y-3"
                >
                  <div 
                    onClick={() => setExpandedSocials(!expandedSocials)}
                    className="flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-[#0D6EFD]/20 border border-[#0D6EFD]/40 text-[#28B9FF] flex items-center justify-center shrink-0">
                        <Globe className="w-5 h-5 text-[#28B9FF]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <h2 className="text-xs sm:text-sm font-bold text-white group-hover:text-[#28B9FF] transition-colors truncate">
                            {link.label}
                          </h2>
                          <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-[#0D6EFD]/20 text-[#28B9FF] border border-[#0D6EFD]/30 uppercase tracking-wider">
                            {link.badge || '@zohaibdigiforge'}
                          </span>
                        </div>
                        {link.subtitle && (
                          <p className="text-[11px] text-slate-300 line-clamp-1 leading-relaxed">
                            {link.subtitle}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="w-8 h-8 rounded-xl bg-slate-950 text-slate-300 flex items-center justify-center border border-slate-800">
                      {expandedSocials ? <ChevronUp className="w-4 h-4 text-[#28B9FF]" /> : <ChevronDown className="w-4 h-4 text-[#28B9FF]" />}
                    </div>
                  </div>

                  {/* Expanded Sub-row of Social Icons */}
                  {expandedSocials && (
                    <div className="pt-2 border-t border-slate-800/80">
                      <p className="text-[10px] font-semibold text-slate-400 mb-2">
                        Official handles (@zohaibdigiforge):
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {socials.map((s) => {
                          const Icon = s.icon;
                          return (
                            <a
                              key={s.id}
                              href={s.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 hover:text-white transition-all ${s.color}`}
                            >
                              <Icon className="w-3.5 h-3.5" />
                              <span>{s.name}</span>
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            // 3. Inline Newsletter Type
            if (isNewsletter) {
              return (
                <div
                  key={link.id}
                  id={`bio-link-${link.id}`}
                  className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 shadow-xl space-y-3"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#0D6EFD]/20 border border-[#0D6EFD]/40 text-[#28B9FF] flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-white">
                        {link.label}
                      </h3>
                      {link.subtitle && (
                        <p className="text-[11px] text-slate-400">
                          {link.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  {emailSubscribed ? (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[#22C55E] text-xs font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>You&apos;re in! We&apos;ll send you free VIP weekly drops.</span>
                    </div>
                  ) : (
                    <form onSubmit={handleNewsletterSubmit} className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="email"
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          placeholder="Enter your student email..."
                          className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-base sm:text-xs focus:outline-none focus:border-[#0D6EFD] min-h-[44px]"
                          required
                        />
                        <button
                          type="submit"
                          disabled={emailSubmitting}
                          className="px-4 py-2.5 rounded-xl bg-[#0D6EFD] hover:bg-[#0b5ed7] text-white text-xs font-bold transition-all shadow-md shadow-[#0D6EFD]/20 min-h-[44px] shrink-0"
                        >
                          {emailSubmitting ? 'Joining...' : 'Get Free Drops'}
                        </button>
                      </div>
                      {emailError && (
                        <p className="text-[10px] text-rose-400">{emailError}</p>
                      )}
                    </form>
                  )}
                </div>
              );
            }

            // 4. Standard Website / Custom Link
            return (
              <div
                key={link.id}
                id={`bio-link-${link.id}`}
                onClick={() => handleLinkClick(link)}
                className="group relative p-3.5 sm:p-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800/95 border border-slate-800 hover:border-slate-700 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 shadow-md shadow-black/40 min-h-[52px]"
              >
                <div className="flex items-center justify-between gap-3">
                  
                  {/* Content */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      {renderItemIcon(link)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <h2 className="text-xs sm:text-sm font-bold text-white group-hover:text-[#28B9FF] transition-colors truncate">
                          {link.label}
                        </h2>
                        {link.badge && (
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${link.badgeColor || 'bg-blue-500/20 text-[#28B9FF] border-blue-500/30'}`}>
                            {link.badge}
                          </span>
                        )}
                      </div>
                      {link.subtitle && (
                        <p className="text-[11px] text-slate-400 line-clamp-1 leading-relaxed">
                          {link.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions: Copy & Arrow */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={(e) => handleCopyLink(e, link.id, link.url.startsWith('http') ? link.url : `${window.location.origin}/${link.url.replace(/^\/+/, '')}`)}
                      className="p-2 rounded-xl text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center"
                      title="Copy direct link"
                      aria-label={`Copy link for ${link.label}`}
                    >
                      {copiedId === link.id ? (
                        <Check className="w-4 h-4 text-[#22C55E]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <div className="w-8 h-8 rounded-xl bg-slate-950 group-hover:bg-[#0D6EFD] text-slate-400 group-hover:text-white border border-slate-800 group-hover:border-[#28B9FF]/50 flex items-center justify-center transition-all">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </section>

        {/* ═════════════════════════════════════════════════════
            5. INLINE EMAIL CAPTURE (Lead Generation Default Box)
        ═════════════════════════════════════════════════════ */}
        <section aria-label="Newsletter Lead Capture" className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
          
          <div className="relative z-10 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#0D6EFD]/20 border border-[#0D6EFD]/40 text-[#28B9FF] flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white">
                  Get Weekly Free Software &amp; Deals
                </h3>
                <p className="text-[11px] text-slate-400">
                  No spam. Just verified tools, coupons &amp; drive updates.
                </p>
              </div>
            </div>

            {emailSubscribed ? (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[#22C55E] text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>You&apos;re on the list! Check your inbox for weekly drops.</span>
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="Enter your email..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-base sm:text-xs focus:outline-none focus:border-[#0D6EFD] min-h-[44px]"
                    required
                  />
                  <button
                    type="submit"
                    disabled={emailSubmitting}
                    className="px-4 py-2.5 rounded-xl bg-[#0D6EFD] hover:bg-[#0b5ed7] text-white text-xs font-bold transition-all shadow-md shadow-[#0D6EFD]/20 min-h-[44px] shrink-0"
                  >
                    {emailSubmitting ? 'Joining...' : 'Subscribe'}
                  </button>
                </div>
                {emailError && (
                  <p className="text-[10px] text-rose-400">{emailError}</p>
                )}
              </form>
            )}
          </div>
        </section>

        {/* ═════════════════════════════════════════════════════
            6. SOCIAL CHANNELS ROW (Secondary Tier, Smaller Icons)
        ═════════════════════════════════════════════════════ */}
        <section aria-label="Official Social Channels" className="pt-2">
          <p className="text-[11px] font-semibold text-slate-400 text-center uppercase tracking-wider mb-3">
            Official Socials &amp; Community
          </p>

          <div className="flex items-center justify-center gap-2.5 flex-wrap">
            {socials.map((s) => {
              const Icon = s.icon;
              return (
                <a
                  key={s.id}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.name}
                  className={`w-11 h-11 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-center text-slate-400 transition-all shadow-sm ${s.color} hover:scale-105 min-h-[44px] min-w-[44px]`}
                >
                  <Icon className="w-5 h-5" />
                </a>
              );
            })}
          </div>
        </section>

        {/* ═════════════════════════════════════════════════════
            7. FOOTER & BRAND SIGNATURE
        ═════════════════════════════════════════════════════ */}
        <footer className="text-center space-y-2 pt-6 pb-4 border-t border-slate-850/60">
          <div className="inline-flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-[#0D6EFD] flex items-center justify-center overflow-hidden">
              <img 
                src={BRAND_ICON} 
                alt="ZDF Icon" 
                className="w-full h-full object-cover rounded-full" 
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.src !== window.location.origin + '/icon.png') {
                    target.src = '/icon.png';
                  }
                }}
              />
            </div>
            <span className="text-xs font-black tracking-tight text-white">
              {pageSettings.headline || 'Zohaib DigiForge'}
            </span>
          </div>

          <p className="text-[11px] text-slate-500">
            &copy; {new Date().getFullYear()} Zohaib DigiForge • Empowering Learning, Powering Success.
          </p>

          <div className="pt-1">
            <button
              onClick={onNavigateHome}
              className="text-[11px] font-semibold text-[#28B9FF] hover:underline"
            >
              ← Return to Main Storefront
            </button>
          </div>
        </footer>

      </div>
    </div>
  );
};

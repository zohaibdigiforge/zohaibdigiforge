import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  HelpCircle, 
  Truck, 
  Layers, 
  Phone, 
  Mail, 
  Copy, 
  Check, 
  ExternalLink, 
  ChevronDown, 
  Clock, 
  User, 
  AlertCircle,
  Loader2,
  ArrowRight,
  Compass,
  MessageCircle,
  Share2,
  CheckCheck
} from 'lucide-react';
import { ContactInquiryType, SiteSettings } from '../types';
import { 
  getSiteSettingsFromDb, 
  submitContactInquiryDb, 
  DEFAULT_SITE_SETTINGS 
} from '../services/firestoreService';
import { CommunityCallout } from './CommunityCallout';
import { FAQSection } from './FAQSection';

interface ContactPageProps {
  onNavigateHome: () => void;
  onNavigateResources: (catSlug?: string) => void;
  onOpenTracker: () => void;
  onNavigateJoinUs?: () => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({
  onNavigateHome,
  onNavigateResources,
  onOpenTracker,
  onNavigateJoinUs
}) => {
  // Dynamic site settings loaded from Firestore
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [inquiryType, setInquiryType] = useState<ContactInquiryType>('Resource Question');
  const [message, setMessage] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [honeypot, setHoneypot] = useState(''); // anti-spam bot field

  // Touch and validation states
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedInquiryId, setSubmittedInquiryId] = useState<string>('');
  const [copiedEmail, setCopiedEmail] = useState(false);

  // FAQ accordion state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Load live site settings from Firestore
  useEffect(() => {
    getSiteSettingsFromDb()
      .then((settings) => {
        if (settings) setSiteSettings(settings);
      })
      .catch((err) => {
        console.warn('Using default site settings:', err);
      });
  }, []);

  // Validation rules
  const isNameValid = name.trim().length >= 2;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isMessageValid = message.trim().length >= 10;
  const isFormValid = isNameValid && isEmailValid && isMessageValid;

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(siteSettings.email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all as touched
    setTouched({ name: true, email: true, message: true });

    // Honeypot check: reject bots silently without error
    if (honeypot.trim() !== '') {
      setIsSubmitted(true);
      return;
    }

    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const result = await submitContactInquiryDb({
        name: name.trim(),
        email: email.trim(),
        inquiryType,
        message: message.trim(),
        whatsapp: whatsapp.trim() || undefined
      });

      setSubmittedInquiryId(result.id || 'INQ-' + Date.now().toString().slice(-6));
      setIsSubmitted(true);
    } catch (err) {
      console.error('Error submitting contact form:', err);
      // Fallback state
      setSubmittedInquiryId('INQ-' + Math.floor(100000 + Math.random() * 900000));
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setName('');
    setEmail('');
    setInquiryType('Resource Question');
    setMessage('');
    setWhatsapp('');
    setTouched({});
    setIsSubmitted(false);
    setSubmittedInquiryId('');
  };

  const scrollToForm = () => {
    const formElement = document.getElementById('contact-form-section');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
      // Focus the name input
      const nameInput = document.getElementById('contact-name-input');
      if (nameInput) nameInput.focus();
    }
  };

  // Quick Action Tiles Data
  const quickActionTiles = [
    {
      id: 'quick-tracker',
      title: 'Order Not Delivered Yet?',
      description: 'Check real-time verification and download links instantly.',
      badge: 'Self-Service',
      icon: Truck,
      color: 'from-[#0D6EFD] to-[#28B9FF]',
      actionLabel: 'Track Your Order',
      onClick: onOpenTracker
    },
    {
      id: 'quick-resources',
      title: 'Looking for Digital Assets?',
      description: 'Explore verified premium courses, graphics, scripts, and software tools.',
      badge: 'Resources',
      icon: Sparkles,
      color: 'from-amber-500 to-orange-500',
      actionLabel: 'Browse All Resources',
      onClick: () => onNavigateResources('all')
    },
    {
      id: 'quick-community',
      title: 'Join Our Creator Hub?',
      description: 'Connect with our community, get instant drops & VIP updates.',
      badge: 'Community',
      icon: Layers,
      color: 'from-[#28B9FF] to-[#22C55E]',
      actionLabel: 'Join Us Page',
      onClick: () => {
        if (onNavigateJoinUs) onNavigateJoinUs();
        else onNavigateResources('all');
      }
    },
    {
      id: 'quick-general',
      title: 'General Question?',
      description: 'Need help choosing a course, file formats, or licensing details.',
      badge: 'Fast Reply',
      icon: HelpCircle,
      color: 'from-indigo-500 to-purple-500',
      actionLabel: 'Ask Below',
      onClick: scrollToForm
    }
  ];

  // FAQ Accordion Data
  const faqs = [
    {
      q: 'How long does delivery take after payment?',
      a: 'Digital downloads and access links are typically verified and delivered within 15 to 45 minutes directly via WhatsApp and your registered email address. During high-volume periods, it may take up to 1 hour.'
    },
    {
      q: "What if I don't receive my order?",
      a: "If you haven't received your Google Drive link or product credentials within 1 hour, simply click 'Track Order' at the top of the page using your Order ID (e.g. ZDF-123456) or message us immediately on WhatsApp at 03406070632 with your payment screenshot. We will verify and push access instantly."
    },
    {
      q: 'Can I get a refund?',
      a: 'Due to the immediate digital nature of access keys, project source files, and download links, purchases are non-refundable once the access links have been delivered. However, if any link is broken or a software license key encounters an activation fault, we provide 100% free immediate replacement and technical troubleshooting.'
    },
    {
      q: 'How do I track my order status?',
      a: 'Click the "Track Order" button in the top navigation bar or the self-service tile above. Enter either your ZDF Order ID or your WhatsApp phone number to view live verification status, payment notes, and your persistent Google Drive folder links.'
    },
    {
      q: 'What payment methods do you accept?',
      a: 'For Pakistani customers, we accept JazzCash, EasyPaisa, SadaPay, NayaPay, and all major Pakistani Bank Transfers (Meezan Bank, HBL, Bank Alfalah, UBL, etc.). For international students and creators, we accept Binance USDT (Crypto) with manual verification.'
    }
  ];

  // Social Links List
  const socialsList = [
    { name: 'Instagram', handle: '@zohaibdigiforge', url: siteSettings.socials?.instagram || 'https://instagram.com/zohaibdigiforge', color: 'hover:text-pink-400 hover:border-pink-500/30' },
    { name: 'TikTok', handle: '@zohaibdigiforge', url: siteSettings.socials?.tiktok || 'https://tiktok.com/@zohaibdigiforge', color: 'hover:text-cyan-400 hover:border-cyan-500/30' },
    { name: 'Facebook', handle: 'zohaibdigiforge', url: siteSettings.socials?.facebook || 'https://facebook.com/zohaibdigiforge', color: 'hover:text-blue-400 hover:border-blue-500/30' },
    { name: 'X / Twitter', handle: '@zohaibdigiforge', url: siteSettings.socials?.x || 'https://x.com/zohaibdigiforge', color: 'hover:text-slate-200 hover:border-white/30' },
    { name: 'Telegram', handle: '@zohaibdigiforge', url: siteSettings.socials?.telegram || 'https://t.me/zohaibdigiforge', color: 'hover:text-[#28B9FF] hover:border-[#28B9FF]/30' },
    { name: 'Threads', handle: '@zohaibdigiforge', url: siteSettings.socials?.threads || 'https://threads.net/@zohaibdigiforge', color: 'hover:text-purple-400 hover:border-purple-500/30' }
  ];

  return (
    <div id="contact-page" className="min-h-screen bg-[#0A0F1D] text-white selection:bg-[#0D6EFD] selection:text-white pb-24">
      
      {/* Background Decorative Ambient Lights */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-[#0D6EFD]/10 rounded-full blur-[140px]" />
        <div className="absolute top-2/3 right-10 w-[500px] h-[400px] bg-[#28B9FF]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-[#22C55E]/10 rounded-full blur-[130px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14">
        
        {/* ═════════════════════════════════════════════════════
            1. PAGE HEADER & RESPONSE TIME BADGE
        ═════════════════════════════════════════════════════ */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          
          {/* Eyebrow Badge */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0D6EFD]/10 border border-[#0D6EFD]/30 text-[#28B9FF] text-xs font-semibold uppercase tracking-wider mb-4 shadow-sm"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Get In Touch</span>
          </motion.div>

          {/* Headline */}
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4"
          >
            Have a Question? <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#28B9FF] via-[#0D6EFD] to-[#22C55E]">Let&apos;s Talk.</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto mb-6"
          >
            Whether it&apos;s about an order, a resource, or a custom project — we usually reply within 3 hours.
          </motion.p>

          {/* Response Time Live Badge */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-slate-900/90 border border-[#22C55E]/40 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-[#22C55E]/10"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22C55E] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#22C55E]"></span>
            </span>
            <span className="text-slate-200">⚡ Average reply time: <strong className="text-[#22C55E] font-bold">Under 3 Hours (WhatsApp)</strong></span>
          </motion.div>
        </div>

        {/* ═════════════════════════════════════════════════════
            2. QUICK-ACTION TILES (Self-Service First)
        ═════════════════════════════════════════════════════ */}
        <div className="mb-14 sm:mb-16">
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-[#28B9FF]" /> Quick Routing &amp; Instant Self-Service
            </h2>
            <span className="text-[11px] text-slate-500 hidden sm:inline">Choose an option for fastest resolution</span>
          </div>

          {/* Tiles Grid (Horizontal scroll on mobile, 4-col on desktop) */}
          <div className="flex overflow-x-auto no-scrollbar gap-3.5 pb-2 sm:grid sm:grid-cols-2 lg:grid-cols-4 snap-x snap-mandatory">
            {quickActionTiles.map((tile, idx) => {
              const IconComponent = tile.icon;
              return (
                <motion.div
                  key={tile.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 * idx }}
                  onClick={tile.onClick}
                  className="min-w-[260px] sm:min-w-0 snap-start flex-1 p-5 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 transition-all duration-300 cursor-pointer group flex flex-col justify-between shadow-sm hover:shadow-md relative overflow-hidden"
                >
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${tile.color} opacity-80 group-hover:opacity-100 transition-opacity`} />
                  
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 group-hover:bg-slate-700 flex items-center justify-center text-white border border-white/5 transition-colors">
                        <IconComponent className="w-5 h-5 text-[#28B9FF]" />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-300">
                        {tile.badge}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm sm:text-base text-white mb-1.5 group-hover:text-[#28B9FF] transition-colors leading-snug">
                      {tile.title}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed mb-4">
                      {tile.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-[#28B9FF] group-hover:text-white transition-colors">
                    <span>{tile.actionLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════
            3. TWO-COLUMN LAYOUT
            Desktop: Left (Contact Info) | Right (Form)
            Mobile: Form is primary (top), Contact Info below form
        ═════════════════════════════════════════════════════ */}
        <div id="contact-form-section" className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-16 items-start">
          
          {/* ────────────────────────────────────────────────
              LEFT COLUMN (Desktop) / BOTTOM (Mobile):
              DIRECT CONTACT INFO + TRUST
          ──────────────────────────────────────────────── */}
          <div className="order-2 lg:order-1 lg:col-span-5 space-y-6">
            
            {/* Header / Intro Card */}
            <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#28B9FF] mb-1 block">
                  Direct Concierge
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Prefer to talk directly?
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                  Skip the form and chat with our team right away. We handle support inquiries, payment verification, and custom orders with priority.
                </p>
              </div>

              {/* PRIMARY CHANNEL: WhatsApp Highlight Box */}
              <div className="p-5 rounded-2xl bg-gradient-to-b from-[#22C55E]/15 to-[#22C55E]/5 border border-[#22C55E]/40 relative overflow-hidden shadow-lg shadow-[#22C55E]/5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-[#22C55E] text-slate-950 flex items-center justify-center font-bold shadow-md shadow-[#22C55E]/30">
                      <Phone className="w-5 h-5 fill-current" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm sm:text-base text-white">
                          WhatsApp Concierge
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30">
                          Primary
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-[#22C55E]">
                        Fastest response — usually under 1 hour
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-lg sm:text-xl font-mono font-bold text-white mb-3">
                  {siteSettings.whatsappDisplay}
                </div>

                <a
                  id="contact-whatsapp-direct-btn"
                  href={`https://wa.me/${siteSettings.whatsappNumber}?text=Hi%20Zohaib%20DigiForge!%20I%20have%20an%20inquiry%20regarding%20a%20resource/order.`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-[#22C55E] hover:bg-[#1eb053] text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg shadow-[#22C55E]/20"
                >
                  <MessageCircle className="w-4 h-4 fill-slate-950" />
                  <span>Start WhatsApp Chat</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* SECONDARY CHANNEL: Official Email Box */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-[#28B9FF] shrink-0 border border-white/5">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] font-medium text-slate-400 block">Official Support Email</span>
                    <span className="text-xs sm:text-sm font-semibold text-white truncate block">
                      {siteSettings.email}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={handleCopyEmail}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-xs flex items-center gap-1"
                    title="Copy Email Address"
                  >
                    {copiedEmail ? <Check className="w-3.5 h-3.5 text-[#22C55E]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">{copiedEmail ? 'Copied' : 'Copy'}</span>
                  </button>
                  <a
                    href={`mailto:${siteSettings.email}`}
                    className="p-2 rounded-lg bg-[#0D6EFD]/20 hover:bg-[#0D6EFD]/30 border border-[#0D6EFD]/40 text-[#28B9FF] transition-colors"
                    title="Send Email"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* SOCIAL HANDLES ROW */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 block">
                  Official Channels &amp; Updates ({siteSettings.socials?.handle || '@zohaibdigiforge'})
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {socialsList.map((soc) => (
                    <a
                      key={soc.name}
                      href={soc.url}
                      target="_blank"
                      rel="noreferrer"
                      className={`p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs font-semibold text-slate-300 transition-all flex items-center justify-between group ${soc.color}`}
                    >
                      <span className="truncate">{soc.name}</span>
                      <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-current shrink-0" />
                    </a>
                  ))}
                </div>
              </div>

              {/* JOIN US / LINK-IN-BIO HUB CALLOUT */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#0D6EFD]/20 via-[#28B9FF]/15 to-[#22C55E]/15 border border-[#28B9FF]/30 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#28B9FF] block">
                    Looking for all our links in one place?
                  </span>
                  <p className="text-xs font-bold text-white truncate">
                    Join Our Official Bio &amp; Resource Hub
                  </p>
                </div>
                <button
                  id="contact-join-bio-hub-btn"
                  onClick={() => {
                    if (onNavigateJoinUs) onNavigateJoinUs();
                    else window.location.href = '/join-us';
                  }}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#0D6EFD] to-[#28B9FF] hover:opacity-95 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 transition-all shadow-md shadow-[#0D6EFD]/20 min-h-[44px]"
                >
                  <span>Open Bio Hub (/join)</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* HUMAN TRUST GUARANTEE LINE */}
              <div className="pt-4 border-t border-slate-800/80 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#22C55E]/10 border border-[#22C55E]/30 flex items-center justify-center text-[#22C55E] shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Human Verification Guarantee</h4>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    &quot;We&apos;re a real team, not a bot — every message gets a real reply.&quot;
                  </p>
                </div>
              </div>

            </div>

            {/* Operating Hours Card */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-400 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-[#28B9FF]" />
                <span>Support Hours: <strong className="text-slate-200">Mon – Sun (9:00 AM – 11:30 PM PKT)</strong></span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                Online
              </span>
            </div>

          </div>

          {/* ────────────────────────────────────────────────
              RIGHT COLUMN (Desktop) / TOP (Mobile):
              INTENT-BASED CONTACT FORM (Single Column Fields Only)
          ──────────────────────────────────────────────── */}
          <div className="order-1 lg:order-2 lg:col-span-7">
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl relative">
              
              <div className="mb-6">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    Send a Message
                  </h2>
                  <span className="text-[11px] font-semibold text-slate-400">
                    Max 5 Fields · Easy &amp; Quick
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300">
                  Fill out the form below. We route inquiries directly by category to resolve issues without delays.
                </p>
              </div>

              {/* SUCCESS STATE CONFIRMATION */}
              <AnimatePresence mode="wait">
                {isSubmitted ? (
                  <motion.div
                    key="success-state"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-6 sm:p-8 rounded-2xl bg-emerald-950/40 border border-[#22C55E]/40 text-center space-y-5"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-[#22C55E]/20 border border-[#22C55E]/40 text-[#22C55E] flex items-center justify-center mx-auto shadow-lg shadow-[#22C55E]/20">
                      <CheckCheck className="w-8 h-8" />
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-white">
                        Got it! We&apos;ll reply within 3 hours.
                      </h3>
                      <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                        Your inquiry has been logged with reference ID <strong className="text-[#28B9FF] font-mono">{submittedInquiryId}</strong>. We will reach out directly on WhatsApp or your email.
                      </p>
                    </div>

                    {/* Quick WhatsApp Jump */}
                    <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                      <a
                        href={`https://wa.me/${siteSettings.whatsappNumber}?text=Hi%20Zohaib%20DigiForge!%20I%20just%20submitted%20inquiry%20%23${submittedInquiryId}%20regarding%20${encodeURIComponent(inquiryType)}.`}
                        target="_blank"
                        rel="noreferrer"
                        className="py-3 px-5 rounded-xl bg-[#22C55E] hover:bg-[#1eb053] text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md"
                      >
                        <MessageCircle className="w-4 h-4 fill-slate-950" />
                        <span>Send on WhatsApp as well</span>
                      </a>
                      <button
                        onClick={handleResetForm}
                        className="py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs sm:text-sm transition-colors border border-white/10"
                      >
                        Send Another Inquiry
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.form
                    key="active-form"
                    onSubmit={handleFormSubmit}
                    noValidate
                    className="space-y-4 sm:space-y-5"
                  >
                    {/* HONEYPOT ANTI-SPAM FIELD (Invisible to real users) */}
                    <div className="hidden" aria-hidden="true">
                      <label htmlFor="company_hp">Do not fill this</label>
                      <input
                        type="text"
                        id="company_hp"
                        name="company_hp"
                        tabIndex={-1}
                        value={honeypot}
                        onChange={(e) => setHoneypot(e.target.value)}
                        autoComplete="off"
                      />
                    </div>

                    {/* FIELD 1: Full Name */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label htmlFor="contact-name-input" className="block text-xs font-semibold text-slate-300">
                          Your Full Name <span className="text-rose-400">*</span>
                        </label>
                        {touched.name && isNameValid && (
                          <span className="text-[11px] font-semibold text-[#22C55E] flex items-center gap-1">
                            <Check className="w-3 h-3" /> Valid
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          id="contact-name-input"
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          onBlur={() => setTouched({ ...touched, name: true })}
                          placeholder="e.g. Muhammad Ali"
                          className={`w-full px-4 py-3 rounded-xl bg-slate-950 border text-sm text-white placeholder-slate-500 focus:outline-none transition-all ${
                            touched.name && !isNameValid
                              ? 'border-rose-500/80 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                              : 'border-slate-800 focus:border-[#0D6EFD] focus:ring-1 focus:ring-[#0D6EFD]'
                          }`}
                        />
                      </div>
                      {touched.name && !isNameValid && (
                        <p className="text-[11px] text-rose-400 flex items-center gap-1 pt-0.5">
                          <AlertCircle className="w-3 h-3" /> Please enter your name (minimum 2 characters).
                        </p>
                      )}
                    </div>

                    {/* FIELD 2: Email Address (Validated) */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label htmlFor="contact-email-input" className="block text-xs font-semibold text-slate-300">
                          Email Address <span className="text-rose-400">*</span>
                        </label>
                        {touched.email && isEmailValid && (
                          <span className="text-[11px] font-semibold text-[#22C55E] flex items-center gap-1">
                            <Check className="w-3 h-3" /> Valid Email
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          id="contact-email-input"
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onBlur={() => setTouched({ ...touched, email: true })}
                          placeholder="name@example.com"
                          className={`w-full px-4 py-3 rounded-xl bg-slate-950 border text-sm text-white placeholder-slate-500 focus:outline-none transition-all ${
                            touched.email && !isEmailValid
                              ? 'border-rose-500/80 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                              : 'border-slate-800 focus:border-[#0D6EFD] focus:ring-1 focus:ring-[#0D6EFD]'
                          }`}
                        />
                      </div>
                      {touched.email && !isEmailValid && (
                        <p className="text-[11px] text-rose-400 flex items-center gap-1 pt-0.5">
                          <AlertCircle className="w-3 h-3" /> Please provide a valid email format (e.g. yourname@mail.com).
                        </p>
                      )}
                    </div>

                    {/* FIELD 3: Inquiry Type (Dropdown — Intent Routing) */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label htmlFor="contact-inquiry-type" className="block text-xs font-semibold text-slate-300">
                          Inquiry Type <span className="text-rose-400">*</span>
                        </label>
                        <span className="text-[10px] text-slate-400">Routes to specialized agent</span>
                      </div>
                      <div className="relative">
                        <select
                          id="contact-inquiry-type"
                          value={inquiryType}
                          onChange={(e) => setInquiryType(e.target.value as ContactInquiryType)}
                          className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-[#0D6EFD] focus:ring-1 focus:ring-[#0D6EFD] transition-all appearance-none cursor-pointer"
                        >
                          <option value="Resource Question">Resource Question (Courses, Templates, Drive Links)</option>
                          <option value="Order/Delivery Issue">Order / Delivery Issue (Pending link, verification)</option>
                          <option value="Membership/Bundles">Membership &amp; Bundles (Mega Pass, Pro Tools)</option>
                          <option value="Custom Service Request">Custom Service Request (Web development, custom scripts)</option>
                          <option value="Partnership/Other">Partnership / General Other</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* FIELD 4: Message (Textarea) */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label htmlFor="contact-message-input" className="block text-xs font-semibold text-slate-300">
                          Your Message / Details <span className="text-rose-400">*</span>
                        </label>
                        <span className={`text-[10px] ${message.trim().length >= 10 ? 'text-slate-400' : 'text-slate-500'}`}>
                          {message.trim().length} / 10 min chars
                        </span>
                      </div>
                      <div className="relative">
                        <textarea
                          id="contact-message-input"
                          required
                          rows={4}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          onBlur={() => setTouched({ ...touched, message: true })}
                          placeholder="Tell us what you need help with (e.g., Order ID, specific bundle, or service specifications)..."
                          className={`w-full px-4 py-3 rounded-xl bg-slate-950 border text-sm text-white placeholder-slate-500 focus:outline-none transition-all resize-y min-h-[100px] ${
                            touched.message && !isMessageValid
                              ? 'border-rose-500/80 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                              : 'border-slate-800 focus:border-[#0D6EFD] focus:ring-1 focus:ring-[#0D6EFD]'
                          }`}
                        />
                      </div>
                      {touched.message && !isMessageValid && (
                        <p className="text-[11px] text-rose-400 flex items-center gap-1 pt-0.5">
                          <AlertCircle className="w-3 h-3" /> Please include at least 10 characters so we can help effectively.
                        </p>
                      )}
                    </div>

                    {/* FIELD 5: WhatsApp Number (Optional for faster reply) */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label htmlFor="contact-whatsapp-input" className="block text-xs font-semibold text-slate-300">
                          WhatsApp Number <span className="text-slate-400 font-normal">(Optional — for faster follow-up)</span>
                        </label>
                        <span className="text-[10px] text-[#22C55E]">⚡ Speeds up reply</span>
                      </div>
                      <div className="relative">
                        <input
                          id="contact-whatsapp-input"
                          type="tel"
                          value={whatsapp}
                          onChange={(e) => setWhatsapp(e.target.value)}
                          placeholder="e.g. 0340 6070632 or +92 340 6070632"
                          className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] transition-all"
                        />
                      </div>
                      <p className="text-[11px] text-slate-400">
                        If provided, our support concierge can message you directly on WhatsApp for instant link hand-off.
                      </p>
                    </div>

                    {/* SUBMIT BUTTON (Never generic "Submit") */}
                    <div className="pt-2">
                      <button
                        id="contact-form-submit-btn"
                        type="submit"
                        disabled={isSubmitting}
                        className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
                          isSubmitting
                            ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                            : 'bg-gradient-to-r from-[#0D6EFD] to-[#28B9FF] hover:from-[#0b5ed7] hover:to-[#1da1e0] text-white shadow-[#0D6EFD]/25 hover:shadow-[#0D6EFD]/40'
                        }`}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-[#28B9FF]" />
                            <span>Routing &amp; Sending Inquiry...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>Send Message</span>
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-400 text-center">
                      Protected by Zero-Spam HoneyGuard. Your email and phone are never shared.
                    </p>

                  </motion.form>
                )}
              </AnimatePresence>

            </div>
          </div>

        </div>

        {/* ═════════════════════════════════════════════════════
            4. JOIN US CTA BANNER
        ═════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-20 p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-950/40 border border-slate-800 relative overflow-hidden shadow-2xl"
        >
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-[#0D6EFD]/10 to-transparent pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div className="space-y-2 max-w-xl">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#28B9FF] block">
                DigiForge Community &amp; VIP Circle
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Not Here to Ask a Question? Just Say Hi.
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Follow DigiForge for free resources, updates, and behind-the-scenes content. Join a growing community of fellow creators and students across Pakistan.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 justify-center">
              <a
                id="contact-join-us-btn"
                href={`https://wa.me/${siteSettings.whatsappNumber}?text=Hi%20Zohaib%20DigiForge!%20I%20want%20to%20join%20the%20community%20and%20receive%20free%20drops.`}
                target="_blank"
                rel="noreferrer"
                className="py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#22C55E] to-emerald-400 hover:from-[#1eb053] hover:to-emerald-500 text-slate-950 font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-[#22C55E]/20"
              >
                <Sparkles className="w-4 h-4 fill-slate-950" />
                <span>Join Us</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <button
                onClick={() => onNavigateResources('all')}
                className="py-3.5 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-sm transition-colors border border-white/10"
              >
                Browse Free Drops
              </button>
            </div>
          </div>
        </motion.div>

        {/* 5. FAQ SECTION (Accordion — Reduces Support Inquiries) */}
        <FAQSection
          title="Instant Answers to Common Support Questions"
          subtitle="Support FAQs"
          description="Save time with instant answers before reaching out. Most common delivery and payment questions are answered below."
          className="py-0 mb-16"
        />

        {/* Community & Resources Callout */}
        <CommunityCallout
          onNavigateResources={onNavigateResources}
          onNavigateJoinUs={onNavigateJoinUs}
          title="Looking for Instant Solutions or Direct Support?"
          subtitle="Explore Digital Catalog & Join Our Community"
          description="Browse our verified developer assets, student bundles, and design libraries — or join the community to connect with Zohaib DigiForge directly."
        />

      </div>

    </div>
  );
};

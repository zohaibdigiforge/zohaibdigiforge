import React, { useState, useMemo } from 'react';
import { 
  Compass, 
  Search, 
  ExternalLink, 
  Copy, 
  Check, 
  FileCode, 
  Globe, 
  Layers, 
  Sparkles, 
  FolderOpen, 
  ShieldCheck, 
  HelpCircle, 
  PhoneCall, 
  Package, 
  Users, 
  ArrowRight,
  Code2,
  Calendar,
  Clock,
  ArrowUpRight,
  CheckCircle2,
  Share2,
  Laptop,
  Palette,
  Bot,
  Building2
} from 'lucide-react';
import { motion } from 'motion/react';
import { Category, LegalDocId } from '../types';
import { SEO } from './SEO';

interface SitemapPageProps {
  onNavigateHome: () => void;
  onNavigateAbout: () => void;
  onNavigateResources: (categorySlug?: string, subcatSlug?: string) => void;
  onNavigateContact: () => void;
  onNavigateFaq: () => void;
  onNavigateLegal: (docId: LegalDocId) => void;
  onNavigateJoinUs: () => void;
  onOpenTrackerModal: () => void;
  onOpenAuthModal?: () => void;
  categories?: Category[];
}

interface SitemapLinkItem {
  title: string;
  url: string;
  description: string;
  category: 'Main Pages' | 'Resource Vault' | 'Legal & Policies' | 'Technical XML';
  priority: string;
  changeFreq: 'Daily' | 'Weekly' | 'Monthly';
  badge?: string;
  badgeColor?: string;
  action: () => void;
}

export const SitemapPage: React.FC<SitemapPageProps> = ({
  onNavigateHome,
  onNavigateAbout,
  onNavigateResources,
  onNavigateContact,
  onNavigateFaq,
  onNavigateLegal,
  onNavigateJoinUs,
  onOpenTrackerModal,
  onOpenAuthModal,
  categories = []
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('All');
  const [copiedXml, setCopiedXml] = useState(false);

  // Core Static Links
  const sitemapItems: SitemapLinkItem[] = useMemo(() => {
    const items: SitemapLinkItem[] = [
      // 1. Main Pages
      {
        title: 'Home — Digital Products & Engineering Studio',
        url: '/',
        description: 'Explore the full Zohaib DigiForge ecosystem, trending $1 digital resources, verified coupons, and tech workflows.',
        category: 'Main Pages',
        priority: '1.0',
        changeFreq: 'Daily',
        badge: 'Primary Entry',
        badgeColor: 'bg-emerald-500/20 text-[#22C55E] border-emerald-500/30',
        action: onNavigateHome
      },
      {
        title: 'About Us — Mission, Team & Vision',
        url: '/about',
        description: 'Learn about Zohaib DigiForge, our founder Zohaib, our focus on Pakistani students and creators, and our 100% IP ownership guarantee.',
        category: 'Main Pages',
        priority: '0.9',
        changeFreq: 'Monthly',
        badge: 'Company',
        badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
        action: onNavigateAbout
      },
      {
        title: 'Digital Resources Store & Vault',
        url: '/resources',
        description: 'Browse hundreds of digital resources, student courses, premium tools, templates, ebooks, and graphic packs at Rs. 279 / $1.',
        category: 'Main Pages',
        priority: '0.95',
        changeFreq: 'Daily',
        badge: 'Store Catalog',
        badgeColor: 'bg-[#0D6EFD]/20 text-[#28B9FF] border-[#0D6EFD]/30',
        action: () => onNavigateResources('all')
      },
      {
        title: 'Contact Us & Direct Support Hub',
        url: '/contact',
        description: 'Get in touch with our team via WhatsApp, Telegram, email, or send a direct inquiry message.',
        category: 'Main Pages',
        priority: '0.85',
        changeFreq: 'Monthly',
        badge: 'Support',
        badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
        action: onNavigateContact
      },
      {
        title: 'FAQ & Help Center',
        url: '/faq',
        description: 'Answers to frequently asked questions regarding instant downloads, payment methods (JazzCash, EasyPaisa, Bank), licensing, and support.',
        category: 'Main Pages',
        priority: '0.85',
        changeFreq: 'Weekly',
        badge: 'Knowledgebase',
        badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
        action: onNavigateFaq
      },
      {
        title: 'Track Order & Access Portal',
        url: '/track-order',
        description: 'Check real-time order status, retrieve instant download links, invoice slips, and verification credentials by Order ID.',
        category: 'Main Pages',
        priority: '0.8',
        changeFreq: 'Daily',
        badge: 'Utility',
        badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
        action: onOpenTrackerModal
      },
      {
        title: 'Join Us & Community Link Hub (Linktree)',
        url: '/join-us',
        description: 'Connect with our official WhatsApp Channel, Telegram Group, GitHub repository, and community announcements.',
        category: 'Main Pages',
        priority: '0.85',
        changeFreq: 'Weekly',
        badge: 'Community',
        badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
        action: onNavigateJoinUs
      }
    ];

    // 2. Resource Categories
    const defaultCats = [
      { id: 'courses', name: 'Courses & Video Tutorials', slug: 'courses', desc: 'Step-by-step programming, design, and marketing mastery courses.' },
      { id: 'pro-tools', name: 'Pro Tools & Premium Utilities', slug: 'pro-tools', desc: 'Essential digital utilities, browser extensions, and productivity toolkits.' },
      { id: 'softwares', name: 'Desktop Softwares & Utilities', slug: 'softwares', desc: 'Standalone software programs, batch tools, and automation scripts.' },
      { id: 'templates', name: 'Web & App Templates', slug: 'templates', desc: 'Production-ready Tailwind, React, and Next.js landing pages and UI kits.' },
      { id: 'graphics-assets', name: 'Graphics & Visual Assets', slug: 'graphics-assets', desc: 'High-resolution UI kits, 3D icons, vector illustrations, and sound effects.' },
      { id: 'e-books', name: 'E-Books & Tech Guides', slug: 'e-books', desc: 'Curated technical e-books, cheat sheets, and student roadmaps.' }
    ];

    const activeCats = categories.length > 0 ? categories : defaultCats;
    activeCats.forEach(cat => {
      items.push({
        title: `Resource Catalog: ${cat.name}`,
        url: `/resources/category/${cat.slug || cat.id}`,
        description: (cat as any).desc || `Explore premium ${cat.name} available for instant download in Pakistan and worldwide.`,
        category: 'Resource Vault',
        priority: '0.85',
        changeFreq: 'Weekly',
        badge: 'Rs. 279 / $1',
        badgeColor: 'bg-[#0D6EFD]/20 text-[#28B9FF] border-[#0D6EFD]/30',
        action: () => onNavigateResources(cat.slug || cat.id)
      });
    });

    // 4. Legal & Policies
    items.push(
      {
        title: 'Privacy Policy & Data Security',
        url: '/privacy',
        description: 'Our strict privacy commitment: zero data selling, end-to-end encryption, and transparent cookie policies.',
        category: 'Legal & Policies',
        priority: '0.6',
        changeFreq: 'Monthly',
        badge: 'Legal',
        badgeColor: 'bg-slate-700/50 text-slate-300 border-slate-600',
        action: () => onNavigateLegal('privacy')
      },
      {
        title: 'Terms of Service & Usage Agreement',
        url: '/terms',
        description: 'Legal terms governing digital downloads, intellectual property rights, commercial licenses, and services.',
        category: 'Legal & Policies',
        priority: '0.6',
        changeFreq: 'Monthly',
        badge: 'Legal',
        badgeColor: 'bg-slate-700/50 text-slate-300 border-slate-600',
        action: () => onNavigateLegal('terms')
      },
      {
        title: 'Refund & Replacement Policy',
        url: '/refund',
        description: 'Clear guidelines regarding digital product replacements, corrupted download resolution, and customer satisfaction.',
        category: 'Legal & Policies',
        priority: '0.6',
        changeFreq: 'Monthly',
        badge: 'Customer Guarantee',
        badgeColor: 'bg-slate-700/50 text-slate-300 border-slate-600',
        action: () => onNavigateLegal('refund')
      }
    );

    return items;
  }, [categories, onNavigateHome, onNavigateAbout, onNavigateResources, onNavigateContact, onNavigateFaq, onNavigateLegal, onNavigateJoinUs, onOpenTrackerModal]);

  // Section categories for tabbed filter
  const sections = ['All', 'Main Pages', 'Resource Vault', 'Legal & Policies'];

  // Filtered links
  const filteredItems = useMemo(() => {
    return sitemapItems.filter(item => {
      const matchSection = selectedSection === 'All' || item.category === selectedSection;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q || 
        item.title.toLowerCase().includes(q) || 
        item.description.toLowerCase().includes(q) || 
        item.url.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);
      return matchSection && matchQuery;
    });
  }, [sitemapItems, selectedSection, searchQuery]);

  const handleCopyXml = () => {
    const sitemapUrl = `${window.location.origin}/sitemap.xml`;
    navigator.clipboard.writeText(sitemapUrl);
    setCopiedXml(true);
    setTimeout(() => setCopiedXml(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 selection:bg-[#28B9FF]/30 selection:text-[#28B9FF] pt-24 pb-20 relative overflow-hidden">
      <SEO 
        title="HTML Sitemap & Directory — Complete Page Index | Zohaib DigiForge"
        description="Comprehensive index and visual sitemap of all pages, digital product categories, bespoke engineering services, articles, guides, and legal policies on Zohaib DigiForge."
        canonical="https://www.zohaibdigiforge.store/sitemap"
      />

      {/* Cyber Grid & Ambient Background Accents */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-[#0D6EFD]/15 via-[#28B9FF]/10 to-transparent blur-[140px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">

        {/* Breadcrumb Navigation */}
        <motion.nav 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-xs text-slate-400 mb-8"
        >
          <button 
            onClick={onNavigateHome}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Home
          </button>
          <span>/</span>
          <span className="text-[#28B9FF] font-medium">Sitemap Directory</span>
        </motion.nav>

        {/* Hero Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0D6EFD]/15 border border-[#0D6EFD]/30 text-[#28B9FF] text-xs font-bold mb-4 shadow-sm">
            <Compass className="w-3.5 h-3.5 animate-spin-slow" />
            <span>Architecture &amp; Page Directory</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight mb-4 leading-tight">
            Explore All Pages, Services &amp; <span className="bg-gradient-to-r from-[#28B9FF] via-[#0D6EFD] to-[#22C55E] bg-clip-text text-transparent">Digital Catalog</span>
          </h1>

          <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-6">
            A comprehensive, human and crawler-friendly index of all software tools, client services, educational guides, and legal resources across Zohaib DigiForge.
          </p>
        </motion.div>

        {/* Search & Filter Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-4 sm:p-5 mb-8 shadow-xl"
        >
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search any page, service, course or guide..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#28B9FF] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-white px-1.5 py-0.5 rounded bg-slate-800"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              {sections.map(sec => {
                const count = sec === 'All' 
                  ? sitemapItems.length 
                  : sitemapItems.filter(i => i.category === sec).length;

                return (
                  <button
                    key={sec}
                    onClick={() => setSelectedSection(sec)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                      selectedSection === sec
                        ? 'bg-gradient-to-r from-[#0D6EFD] to-[#28B9FF] text-white shadow-md shadow-[#0D6EFD]/20'
                        : 'bg-slate-950/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    <span>{sec}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      selectedSection === sec ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Sitemap Grid / List View */}
        {filteredItems.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center my-8">
            <Search className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">No matching links found</h3>
            <p className="text-sm text-slate-400 mb-4">
              We couldn't find any indexed pages matching "{searchQuery}". Try a different keyword or reset filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedSection('All');
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all"
            >
              Reset Search &amp; Filters
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            {sections
              .filter(sec => sec !== 'All' && (selectedSection === 'All' || selectedSection === sec))
              .map((sectionName) => {
                const sectionItems = filteredItems.filter(item => item.category === sectionName);
                if (sectionItems.length === 0) return null;

                const getSectionIcon = () => {
                  switch (sectionName) {
                    case 'Main Pages': return Globe;
                    case 'Custom Services': return Sparkles;
                    case 'Resource Vault': return FolderOpen;
                    case 'Legal & Policies': return ShieldCheck;
                    default: return Layers;
                  }
                };

                const IconComponent = getSectionIcon();

                return (
                  <motion.div 
                    key={sectionName}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4 }}
                    className="space-y-4"
                  >
                    {/* Section Header */}
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-[#28B9FF]">
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                          {sectionName}
                        </h2>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700/60 text-slate-400">
                          {sectionItems.length} Links
                        </span>
                      </div>

                      {sectionName === 'Resource Vault' && (
                        <button
                          onClick={() => onNavigateResources('all')}
                          className="text-xs font-bold text-[#28B9FF] hover:underline flex items-center gap-1"
                        >
                          <span>View All Store Catalog</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Section Items Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {sectionItems.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={item.action}
                          className="group p-4 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-[#28B9FF]/40 transition-all cursor-pointer hover:shadow-lg hover:shadow-[#0D6EFD]/5 flex flex-col justify-between"
                        >
                          <div>
                            {/* Top Meta Line */}
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="text-[11px] font-mono text-slate-500 truncate max-w-[200px] sm:max-w-[260px]">
                                {item.url}
                              </span>

                              {item.badge && (
                                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                                  {item.badge}
                                </span>
                              )}
                            </div>

                            {/* Item Title */}
                            <h3 className="font-bold text-sm sm:text-base text-white group-hover:text-[#28B9FF] transition-colors flex items-center justify-between gap-2 mb-1.5">
                              <span>{item.title}</span>
                              <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-[#28B9FF] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
                            </h3>

                            {/* Item Description */}
                            <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-3">
                              {item.description}
                            </p>
                          </div>

                          {/* Item Footer Details */}
                          <div className="pt-2 border-t border-slate-800/50 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                            <div className="flex items-center gap-3">
                              <span>Priority: <strong className="text-slate-400">{item.priority}</strong></span>
                              <span>Freq: <strong className="text-slate-400">{item.changeFreq}</strong></span>
                            </div>
                            <span className="text-[#28B9FF] group-hover:translate-x-1 transition-transform font-sans font-bold flex items-center gap-1">
                              Visit Page →
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
          </div>
        )}

      </div>
    </div>
  );
};

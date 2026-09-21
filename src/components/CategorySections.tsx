import React, { useRef } from 'react';
import { Category, Product, Currency } from '../types';
import { usePricing } from '../context/PricingContext';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { getOptimizedImageUrl } from '../lib/imageUtils';
import { SocialShareBar } from './SocialShareBar';
import { 
  GraduationCap, 
  Palette, 
  LayoutTemplate, 
  Cpu, 
  BookOpen, 
  Wrench, 
  ArrowRight, 
  Star, 
  Eye, 
  ShoppingBag, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  Zap,
  Folder,
  Layers,
  CheckCircle2
} from 'lucide-react';

interface CategorySectionsProps {
  categories: Category[];
  products: Product[];
  currency: Currency;
  onNavigateCategory: (categorySlug: string) => void;
  onViewDetails: (product: Product) => void;
  onQuickBuy: (product: Product) => void;
}

// Icon mapper helper
const getCategoryIcon = (iconName?: string) => {
  switch (iconName) {
    case 'GraduationCap':
    case 'courses':
      return GraduationCap;
    case 'Palette':
    case 'graphics-assets':
      return Palette;
    case 'Layout':
    case 'LayoutTemplate':
    case 'templates':
      return LayoutTemplate;
    case 'Cpu':
    case 'softwares':
      return Cpu;
    case 'BookOpen':
    case 'ebooks':
    case 'e-books':
      return BookOpen;
    case 'Wrench':
    case 'pro-tools':
      return Wrench;
    default:
      return Layers;
  }
};

// Color accents per category
const CATEGORY_ACCENTS: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  courses: {
    bg: 'bg-blue-500/10',
    text: 'text-[#28B9FF]',
    border: 'border-[#0D6EFD]/30',
    glow: 'from-[#0D6EFD]/15 to-blue-500/5'
  },
  'graphics-assets': {
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
    glow: 'from-purple-600/15 to-pink-500/5'
  },
  templates: {
    bg: 'bg-emerald-500/10',
    text: 'text-[#22C55E]',
    border: 'border-[#22C55E]/30',
    glow: 'from-emerald-500/15 to-teal-500/5'
  },
  softwares: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    glow: 'from-amber-500/15 to-orange-500/5'
  },
  'e-books': {
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-400',
    border: 'border-indigo-500/30',
    glow: 'from-indigo-500/15 to-blue-500/5'
  },
  ebooks: {
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-400',
    border: 'border-indigo-500/30',
    glow: 'from-indigo-500/15 to-blue-500/5'
  },
  'pro-tools': {
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    border: 'border-cyan-500/30',
    glow: 'from-cyan-500/15 to-blue-500/5'
  }
};

export const CategorySections: React.FC<CategorySectionsProps> = ({
  categories,
  products,
  currency,
  onNavigateCategory,
  onViewDetails,
  onQuickBuy
}) => {
  // Sort categories by order or default order
  const sortedCategories = [...categories].sort((a, b) => (a.order || 0) - (b.order || 0));

  // Single Category Section Renderer
  const CategoryRowSection: React.FC<{ category: Category; index: number }> = ({ category, index }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const sectionRef = useScrollReveal<HTMLElement>();

    // Filter products for this category
    const catIdNorm = (category.id || '').toLowerCase().trim();
    const catSlugNorm = (category.slug || '').toLowerCase().trim();
    const catNameNorm = (category.name || '').toLowerCase().trim();

    const categoryProducts = products.filter(p => {
      const pCat = (p.categoryId || (p as any).category || '').toLowerCase().trim();
      return pCat === catIdNorm || pCat === catSlugNorm || pCat === catNameNorm ||
             (pCat.includes(catIdNorm) && catIdNorm.length > 3) ||
             (catIdNorm.includes(pCat) && pCat.length > 3);
    });

    // If zero products, keep section visible with a dedicated curation placeholder
    const isZeroProducts = categoryProducts.length === 0;

    const IconComp = getCategoryIcon(category.icon || category.id || category.slug);
    const accent = CATEGORY_ACCENTS[category.id] || CATEGORY_ACCENTS[category.slug] || CATEGORY_ACCENTS.courses;

    // Alternating subtle background shade
    const isEven = index % 2 === 0;
    const bgShade = isEven ? 'bg-[#0A0F1D]' : 'bg-[#0E1528]';

    const handleScroll = (direction: 'left' | 'right') => {
      if (scrollContainerRef.current) {
        const amount = direction === 'left' ? -340 : 340;
        scrollContainerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
      }
    };

    const { formatCombinedPrice } = usePricing();
    const flatPriceTag = formatCombinedPrice();

    return (
      <section 
        ref={sectionRef}
        id={`category-section-${category.slug}`}
        className={`py-12 sm:py-16 relative border-t border-b border-slate-800/60 ${bgShade} overflow-hidden reveal-init`}
      >
        {/* Ambient Subtle Glow */}
        <div className={`absolute top-0 left-0 w-96 h-96 bg-gradient-to-br ${accent.glow} blur-3xl pointer-events-none opacity-60`} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-6 sm:space-y-8">
          
          {/* 1. Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-slate-800/50">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className={`p-2.5 rounded-xl ${accent.bg} ${accent.text} border ${accent.border} shrink-0`}>
                  <IconComp className="w-5 h-5" />
                </div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  <span>{category.name}</span>
                </h2>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/80">
                  {categoryProducts.length} {categoryProducts.length === 1 ? 'Resource' : 'Resources'}
                </span>
              </div>

              {category.description && (
                <p className="text-xs sm:text-sm text-slate-400 font-medium max-w-2xl leading-relaxed pl-1">
                  {(category.id === 'courses' || category.slug === 'courses')
                    ? 'Master in-demand Cybersecurity, Artificial Intelligence, Web Development, Software Development, Trading , Youtube Automation and Digital Marketing and much more Courses.'
                    : (category.id === 'graphics-assets' || category.slug === 'graphics-assets')
                    ? 'Advanced Level Video Editing Assets, Graphics Designing Assets, Social Media Branding Bundles, Raw Data, Designing Templates and Much More.'
                    : (category.id === 'templates' || category.slug === 'templates')
                    ? 'Notion, Wordpress, Shopify, Excel, Powerpoint, Font, Resume, Canva, Etsy, Pinterest, Evento, Coding , ChatGPT Prompts , Mid Journey Prompts, and much more Template.'
                    : (category.id === 'softwares' || category.slug === 'softwares')
                    ? 'All pro utilities, adobe collections, audio/video editing suites, designing softwares, Apk & Pro mobile Apps and much more.'
                    : (category.id === 'ebooks' || category.slug === 'e-books')
                    ? 'All Books About Digital Skills, Motivational, Self Improvement, Prompt Books, Urdu & English Mega Bundles, Digital Product Playbooks, Blueprints and much more.'
                    : (category.id === 'pro-tools' || category.slug === 'pro-tools')
                    ? 'Instant private & team subscriptions for Canva Pro, ChatGPT Plus, CapCut Pro & Gemini Pro , VPNs ,Linkedln and more much Tools .'
                    : category.description
                  }
                </p>
              )}
            </div>

            {/* See All → Link */}
            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0">
              {/* Desktop Scroll Controls */}
              <div className="hidden md:flex items-center gap-1.5 mr-2">
                <button
                  onClick={() => handleScroll('left')}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-all shadow-sm active:scale-95"
                  title="Scroll Left"
                  aria-label="Scroll Left"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleScroll('right')}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-all shadow-sm active:scale-95"
                  title="Scroll Right"
                  aria-label="Scroll Right"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => onNavigateCategory(category.slug)}
                className="group flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-[#0D6EFD]/20 border border-slate-800 hover:border-[#0D6EFD]/40 text-xs sm:text-sm font-bold text-[#28B9FF] transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[40px]"
              >
                <span>See All {category.name}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* 2. Product Row or Empty State */}
          {isZeroProducts ? (
            <div className="w-full rounded-2xl bg-slate-900/50 border border-dashed border-slate-800 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className={`p-4 rounded-2xl ${accent.bg} ${accent.text} border ${accent.border} shrink-0`}>
                  <IconComp className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      Fresh {category.name} Arriving Soon
                    </h3>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      In Curation
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
                    Our team is currently verifying and updating high-value lifetime digital assets for this collection. Need something specific right now? Request it directly!
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 flex-wrap justify-center shrink-0">
                <a
                  href={`https://wa.me/923406070632?text=${encodeURIComponent(`Hi Zohaib DigiForge, I want to request digital resources from the ${category.name} section.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-[#22C55E] hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer min-h-[40px]"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Request on WhatsApp</span>
                </a>
                <button
                  onClick={() => onNavigateCategory(category.slug)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors min-h-[40px]"
                >
                  Explore Catalog
                </button>
              </div>
            </div>
          ) : (
            <div
              ref={scrollContainerRef}
              className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent snap-x snap-mandatory scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0"
            >
              {categoryProducts.map((product) => {
                const isNew = product.createdAt 
                  ? (new Date().getTime() - new Date(product.createdAt).getTime()) < (30 * 24 * 60 * 60 * 1000)
                  : false;

                return (
                  <div
                    key={product.id}
                    className="shrink-0 w-[85vw] max-w-[290px] sm:w-[310px] md:w-[320px] snap-start group relative bg-slate-900/90 border border-slate-800/80 hover:border-[#22C55E]/50 rounded-2xl overflow-hidden shadow-lg hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between"
                  >
                    {/* Thumbnail Container */}
                    <div className="relative h-44 w-full overflow-hidden bg-slate-950">
                      <img
                        src={getOptimizedImageUrl(product.thumbnail, 360, 65)}
                        alt={product.title}
                        width="320"
                        height="176"
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />

                      {/* Top Badges */}
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                        {isNew && (
                          <span className="text-[9px] font-black px-2 py-0.5 rounded bg-emerald-500 text-slate-950 uppercase tracking-wider shadow-md">
                            NEW
                          </span>
                        )}
                        {product.badge && (
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${
                            product.badge === 'Bestseller' ? 'bg-amber-500 text-slate-950 shadow-md' :
                            product.badge === 'Hot Deal' ? 'bg-rose-500 text-white shadow-md' :
                            'bg-[#28B9FF] text-slate-950 shadow-md'
                          }`}>
                            {product.badge}
                          </span>
                        )}
                      </div>

                      <div className="absolute top-2.5 right-2.5">
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-950/80 backdrop-blur-md text-slate-300 border border-slate-800">
                          {product.deliveryMethod || 'Instant Drive'}
                        </span>
                      </div>

                      {/* Quick View Button on Hover */}
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4">
                        <button
                          onClick={() => onViewDetails(product)}
                          className="px-3 py-1.5 rounded-lg bg-slate-900/95 text-white text-xs font-semibold hover:bg-slate-800 flex items-center gap-1.5 border border-slate-700 shadow-lg min-h-[36px]"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#28B9FF]" />
                          <span>View Details</span>
                        </button>
                      </div>
                    </div>

                    {/* Body Content */}
                    <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div className="space-y-1.5">
                        {/* Rating */}
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span className="text-[#28B9FF] font-medium text-[11px] truncate max-w-[140px]">
                            {product.fileFormat || category.name}
                          </span>
                          <div className="flex items-center gap-1 text-amber-400 font-semibold text-xs">
                            <Star className="w-3.5 h-3.5 fill-amber-400" />
                            <span>{product.rating || 4.9}</span>
                          </div>
                        </div>

                        {/* Title */}
                        <h3
                          onClick={() => onViewDetails(product)}
                          className="font-bold text-sm text-white hover:text-[#28B9FF] cursor-pointer line-clamp-2 transition-colors leading-snug"
                          title={product.title}
                        >
                          {product.title}
                        </h3>
                      </div>

                      {/* Price & Action */}
                      <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-1.5 min-w-0">
                        <div className="shrink-0">
                          <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#22C55E] block whitespace-nowrap">
                            Flat Rate
                          </span>
                          <span className="text-xs sm:text-sm font-black text-white tracking-tight whitespace-nowrap block">
                            {flatPriceTag}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 justify-end">
                          <SocialShareBar
                            compact
                            title={product.title}
                            priceFormatted={flatPriceTag}
                            productId={product.id}
                          />
                          <button
                            onClick={() => onQuickBuy(product)}
                            className="px-2 py-1.5 sm:px-2.5 sm:py-2 rounded-xl bg-[#22C55E] hover:bg-emerald-400 text-slate-950 font-black text-[11px] sm:text-xs flex items-center gap-1 shadow-md hover:shadow-[#22C55E]/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer min-h-[32px] sm:min-h-[36px] whitespace-nowrap shrink-0"
                          >
                            <ShoppingBag className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                            <span>Get Access</span>
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </section>
    );
  };

  // Find products that don't match any category in sortedCategories
  const uncategorizedCat: Category = {
    id: 'extra-resources',
    name: 'Additional Digital Assets',
    slug: 'all',
    icon: 'Sparkles',
    description: 'More exclusive digital tools, courses, and resources from Zohaib DigiForge.',
    order: 99,
    itemCount: 0
  };

  const hasUncategorized = products.some(p => {
    const pCat = (p.categoryId || (p as any).category || '').toLowerCase().trim();
    return !sortedCategories.some(cat => {
      const catIdNorm = (cat.id || '').toLowerCase().trim();
      const catSlugNorm = (cat.slug || '').toLowerCase().trim();
      const catNameNorm = (cat.name || '').toLowerCase().trim();
      return pCat === catIdNorm || pCat === catSlugNorm || pCat === catNameNorm ||
             (pCat.includes(catIdNorm) && catIdNorm.length > 3) ||
             (catIdNorm.includes(pCat) && pCat.length > 3);
    });
  });

  return (
    <div id="home-category-sections" className="space-y-0">
      {sortedCategories.map((cat, idx) => (
        <CategoryRowSection key={cat.id || cat.slug || idx} category={cat} index={idx} />
      ))}
      {hasUncategorized && (
        <CategoryRowSection category={uncategorizedCat} index={sortedCategories.length} />
      )}
    </div>
  );
};

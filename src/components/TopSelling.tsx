import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, Currency } from '../types';
import { usePricing } from '../context/PricingContext';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { getOptimizedImageUrl } from '../lib/imageUtils';
import { Star, ShoppingBag, Eye, Zap, CheckCircle2, Search, X, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

interface TopSellingProps {
  products: Product[];
  currency: Currency;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onViewDetails: (product: Product) => void;
  onQuickBuy: (product: Product) => void;
}

export const TopSelling: React.FC<TopSellingProps> = ({
  products,
  currency,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  setSearchQuery,
  onViewDetails,
  onQuickBuy
}) => {
  const { formatCombinedProductPrice, formatProductPrice, getProductPriceNumber } = usePricing();
  // Local category filter for interactive filtering on homepage
  const [localCategory, setLocalCategory] = React.useState<string>(selectedCategory || 'All');
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const sectionRef = useScrollReveal<HTMLElement>();

  // Sync if prop changes externally
  React.useEffect(() => {
    if (selectedCategory) {
      setLocalCategory(selectedCategory);
    }
  }, [selectedCategory]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const activeCat = localCategory || 'All';
  const normActive = activeCat.toLowerCase().trim().replace(/[^a-z0-9]/g, '');

  // Filter products by "Handpick deals" tag system
  const filteredProducts = products.filter(p => {
    if (p.showOnHome === false) return false;
    const pTags = p.tags || [];
    
    // Check if product has 'Handpick deals' or 'handpick' tag
    const hasHandpickTag = pTags.some(t => {
      const normT = t.toLowerCase().trim();
      return normT.includes('handpick') || normT.includes('handpicked');
    });

    // Check if any product in the list has an explicit handpick tag
    const anyHasHandpickTag = products.some(prod => 
      (prod.tags || []).some(t => t.toLowerCase().trim().includes('handpick'))
    );

    // If explicit handpick tags exist in dataset, strictly show products with that tag.
    // Otherwise, show bestsellers/featured/hot deals as fallback.
    const isMatchedByTag = anyHasHandpickTag
      ? hasHandpickTag
      : (hasHandpickTag || p.isBestseller || p.isFeatured || p.badge === 'Bestseller' || p.badge === 'Hot Deal' || p.badge === 'Featured');

    // Search match
    const pDesc = (p.shortDescription || (p as any).description || '').toString();
    const pTitle = (p.title || '').toString();
    const pCat = ((p as any).category || p.categoryId || '').toString();
    const normSearch = searchQuery.trim().toLowerCase();
    const matchesSearch = !normSearch || 
                          pTitle.toLowerCase().includes(normSearch) ||
                          pDesc.toLowerCase().includes(normSearch) ||
                          pCat.toLowerCase().includes(normSearch) ||
                          pTags.some(t => t.toLowerCase().includes(normSearch));

    return isMatchedByTag && matchesSearch;
  });

  return (
    <section ref={sectionRef} id="products" className="py-16 relative reveal-init">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <span className="text-xs font-bold tracking-widest uppercase text-[#22C55E] bg-[#22C55E]/10 px-3 py-1 rounded-full border border-[#22C55E]/20">
              Handpicked Deals
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mt-3">
              What Everyone&apos;s Buying
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Handpicked and best-selling this week — tested for quality and high performance.
            </p>
          </div>

          {/* Controls: Scroll Buttons */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            {/* Horizontal Scroll Navigation Arrows */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleScroll('left')}
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-[#28B9FF] text-slate-300 hover:text-white transition-all shadow-md active:scale-95"
                title="Scroll Left"
              >
                <ChevronLeft className="w-5 h-5 text-[#28B9FF]" />
              </button>
              <button
                onClick={() => handleScroll('right')}
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-[#28B9FF] text-slate-300 hover:text-white transition-all shadow-md active:scale-95"
                title="Scroll Right"
              >
                <ChevronRight className="w-5 h-5 text-[#28B9FF]" />
              </button>
            </div>
          </div>
        </div>

        {/* Product Cards Horizontal Scroller */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 px-4 bg-slate-900/50 rounded-2xl border border-slate-800 max-w-2xl mx-auto">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-white font-bold text-base sm:text-lg">
              {products.length === 0 ? 'Curated Deals Coming Soon' : 'No resources found matching your search'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
              {products.length === 0 
                ? 'Zero fake products loaded. As products are published through your Admin Panel, they will instantly appear here.'
                : 'Try clearing your search query or switching categories.'}
            </p>
            <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
              {products.length > 0 ? (
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-2 rounded-xl bg-[#0D6EFD] text-white text-xs font-bold transition-transform hover:scale-105"
                >
                  Reset Search
                </button>
              ) : (
                <a
                  href="https://wa.me/923406070632?text=Hi%20Zohaib%20DigiForge!%20I%20am%20looking%20for%20a%20specific%20course%20or%20digital%20tool."
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-[#22C55E] hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-md"
                >
                  Request Asset on WhatsApp
                </a>
              )}
            </div>
          </div>
        ) : (
          <div
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-[#0D6EFD]/50 scrollbar-track-slate-900 snap-x snap-mandatory scroll-smooth py-2 -mx-4 px-4 sm:mx-0 sm:px-0"
          >
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product) => {
                const displayPrice = formatProductPrice(product, currency);
                
                const productCategory = (product as any).category || product.categoryId;

                return (
                  <motion.div
                    layout
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.2 } }}
                    transition={{
                      layout: { type: 'spring', stiffness: 360, damping: 30 },
                      opacity: { duration: 0.25 },
                      scale: { duration: 0.25 }
                    }}
                    className="shrink-0 w-[82vw] max-w-[290px] sm:w-[320px] md:w-[340px] snap-start group relative bg-slate-900/80 border border-slate-800 hover:border-[#28B9FF]/40 rounded-2xl overflow-hidden shadow-xl hover:-translate-y-1.5 transition-colors duration-300 flex flex-col justify-between"
                  >
                  {/* Thumbnail & Badges */}
                  <div className="relative h-48 w-full overflow-hidden bg-slate-950">
                    <img
                      src={getOptimizedImageUrl(product.thumbnail, 360, 65)}
                      alt={product.title}
                      width="340"
                      height="192"
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      {product.badge && (
                        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider ${
                          product.badge === 'Bestseller' ? 'bg-amber-500 text-slate-950 shadow-md' :
                          product.badge === 'Hot Deal' ? 'bg-rose-500 text-white shadow-md' :
                          'bg-[#28B9FF] text-slate-950 shadow-md'
                        }`}>
                          {product.badge}
                        </span>
                      )}
                    </div>

                    <div className="absolute top-3 right-3">
                      <span className="text-[10px] font-medium px-2 py-1 rounded bg-slate-950/80 backdrop-blur-md text-slate-300 border border-slate-800">
                        {product.deliveryMethod}
                      </span>
                    </div>

                    {/* Quick View Button on Hover Overlay */}
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4">
                      <button
                        onClick={() => onViewDetails(product)}
                        className="px-3.5 py-2 rounded-lg bg-slate-900/90 text-white text-xs font-semibold hover:bg-slate-800 flex items-center gap-1.5 border border-slate-700 shadow-lg"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#28B9FF]" />
                        <span>View Details</span>
                      </button>
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    
                    <div>
                      {/* Category & Star Rating */}
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                        <span className="text-[#28B9FF] font-medium truncate max-w-[120px]">{productCategory}</span>
                        <div className="flex items-center gap-1 text-amber-400 font-semibold">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>{product.rating}</span>
                        </div>
                      </div>

                      {/* Title */}
                      <h3
                        onClick={() => onViewDetails(product)}
                        className="font-bold text-sm text-white hover:text-[#28B9FF] cursor-pointer line-clamp-2 transition-colors leading-snug"
                      >
                        {product.title}
                      </h3>
                    </div>

                    {/* Price & Action Buttons */}
                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-1 sm:gap-2">
                      <div className="shrink-0 min-w-fit">
                        {(() => {
                          const origPKR = product.originalPricePKR;
                          const origUSD = product.originalPriceUSD;
                          const curNum = getProductPriceNumber(product, currency);
                          const hasOrig = currency === 'PKR' 
                            ? (typeof origPKR === 'number' && origPKR > curNum)
                            : (typeof origUSD === 'number' && origUSD > curNum);
                          const origStr = currency === 'PKR' ? `Rs. ${origPKR?.toLocaleString()}` : `$${origUSD?.toFixed(2)}`;
                          const origNum = currency === 'PKR' ? (origPKR || 0) : (origUSD || 0);
                          const disc = (hasOrig && origNum > curNum) ? Math.round(((origNum - curNum) / origNum) * 100) : 0;

                          return (
                            <div>
                              {hasOrig ? (
                                <div className="flex items-center gap-1 sm:gap-1.5 mb-0.5 whitespace-nowrap">
                                  <span className="text-[10px] sm:text-xs text-slate-500 line-through font-medium">{origStr}</span>
                                  <span className="text-[9px] sm:text-[10px] font-black text-rose-400 bg-rose-500/10 px-1.2 sm:px-1.5 py-0.5 rounded border border-rose-500/25">{disc}% OFF</span>
                                </div>
                              ) : (
                                <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-[#22C55E] block whitespace-nowrap">
                                  Flat Rate
                                </span>
                              )}
                              <span className="text-xs sm:text-sm font-extrabold text-white whitespace-nowrap block">
                                {formatCombinedProductPrice(product)}
                              </span>
                            </div>
                          );
                        })()}
                      </div>

                      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 justify-end">
                        <button
                          onClick={() => onQuickBuy(product)}
                          className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-[#22C55E] hover:bg-[#1fbd58] text-slate-950 font-black text-[11px] sm:text-xs flex items-center gap-1 shadow-md hover:shadow-[#22C55E]/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer min-h-[34px] sm:min-h-[38px] whitespace-nowrap"
                        >
                          <ShoppingBag className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          <span>Get Access</span>
                        </button>
                      </div>
                    </div>

                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

      </div>
    </section>
  );
};

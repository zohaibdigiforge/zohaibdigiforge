import React, { useState, useEffect, useRef } from 'react';
import { getOptimizedImageUrl } from '../lib/imageUtils';
import {
  Search,
  X,
  Clock,
  ChevronRight,
  TrendingUp,
  Tag,
  ArrowRight,
  FolderOpen,
  Sparkles,
  Package,
  Trash2,
  CornerDownLeft
} from 'lucide-react';
import { Product, Category, Subcategory, Currency } from '../types';
import {
  performFuzzySearch,
  getRecentSearches,
  addRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
  CombinedSearchResults
} from '../services/searchService';
import { HighlightText } from './HighlightText';
import { usePricing } from '../context/PricingContext';

interface SiteSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  categories: Category[];
  subcategories: Subcategory[];
  currency: Currency;
  onSelectProduct: (product: Product) => void;
  onSelectCategory: (categorySlug: string) => void;
  onSeeAllResults: (query: string) => void;
  initialQuery?: string;
}

export const SiteSearchOverlay: React.FC<SiteSearchOverlayProps> = ({
  isOpen,
  onClose,
  products,
  categories,
  subcategories,
  currency,
  onSelectProduct,
  onSelectCategory,
  onSeeAllResults,
  initialQuery = ''
}) => {
  const { formatProductPrice } = usePricing();
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<CombinedSearchResults>({
    products: [],
    categories: [],
    subcategories: [],
    totalMatches: 0
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Sync initial query if passed
  useEffect(() => {
    if (initialQuery !== undefined) {
      setQuery(initialQuery);
      setDebouncedQuery(initialQuery);
    }
  }, [initialQuery]);

  // Load recent searches on open
  useEffect(() => {
    if (isOpen) {
      setRecentSearches(getRecentSearches());
      // Auto focus input with slight delay for smooth modal mount
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Lock background body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle ESC key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Debounce input 200ms
  useEffect(() => {
    setIsSearching(true);
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
      setIsSearching(false);
    }, 200);

    return () => clearTimeout(handler);
  }, [query]);

  // Execute fuzzy search on debounced query
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSearchResults({
        products: [],
        categories: [],
        subcategories: [],
        totalMatches: 0
      });
      return;
    }

    const results = performFuzzySearch(
      debouncedQuery,
      products,
      categories,
      subcategories,
      {
        maxProductResults: 8,
        maxCategoryResults: 3,
        threshold: 0.38
      }
    );

    setSearchResults(results);
  }, [debouncedQuery, products, categories, subcategories]);

  if (!isOpen) return null;

  const handleRecentClick = (recentTerm: string) => {
    setQuery(recentTerm);
    setDebouncedQuery(recentTerm);
  };

  const handleRemoveRecent = (e: React.MouseEvent, recentTerm: string) => {
    e.stopPropagation();
    const updated = removeRecentSearch(recentTerm);
    setRecentSearches(updated);
  };

  const handleClearAllRecent = () => {
    const updated = clearRecentSearches();
    setRecentSearches(updated);
  };

  const handleSubmitSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    addRecentSearch(query);
    onSeeAllResults(query.trim());
    onClose();
  };

  const handleProductClick = (product: Product) => {
    addRecentSearch(product.title);
    onSelectProduct(product);
    onClose();
  };

  const handleCategoryClick = (categorySlug: string) => {
    addRecentSearch(categorySlug);
    onSelectCategory(categorySlug);
    onClose();
  };

  // Popular / Trending Categories
  const popularCategories = categories.slice(0, 5);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 bg-[#0A0F1D]/80 backdrop-blur-md flex flex-col justify-start items-center p-0 sm:p-4 md:p-6 lg:p-12 animate-in fade-in duration-200 overflow-y-auto"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      {/* Search Container Panel */}
      <div className="w-full max-w-3xl bg-[#0D1527] border border-slate-700/80 rounded-none sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col min-h-screen sm:min-h-0 my-0 sm:my-auto">
        {/* Search Header Bar */}
        <form
          onSubmit={handleSubmitSearch}
          className="relative flex items-center px-4 sm:px-6 py-4 bg-slate-900/90 border-b border-slate-800 gap-3"
        >
          <Search className="w-5 h-5 text-[#28B9FF] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search resources, courses, tools..."
            className="w-full bg-transparent text-white text-base sm:text-lg font-medium placeholder-slate-400 focus:outline-none"
            aria-label="Site-wide search input"
          />

          {isSearching && (
            <div className="w-4 h-4 border-2 border-[#28B9FF] border-t-transparent rounded-full animate-spin shrink-0" />
          )}

          {query && !isSearching && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Clear search query"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
          >
            <span className="hidden sm:inline text-[11px] text-slate-400">ESC</span>
            <X className="w-4 h-4" />
          </button>
        </form>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* STATE A: EMPTY QUERY - Show Recent Searches & Trending Categories */}
          {!query.trim() && (
            <div className="space-y-6">
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <Clock className="w-3.5 h-3.5 text-[#28B9FF]" />
                      <span>Recent Searches</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearAllRecent}
                      className="text-[11px] text-slate-500 hover:text-rose-400 font-semibold transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Clear History</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleRecentClick(term)}
                        className="group flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 hover:border-[#28B9FF]/40 text-slate-200 text-xs font-medium cursor-pointer transition-all hover:scale-102"
                      >
                        <Clock className="w-3 h-3 text-slate-400 group-hover:text-[#28B9FF]" />
                        <span>{term}</span>
                        <button
                          type="button"
                          onClick={(e) => handleRemoveRecent(e, term)}
                          className="p-0.5 rounded hover:bg-slate-600 text-slate-500 hover:text-rose-300"
                          title="Remove from recent"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Indexed Platform Hashtags */}
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#28B9FF] uppercase tracking-wider mb-3">
                  <Sparkles className="w-3.5 h-3.5 text-[#28B9FF]" />
                  <span>AI Indexed Hashtags (#Tags)</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    '#CapCutPro',
                    '#PythonAutomation',
                    '#VideoEditing',
                    '#GenerativeAI',
                    '#Cybersecurity',
                    '#CanvaLifetime',
                    '#WebDev2026',
                    '#AdobeCCSuite',
                    '#NotionOS',
                    '#ChatGPTPlus',
                    '#MotionGraphics',
                    '#FlatRs279'
                  ].map((tag, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setQuery(tag);
                        setDebouncedQuery(tag);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#0D6EFD]/10 hover:bg-[#0D6EFD]/25 border border-[#28B9FF]/30 hover:border-[#28B9FF] text-[#28B9FF] hover:text-white text-xs font-bold transition-all cursor-pointer hover:scale-105 shadow-sm"
                    >
                      <span>{tag}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Prompts & Suggested Learning Paths */}
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  <Sparkles className="w-3.5 h-3.5 text-[#28B9FF]" />
                  <span>AI Recommended Learning Paths &amp; Bundles</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    { label: '🎬 Viral Video Editing & CapCut Pack', query: 'CapCut Pro and video editing masterclass' },
                    { label: '🤖 AI Automation & Python Playbook', query: 'AI agents and Python automation' },
                    { label: '🛡️ Ethical Hacking & Cybersecurity', query: 'Cybersecurity and ethical hacking course' },
                    { label: '🎨 Canva Pro & Design Bundles', query: 'Canva Pro lifetime access and templates' },
                    { label: '🚀 Full-Stack Web Dev 2026', query: 'Full stack web development bootcamp' },
                    { label: '📊 Notion OS & Agency CRM', query: 'Notion creator life OS workspace' }
                  ].map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setQuery(chip.query);
                        setDebouncedQuery(chip.query);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-[#0D6EFD]/20 border border-slate-700/80 hover:border-[#28B9FF]/50 text-slate-200 text-xs font-semibold transition-all cursor-pointer hover:scale-102 flex items-center gap-1.5"
                    >
                      <span>{chip.label}</span>
                      <ChevronRight className="w-3 h-3 text-slate-400" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Popular Categories */}
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Popular Categories</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {popularCategories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCategoryClick(cat.slug)}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-left transition-all cursor-pointer group"
                    >
                      <span className="text-base p-1 rounded-lg bg-slate-800 group-hover:bg-[#0D6EFD]/20">
                        {cat.icon || '📁'}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-200 group-hover:text-[#28B9FF] truncate">
                          {cat.name}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">
                          Explore collection
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Tip */}
              <div className="p-3 rounded-xl bg-[#0D6EFD]/10 border border-[#0D6EFD]/20 flex items-center gap-3 text-xs text-slate-300">
                <Sparkles className="w-4 h-4 text-[#28B9FF] shrink-0" />
                <p>
                  Type keywords like <span className="text-[#28B9FF] font-semibold">"Photoshop"</span>, <span className="text-[#28B9FF] font-semibold">"Trading"</span>, or <span className="text-[#28B9FF] font-semibold">"Course"</span> for instant autocomplete.
                </p>
              </div>
            </div>
          )}

          {/* STATE B: QUERY ACTIVE - Show Matching Results */}
          {query.trim().length > 0 && (
            <div className="space-y-5">
              {/* Category Suggestions */}
              {searchResults.categories.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Matching Categories
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {searchResults.categories.map((res) => (
                      <button
                        key={res.category.id}
                        type="button"
                        onClick={() => handleCategoryClick(res.category.slug)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0D6EFD]/15 hover:bg-[#0D6EFD]/30 border border-[#0D6EFD]/30 text-white text-xs font-semibold transition-all cursor-pointer"
                      >
                        <FolderOpen className="w-3.5 h-3.5 text-[#28B9FF]" />
                        <HighlightText
                          text={res.category.name}
                          query={query}
                        />
                        <span className="text-[10px] bg-slate-900/60 px-1.5 py-0.5 rounded text-slate-300">
                          Category
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Product Suggestions */}
              {searchResults.products.length > 0 ? (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Product Suggestions ({searchResults.products.length})
                    </p>
                  </div>

                  <div className="space-y-2">
                    {searchResults.products.map((res) => {
                      const item = res.item;
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleProductClick(item)}
                          className="flex items-center justify-between gap-3 p-2.5 sm:p-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-[#28B9FF]/40 cursor-pointer transition-all group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Thumbnail */}
                            <div className="w-11 h-11 rounded-lg bg-slate-950 overflow-hidden shrink-0 border border-slate-800 flex items-center justify-center">
                              {item.thumbnail || item.image ? (
                                <img
                                  src={getOptimizedImageUrl(item.thumbnail || item.image, 120, 70)}
                                  alt={item.title}
                                  loading="lazy"
                                  decoding="async"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <Package className="w-5 h-5 text-slate-500" />
                              )}
                            </div>

                            {/* Title & Category */}
                            <div className="min-w-0">
                              <p className="text-xs sm:text-sm font-bold text-white group-hover:text-[#28B9FF] truncate transition-colors">
                                <HighlightText
                                  text={item.title}
                                  query={query}
                                />
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {res.categoryName && (
                                  <span className="text-[10px] text-slate-400 bg-slate-800/80 px-1.5 py-0.2 rounded border border-slate-700/50">
                                    {res.categoryName}
                                  </span>
                                )}
                                {item.fileFormat && (
                                  <span className="text-[10px] text-slate-500 truncate hidden sm:inline">
                                    {item.fileFormat}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Price Badge */}
                          <div className="text-right shrink-0">
                            <span className="inline-block text-xs font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                              {formatProductPrice(item, currency)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Zero Results State inside Autocomplete */
                <div className="py-8 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                    <Search className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-200">
                      No exact matches for "{query}"
                    </p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      Try checking for typos, or browse our popular categories below.
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => handleSubmitSearch()}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0D6EFD] to-[#28B9FF] text-white font-bold text-xs shadow-lg shadow-[#0D6EFD]/20 hover:scale-105 transition-all cursor-pointer"
                    >
                      View all catalog items
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Bar: See All Results link */}
        {query.trim().length > 0 && (
          <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400 pl-2">
              Press <span className="text-white font-semibold">Enter</span> to see full results
            </span>
            <button
              type="button"
              onClick={() => handleSubmitSearch()}
              className="px-4 py-2 rounded-xl bg-[#0D6EFD]/20 hover:bg-[#0D6EFD]/30 text-[#28B9FF] border border-[#0D6EFD]/40 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer hover:scale-102"
            >
              <span>See all results for "{query}"</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

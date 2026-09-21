import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getOptimizedImageUrl } from '../lib/imageUtils';
import {
  Search,
  X,
  SlidersHorizontal,
  ChevronDown,
  Star,
  Zap,
  Sparkles,
  ArrowRight,
  FolderOpen,
  Package,
  RotateCcw,
  Check,
  TrendingUp,
  Download,
  Flame,
  Clock,
  LayoutGrid
} from 'lucide-react';
import { Product, Category, Subcategory, Currency } from '../types';
import { performFuzzySearch } from '../services/searchService';
import { usePricing } from '../context/PricingContext';
import { HighlightText } from './HighlightText';
import { TrustBar } from './TrustBar';

interface SearchResultsPageProps {
  query: string;
  onUpdateQuery: (newQuery: string) => void;
  products: Product[];
  categories: Category[];
  subcategories: Subcategory[];
  currency: Currency;
  onViewProduct: (product: Product) => void;
  onQuickBuy: (product: Product) => void;
  onNavigateResources: (categorySlug?: string) => void;
  onNavigateHome: () => void;
}

export const SearchResultsPage: React.FC<SearchResultsPageProps> = ({
  query,
  onUpdateQuery,
  products,
  categories,
  subcategories,
  currency,
  onViewProduct,
  onQuickBuy,
  onNavigateResources,
  onNavigateHome
}) => {
  const { formatProductPrice, getProductPriceNumber } = usePricing();

  const [inputQuery, setInputQuery] = useState(query);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<
    'relevance' | 'popular' | 'newest' | 'price-low' | 'price-high' | 'top-rated'
  >('relevance');

  // Keep internal inputQuery updated when parent query changes
  useEffect(() => {
    setInputQuery(query);
  }, [query]);

  // Handle live search submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateQuery(inputQuery.trim());
  };

  // Perform fuzzy search
  const rawSearchResults = useMemo(() => {
    if (!query.trim()) {
      return {
        products: [],
        categories: [],
        subcategories: [],
        totalMatches: 0
      };
    }
    return performFuzzySearch(query, products, categories, subcategories, {
      maxProductResults: 100,
      threshold: 0.38
    });
  }, [query, products, categories, subcategories]);

  // Category map for quick lookup
  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  // Extract products from results
  const matchingProducts = useMemo(() => {
    return rawSearchResults.products.map((r) => r.item);
  }, [rawSearchResults]);

  // Filter & Sort
  const filteredProducts = useMemo(() => {
    let list = [...matchingProducts];

    // Filter by Category
    if (selectedCategory !== 'all') {
      list = list.filter((p) => {
        const cat = categoryMap.get(p.categoryId);
        return cat?.slug === selectedCategory || p.categoryId === selectedCategory;
      });
    }

    // Sort
    switch (sortBy) {
      case 'popular':
        list.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
        break;
      case 'newest':
        list.sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
        );
        break;
      case 'price-low':
        list.sort((a, b) => getProductPriceNumber(a, 'PKR') - getProductPriceNumber(b, 'PKR'));
        break;
      case 'price-high':
        list.sort((a, b) => getProductPriceNumber(b, 'PKR') - getProductPriceNumber(a, 'PKR'));
        break;
      case 'top-rated':
        list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'relevance':
      default:
        // Already sorted by Fuse.js relevance score
        break;
    }

    return list;
  }, [matchingProducts, selectedCategory, sortBy, categoryMap]);

  // Fallback products for zero results (Bestsellers / Featured)
  const fallbackProducts = useMemo(() => {
    return products
      .filter((p) => p.isBestseller || p.isFeatured || (p.rating && p.rating >= 4.8))
      .slice(0, 8);
  }, [products]);

  return (
    <div className="min-h-screen bg-[#0A0F1D] text-slate-100 pb-20">
      {/* 1. Header Banner */}
      <section className="bg-gradient-to-b from-[#0D1527] to-[#0A0F1D] border-b border-slate-800/80 pt-8 pb-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <button
              onClick={onNavigateHome}
              className="hover:text-[#28B9FF] transition-colors"
            >
              Home
            </button>
            <span>/</span>
            <span className="text-white font-bold">Search Results</span>
          </div>

          {/* Heading & Search Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0D6EFD]/15 border border-[#0D6EFD]/30 text-[#28B9FF] text-xs font-semibold mb-2">
                <Search className="w-3.5 h-3.5" />
                <span>Site-Wide Search Engine</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                {query ? (
                  <>
                    Results for <span className="text-[#28B9FF]">"{query}"</span>
                  </>
                ) : (
                  'Search All Resources'
                )}
              </h1>
              {query && (
                <p className="mt-1 text-xs sm:text-sm text-slate-400">
                  Found <span className="text-white font-bold">{rawSearchResults.totalMatches}</span> matching items across products and categories
                </p>
              )}
            </div>

            {/* Top Editable Search Form */}
            <form
              onSubmit={handleSearchSubmit}
              className="w-full md:w-96 relative flex items-center"
            >
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-[#28B9FF]" />
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Search resources, courses, tools..."
                className="w-full pl-10 pr-20 py-3 bg-slate-900 border border-slate-700/80 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#0D6EFD] focus:ring-1 focus:ring-[#0D6EFD] transition-all shadow-inner"
              />
              {inputQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setInputQuery('');
                    onUpdateQuery('');
                  }}
                  className="absolute right-12 text-slate-400 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="submit"
                className="absolute right-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#0D6EFD] to-[#28B9FF] text-white font-bold text-xs hover:scale-105 transition-all cursor-pointer"
              >
                Search
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* 2. Filter & Sort Bar (Sticky) */}
      {matchingProducts.length > 0 && (
        <div className="sticky top-20 z-30 bg-[#0A0F1D]/90 backdrop-blur-xl border-b border-slate-800 py-3 px-4 sm:px-6 lg:px-8 shadow-md">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 hidden sm:inline">
                Category:
              </span>
              <div className="relative">
                <select
                  aria-label="Filter Search Results by Category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="appearance-none bg-slate-900 border border-slate-700/80 text-xs font-semibold text-white pl-3.5 pr-8 py-2 rounded-xl hover:border-[#0D6EFD] focus:outline-none cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 hidden sm:inline">
                Sort By:
              </span>
              <div className="relative">
                <select
                  aria-label="Sort Search Results"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="appearance-none bg-slate-900 border border-slate-700/80 text-xs font-semibold text-white pl-3.5 pr-8 py-2 rounded-xl hover:border-[#0D6EFD] focus:outline-none cursor-pointer"
                >
                  <option value="relevance">Best Relevance</option>
                  <option value="popular">Most Popular</option>
                  <option value="newest">Newest First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="top-rated">Top Rated</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Results Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* CASE 1: Matches Found */}
        {filteredProducts.length > 0 ? (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-300">
                Showing <span className="text-[#28B9FF] font-bold">{filteredProducts.length}</span> items
              </p>
            </div>

            {/* Product Cards Grid with Smooth Layout Movement Transitions */}
            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((product) => {
                  const categoryObj = categoryMap.get(product.categoryId);

                  return (
                    <motion.div
                      layout
                      key={product.id}
                      initial={{ opacity: 0, scale: 0.94, y: 12 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.2 } }}
                      transition={{
                        layout: { type: 'spring', stiffness: 360, damping: 30 },
                        opacity: { duration: 0.25 },
                        scale: { duration: 0.25 }
                      }}
                      className="group relative bg-[#0D1527] rounded-2xl border border-slate-800 hover:border-[#28B9FF]/50 shadow-xl overflow-hidden flex flex-col justify-between transition-colors duration-300 hover:shadow-2xl hover:shadow-[#0D6EFD]/10"
                    >
                      <div>
                        {/* Thumbnail Container */}
                        <div
                          onClick={() => onViewProduct(product)}
                          className="relative h-48 bg-slate-950 overflow-hidden cursor-pointer"
                        >
                          {product.thumbnail || product.image ? (
                            <img
                              src={getOptimizedImageUrl(product.thumbnail || product.image, 400, 75)}
                              alt={product.title}
                              loading="lazy"
                              decoding="async"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-600 bg-slate-900">
                              <Package className="w-10 h-10" />
                            </div>
                          )}

                          {/* Badges */}
                          <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
                            {product.badge && (
                              <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-[#0D6EFD] to-[#28B9FF] text-white shadow-md">
                                {product.badge}
                              </span>
                            )}
                            {categoryObj && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-950/80 backdrop-blur-md text-slate-300 border border-slate-700/60">
                                {categoryObj.name}
                              </span>
                            )}
                          </div>

                          {/* Rating */}
                          {product.rating && (
                            <div className="absolute bottom-3 right-3 px-2 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md border border-slate-700/60 flex items-center gap-1 text-[11px] font-bold text-amber-400">
                              <Star className="w-3 h-3 fill-amber-400" />
                              <span>{product.rating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>

                        {/* Info Section */}
                        <div className="p-4 space-y-2">
                          <h3
                            onClick={() => onViewProduct(product)}
                            className="text-sm font-bold text-white group-hover:text-[#28B9FF] line-clamp-2 cursor-pointer transition-colors leading-snug"
                          >
                            <HighlightText
                              text={product.title}
                              query={query}
                            />
                          </h3>

                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                            {product.shortDescription || product.description || 'Instant digital download access.'}
                          </p>
                        </div>
                      </div>

                      {/* Bottom Action Footer */}
                      <div className="p-4 pt-0 space-y-3">
                        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-500">
                              Price
                            </p>
                            <p className="text-sm font-black text-emerald-400">
                              {formatProductPrice(product, currency)}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => onViewProduct(product)}
                              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
                            >
                              Preview
                            </button>
                            <button
                              type="button"
                              onClick={() => onQuickBuy(product)}
                              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#0D6EFD] to-[#28B9FF] text-white text-xs font-bold hover:scale-105 transition-all cursor-pointer flex items-center gap-1 shadow-md"
                            >
                              <Zap className="w-3 h-3 fill-white" />
                              <span>Buy</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          </div>
        ) : (
          /* CASE 2: ZERO RESULTS - Never a Dead End! */
          <div className="space-y-12 py-6">
            {/* Zero Results Banner */}
            <div className="p-6 sm:p-10 rounded-3xl bg-gradient-to-br from-slate-900 to-[#0D1527] border border-slate-800 text-center space-y-5 max-w-3xl mx-auto shadow-2xl">
              <div className="w-16 h-16 rounded-2xl bg-[#0D6EFD]/10 border border-[#0D6EFD]/30 flex items-center justify-center mx-auto text-[#28B9FF]">
                <Search className="w-8 h-8" />
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  No exact matches for "{query}" — here's what's close
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
                  We couldn't find an exact match for your query. Try checking spelling or browse our top featured resources below.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onUpdateQuery('')}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all cursor-pointer flex items-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear Search</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateResources('all')}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0D6EFD] to-[#28B9FF] text-white font-bold text-xs shadow-lg shadow-[#0D6EFD]/20 hover:scale-105 transition-all cursor-pointer flex items-center gap-2"
                >
                  <span>Browse All Resources</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Popular Categories Grid Fallback */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-[#28B9FF]" />
                <h3 className="text-lg font-bold text-white">
                  Explore Popular Categories
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => onNavigateResources(cat.slug)}
                    className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-[#28B9FF]/50 text-left transition-all cursor-pointer group"
                  >
                    <span className="text-2xl block mb-2">{cat.icon || '📁'}</span>
                    <p className="text-xs font-bold text-white group-hover:text-[#28B9FF] transition-colors">
                      {cat.name}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                      {cat.description || 'View catalog'}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Recommended Products Fallback Grid */}
            <div className="space-y-6 pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-bold text-white">
                    Popular &amp; Bestseller Recommendations
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {fallbackProducts.map((product) => (
                  <div
                    key={product.id}
                    className="group bg-[#0D1527] rounded-2xl border border-slate-800 hover:border-[#28B9FF]/50 shadow-xl overflow-hidden flex flex-col justify-between transition-all cursor-pointer"
                    onClick={() => onViewProduct(product)}
                  >
                    <div>
                      <div className="relative h-44 bg-slate-950 overflow-hidden">
                        {product.thumbnail || product.image ? (
                          <img
                            src={product.thumbnail || product.image}
                            alt={product.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-600 bg-slate-900">
                            <Package className="w-10 h-10" />
                          </div>
                        )}
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-[#0D6EFD] text-white">
                          Bestseller
                        </span>
                      </div>
                      <div className="p-4">
                        <h4 className="text-xs font-bold text-white group-hover:text-[#28B9FF] line-clamp-2">
                          {product.title}
                        </h4>
                      </div>
                    </div>

                    <div className="p-4 pt-0 flex items-center justify-between border-t border-slate-800/80 mt-2">
                      <span className="text-xs font-bold text-emerald-400">
                        {formatProductPrice(product, currency)}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuickBuy(product);
                        }}
                        className="px-3 py-1 rounded-xl bg-gradient-to-r from-[#0D6EFD] to-[#28B9FF] text-white text-xs font-bold hover:scale-105 transition-all"
                      >
                        Buy Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Trust Bar */}
      <div className="mt-16">
        <TrustBar />
      </div>
    </div>
  );
};

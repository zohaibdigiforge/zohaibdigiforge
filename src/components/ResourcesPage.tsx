import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getOptimizedImageUrl } from '../lib/imageUtils';
import { 
  Search, 
  SlidersHorizontal, 
  X, 
  ChevronRight, 
  ChevronDown, 
  Star, 
  Zap, 
  Download, 
  Check, 
  RotateCcw, 
  Sparkles, 
  Eye, 
  HelpCircle, 
  ChevronUp, 
  Layers, 
  Tag, 
  Flame, 
  ShieldCheck, 
  Clock, 
  GraduationCap, 
  Palette, 
  Layout, 
  Cpu, 
  BookOpen, 
  Wrench, 
  Filter,
  ArrowRight
} from 'lucide-react';
import { Currency, Product, Category, Subcategory } from '../types';
import { isHasbETawfeeqItem } from '../lib/priceUtils';
import { usePricing } from '../context/PricingContext';
import { TrustBar } from './TrustBar';
import { SocialShareBar } from './SocialShareBar';
import { HowItWorks } from './HowItWorks';
import { PaymentMethods } from './PaymentMethods';
import { FAQSection } from './FAQSection';
import { CommunityCallout } from './CommunityCallout';

interface ResourcesPageProps {
  products: Product[];
  categories: Category[];
  subcategories: Subcategory[];
  currency: Currency;
  onViewProduct: (product: Product) => void;
  onQuickBuy: (product: Product) => void;
  onNavigateHome: () => void;
  initialCategorySlug?: string;
  initialSubcategorySlug?: string;
  initialSearchQuery?: string;
  onNavigateContact?: () => void;
  onNavigateFaq?: () => void;
  onNavigateJoinUs?: () => void;
  onNavigateResources?: (catSlug?: string) => void;
}

export const ResourcesPage: React.FC<ResourcesPageProps> = ({
  products,
  categories,
  subcategories,
  currency,
  onViewProduct,
  onQuickBuy,
  onNavigateHome,
  initialCategorySlug = 'all',
  initialSubcategorySlug = 'all',
  initialSearchQuery = '',
  onNavigateContact,
  onNavigateFaq,
  onNavigateJoinUs,
  onNavigateResources
}) => {
  const { formatPrice, getPriceNumber, formatCombinedPrice, formatProductPrice, getProductPriceNumber, formatCombinedProductPrice } = usePricing();

  // Primary Facet States
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>(initialCategorySlug);
  const [selectedSubcategorySlug, setSelectedSubcategorySlug] = useState<string>(initialSubcategorySlug);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearchQuery);
  const [debouncedSearch, setDebouncedSearch] = useState<string>(initialSearchQuery);
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'price-low' | 'price-high' | 'top-rated'>('popular');
  
  // Price Range State
  const maxPriceLimit = currency === 'PKR' ? 3000 : 25;
  const [priceRange, setPriceRange] = useState<number>(maxPriceLimit);
  const [debouncedPrice, setDebouncedPrice] = useState<number>(maxPriceLimit);

  // Secondary Facets (More Filters)
  const [minRating, setMinRating] = useState<number>(0);
  const [selectedFormatTags, setSelectedFormatTags] = useState<string[]>([]);
  const [onlyNewThisWeek, setOnlyNewThisWeek] = useState<boolean>(false);
  const [onlyBestsellers, setOnlyBestsellers] = useState<boolean>(false);

  // UI Modals / Drawers / Pagination
  const [moreFiltersOpen, setMoreFiltersOpen] = useState<boolean>(false);
  const [mobileFilterDrawerOpen, setMobileFilterDrawerOpen] = useState<boolean>(false);
  const [visibleCount, setVisibleCount] = useState<number>(12);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Session Recently Viewed
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>(() => {
    try {
      const saved = sessionStorage.getItem('zdf_recently_viewed');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // FAQs Accordion State
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(0);

  // Synchronize initial props
  useEffect(() => {
    if (initialCategorySlug) setSelectedCategorySlug(initialCategorySlug);
  }, [initialCategorySlug]);

  useEffect(() => {
    if (initialSubcategorySlug) setSelectedSubcategorySlug(initialSubcategorySlug);
  }, [initialSubcategorySlug]);

  useEffect(() => {
    if (initialSearchQuery !== undefined) {
      setSearchQuery(initialSearchQuery);
      setDebouncedSearch(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  // Debounce search query (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Debounce price slider (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedPrice(priceRange);
    }, 300);
    return () => clearTimeout(handler);
  }, [priceRange]);

  // Reset subcategory when category changes (unless matching)
  const handleCategoryChange = (catSlug: string) => {
    setSelectedCategorySlug(catSlug);
    setSelectedSubcategorySlug('all');
    setVisibleCount(12);
    updateUrlParams({ category: catSlug, subcat: 'all' });
  };

  const handleSubcategoryChange = (subSlug: string) => {
    setSelectedSubcategorySlug(subSlug);
    setVisibleCount(12);
    updateUrlParams({ subcat: subSlug });
  };

  // URL sync helper
  const updateUrlParams = (params: Record<string, string | number>) => {
    try {
      const category = params.category !== undefined ? String(params.category) : selectedCategorySlug;
      const subcat = params.subcat !== undefined ? String(params.subcat) : selectedSubcategorySlug;
      const search = params.search !== undefined ? String(params.search) : searchQuery;

      let path = '/resources';
      if (category && category !== 'all') {
        path += `/${category}`;
        if (subcat && subcat !== 'all') {
          path += `/${subcat}`;
        }
      }
      if (search && search.trim()) {
        const cleanQuery = encodeURIComponent(search.trim());
        path += `?q=${cleanQuery}`;
      }
      window.history.replaceState({}, '', path);
    } catch (e) {
      // safe fallback
    }
  };

  // Active Category & Subcategory Objects
  const activeCategory = useMemo(() => {
    if (selectedCategorySlug === 'all') return null;
    return categories.find(c => c.slug === selectedCategorySlug || c.id === selectedCategorySlug) || null;
  }, [categories, selectedCategorySlug]);

  const activeSubcategory = useMemo(() => {
    if (selectedSubcategorySlug === 'all') return null;
    return subcategories.find(s => s.slug === selectedSubcategorySlug || s.id === selectedSubcategorySlug) || null;
  }, [subcategories, selectedSubcategorySlug]);

  // Subcategories available for active category
  const availableSubcategories = useMemo(() => {
    if (!activeCategory) return subcategories;
    return subcategories.filter(s => s.categoryId === activeCategory.id || s.categoryId.includes(activeCategory.id));
  }, [subcategories, activeCategory]);

  // Calculate live counts for Categories
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: products.length };
    categories.forEach(cat => {
      counts[cat.slug] = products.filter(p => p.categoryId === cat.id || p.categoryId === cat.slug).length;
    });
    return counts;
  }, [products, categories]);

  // Calculate live counts for Subcategories
  const subcategoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: 0 };
    let filteredForCat = products;
    if (activeCategory) {
      filteredForCat = products.filter(p => p.categoryId === activeCategory.id || p.categoryId === activeCategory.slug);
    }
    counts.all = filteredForCat.length;

    availableSubcategories.forEach(sub => {
      counts[sub.slug] = filteredForCat.filter(p => p.subcategoryId === sub.id || p.subcategoryId === sub.slug).length;
    });
    return counts;
  }, [products, activeCategory, availableSubcategories]);

  // All distinct format tags available
  const allAvailableTags = useMemo(() => {
    const tagSet = new Set<string>();
    products.forEach(p => {
      if (p.tags && Array.isArray(p.tags)) {
        p.tags.forEach(t => tagSet.add(t));
      }
      if (p.fileFormat) {
        if (p.fileFormat.includes('PDF')) tagSet.add('PDF');
        if (p.fileFormat.includes('Video')) tagSet.add('Video');
        if (p.fileFormat.includes('ZIP')) tagSet.add('ZIP');
        if (p.fileFormat.includes('Figma')) tagSet.add('Figma');
        if (p.fileFormat.includes('Notion')) tagSet.add('Notion');
      }
    });
    return Array.from(tagSet);
  }, [products]);

  // Calculate live counts for tags based on current filtered set
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allAvailableTags.forEach(tag => {
      counts[tag] = products.filter(p => {
        const matchesCategory = selectedCategorySlug === 'all' || p.categoryId === activeCategory?.id || p.categoryId === selectedCategorySlug;
        const matchesSubcat = selectedSubcategorySlug === 'all' || p.subcategoryId === activeSubcategory?.id || p.subcategoryId === selectedSubcategorySlug;
        const matchesTag = (p.tags && p.tags.includes(tag)) || (p.fileFormat && p.fileFormat.toLowerCase().includes(tag.toLowerCase()));
        return matchesCategory && matchesSubcat && matchesTag;
      }).length;
    });
    return counts;
  }, [allAvailableTags, products, selectedCategorySlug, selectedSubcategorySlug, activeCategory, activeSubcategory]);

  // Main Filtering Logic
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // 1. Category Filter
      if (selectedCategorySlug !== 'all') {
        const matchCat = product.categoryId === activeCategory?.id || 
                         product.categoryId === selectedCategorySlug ||
                         (activeCategory && product.categoryId === activeCategory.slug);
        if (!matchCat) return false;
      }

      // 2. Subcategory Filter
      if (selectedSubcategorySlug !== 'all') {
        const matchSub = product.subcategoryId === activeSubcategory?.id || 
                         product.subcategoryId === selectedSubcategorySlug ||
                         (activeSubcategory && product.subcategoryId === activeSubcategory.slug);
        if (!matchSub) return false;
      }

      // 3. Search Query Filter
      if (debouncedSearch.trim()) {
        const q = debouncedSearch.toLowerCase().trim();
        const inTitle = product.title.toLowerCase().includes(q);
        const inDesc = product.shortDescription?.toLowerCase().includes(q) || product.fullDescription?.toLowerCase().includes(q);
        const inTags = product.tags?.some(t => t.toLowerCase().includes(q));
        const inFormat = product.fileFormat?.toLowerCase().includes(q);
        if (!inTitle && !inDesc && !inTags && !inFormat) return false;
      }

      // 4. Price Slider Filter
      const productPrice = getProductPriceNumber(product, currency);
      if (productPrice > debouncedPrice) {
        return false;
      }

      // 5. Rating Filter
      if (minRating > 0 && product.rating < minRating) {
        return false;
      }

      // 6. Format Tags Filter (AND/OR: at least one matching if selected)
      if (selectedFormatTags.length > 0) {
        const hasMatchingTag = selectedFormatTags.some(tag => 
          (product.tags && product.tags.includes(tag)) || 
          (product.fileFormat && product.fileFormat.toLowerCase().includes(tag.toLowerCase()))
        );
        if (!hasMatchingTag) return false;
      }

      // 7. Bestseller toggle
      if (onlyBestsellers && !product.isBestseller && product.badge !== 'Bestseller') {
        return false;
      }

      // 8. New This Week toggle
      if (onlyNewThisWeek && !product.isNew && product.badge !== 'New') {
        return false;
      }

      return true;
    });
  }, [
    products, 
    selectedCategorySlug, 
    selectedSubcategorySlug, 
    activeCategory, 
    activeSubcategory, 
    debouncedSearch, 
    debouncedPrice, 
    currency, 
    minRating, 
    selectedFormatTags, 
    onlyBestsellers, 
    onlyNewThisWeek
  ]);

  // Sort Products
  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    switch (sortBy) {
      case 'popular':
        return list.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
      case 'newest':
        return list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      case 'top-rated':
        return list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'price-low':
        return list.sort((a, b) => {
          const priceA = getProductPriceNumber(a, currency);
          const priceB = getProductPriceNumber(b, currency);
          return priceA - priceB;
        });
      case 'price-high':
        return list.sort((a, b) => {
          const priceA = getProductPriceNumber(a, currency);
          const priceB = getProductPriceNumber(b, currency);
          return priceB - priceA;
        });
      default:
        return list;
    }
  }, [filteredProducts, sortBy, currency]);

  // Paginated visible slice
  const displayedProducts = useMemo(() => {
    return sortedProducts.slice(0, visibleCount);
  }, [sortedProducts, visibleCount]);

  // Zero-results Fallback / Recovery suggestions
  const fallbackRecommendations = useMemo(() => {
    if (filteredProducts.length > 0) return [];
    // 1. If in a specific category, show top products in that category
    if (activeCategory) {
      const catProds = products.filter(p => p.categoryId === activeCategory.id || p.categoryId === activeCategory.slug);
      if (catProds.length > 0) return catProds.slice(0, 4);
    }
    // 2. Otherwise show overall bestsellers
    return products.filter(p => p.isBestseller || p.rating >= 4.9).slice(0, 4);
  }, [filteredProducts, activeCategory, products]);

  // Recently Viewed items
  const recentlyViewedProducts = useMemo(() => {
    if (recentlyViewedIds.length === 0) return [];
    return products.filter(p => recentlyViewedIds.includes(p.id)).slice(0, 4);
  }, [products, recentlyViewedIds]);

  // Related / "You Might Also Like" row
  const youMightAlsoLikeProducts = useMemo(() => {
    if (displayedProducts.length === 0) return [];
    const firstActive = displayedProducts[0];
    return products
      .filter(p => p.id !== firstActive.id && (p.categoryId === firstActive.categoryId || p.subcategoryId === firstActive.subcategoryId))
      .slice(0, 4);
  }, [products, displayedProducts]);

  // Record item into recently viewed
  const handleProductClick = (product: Product) => {
    try {
      const updated = [product.id, ...recentlyViewedIds.filter(id => id !== product.id)].slice(0, 8);
      setRecentlyViewedIds(updated);
      sessionStorage.setItem('zdf_recently_viewed', JSON.stringify(updated));
    } catch {
      // safe fallback
    }
    onViewProduct(product);
  };

  // Reset all filters
  const handleClearAllFilters = () => {
    setSelectedCategorySlug('all');
    setSelectedSubcategorySlug('all');
    setSearchQuery('');
    setDebouncedSearch('');
    setPriceRange(maxPriceLimit);
    setDebouncedPrice(maxPriceLimit);
    setMinRating(0);
    setSelectedFormatTags([]);
    setOnlyNewThisWeek(false);
    setOnlyBestsellers(false);
    setSortBy('popular');
    setVisibleCount(12);
    updateUrlParams({ category: 'all', subcat: 'all', search: '', minPrice: 0, maxPrice: 0 });
  };

  // Active filters count for "More Filters" badge
  const activeSecondaryFilterCount = useMemo(() => {
    let count = 0;
    if (minRating > 0) count++;
    if (selectedFormatTags.length > 0) count += selectedFormatTags.length;
    if (onlyNewThisWeek) count++;
    if (onlyBestsellers) count++;
    return count;
  }, [minRating, selectedFormatTags, onlyNewThisWeek, onlyBestsellers]);

  const hasAnyActiveFilters = useMemo(() => {
    return (
      selectedCategorySlug !== 'all' ||
      selectedSubcategorySlug !== 'all' ||
      searchQuery.trim().length > 0 ||
      priceRange < maxPriceLimit ||
      minRating > 0 ||
      selectedFormatTags.length > 0 ||
      onlyNewThisWeek ||
      onlyBestsellers
    );
  }, [
    selectedCategorySlug, 
    selectedSubcategorySlug, 
    searchQuery, 
    priceRange, 
    maxPriceLimit, 
    minRating, 
    selectedFormatTags, 
    onlyNewThisWeek, 
    onlyBestsellers
  ]);

  // Page Title & SEO Intro
  const pageTitle = useMemo(() => {
    if (activeSubcategory) return activeSubcategory.name;
    if (activeCategory) return activeCategory.name;
    if (searchQuery.trim()) return `Results for "${searchQuery}"`;
    return 'Digital Resources Catalog';
  }, [activeCategory, activeSubcategory, searchQuery]);

  const seoDescription = useMemo(() => {
    if (activeSubcategory) return activeSubcategory.description;
    if (activeCategory) return activeCategory.description;
    return 'Explore verified digital courses, Notion life OS systems, 3D icons, UI Figma kits, automated softwares, and pro tool keys with instant automated delivery.';
  }, [activeCategory, activeSubcategory]);

  const faqs = [
    {
      q: 'How does instant digital delivery work?',
      a: 'Immediately upon completing your payment via JazzCash, EasyPaisa, Bank, or Crypto, your private download links and software license keys appear directly on your dashboard. You also receive an instant confirmation via WhatsApp.'
    },
    {
      q: 'What payment methods do you accept?',
      a: 'We support all major local and international methods: JazzCash, EasyPaisa, SadaPay, NayaPay, Raast Direct Bank Transfer, and Binance Crypto (USDT). We personally check and verify payments on WhatsApp as soon as possible, usually within the hour.'
    },
    {
      q: 'Can I get a refund or replacement if something does not work?',
      a: 'Yes! We offer a 100% replacement guarantee. If a software license key, Canva upgrade, or tool account experiences any issue within your subscription period, our support team will replace or fix it within minutes.'
    },
    {
      q: 'How fast is access after making payment?',
      a: 'Typical verification takes between 30 seconds and 3 minutes. Our automated system generates your access pass immediately upon reference number input.'
    },
    {
      q: 'Are future updates included in digital courses and templates?',
      a: 'Yes. All Notion templates, Figma kits, and development courses include lifetime free access to all future updates and added modules at no extra charge.'
    }
  ];

  return (
    <div id="resources-page-root" className="min-h-screen bg-[#0A0F1D] text-slate-100 font-['Poppins',sans-serif]">
      
      {/* ═══════════════════════════════════════════
          1. PAGE HEADER & BREADCRUMB TRAIL
         ═══════════════════════════════════════════ */}
      <section className="relative pt-8 pb-6 px-4 sm:px-6 lg:px-8 border-b border-white/10 bg-gradient-to-b from-[#0F172A]/70 via-[#0A0F1D] to-[#0A0F1D]">
        <div className="max-w-7xl mx-auto">
          
          {/* Breadcrumb Trail (Clickable at every level) */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-400 mb-4 overflow-x-auto pb-1 no-scrollbar">
            <button 
              onClick={onNavigateHome}
              className="hover:text-[#28B9FF] transition-colors flex items-center gap-1 font-medium whitespace-nowrap"
            >
              Home
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <button 
              onClick={() => handleCategoryChange('all')}
              className={`hover:text-[#28B9FF] transition-colors font-medium whitespace-nowrap ${
                selectedCategorySlug === 'all' ? 'text-white font-semibold' : ''
              }`}
            >
              Resources
            </button>

            {activeCategory && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                <button 
                  onClick={() => handleCategoryChange(activeCategory.slug)}
                  className={`hover:text-[#28B9FF] transition-colors font-medium whitespace-nowrap ${
                    selectedSubcategorySlug === 'all' ? 'text-white font-semibold' : ''
                  }`}
                >
                  {activeCategory.name}
                </button>
              </>
            )}

            {activeSubcategory && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                <span className="text-[#28B9FF] font-semibold whitespace-nowrap">
                  {activeSubcategory.name}
                </span>
              </>
            )}
          </nav>

          {/* Dynamic Page Title & SEO Description */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0D6EFD]/15 border border-[#0D6EFD]/30 text-[#28B9FF] text-xs font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Verified Marketplace ({products.length} High-Yield Assets)</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                {pageTitle}
              </h1>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                {seoDescription}
              </p>
            </div>

            {/* Quick Search in Header */}
            <div className="w-full md:w-80 relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Filter by keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 bg-slate-900/90 border border-white/15 rounded-xl text-base sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#0D6EFD] focus:ring-1 focus:ring-[#0D6EFD] transition-all shadow-inner"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* ═══════════════════════════════════════════
          2. STICKY FILTER BAR (sticks on scroll)
         ═══════════════════════════════════════════ */}
      <div 
        id="sticky-filter-bar"
        className="sticky top-20 z-30 bg-[#0A0F1D]/90 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/40 transition-all py-3 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-7xl mx-auto">
          
          {/* Top Row: Primary Facets & Dropdowns */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            
            {/* Desktop Left: Primary Facets */}
            <div className="hidden lg:flex items-center gap-3 flex-wrap">
              
              {/* Category Dropdown (Single Select with live counts) */}
              <div className="relative">
                <select
                  aria-label="Filter by Category"
                  value={selectedCategorySlug}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="appearance-none bg-slate-900 border border-white/15 text-xs font-semibold text-white pl-3.5 pr-8 py-2 rounded-xl hover:border-[#0D6EFD]/50 focus:outline-none focus:border-[#0D6EFD] cursor-pointer"
                >
                  <option value="all">All Categories ({categoryCounts.all || 0})</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.slug}>
                      {cat.name} ({categoryCounts[cat.slug] || 0})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>

              {/* Subcategory Dropdown (Dynamically populated based on category) */}
              <div className="relative">
                <select
                  aria-label="Filter by Subcategory"
                  value={selectedSubcategorySlug}
                  onChange={(e) => handleSubcategoryChange(e.target.value)}
                  disabled={availableSubcategories.length === 0}
                  className="appearance-none bg-slate-900 border border-white/15 text-xs font-semibold text-white pl-3.5 pr-8 py-2 rounded-xl hover:border-[#0D6EFD]/50 focus:outline-none focus:border-[#0D6EFD] cursor-pointer disabled:opacity-50"
                >
                  <option value="all">
                    {selectedCategorySlug === 'all' ? 'All Subcategories' : `All ${activeCategory?.name || ''} (${subcategoryCounts.all})`}
                  </option>
                  {availableSubcategories.map(sub => (
                    <option key={sub.id} value={sub.slug}>
                      {sub.name} ({subcategoryCounts[sub.slug] || 0})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>

              {/* Sort By Dropdown */}
              <div className="relative">
                <select
                  aria-label="Sort Resources"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="appearance-none bg-slate-900 border border-white/15 text-xs font-semibold text-white pl-3.5 pr-8 py-2 rounded-xl hover:border-[#0D6EFD]/50 focus:outline-none focus:border-[#0D6EFD] cursor-pointer"
                >
                  <option value="popular">Sort: Most Popular</option>
                  <option value="top-rated">Sort: Top Rated (★ 5.0)</option>
                  <option value="newest">Sort: Newest Releases</option>
                  <option value="price-low">Sort: Price (Low → High)</option>
                  <option value="price-high">Sort: Price (High → Low)</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>

            </div>

            {/* Mobile Filter Button Toggle */}
            <div className="flex lg:hidden items-center gap-2 w-full justify-between">
              <button
                onClick={() => setMobileFilterDrawerOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-white/20 text-xs font-semibold text-white shadow-md active:scale-95 transition-all"
              >
                <SlidersHorizontal className="w-4 h-4 text-[#28B9FF]" />
                <span>Filters & Sort</span>
                {activeSecondaryFilterCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-[#0D6EFD] text-white text-[10px] flex items-center justify-center font-bold">
                    {activeSecondaryFilterCount}
                  </span>
                )}
              </button>

              <div className="text-xs text-slate-400 font-medium">
                <span className="text-white font-bold">{filteredProducts.length}</span> results
              </div>
            </div>

            {/* Right Side: More Filters Button (Desktop Progressive Disclosure) */}
            <div className="hidden lg:flex items-center gap-3">
              <button
                onClick={() => setMoreFiltersOpen(!moreFiltersOpen)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
                  moreFiltersOpen || activeSecondaryFilterCount > 0
                    ? 'bg-[#0D6EFD]/20 border-[#0D6EFD] text-[#28B9FF]'
                    : 'bg-slate-900 border-white/15 text-slate-300 hover:text-white hover:border-white/30'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>More Filters</span>
                {activeSecondaryFilterCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-[#0D6EFD] text-white text-[10px] font-bold">
                    {activeSecondaryFilterCount}
                  </span>
                )}
              </button>

              {/* Total Live Count Badge */}
              <div className="text-xs text-slate-400 font-medium pl-2 border-l border-white/10">
                Showing <span className="text-white font-bold">{filteredProducts.length}</span> of {products.length}
              </div>
            </div>

          </div>

          {/* Expandable "More Filters" Secondary Facets Panel (Desktop) */}
          {moreFiltersOpen && (
            <div className="hidden lg:block mt-3 pt-3 border-t border-white/10 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="grid grid-cols-4 gap-6 p-4 rounded-xl bg-slate-900/90 border border-white/10">
                
                {/* Rating Facet */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-2">
                    Minimum Rating
                  </label>
                  <div className="space-y-1.5">
                    {[
                      { val: 0, label: 'All Ratings' },
                      { val: 4.8, label: '4.8+ Stars (Elite)' },
                      { val: 4.5, label: '4.5+ Stars' },
                      { val: 4.0, label: '4.0+ Stars' }
                    ].map(r => (
                      <button
                        key={r.val}
                        onClick={() => setMinRating(r.val)}
                        className={`flex items-center justify-between w-full px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                          minRating === r.val ? 'bg-[#0D6EFD] text-white font-semibold' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <span className="flex items-center gap-1">
                          {r.val > 0 && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                          {r.label}
                        </span>
                        {minRating === r.val && <Check className="w-3 h-3" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Format / Type Tags Facet */}
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-300 block mb-2">
                    Asset Format & Deliverable Tags
                  </label>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                    {allAvailableTags.map(tag => {
                      const isSelected = selectedFormatTags.includes(tag);
                      const count = tagCounts[tag] || 0;
                      return (
                        <button
                          key={tag}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedFormatTags(selectedFormatTags.filter(t => t !== tag));
                            } else {
                              setSelectedFormatTags([...selectedFormatTags, tag]);
                            }
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border ${
                            isSelected 
                              ? 'bg-[#0D6EFD] border-[#0D6EFD] text-white shadow-sm' 
                              : 'bg-slate-950/60 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                          }`}
                        >
                          <span>{tag}</span>
                          <span className={`text-[10px] px-1 rounded ${isSelected ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-500'}`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Status Toggles */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-2">
                    Curated Badges
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-white/5 cursor-pointer hover:border-white/20">
                      <span className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#22C55E]" /> New This Week
                      </span>
                      <input
                        type="checkbox"
                        checked={onlyNewThisWeek}
                        onChange={(e) => setOnlyNewThisWeek(e.target.checked)}
                        className="rounded accent-[#0D6EFD] cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-white/5 cursor-pointer hover:border-white/20">
                      <span className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-amber-400" /> Bestseller Only
                      </span>
                      <input
                        type="checkbox"
                        checked={onlyBestsellers}
                        onChange={(e) => setOnlyBestsellers(e.target.checked)}
                        className="rounded accent-[#0D6EFD] cursor-pointer"
                      />
                    </label>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Active Filter Removable Chips Bar */}
          {hasAnyActiveFilters && (
            <div className="flex items-center gap-2 flex-wrap pt-2.5 mt-2 border-t border-white/5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Active Filters:
              </span>

              {selectedCategorySlug !== 'all' && activeCategory && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-900/40 border border-blue-500/30 text-blue-300 text-xs font-medium">
                  <span>Category: {activeCategory.name}</span>
                  <button onClick={() => handleCategoryChange('all')} className="hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedSubcategorySlug !== 'all' && activeSubcategory && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-900/40 border border-indigo-500/30 text-indigo-300 text-xs font-medium">
                  <span>Subcategory: {activeSubcategory.name}</span>
                  <button onClick={() => handleSubcategoryChange('all')} className="hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {searchQuery && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-white/20 text-slate-200 text-xs font-medium">
                  <span>Search: "{searchQuery}"</span>
                  <button onClick={() => setSearchQuery('')} className="hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {priceRange < maxPriceLimit && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-900/40 border border-cyan-500/30 text-cyan-300 text-xs font-medium">
                  <span>Under {currency === 'PKR' ? `Rs. ${priceRange}` : `$${priceRange}`}</span>
                  <button onClick={() => setPriceRange(maxPriceLimit)} className="hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {minRating > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-900/40 border border-amber-500/30 text-amber-300 text-xs font-medium">
                  <span>{minRating}+ Stars</span>
                  <button onClick={() => setMinRating(0)} className="hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedFormatTags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-900/40 border border-purple-500/30 text-purple-300 text-xs font-medium">
                  <span>{tag}</span>
                  <button onClick={() => setSelectedFormatTags(selectedFormatTags.filter(t => t !== tag))} className="hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {onlyNewThisWeek && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-900/40 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
                  <span>New This Week</span>
                  <button onClick={() => setOnlyNewThisWeek(false)} className="hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {onlyBestsellers && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-900/40 border border-amber-500/30 text-amber-300 text-xs font-medium">
                  <span>Bestseller Only</span>
                  <button onClick={() => setOnlyBestsellers(false)} className="hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              <button
                onClick={handleClearAllFilters}
                className="inline-flex items-center gap-1 text-xs font-bold text-rose-400 hover:text-rose-300 ml-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear All</span>
              </button>
            </div>
          )}

        </div>
      </div>

      {/* ═══════════════════════════════════════════
          3. MAIN PRODUCT GRID SECTION
         ═══════════════════════════════════════════ */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Grid or Zero-Results Recovery */}
          {displayedProducts.length > 0 ? (
            <div>
              {/* Responsive Product Grid: 4 cols desktop / 2 cols tablet / 1-2 cols mobile with Smooth Layout Transitions */}
              <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <AnimatePresence mode="popLayout">
                  {displayedProducts.map((product) => {
                    const flatVal = getProductPriceNumber(product, currency);
                    const displayPrice = formatProductPrice(product, currency);
                    const originalPrice = currency === 'PKR' ? `Rs. ${(flatVal * 2).toLocaleString()}` : `$${(flatVal * 2).toFixed(2)}`;

                    return (
                      <motion.div
                        layout
                        key={product.id}
                        id={`product-card-${product.id}`}
                        initial={{ opacity: 0, scale: 0.94, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.2 } }}
                        transition={{
                          layout: { type: 'spring', stiffness: 360, damping: 30 },
                          opacity: { duration: 0.25 },
                          scale: { duration: 0.25 },
                          y: { duration: 0.25 }
                        }}
                        className="group flex flex-col justify-between bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-white/10 hover:border-[#0D6EFD]/60 rounded-2xl p-4 transition-colors duration-300 hover:shadow-2xl hover:shadow-[#0D6EFD]/10 relative overflow-hidden"
                      >
                      {/* Top Thumbnail & Badges */}
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 mb-3.5">
                        <img
                          src={getOptimizedImageUrl(product.thumbnail, 480, 75)}
                          alt={product.title}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
                        
                        {/* Status Badges */}
                        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
                          {product.badge === 'Bestseller' && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/90 text-slate-950 text-[10px] font-black tracking-wider uppercase shadow-md flex items-center gap-1">
                              <Flame className="w-3 h-3 fill-slate-950" /> Bestseller
                            </span>
                          )}
                          {product.badge === 'New' && (
                            <span className="px-2 py-0.5 rounded-md bg-[#22C55E] text-slate-950 text-[10px] font-black tracking-wider uppercase shadow-md">
                              New
                            </span>
                          )}
                          {product.badge === 'Popular' && (
                            <span className="px-2 py-0.5 rounded-md bg-[#0D6EFD] text-white text-[10px] font-black tracking-wider uppercase shadow-md">
                              Popular
                            </span>
                          )}
                          {product.badge === 'Hot Deal' && (
                            <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-black tracking-wider uppercase shadow-md">
                              50% Off
                            </span>
                          )}
                        </div>

                        {/* Format Tag in Corner */}
                        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-slate-900/90 border border-white/20 text-[10px] font-medium text-slate-300 backdrop-blur-md">
                          {product.fileFormat || 'Instant Delivery'}
                        </div>
                      </div>

                      {/* Content Info */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          {/* Rating */}
                          {product.rating && (
                            <div className="flex items-center gap-1 mb-1.5 text-xs">
                              <div className="flex items-center text-amber-400">
                                <Star className="w-3.5 h-3.5 fill-amber-400" />
                                <span className="font-bold ml-1 text-slate-200">{product.rating.toFixed(1)}</span>
                              </div>
                            </div>
                          )}

                          {/* Title (2-line max truncated) */}
                          <h3 
                            onClick={() => handleProductClick(product)}
                            className="font-bold text-sm text-white hover:text-[#28B9FF] transition-colors line-clamp-2 leading-snug cursor-pointer mb-2"
                            title={product.title}
                          >
                            {product.title}
                          </h3>

                          {/* Short Description */}
                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                            {product.shortDescription}
                          </p>
                        </div>

                        {/* Price & Action Buttons */}
                        <div className="pt-3 border-t border-white/10 mt-2 flex items-center justify-between gap-2">
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
                            <SocialShareBar
                              compact
                              title={product.title}
                              priceFormatted={formatCombinedProductPrice(product)}
                              productId={product.id}
                            />
                            <button
                              onClick={(e) => { e.stopPropagation(); onQuickBuy(product); }}
                              className="px-2 py-1.5 sm:px-2.5 sm:py-2 rounded-xl bg-gradient-to-r from-[#0D6EFD] to-[#28B9FF] hover:from-[#0b5ed7] hover:to-[#0D6EFD] text-[11px] sm:text-xs font-black text-white shadow-md shadow-[#0D6EFD]/20 transition-all flex items-center gap-1 active:scale-95 whitespace-nowrap min-h-[32px] sm:min-h-[36px] cursor-pointer shrink-0"
                            >
                              <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                              <span>Get Access</span>
                            </button>
                          </div>
                        </div>

                      </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>

              {/* Load More Button (If remaining items) */}
              {displayedProducts.length < sortedProducts.length && (
                <div className="mt-12 text-center">
                  <button
                    onClick={() => setVisibleCount(prev => prev + 12)}
                    className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-white/15 hover:border-[#0D6EFD] text-sm font-bold text-white hover:text-[#28B9FF] transition-all shadow-xl hover:shadow-[#0D6EFD]/10"
                  >
                    Load More Resources ({sortedProducts.length - displayedProducts.length} remaining)
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* ═══════════════════════════════════════════
               5. ZERO-RESULTS RECOVERY STATE (CRITICAL)
               ═══════════════════════════════════════════ */
            <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/60 border border-white/10 text-center max-w-3xl mx-auto my-6 animate-in fade-in">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0D6EFD]/20 to-[#28B9FF]/10 border border-[#0D6EFD]/30 flex items-center justify-center mx-auto mb-4 text-[#28B9FF]">
                <Filter className="w-8 h-8" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                No exact matches — here's what's close
              </h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
                We couldn't find any resources matching all your active filters. Try loosening your price limit or clearing specific tags.
              </p>

              {/* Recovery Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
                <button
                  onClick={handleClearAllFilters}
                  className="px-5 py-2.5 rounded-xl bg-[#0D6EFD] hover:bg-[#0b5ed7] text-xs font-bold text-white shadow-lg shadow-[#0D6EFD]/30 transition-all flex items-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear All Filters</span>
                </button>
                {priceRange < maxPriceLimit && (
                  <button
                    onClick={() => setPriceRange(maxPriceLimit)}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-all"
                  >
                    Reset Price Limit
                  </button>
                )}
                {selectedSubcategorySlug !== 'all' && (
                  <button
                    onClick={() => setSelectedSubcategorySlug('all')}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-all"
                  >
                    Show Entire Category
                  </button>
                )}
              </div>

              {/* Auto-suggest Top Recommended Products */}
              {fallbackRecommendations.length > 0 && (
                <div className="text-left border-t border-white/10 pt-8">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-4 h-4 text-[#22C55E]" />
                    <h4 className="text-sm font-bold text-white">
                      Recommended Top Sellers in DigiForge:
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {fallbackRecommendations.map(prod => (
                      <div
                        key={prod.id}
                        onClick={() => handleProductClick(prod)}
                        className="cursor-pointer p-3 rounded-xl bg-slate-950 border border-white/10 hover:border-[#0D6EFD]/50 transition-all group"
                      >
                        <img 
                          src={getOptimizedImageUrl(prod.thumbnail, 320, 75)} 
                          alt={prod.title} 
                          loading="lazy"
                          decoding="async"
                          className="w-full aspect-video object-cover rounded-lg mb-2 group-hover:scale-105 transition-transform" 
                        />
                        <h5 className="text-xs font-bold text-white line-clamp-2 mb-1 group-hover:text-[#28B9FF]">
                          {prod.title}
                        </h5>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-[#28B9FF]">
                            {formatProductPrice(prod, currency)}
                          </span>
                          <span className="text-amber-400 font-semibold">★ {prod.rating}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      </section>

      {/* ═══════════════════════════════════════════
          6. RECENTLY VIEWED & YOU MIGHT ALSO LIKE
         ═══════════════════════════════════════════ */}
      {recentlyViewedProducts.length > 0 && (
        <section className="py-8 px-4 sm:px-6 lg:px-8 border-t border-white/5 bg-slate-950/40">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#28B9FF]" />
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Recently Viewed by You
                </h3>
              </div>
              <span className="text-xs text-slate-500">Saved in current session</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentlyViewedProducts.map(p => (
                <div 
                  key={p.id}
                  onClick={() => handleProductClick(p)}
                  className="cursor-pointer p-3.5 rounded-xl bg-slate-900 border border-white/10 hover:border-[#0D6EFD]/50 transition-all group flex items-center gap-3"
                >
                  <img 
                    src={getOptimizedImageUrl(p.thumbnail, 160, 75)} 
                    alt={p.title} 
                    loading="lazy" 
                    decoding="async" 
                    className="w-16 h-14 object-cover rounded-lg shrink-0" 
                  />

                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate group-hover:text-[#28B9FF] transition-colors">
                      {p.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate">{p.fileFormat}</p>
                    <span className="text-xs font-bold text-[#28B9FF]">
                      {formatProductPrice(p, currency)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════
          8. TRUST BAR
         ═══════════════════════════════════════════ */}
      <TrustBar />
      <HowItWorks />
      <PaymentMethods />
      <FAQSection
        title="General Digital Assets & Support FAQs"
        subtitle="General Digital Assets FAQs"
        description="Find quick answers regarding digital resources, instant Google Drive delivery, and lifetime license access."
        onNavigateContact={onNavigateContact}
        onNavigateFAQ={onNavigateFaq}
      />
      <CommunityCallout
        onNavigateResources={onNavigateResources || (() => {})}
        onNavigateJoinUs={onNavigateJoinUs || (() => {})}
      />

      {/* ═══════════════════════════════════════════
          MOBILE FILTER FULL-SCREEN DRAWER / SHEET
         ═══════════════════════════════════════════ */}
      {mobileFilterDrawerOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#0A0F1D] border-t border-white/15 rounded-t-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#28B9FF]" />
                <span className="font-bold text-white text-sm">Filter & Sort Resources</span>
              </div>
              <button
                onClick={() => setMobileFilterDrawerOpen(false)}
                className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 overflow-y-auto space-y-6 flex-1">
              
              {/* Category */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2">Category</label>
                <select
                  value={selectedCategorySlug}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full bg-slate-900 border border-white/15 text-base sm:text-xs font-semibold text-white px-3 py-2.5 rounded-xl min-h-[44px]"
                >
                  <option value="all">All Categories ({categoryCounts.all})</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.slug}>{c.name} ({categoryCounts[c.slug] || 0})</option>
                  ))}
                </select>
              </div>

              {/* Subcategory */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2">Subcategory</label>
                <select
                  value={selectedSubcategorySlug}
                  onChange={(e) => handleSubcategoryChange(e.target.value)}
                  className="w-full bg-slate-900 border border-white/15 text-base sm:text-xs font-semibold text-white px-3 py-2.5 rounded-xl min-h-[44px]"
                >
                  <option value="all">All Subcategories ({subcategoryCounts.all})</option>
                  {availableSubcategories.map(s => (
                    <option key={s.id} value={s.slug}>{s.name} ({subcategoryCounts[s.slug] || 0})</option>
                  ))}
                </select>
              </div>

              {/* Price Slider */}
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-slate-300">Max Price</span>
                  <span className="font-bold text-[#28B9FF]">
                    {currency === 'PKR' ? `Rs. ${priceRange}` : `$${priceRange}`}
                  </span>
                </div>
                <input
                  type="range"
                  min={currency === 'PKR' ? 300 : 2}
                  max={maxPriceLimit}
                  step={currency === 'PKR' ? 100 : 1}
                  value={priceRange}
                  onChange={(e) => setPriceRange(Number(e.target.value))}
                  className="w-full accent-[#0D6EFD]"
                />
              </div>

              {/* Rating */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2">Minimum Rating</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { val: 0, label: 'All' },
                    { val: 4.8, label: '★ 4.8+' },
                    { val: 4.5, label: '★ 4.5+' },
                    { val: 4.0, label: '★ 4.0+' }
                  ].map(r => (
                    <button
                      key={r.val}
                      onClick={() => setMinRating(r.val)}
                      className={`py-2 px-3 rounded-xl text-xs font-medium border ${
                        minRating === r.val ? 'bg-[#0D6EFD] border-[#0D6EFD] text-white' : 'bg-slate-900 border-white/10 text-slate-300'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-2">
                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-white/10">
                  <span className="text-xs font-medium text-slate-200">New This Week</span>
                  <input
                    type="checkbox"
                    checked={onlyNewThisWeek}
                    onChange={(e) => setOnlyNewThisWeek(e.target.checked)}
                    className="accent-[#0D6EFD]"
                  />
                </label>
                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-white/10">
                  <span className="text-xs font-medium text-slate-200">Bestseller Only</span>
                  <input
                    type="checkbox"
                    checked={onlyBestsellers}
                    onChange={(e) => setOnlyBestsellers(e.target.checked)}
                    className="accent-[#0D6EFD]"
                  />
                </label>
              </div>

            </div>

            {/* Footer Apply */}
            <div className="p-4 border-t border-white/10 bg-slate-950 flex items-center gap-3">
              <button
                onClick={handleClearAllFilters}
                className="w-1/3 py-3 rounded-xl bg-slate-900 text-xs font-semibold text-slate-300"
              >
                Reset
              </button>
              <button
                onClick={() => setMobileFilterDrawerOpen(false)}
                className="w-2/3 py-3 rounded-xl bg-gradient-to-r from-[#0D6EFD] to-[#28B9FF] text-xs font-bold text-white shadow-lg shadow-[#0D6EFD]/30"
              >
                Show {filteredProducts.length} Results
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default ResourcesPage;

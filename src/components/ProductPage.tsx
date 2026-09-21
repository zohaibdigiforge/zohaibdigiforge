import React, { useState, useEffect } from 'react';
import { Product, Currency, Category, Subcategory } from '../types';
import { logAnalyticsEvent } from '../services/firestoreService';
import { isHasbETawfeeqItem, HASB_E_TAWFEEQ_LABEL, MAINTENANCE_FEE_NOTE } from '../lib/priceUtils';
import { usePricing } from '../context/PricingContext';
import { getOptimizedImageUrl } from '../lib/imageUtils';
import { FAQSection } from './FAQSection';
import { SocialShareBar } from './SocialShareBar';
import { 
  ChevronRight, 
  Star, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  Download, 
  Share2, 
  ArrowLeft, 
  ShoppingBag, 
  MessageCircle, 
  FileText, 
  Layers, 
  HelpCircle, 
  Sparkles, 
  Clock, 
  Lock, 
  Check, 
  FolderArchive,
  RefreshCw,
  ExternalLink,
  BookOpen,
  Eye,
  Maximize2,
  X
} from 'lucide-react';

interface ProductPageProps {
  product: Product;
  allProducts: Product[];
  categories: Category[];
  subcategories: Subcategory[];
  currency: Currency;
  onBack: () => void;
  onBuyNow: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onSelectRelatedProduct: (product: Product) => void;
  onNavigateCategory: (catSlug: string) => void;
}

export const ProductPage: React.FC<ProductPageProps> = ({
  product,
  allProducts,
  categories,
  subcategories,
  currency,
  onBack,
  onBuyNow,
  onAddToCart,
  onSelectRelatedProduct,
  onNavigateCategory
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [addedToCartToast, setAddedToCartToast] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [selectedPreviewIdx, setSelectedPreviewIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Scroll to top on mount / product switch & log analytics view
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setSelectedPreviewIdx(0);
    setLightboxOpen(false);
    logAnalyticsEvent('product_view', { productId: product.id, title: product.title });
  }, [product.id, product.title]);

  // Track scroll for sticky bottom purchase bar
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const shouldShow = window.scrollY > 450;
          setShowStickyBar(prev => (prev !== shouldShow ? shouldShow : prev));
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  const { formatProductPrice, getProductPriceNumber } = usePricing();
  const priceFormatted = formatProductPrice(product, currency);

  const categoryObj = categories.find(c => c.id === product.categoryId || c.slug === product.categoryId);
  const subcategoryObj = subcategories.find(s => s.id === product.subcategoryId || s.slug === product.subcategoryId);

  const categoryName = categoryObj ? categoryObj.name : product.categoryId || 'Resources';
  const subcategoryName = subcategoryObj ? subcategoryObj.name : product.subcategoryId || 'Digital Goods';

  const relatedProducts = allProducts
    .filter(p => p.id !== product.id && (p.categoryId === product.categoryId || p.subcategoryId === product.subcategoryId))
    .slice(0, 3);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const openWhatsAppInquiry = () => {
    const text = encodeURIComponent(
      `Hello Zohaib DigiForge! I'm interested in "${product.title}" (${priceFormatted}). Please share instant delivery details.`
    );
    window.open(`https://wa.me/923406070632?text=${text}`, '_blank');
  };

  const curriculumModules = [
    {
      title: 'Module 1: Foundation & Core Asset Toolkit',
      duration: '6 Sub-modules • 14 Files',
      lessons: [
        'Complete Project Architecture & Starter Template',
        'High-Resolution Assets & Source Master Files',
        'Configuration Guides & Step-by-Step Setup Video',
        'Licensing & Lifetime Commercial Use Documentation'
      ]
    },
    {
      title: 'Module 2: Advanced Implementations & Pro Workflows',
      duration: '8 Sub-modules • 22 Files',
      lessons: [
        'Production-Ready Components & Ready Scripts',
        'Optimized High-Performance Assets & Color Profiles',
        'Integration with Modern Frameworks and Industry Standards',
        'Real-world Case Studies & Automated Workflows'
      ]
    },
    {
      title: 'Module 3: Bonus Toolkits & Lifetime Resource Pack',
      duration: '4 Sub-modules • 10 Files',
      lessons: [
        'Exclusive Cheat Sheets & Quick-Reference Manuals',
        'Ready-to-Use Client Pitch Decks & Proposals',
        'Access to Private Google Drive Archive Updates'
      ]
    }
  ];

  const faqs = [
    {
      q: 'How will I receive this resource after payment?',
      a: 'Instant digital delivery! Once your payment is verified (JazzCash, EasyPaisa, SadaPay, NayaPay, or Bank Transfer), you receive direct high-speed Cloud access links immediately on your screen and via WhatsApp/Email.'
    },
    {
      q: 'Do I get lifetime access and future updates?',
      a: 'Yes! All digital toolkits, course bundles, and asset packs include 100% lifetime access with all future updates added automatically at no extra cost.'
    },
    {
      q: 'Are the files verified and safe to open?',
      a: 'Every archive is virus-scanned with enterprise security and vetted for absolute authenticity before publication.'
    },
    {
      q: 'How can I get support if I need help?',
      a: 'We offer dedicated WhatsApp support at +92 340 6070632 with rapid personal assistance.'
    }
  ];

  const avgRating = (product.rating || 5).toFixed(1);

  return (
    <div className="min-h-screen bg-[#070B14] text-white pt-6 pb-28 font-['Poppins',sans-serif]">
      
      {/* AMBIENT BACKGROUND GLOW */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[350px] bg-gradient-to-b from-[#0D6EFD]/10 via-[#28B9FF]/5 to-transparent blur-[140px] rounded-full pointer-events-none" />

      {/* TOP NAVIGATION / BREADCRUMBS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 relative z-10">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2 flex-wrap">
            <button 
              onClick={onBack}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:text-white hover:border-slate-700 transition-all font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#28B9FF]" />
              <span>Back to Catalog</span>
            </button>
            <span className="text-slate-600">/</span>
            <button onClick={() => onNavigateCategory('all')} className="hover:text-white transition-colors">
              Resources
            </button>
            <span className="text-slate-600">/</span>
            <button onClick={() => onNavigateCategory(categoryObj?.slug || 'all')} className="hover:text-white text-slate-300 transition-colors">
              {categoryName}
            </button>
            <span className="text-slate-600">/</span>
            <span className="text-slate-400 truncate max-w-[180px] sm:max-w-xs">{product.title}</span>
          </div>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all font-medium"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-[#22C55E]" /> : <Share2 className="w-3.5 h-3.5 text-[#28B9FF]" />}
            <span>{copiedLink ? 'Link Copied!' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* MAIN EXCLUSIVE PRODUCT HERO */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          
          {/* LEFT: EXCLUSIVE IMAGE SHOWCASE */}
          <div className="lg:col-span-6 space-y-4">
            <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800/80 shadow-2xl group">
              <img
                src={getOptimizedImageUrl(product.thumbnail || product.image, 650, 80)}
                alt={product.title}
                loading="eager"
                decoding="async"
                className="w-full h-80 sm:h-[420px] object-cover group-hover:scale-105 transition-transform duration-700"
              />
              
              {/* Floating Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.badge && (
                  <span className="px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg">
                    {product.badge}
                  </span>
                )}
                <span className="px-3 py-1 rounded-xl bg-slate-950/85 backdrop-blur-md border border-white/10 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md">
                  <Zap className="w-3.5 h-3.5 text-[#22C55E]" /> {product.deliveryMethod || 'Instant Download'}
                </span>
              </div>

              {/* Discount Tag */}
              <div className="absolute top-4 right-4 px-3 py-1 rounded-xl bg-[#22C55E] text-slate-950 font-black text-xs shadow-lg tracking-wide">
                55% OFF EXCLUSIVE
              </div>

              {/* Bottom Quick Specs Bar */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/95 via-slate-950/70 to-transparent p-5 flex items-center justify-between text-xs font-medium">
                <span className="text-slate-300 flex items-center gap-2">
                  <FolderArchive className="w-4 h-4 text-[#28B9FF]" />
                  <span>Format: <strong className="text-white">{product.fileFormat || 'ZIP Archive / Google Drive'}</strong></span>
                </span>
                <span className="text-slate-300 flex items-center gap-2">
                  <Download className="w-4 h-4 text-[#22C55E]" />
                  <span>Size: <strong className="text-white">{product.fileSize || 'Instant Access'}</strong></span>
                </span>
              </div>
            </div>

            {/* Trust Assurance Banner */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3.5">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-[#22C55E] border border-emerald-500/20 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-xs sm:text-sm">Verified Secure & Clean Archive</h4>
                <p className="text-slate-400 text-[11px] leading-relaxed">Scanned with enterprise antivirus • 100% lifetime commercial access guaranteed.</p>
              </div>
            </div>
          </div>

          {/* RIGHT: DETAILS, PRICING & EXCLUSIVE CONVERSION STACK */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Category & Rating Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="px-3.5 py-1.5 rounded-xl bg-[#0D6EFD]/15 text-[#28B9FF] border border-[#0D6EFD]/30 text-xs font-bold tracking-wide">
                {categoryName} • {subcategoryName}
              </span>

              <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-semibold">
                <div className="flex items-center text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span className="ml-1 font-bold text-white">{product.rating || '5.0'}</span>
                </div>
                <span className="text-slate-600">•</span>
                <span className="text-emerald-400 flex items-center gap-1 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified Resource
                </span>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight tracking-tight">
              {product.title}
            </h1>

            {/* Short Description */}
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
              {product.shortDescription || product.fullDescription}
            </p>

            {/* Product Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {product.tags.map((tag, idx) => (
                  <span 
                    key={idx} 
                    className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-[#28B9FF] text-xs font-semibold hover:border-[#0D6EFD]/50 transition-colors"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Price Box */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-baseline justify-between">
                <div>
                  {isHasbETawfeeqItem(product) ? (
                    <div>
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#22C55E] bg-[#22C55E]/10 px-2.5 py-1 rounded-lg border border-[#22C55E]/20 inline-block mb-2">
                        {HASB_E_TAWFEEQ_LABEL}
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                          Rs. 0+
                        </span>
                        <span className="text-xs text-slate-400">(Free or Custom Support Fee)</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                        {MAINTENANCE_FEE_NOTE}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <span className="text-xs text-slate-400 block font-medium mb-1">Exclusive Package Price</span>
                      <div className="flex items-baseline gap-3">
                        <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                          {priceFormatted}
                        </span>
                        {(() => {
                          const origPKR = product.originalPricePKR;
                          const origUSD = product.originalPriceUSD;
                          const curNum = getProductPriceNumber(product, currency);
                          const hasOrig = currency === 'PKR' 
                            ? (typeof origPKR === 'number' && origPKR > curNum)
                            : (typeof origUSD === 'number' && origUSD > curNum);
                          const origStr = currency === 'PKR' ? `Rs. ${origPKR?.toLocaleString()}` : `$${origUSD?.toFixed(2)}`;
                          const origNum = currency === 'PKR' ? (origPKR || 0) : (origUSD || 0);
                          const disc = (hasOrig && origNum > curNum) ? Math.round(((origNum - curNum) / origNum) * 100) : 55;
                          const displayOrig = hasOrig ? origStr : (currency === 'PKR' ? `Rs. ${Math.round(curNum * 2.2).toLocaleString()}` : `$${(curNum * 2.2).toFixed(2)}`);

                          return (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-slate-500 line-through font-medium">{displayOrig}</span>
                              <span className="px-2 py-0.5 rounded-lg bg-rose-500/15 text-rose-400 font-black text-xs border border-rose-500/30">{disc}% OFF</span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>

                <div className="shrink-0">
                  <span className="px-3 py-1 rounded-xl bg-emerald-500/10 text-[#22C55E] border border-emerald-500/20 text-xs font-bold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Instant Delivery
                  </span>
                </div>
              </div>

              {/* Highlights Pill Grid */}
              <div className="pt-3 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-slate-300">
                <span className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-1.5 font-medium">
                  <Check className="w-3.5 h-3.5 text-[#22C55E]" /> Full Source
                </span>
                <span className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-1.5 font-medium">
                  <Check className="w-3.5 h-3.5 text-[#22C55E]" /> Lifetime Updates
                </span>
                <span className="col-span-2 sm:col-span-1 p-2 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-1.5 font-medium">
                  <Check className="w-3.5 h-3.5 text-[#22C55E]" /> Commercial Use
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => onBuyNow(product)}
                  className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-[#22C55E] to-[#16a34a] hover:from-[#1ebd55] hover:to-[#15803d] text-slate-950 font-black text-base flex items-center justify-center gap-2.5 shadow-xl shadow-[#22C55E]/20 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
                >
                  <Zap className="w-5 h-5 fill-slate-950" />
                  <span>
                    {isHasbETawfeeqItem(product)
                      ? 'Get Instant Access'
                      : `Buy Now (${priceFormatted})`}
                  </span>
                </button>

                <button
                  onClick={() => {
                    if (onAddToCart) {
                      onAddToCart(product);
                      setAddedToCartToast(true);
                      setTimeout(() => setAddedToCartToast(false), 2500);
                    }
                  }}
                  className="w-full py-4 px-5 rounded-2xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-white font-bold text-base flex items-center justify-center gap-2.5 hover:border-[#0D6EFD]/60 transition-all cursor-pointer"
                >
                  {addedToCartToast ? (
                    <>
                      <Check className="w-5 h-5 text-[#22C55E]" />
                      <span className="text-[#22C55E]">Added to Cart!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-5 h-5 text-[#28B9FF]" />
                      <span>Add to Cart</span>
                    </>
                  )}
                </button>
              </div>

              <button
                onClick={openWhatsAppInquiry}
                className="w-full py-3.5 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold text-sm flex items-center justify-center gap-2.5 transition-all hover:border-[#22C55E]/50"
              >
                <MessageCircle className="w-4 h-4 text-[#22C55E]" />
                <span>Chat on WhatsApp for Quick Support (+92 340 6070632)</span>
              </button>
            </div>

            {/* Social Share Bar */}
            <SocialShareBar
              title={product.title}
              priceFormatted={priceFormatted}
              productId={product.id}
              type="product"
            />

            {/* Bottom Trust Indicators */}
            <div className="grid grid-cols-3 gap-3 pt-2 text-center">
              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                <Zap className="w-4 h-4 text-[#28B9FF] mx-auto mb-1.5" />
                <span className="text-xs font-bold text-slate-200 block">Under 3 Hours</span>
                <span className="text-[10px] text-slate-400">Instant Delivery</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                <Lock className="w-4 h-4 text-[#22C55E] mx-auto mb-1.5" />
                <span className="text-xs font-bold text-slate-200 block">Encrypted</span>
                <span className="text-[10px] text-slate-400">Secure Checkout</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                <RefreshCw className="w-4 h-4 text-amber-400 mx-auto mb-1.5" />
                <span className="text-xs font-bold text-slate-200 block">Lifetime</span>
                <span className="text-[10px] text-slate-400">Free Updates</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* EXCLUSIVE SPECIFICATIONS & CONTENT SECTION */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">

            {/* SAMPLE PREVIEW GALLERY SECTION (Conditional on previewImages) */}
            {product.previewImages && product.previewImages.length > 0 && (
              <div id="product-preview-gallery-section" className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-5 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#28B9FF]/15 border border-[#28B9FF]/30 flex items-center justify-center text-[#28B9FF]">
                      <Eye className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                        <span>Sample Preview &amp; Screenshots</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {product.previewNote || 'Actual sample pages & screenshots from inside this verified digital resource'}
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-xs font-semibold text-[#22C55E]">
                    {product.previewImages.length} Screenshots Available
                  </span>
                </div>

                {/* Main Active Preview Canvas */}
                <div className="space-y-3">
                  <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800/90 h-64 sm:h-96 flex items-center justify-center group shadow-inner">
                    <img
                      src={getOptimizedImageUrl(product.previewImages[selectedPreviewIdx] || product.previewImages[0], 900, 85)}
                      alt={`${product.title} preview screenshot ${selectedPreviewIdx + 1}`}
                      className="w-full h-full object-contain p-2"
                    />
                    <button
                      onClick={() => setLightboxOpen(true)}
                      className="absolute bottom-3 right-3 px-3.5 py-1.5 rounded-xl bg-slate-950/85 hover:bg-slate-900 text-white border border-white/20 text-xs font-semibold flex items-center gap-1.5 backdrop-blur-md transition-all cursor-pointer shadow-lg hover:scale-105"
                    >
                      <Maximize2 className="w-3.5 h-3.5 text-[#28B9FF]" />
                      <span>Full Screen Preview</span>
                    </button>
                  </div>

                  {/* Thumbnail Row */}
                  {product.previewImages.length > 1 && (
                    <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1 scrollbar-thin">
                      {product.previewImages.map((imgUrl, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedPreviewIdx(idx)}
                          className={`relative rounded-xl overflow-hidden shrink-0 w-20 h-16 sm:w-28 sm:h-20 border-2 transition-all cursor-pointer ${
                            selectedPreviewIdx === idx
                              ? 'border-[#28B9FF] ring-2 ring-[#28B9FF]/30 scale-105'
                              : 'border-slate-800 hover:border-slate-600 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={getOptimizedImageUrl(imgUrl, 200, 70)}
                            alt={`Preview ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
              <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#28B9FF]" />
                <span>Exclusive Resource Scope & Description</span>
              </h3>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                {product.fullDescription || product.shortDescription}
              </p>
              <p className="text-sm text-slate-300 leading-relaxed">
                Crafted meticulously with enterprise standards. Includes complete production source files, documentation, setup walkthroughs, and lifetime commercial rights.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
              <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#22C55E]" />
                <span>What You Receive Inside</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {((product.features && product.features.length > 0) ? product.features : [
                  'Complete High-Resolution Master Assets & Source Files',
                  'Lifetime Google Drive Archive Access',
                  'Step-by-Step Setup Video & Documentation Guides',
                  '100% Commercial & Personal Use License Rights',
                  'Free Lifetime Automatic Product Updates',
                  'Dedicated WhatsApp Support Assistance'
                ]).map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-4 rounded-2xl bg-slate-950/85 border border-slate-800">
                    <Check className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-slate-200 leading-normal">{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Quick Metadata */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Quick Metadata
              </h4>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2.5 border-b border-slate-800">
                  <span className="text-slate-400">File Format</span>
                  <span className="font-bold text-white">{product.fileFormat || 'ZIP / Google Drive'}</span>
                </div>
                <div className="flex justify-between py-2.5 border-b border-slate-800">
                  <span className="text-slate-400">File Size</span>
                  <span className="font-bold text-amber-300">{product.fileSize || 'Instant Access'}</span>
                </div>
                <div className="flex justify-between py-2.5 border-b border-slate-800">
                  <span className="text-slate-400">Delivery Method</span>
                  <span className="font-bold text-[#28B9FF]">{product.deliveryMethod || 'Instant Download'}</span>
                </div>
                <div className="flex justify-between py-2.5 border-b border-slate-800">
                  <span className="text-slate-400">Category</span>
                  <span className="font-bold text-white">{categoryName}</span>
                </div>
                <div className="flex justify-between py-2.5 border-b border-slate-800">
                  <span className="text-slate-400">License</span>
                  <span className="font-bold text-[#22C55E]">Commercial / Personal</span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-slate-400">Support</span>
                  <span className="font-bold text-white">Rapid WhatsApp</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RELATED RESOURCES */}
      {relatedProducts.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 pt-12 border-t border-slate-800/80 relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#28B9FF]">
                Similar Toolkits
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                More in {categoryName}
              </h3>
            </div>
            <button
              onClick={() => onNavigateCategory(categoryObj?.slug || 'all')}
              className="text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1"
            >
              <span>Explore All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedProducts.map(rel => {
              const relPrice = formatProductPrice(rel, currency);

              return (
                <div
                  key={rel.id}
                  onClick={() => onSelectRelatedProduct(rel)}
                  className="rounded-3xl bg-slate-900/90 border border-slate-800 overflow-hidden hover:border-[#0D6EFD]/60 hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
                >
                  <div className="relative h-48 bg-slate-950 overflow-hidden">
                    <img
                      src={getOptimizedImageUrl(rel.thumbnail, 420, 75)}
                      alt={rel.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {rel.badge && (
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-xl bg-amber-500 text-slate-950 font-black text-[10px] uppercase shadow-md">
                        {rel.badge}
                      </span>
                    )}
                  </div>

                  <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-extrabold text-white group-hover:text-[#28B9FF] transition-colors line-clamp-2">
                        {rel.title}
                      </h4>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1.5 font-normal">
                        {rel.shortDescription}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-base font-black text-white">{relPrice}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onBuyNow(rel);
                        }}
                        className="px-4 py-2 rounded-xl bg-[#0D6EFD] hover:bg-[#0b5ed7] text-white text-xs font-bold transition-colors shadow-lg shadow-[#0D6EFD]/20"
                      >
                        Buy Now
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FREQUENTLY ASKED QUESTIONS: DELIVERY & LICENSE */}
      <FAQSection
        title="Questions About Digital Delivery & Licensing?"
        subtitle="Delivery & License FAQs"
        description="Instant cloud delivery, lifetime updates, and verified licenses."
        className="pt-6 border-t border-slate-800/80"
      />

      {/* STICKY BOTTOM PURCHASE DOCK */}
      {showStickyBar && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-[#070B14]/95 backdrop-blur-xl border-t border-slate-800 py-3.5 px-4 sm:px-8 animate-in slide-in-from-bottom duration-300 shadow-2xl">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            
            <div className="flex items-center gap-3.5 min-w-0">
              <img
                src={getOptimizedImageUrl(product.thumbnail, 100, 75)}
                alt={product.title}
                loading="lazy"
                decoding="async"
                className="w-11 h-11 rounded-xl object-cover border border-slate-800 hidden sm:block shrink-0 shadow-md"
              />
              <div className="truncate">
                <span className="text-xs sm:text-sm font-bold text-white truncate block">
                  {product.title}
                </span>
                <span className="text-[11px] text-[#28B9FF] flex items-center gap-1 font-medium">
                  <Zap className="w-3 h-3 text-[#22C55E]" /> Instant Cloud Delivery After Payment
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <div className="text-right hidden sm:block">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">
                  {isHasbETawfeeqItem(product) ? 'حسبِ توفیق' : 'Exclusive Price'}
                </span>
                <span className="text-base font-black text-white">
                  {isHasbETawfeeqItem(product) ? 'Rs. 0+ (Pay Any)' : priceFormatted}
                </span>
              </div>

              <button
                onClick={() => onBuyNow(product)}
                className="px-6 sm:px-8 py-3 rounded-2xl bg-[#22C55E] hover:bg-[#1eb452] text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-xl shadow-[#22C55E]/25 transition-all cursor-pointer hover:scale-[1.02]"
              >
                <ShoppingBag className="w-4 h-4 fill-slate-950" />
                <span>
                  {isHasbETawfeeqItem(product)
                    ? 'Get Access (Hasb-e-Tawfeeq)'
                    : `Buy Now (${priceFormatted})`}
                </span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL FOR PREVIEW IMAGES */}
      {lightboxOpen && product.previewImages && product.previewImages.length > 0 && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200">
          <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center justify-center">
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute -top-12 right-0 p-2 rounded-xl bg-slate-900 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
              title="Close Full Screen"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={product.previewImages[selectedPreviewIdx] || product.previewImages[0]}
              alt={`${product.title} full preview`}
              className="max-w-full max-h-[80vh] object-contain rounded-2xl border border-slate-800 shadow-2xl"
            />
            {product.previewNote && (
              <p className="text-center text-xs text-slate-300 mt-4 bg-slate-900/90 px-4 py-2 rounded-xl border border-slate-800 font-medium">
                {product.previewNote}
              </p>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

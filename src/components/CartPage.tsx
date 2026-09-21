import React, { useState, useEffect } from 'react';
import { getOptimizedImageUrl } from '../lib/imageUtils';
import { CartItem, Currency, CouponDiscount, Product } from '../types';
import { 
  ShoppingBag, 
  Trash2, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  Zap, 
  Tag, 
  Check, 
  Sparkles, 
  Lock, 
  RotateCcw, 
  ChevronRight,
  FileCheck,
  Package,
  Layers,
  Sparkle
} from 'lucide-react';
import { validateCouponCode, getCouponsFromDb } from '../services/firestoreService';
import { usePricing } from '../context/PricingContext';

interface CartPageProps {
  cartItems: CartItem[];
  currency: Currency;
  appliedCoupon: CouponDiscount | null;
  featuredProducts: Product[];
  onRemoveItem: (productId: string) => void;
  onUndoRemove?: () => void;
  removedItemTitle?: string | null;
  onApplyCoupon: (coupon: CouponDiscount | null) => void;
  onProceedToCheckout: () => void;
  onContinueShopping: () => void;
  onAddToCart: (item: CartItem) => void;
  onViewProduct?: (product: Product) => void;
}

export const CartPage: React.FC<CartPageProps> = ({
  cartItems,
  currency,
  appliedCoupon,
  featuredProducts,
  onRemoveItem,
  onUndoRemove,
  removedItemTitle,
  onApplyCoupon,
  onProceedToCheckout,
  onContinueShopping,
  onAddToCart,
  onViewProduct
}) => {
  const [couponInput, setCouponInput] = useState(appliedCoupon?.code || '');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);
  const [showCouponInput, setShowCouponInput] = useState(!!appliedCoupon);
  const [dbCoupons, setDbCoupons] = useState<CouponDiscount[]>([]);

  const { getProductPriceNumber, formatPrice, formatProductPrice } = usePricing();

  useEffect(() => {
    getCouponsFromDb().then(list => setDbCoupons(list || [])).catch(() => {});
  }, []);

  // Subtotal calculations using individual product prices
  const subtotalPKR = cartItems.reduce((acc, item) => acc + getProductPriceNumber(item, 'PKR'), 0);
  const subtotalUSD = Number(cartItems.reduce((acc, item) => acc + getProductPriceNumber(item, 'USD'), 0).toFixed(2));

  // Discount calculation
  let discountAmountPKR = 0;
  let discountAmountUSD = 0;

  if (appliedCoupon) {
    const val = validateCouponCode(appliedCoupon.code, subtotalPKR, subtotalUSD, cartItems, dbCoupons);
    if (val.valid) {
      discountAmountPKR = val.discountAmountPKR;
      discountAmountUSD = val.discountAmountUSD;
    }
  }

  const finalTotalPKR = Math.max(0, subtotalPKR - discountAmountPKR);
  const finalTotalUSD = Math.max(0, Number((subtotalUSD - discountAmountUSD).toFixed(2)));

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    setCouponSuccess(null);

    if (!couponInput.trim()) {
      onApplyCoupon(null);
      return;
    }

    const result = validateCouponCode(couponInput, subtotalPKR, subtotalUSD, cartItems, dbCoupons);
    if (result.valid && result.discount) {
      onApplyCoupon(result.discount);
      const eligibleNote = result.eligibleItemTitles?.length 
        ? ` (Applied to: ${result.eligibleItemTitles.join(', ')})`
        : '';
      setCouponSuccess(`Coupon applied! ${result.discount.description}${eligibleNote}`);
    } else {
      setCouponError(result.error || 'Invalid or ineligible coupon code for current cart items.');
    }
  };

  const handleRemoveCoupon = () => {
    onApplyCoupon(null);
    setCouponInput('');
    setCouponSuccess(null);
    setCouponError(null);
  };

  // Auto-apply referral discount if arrived via ?ref= link
  useEffect(() => {
    if (!appliedCoupon && cartItems.length > 0) {
      const activeRef = localStorage.getItem('zdf_active_referral');
      if (activeRef) {
        const result = validateCouponCode(activeRef, subtotalPKR, subtotalUSD, cartItems, dbCoupons);
        if (result.valid && result.discount) {
          onApplyCoupon(result.discount);
          setCouponSuccess(`Referral privilege applied! ${result.discount.description}`);
        }
      }
    }
  }, [appliedCoupon, cartItems.length, subtotalPKR, subtotalUSD, dbCoupons]);

  const getItemTypeBadge = (type: string) => {
    switch (type) {
      case 'bundle':
        return { label: 'Bundle', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
      case 'collection':
        return { label: 'Collection Pass', bg: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
      case 'toolBundle':
        return { label: 'Tool Bundle', bg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' };
      case 'megaPass':
        return { label: 'Mega Pass (VIP)', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
      case 'tool':
        return { label: 'Pro Tool Key', bg: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
      case 'service':
        return { label: 'Custom Service', bg: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };
      default:
        return { label: 'Resource', bg: 'bg-[#0D6EFD]/20 text-[#28B9FF] border-[#0D6EFD]/30' };
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F1D] text-slate-100 pb-24 md:pb-16 pt-6 sm:pt-10">
      
      {/* Undo Toast Bar */}
      {removedItemTitle && (
        <div className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-slate-700 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4">
          <span className="text-sm font-medium text-slate-200">
            Removed <strong className="text-white">"{removedItemTitle}"</strong>
          </span>
          {onUndoRemove && (
            <button
              onClick={onUndoRemove}
              className="px-3 py-1 bg-[#0D6EFD] hover:bg-[#0b5ed7] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Undo</span>
            </button>
          )}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-[#0D6EFD]/10 border border-[#0D6EFD]/30 text-[#28B9FF]">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Your Shopping Cart
              </h1>
              <span className="px-3 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-xs font-bold text-[#28B9FF]">
                {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1 pl-1">
              Review your selected digital assets &amp; pro licenses before one-click checkout.
            </p>
          </div>

          <button
            onClick={onContinueShopping}
            className="self-start sm:self-auto flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#28B9FF] group-hover:-translate-x-1 transition-transform" />
            <span>Continue Browsing</span>
          </button>
        </div>

        {/* CART CONTENT */}
        {cartItems.length === 0 ? (
          
          /* ═════════════════════════════════════════════════════════════
             EMPTY CART STATE (Never a dead end - friendly + recommendations)
             ═════════════════════════════════════════════════════════════ */
          <div className="py-12 sm:py-16 space-y-12">
            <div className="max-w-md mx-auto text-center space-y-5 bg-slate-900/60 border border-slate-800/80 rounded-3xl p-8 sm:p-10 shadow-xl">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400 shadow-inner">
                <ShoppingBag className="w-10 h-10 text-slate-400" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-extrabold text-white">Your cart is empty</h2>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Looks like you haven't added any digital resources or pro accounts yet. Explore our curated collections below!
                </p>
              </div>

              <button
                onClick={onContinueShopping}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#0D6EFD] to-[#28B9FF] hover:from-[#0b5ed7] hover:to-[#1fa8ea] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#0D6EFD]/25 transition-all cursor-pointer"
              >
                <span>Browse All Resources</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Popular/Featured Products as Re-entry points */}
            {featuredProducts && featuredProducts.length > 0 && (
              <div className="space-y-6 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <h3 className="text-lg font-bold text-white">Trending Picks For You</h3>
                  </div>
                  <span className="text-xs text-slate-400">Instant digital delivery</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {featuredProducts.slice(0, 3).map((prod) => (
                    <div 
                      key={prod.id} 
                      className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex flex-col justify-between gap-4 transition-all hover:shadow-xl group"
                    >
                      <div className="flex gap-3.5 items-start">
                        <img 
                          src={getOptimizedImageUrl(prod.thumbnail, 160, 75)} 
                          alt={prod.title} 
                          loading="lazy"
                          decoding="async"
                          className="w-20 h-20 rounded-xl object-cover border border-slate-800 shrink-0 group-hover:scale-105 transition-transform" 
                        />
                        <div className="space-y-1 overflow-hidden">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#0D6EFD]/20 text-[#28B9FF] border border-[#0D6EFD]/30 inline-block truncate">
                            {prod.categoryId || 'Resource'}
                          </span>
                          <h4 
                            onClick={() => onViewProduct && onViewProduct(prod)}
                            className="text-sm font-bold text-white line-clamp-2 hover:text-[#28B9FF] transition-colors cursor-pointer"
                          >
                            {prod.title}
                          </h4>
                          <div className="text-xs font-extrabold text-[#22C55E]">
                            {formatProductPrice(prod, currency)}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => onAddToCart({
                          id: `cart-${prod.id}-${Date.now()}`,
                          productId: prod.id,
                          title: prod.title,
                          thumbnail: prod.thumbnail,
                          pricePKR: prod.pricePKR,
                          priceUSD: prod.priceUSD,
                          type: 'product',
                          quantity: 1,
                          fileFormat: prod.fileFormat,
                          deliveryMethod: prod.deliveryMethod,
                          badge: prod.badge
                        })}
                        className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-[#22C55E] hover:text-slate-950 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Add to Cart</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (

          /* ═════════════════════════════════════════════════════════════
             ACTIVE CART (Scannable Items List + Sticky Order Summary)
             ═════════════════════════════════════════════════════════════ */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 pt-8">
            
            {/* Left Column: Scannable Single-Column Cart List */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-4">
              <div className="space-y-3">
                {cartItems.map((item) => {
                  const badge = getItemTypeBadge(item.type);
                  return (
                    <div
                      key={item.id || item.productId}
                      className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 hover:border-slate-700/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg group"
                    >
                      {/* Left: Thumbnail & Details */}
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0">
                          <img
                            src={getOptimizedImageUrl(item.thumbnail, 160, 75)}
                            alt={item.title}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>

                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${badge.bg}`}>
                              {badge.label}
                            </span>
                            {item.deliveryMethod && (
                              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                <Zap className="w-3 h-3 text-[#22C55E]" />
                                {item.deliveryMethod}
                              </span>
                            )}
                          </div>

                          <h3 className="text-sm sm:text-base font-bold text-white truncate group-hover:text-[#28B9FF] transition-colors">
                            {item.title}
                          </h3>

                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <span>Single User License</span>
                            <span>•</span>
                            <span className="text-slate-400">Instant Access</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Price & Inline Remove Button */}
                      <div className="flex items-center justify-between sm:justify-end gap-5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                        <div className="text-left sm:text-right">
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block sm:hidden">Price</span>
                          <span className="text-base sm:text-lg font-black text-white">
                            {formatProductPrice(item, currency)}
                          </span>
                        </div>

                        <button
                          onClick={() => onRemoveItem(item.productId)}
                          title="Remove item"
                          aria-label={`Remove ${item.title}`}
                          className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700/60 hover:border-rose-500/40 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Digital Access Reassurance Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0D6EFD]/10 via-slate-900 to-[#22C55E]/10 border border-slate-800 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#22C55E] shrink-0 mt-0.5" />
                <div className="text-xs space-y-0.5">
                  <span className="font-bold text-white block">
                    Zero Physical Shipping Required
                  </span>
                  <p className="text-slate-400 leading-relaxed">
                    All downloads, Google Drive access links, and software license keys are delivered instantly to your WhatsApp &amp; Email upon payment verification.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Sticky Order Summary */}
            <div className="lg:col-span-5 xl:col-span-4">
              <div className="sticky top-24 space-y-6">
                
                <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/95 border border-slate-800 shadow-2xl space-y-6">
                  <h2 className="text-lg font-extrabold text-white flex items-center justify-between">
                    <span>Order Summary</span>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300">
                      {cartItems.length} items
                    </span>
                  </h2>

                  {/* Cost Breakdown */}
                  <div className="space-y-3 text-sm border-b border-slate-800 pb-5">
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Subtotal</span>
                      <span className="font-bold text-white">
                        {formatPrice(currency, subtotalPKR, subtotalUSD)}
                      </span>
                    </div>

                    {appliedCoupon && discountAmountPKR > 0 && (
                      <div className="flex items-center justify-between text-[#22C55E]">
                        <div className="flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5" />
                          <span>Discount ({appliedCoupon.code})</span>
                        </div>
                        <span className="font-bold">
                          -{formatPrice(currency, discountAmountPKR, discountAmountUSD)}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-slate-400 text-xs">
                      <span>Delivery Fee</span>
                      <span className="text-[#22C55E] font-semibold">Free (Instant Digital)</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-400 text-xs">
                      <span>Taxes &amp; Processing</span>
                      <span className="text-slate-300 font-semibold">Rs. 0 (Included)</span>
                    </div>
                  </div>

                  {/* Collapsible Coupon Field */}
                  <div className="space-y-2">
                    {!showCouponInput && !appliedCoupon ? (
                      <button
                        type="button"
                        onClick={() => setShowCouponInput(true)}
                        className="text-xs font-semibold text-[#28B9FF] hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Tag className="w-3.5 h-3.5" />
                        <span>Have a discount coupon code?</span>
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400 font-medium">Coupon Code</span>
                          {appliedCoupon && (
                            <button
                              type="button"
                              onClick={handleRemoveCoupon}
                              className="text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        <form onSubmit={handleApplyCoupon} className="flex gap-2">
                          <div className="relative flex-1">
                            <input
                              type="text"
                              value={couponInput}
                              onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                              placeholder="e.g. DIGIFORGE10"
                              disabled={!!appliedCoupon}
                              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-[#28B9FF] uppercase tracking-wider disabled:opacity-60"
                            />
                            {appliedCoupon && (
                              <Check className="w-4 h-4 text-[#22C55E] absolute right-3 top-1/2 -translate-y-1/2" />
                            )}
                          </div>

                          {!appliedCoupon && (
                            <button
                              type="submit"
                              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
                            >
                              Apply
                            </button>
                          )}
                        </form>

                        {couponError && (
                          <p className="text-[11px] text-rose-400">{couponError}</p>
                        )}
                        {couponSuccess && (
                          <p className="text-[11px] text-[#22C55E]">{couponSuccess}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Total */}
                  <div className="pt-2 border-t border-slate-800 flex items-baseline justify-between">
                    <div>
                      <span className="text-xs text-slate-400 block font-medium">Total Amount</span>
                      <span className="text-[10px] text-slate-500">No hidden or recurring charges</span>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl sm:text-3xl font-black text-white">
                        {formatPrice(currency, finalTotalPKR, finalTotalUSD)}
                      </span>
                    </div>
                  </div>

                  {/* Primary Checkout CTA (Desktop) */}
                  <button
                    id="cart-proceed-checkout-btn"
                    onClick={onProceedToCheckout}
                    className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#22C55E] to-[#16a34a] hover:from-[#1ebd55] hover:to-[#15803d] text-slate-950 font-extrabold text-base flex items-center justify-center gap-2 shadow-xl shadow-[#22C55E]/20 hover:shadow-[#22C55E]/30 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>

                  {/* Trust Signals Under CTA */}
                  <div className="pt-2 border-t border-slate-800/80 space-y-2 text-[11px] text-slate-400">
                    <div className="flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-[#22C55E] shrink-0" />
                      <span>100% Encrypted &amp; Verified Manual Payment</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-[#28B9FF] shrink-0" />
                      <span>Immediate verification via WhatsApp (+92 340 6070632)</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}

      </div>

      {/* MOBILE STICKY BOTTOM BAR (Thumb-Zone Checkout Bar) */}
      {cartItems.length > 0 && (
        <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0A0F1D]/98 backdrop-blur-xl border-t border-slate-800 p-4 shadow-2xl flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-bold">
              Total ({cartItems.length} items)
            </span>
            <span className="text-xl font-black text-white">
              {formatPrice(currency, finalTotalPKR, finalTotalUSD)}
            </span>
          </div>

          <button
            onClick={onProceedToCheckout}
            className="flex-1 py-3.5 px-5 rounded-xl bg-[#22C55E] active:bg-[#1db351] text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#22C55E]/30"
          >
            <span>Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

    </div>
  );
};

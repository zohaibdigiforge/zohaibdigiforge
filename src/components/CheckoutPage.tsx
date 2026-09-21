import React, { useState, useEffect } from 'react';
import { CartItem, Currency, CouponDiscount, Order, UserProfile } from '../types';
import { 
  ShieldCheck, 
  Lock, 
  Check, 
  Copy, 
  ArrowLeft, 
  Zap, 
  Send, 
  User, 
  Mail, 
  Phone, 
  MessageSquare, 
  Sparkles, 
  FileText,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  UserPlus,
  LogIn,
  Tag,
  X
} from 'lucide-react';
import { createOrderInDb, triggerOrderEmail, validateCouponCode, getCouponsFromDb } from '../services/firestoreService';
import { usePricing } from '../context/PricingContext';
import { FAQSection } from './FAQSection';
import { AuthModal } from './AuthModal';
import { PhoneInputWithCountry } from './PhoneInputWithCountry';
import { COUNTRY_PHONE_CODES, CountryPhoneCode } from '../data/countryCodes';

interface CheckoutPageProps {
  cartItems: CartItem[];
  currency: Currency;
  appliedCoupon: CouponDiscount | null;
  currentUser: UserProfile | null;
  onBackToCart: () => void;
  onOrderCompleted?: (order: Order) => void;
  onOrderPlaced?: (order: Order) => void;
  onOpenRefundPolicy?: () => void;
  onOpenTerms?: () => void;
  onApplyCoupon?: (coupon: CouponDiscount) => void;
  onRemoveCoupon?: () => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  cartItems,
  currency,
  appliedCoupon,
  currentUser,
  onBackToCart,
  onOrderCompleted,
  onOrderPlaced,
  onOpenRefundPolicy,
  onOpenTerms,
  onApplyCoupon,
  onRemoveCoupon
}) => {
  // Form State
  const [customerName, setCustomerName] = useState(currentUser?.displayName || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [whatsapp, setWhatsapp] = useState(currentUser?.phone || '');
  const [selectedCountry, setSelectedCountry] = useState<CountryPhoneCode>(() => {
    return COUNTRY_PHONE_CODES[0]; // Default to Pakistan (+92)
  });
  const [orderNotes, setOrderNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'JazzCash' | 'EasyPaisa' | 'NayaPay' | 'Binance Crypto'>('JazzCash');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isEditingContact, setIsEditingContact] = useState(!currentUser);
  const [showNotesField, setShowNotesField] = useState(false);

  // Coupon & Referral state
  const [dbCoupons, setDbCoupons] = useState<CouponDiscount[]>([]);
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);
  const [showCouponInput, setShowCouponInput] = useState(false);

  useEffect(() => {
    getCouponsFromDb().then(setDbCoupons).catch(() => {});
  }, []);

  // Auth gate & account prompt modal states
  const [showAccountPrompt, setShowAccountPrompt] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'signup'>('signup');

  // Unified callback for parent
  const notifyOrderCompleted = (order: Order) => {
    if (onOrderCompleted) onOrderCompleted(order);
    if (onOrderPlaced) onOrderPlaced(order);
  };

  // Sync user profile if login happens
  useEffect(() => {
    if (currentUser) {
      if (!customerName) setCustomerName(currentUser.displayName || currentUser.email.split('@')[0]);
      if (!email) setEmail(currentUser.email);
      if (!whatsapp && currentUser.phone) setWhatsapp(currentUser.phone);
      if (!currentUser.phone && !whatsapp) setIsEditingContact(true);
    }
  }, [currentUser]);

  const { getProductPriceNumber } = usePricing();

  // Calculations using individual product prices
  const subtotalPKR = cartItems.reduce((acc, item) => acc + getProductPriceNumber(item, 'PKR'), 0);
  const subtotalUSD = Number(cartItems.reduce((acc, item) => acc + getProductPriceNumber(item, 'USD'), 0).toFixed(2));

  let discountAmountPKR = 0;
  let discountAmountUSD = 0;

  if (appliedCoupon) {
    const couponValidation = validateCouponCode(appliedCoupon.code, subtotalPKR, subtotalUSD, cartItems);
    if (couponValidation.valid) {
      discountAmountPKR = couponValidation.discountAmountPKR;
      discountAmountUSD = couponValidation.discountAmountUSD;
    } else if (appliedCoupon.percentage) {
      discountAmountPKR = Math.round((subtotalPKR * appliedCoupon.percentage) / 100);
      discountAmountUSD = Number(((subtotalUSD * appliedCoupon.percentage) / 100).toFixed(2));
    } else if (appliedCoupon.fixedPKR && appliedCoupon.fixedUSD) {
      discountAmountPKR = Math.min(appliedCoupon.fixedPKR, subtotalPKR);
      discountAmountUSD = Math.min(appliedCoupon.fixedUSD, subtotalUSD);
    }
  }

  const finalTotalPKR = Math.max(0, subtotalPKR - discountAmountPKR);
  const finalTotalUSD = Math.max(0, Number((subtotalUSD - discountAmountUSD).toFixed(2)));

  const formatPrice = (pkr: number, usd: number) => {
    return currency === 'PKR' ? `Rs. ${pkr.toLocaleString()}` : `$${usd.toFixed(2)}`;
  };

  // Auto-apply referral discount if arrived via ?ref= link
  useEffect(() => {
    if (!appliedCoupon && cartItems.length > 0 && onApplyCoupon) {
      const activeRef = localStorage.getItem('zdf_active_referral');
      if (activeRef) {
        const result = validateCouponCode(activeRef, subtotalPKR, subtotalUSD, cartItems, dbCoupons);
        if (result.valid && result.discount) {
          onApplyCoupon(result.discount);
          setCouponSuccess(`Referral discount applied! ${result.discount.description}`);
        }
      }
    }
  }, [appliedCoupon, cartItems.length, subtotalPKR, subtotalUSD, dbCoupons, onApplyCoupon]);

  const handleApplyCouponSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!couponInput.trim() || !onApplyCoupon) return;
    const clean = couponInput.trim().toUpperCase();
    const result = validateCouponCode(clean, subtotalPKR, subtotalUSD, cartItems, dbCoupons);
    if (result.valid && result.discount) {
      onApplyCoupon(result.discount);
      setCouponSuccess(`Applied: ${result.discount.description}`);
      setCouponError(null);
      setCouponInput('');
    } else {
      setCouponError(result.error || 'Invalid or expired coupon/referral code.');
      setCouponSuccess(null);
    }
  };

  const handleRemoveAppliedCoupon = () => {
    if (onRemoveCoupon) {
      onRemoveCoupon();
      try {
        localStorage.removeItem('zdf_active_referral');
      } catch (e) {}
    }
    setCouponSuccess(null);
    setCouponError(null);
  };

  // Payment Details configuration
  const getPaymentDetails = (method: typeof paymentMethod) => {
    switch (method) {
      case 'JazzCash':
        return {
          badge: 'JazzCash (PKR Mobile Wallet)',
          badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30',
          logoText: 'JC',
          accountNumber: '03406070632',
          accountTitle: 'Muhammad Zohaib Shahzad',
          bankName: 'JazzCash Mobile Account',
          instructions: 'Open JazzCash App or dial *786# ➔ Select "Send Money" ➔ "To Mobile Account" ➔ Enter 03406070632.',
          fastNote: 'Instant 0% fee verification'
        };
      case 'EasyPaisa':
        return {
          badge: 'EasyPaisa (PKR Mobile Wallet)',
          badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
          logoText: 'EP',
          accountNumber: '03406070632',
          accountTitle: 'Muhammad Zohaib Shahzad',
          bankName: 'EasyPaisa Wallet Account',
          instructions: 'Open EasyPaisa App or dial *786# ➔ Select "EasyPaisa Transfer" ➔ Enter 03406070632.',
          fastNote: 'Instant zero-fee transfer'
        };
      case 'NayaPay':
        return {
          badge: 'NayaPay (PKR Digital Wallet)',
          badgeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
          logoText: 'NP',
          accountNumber: '03406070632',
          accountTitle: 'Muhammad Zohaib Shahzad',
          bankName: 'NayaPay Fast Wallet',
          instructions: 'Open NayaPay App ➔ Send Money ➔ Enter NayaPay ID / Mobile: 03406070632.',
          fastNote: 'Instant digital wallet'
        };
      case 'Binance Crypto':
        return {
          badge: 'Binance Pay (Global Crypto)',
          badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
          logoText: 'USDT',
          accountNumber: '1217380568',
          accountTitle: 'Muhammad Zohaib Shahzad (Binance Pay ID)',
          bankName: 'Binance Pay / USDT (TRC-20)',
          instructions: 'Send via Binance Pay ID: 1217380568 or USDT TRC20 for international customers.',
          fastNote: 'Best for International Buyers ($USD / Crypto)'
        };
    }
  };

  const currentDetails = getPaymentDetails(paymentMethod);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handlePlaceOrderClick = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!customerName.trim()) {
      setFormError('Please enter your full name for order registration.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setFormError('Please provide a valid email address to receive your download link and receipt.');
      return;
    }
    if (!whatsapp.trim() || whatsapp.trim().length < 8) {
      setIsEditingContact(true);
      setFormError('براہ کرم اپنا درست واٹس ایپ / فون نمبر درج کریں (Please enter a valid WhatsApp/Phone number for delivery).');
      setTimeout(() => {
        const el = document.getElementById('checkout-whatsapp-number');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.focus();
        }
      }, 50);
      return;
    }

    // If user is not logged in, show Account creation / Sign in dialogue for proper order tracking & dashboard link delivery
    if (!currentUser) {
      setShowAccountPrompt(true);
      return;
    }

    // If logged in, proceed directly
    executeOrderPlacement();
  };

  const executeOrderPlacement = async () => {
    setFormError(null);
    setShowAccountPrompt(false);
    setIsSubmitting(true);

    try {
      // Map Cart items to order items with snapshotted individual prices
      const orderItems = cartItems.map(item => {
        const itemPricePKR = getProductPriceNumber(item, 'PKR');
        const itemPriceUSD = getProductPriceNumber(item, 'USD');
        return {
          productId: item.productId,
          title: item.title,
          price: itemPricePKR,
          pricePKR: itemPricePKR,
          priceUSD: itemPriceUSD,
          pricePerItemAtPurchase: currency === 'PKR' ? itemPricePKR : itemPriceUSD,
          type: (item.type || 'product') as any,
          thumbnail: item.thumbnail
        };
      });

      // Format phone with selected country dial code if not already formatted
      let formattedPhone = whatsapp.trim();
      if (!formattedPhone.startsWith('+')) {
        // Strip leading zero if present when prepending country dial code (e.g. 0340 -> 340)
        const cleanDigits = formattedPhone.replace(/^0+/, '');
        formattedPhone = `${selectedCountry.dialCode} ${cleanDigits}`;
      }

      // Create Order in Firestore & LocalStorage
      const createdOrder: Order = await createOrderInDb({
        customerName: customerName.trim(),
        email: email.trim().toLowerCase(),
        whatsapp: formattedPhone,
        items: orderItems,
        totalAmountPKR: finalTotalPKR,
        totalAmountUSD: finalTotalUSD,
        subtotalPKR,
        subtotalUSD,
        discountPKR: discountAmountPKR,
        discountUSD: discountAmountUSD,
        couponCode: appliedCoupon?.code,
        paymentMethod,
        status: 'Pending Verification',
        notes: orderNotes.trim() || undefined,
        downloadLinks: [
          'https://drive.google.com/drive/folders/zohaibdigiforge-instant-access',
          'https://zohaibdigiforge.com/dashboard/my-resources'
        ],
        ...(appliedCoupon?.isReferral && appliedCoupon?.referrerUid ? (() => {
          const nonProToolsItems = cartItems.filter(item => item.category !== 'pro-tools');
          const effectiveSubtotalPKR = nonProToolsItems.reduce((acc, item) => acc + (item.pricePKR || 0) * (item.quantity || 1), 0);
          const referralEligibleTotalPKR = Math.max(0, effectiveSubtotalPKR - discountAmountPKR);
          if (referralEligibleTotalPKR <= 0) return {};
          return {
            referrerUid: appliedCoupon.referrerUid,
            referrerRewardPKR: Math.max(100, Math.round(referralEligibleTotalPKR * 0.10))
          };
        })() : {})
      });

      // Confetti celebratory burst
      import('canvas-confetti').then((m) => {
        const confetti = m.default;
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 }
        });
      }).catch(() => {});

      // Trigger asynchronous background confirmation email (Customer + Admin notification)
      triggerOrderEmail(createdOrder);

      // Pre-fill WhatsApp verification link
      const itemsSummaryText = cartItems.map(i => `• ${i.title} (Rs. ${i.pricePKR.toLocaleString()})`).join('\n');
      const waText = encodeURIComponent(
`*ZOHAIB DIGIFORGE — NEW ORDER VERIFICATION*
---------------------------------------
*Order ID:* #${createdOrder.id}
*Customer Name:* ${customerName.trim()}
*Email:* ${email.trim()}
*WhatsApp:* ${whatsapp.trim()}

*Items Ordered:*
${itemsSummaryText}

*Total Amount:* Rs. ${finalTotalPKR.toLocaleString()} (${currency === 'USD' ? `$${finalTotalUSD}` : 'PKR'})
*Payment Method:* ${paymentMethod}
*Delivery Method:* ${cartItems[0]?.deliveryMethod || 'Instant Download'} (Expected Delivery: Within 3 hours)
${appliedCoupon ? `*Coupon Applied:* ${appliedCoupon.code} (-Rs. ${discountAmountPKR})\n` : ''}${orderNotes.trim() ? `*Customer Note:* ${orderNotes.trim()}\n` : ''}---------------------------------------
_I have placed my order on Zohaib DigiForge and will send my payment screenshot here._`
      );

      const waUrl = `https://wa.me/923406070632?text=${waText}`;

      // Open WhatsApp in new tab for instant verification
      window.open(waUrl, '_blank', 'noopener,noreferrer');

      // Hand off to parent for Order Confirmation Screen
      notifyOrderCompleted(createdOrder);

    } catch (err: any) {
      console.error('Checkout error:', err);
      setFormError('An error occurred while creating your order. Please try again or message us on WhatsApp.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F1D] text-slate-100 pb-28 md:pb-16 pt-6 sm:pt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header & Back to Cart */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-800/80 mb-8">
          <button
            onClick={onBackToCart}
            className="flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#28B9FF] group-hover:-translate-x-1 transition-transform" />
            <span>Back to Cart</span>
          </button>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-[#22C55E]" />
            <span className="font-semibold text-slate-300">256-Bit SSL Encrypted Checkout</span>
          </div>
        </div>

        {/* SINGLE-PAGE CHECKOUT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* LEFT COLUMN: SINGLE-PAGE CHECKOUT FORM */}
          <div className="lg:col-span-7 xl:col-span-7 space-y-8">
            <form onSubmit={handlePlaceOrderClick} className="space-y-8">
              
              {/* Form Error Banner */}
              {formError && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-3 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* ═════════════════════════════════════════════════════════════
                 STEP A: CONTACT INFORMATION (Guest Allowed + Logged In Sync)
                 ═════════════════════════════════════════════════════════════ */}
              <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#0D6EFD]/20 border border-[#0D6EFD]/40 text-[#28B9FF] flex items-center justify-center font-bold text-sm">
                      1
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-white">Contact &amp; Delivery Details</h2>
                      <p className="text-xs text-slate-400">Digital licenses &amp; invoices are sent directly here.</p>
                    </div>
                  </div>

                  {currentUser && !isEditingContact && (
                    <button
                      type="button"
                      onClick={() => setIsEditingContact(true)}
                      className="text-xs text-[#28B9FF] hover:underline font-semibold cursor-pointer"
                    >
                      Edit Details
                    </button>
                  )}
                </div>

                {currentUser && !isEditingContact ? (
                  /* Compact Logged-in state */
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{customerName}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30">
                          Logged In
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{email} • WhatsApp: {whatsapp || 'Not specified'}</p>
                    </div>
                  </div>
                ) : (
                  /* Full Contact Input Fields (Guest or Editing) */
                  <div className="space-y-4 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Full Name */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>Full Name <span className="text-[#28B9FF]">*</span></span>
                        </label>
                        <input
                          type="text"
                          required
                          value={customerName || ''}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="e.g. Zohaib Hassan"
                          className="w-full min-h-[44px] px-4 py-3 rounded-xl bg-slate-950 border border-slate-700/80 text-white text-base placeholder:text-slate-500 focus:outline-none focus:border-[#28B9FF] transition-colors"
                        />
                      </div>

                      {/* Email Address */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>Email Address <span className="text-[#28B9FF]">*</span></span>
                        </label>
                        <input
                          type="email"
                          required
                          value={email || ''}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="e.g. you@example.com"
                          className="w-full min-h-[44px] px-4 py-3 rounded-xl bg-slate-950 border border-slate-700/80 text-white text-base placeholder:text-slate-500 focus:outline-none focus:border-[#28B9FF] transition-colors"
                        />
                      </div>
                    </div>

                    {/* WhatsApp Number with Country Code Selector */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-[#22C55E]" />
                        <span>WhatsApp / Phone Number <span className="text-[#22C55E]">*</span></span>
                      </label>

                      <PhoneInputWithCountry
                        id="checkout-whatsapp-number"
                        value={whatsapp || ''}
                        onChange={(val) => setWhatsapp(val)}
                        selectedCountry={selectedCountry}
                        onCountryChange={(c) => setSelectedCountry(c)}
                        required
                      />
                    </div>

                    {/* Guest Checkout Reassurance Note */}
                    {!currentUser && (
                      <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>
                          <strong className="text-slate-200">No account required to purchase.</strong> You can optionally create a free account post-checkout to view order history.
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ═════════════════════════════════════════════════════════════
                 STEP B: PAYMENT METHOD SELECTION (Visual Brand Tiles)
                 ═════════════════════════════════════════════════════════════ */}
              <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 sm:p-7 shadow-xl space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#22C55E]/20 border border-[#22C55E]/40 text-[#22C55E] flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-white">Select Payment Method</h2>
                    <p className="text-xs text-slate-400">Choose your preferred local wallet, bank, or crypto option.</p>
                  </div>
                </div>

                {/* 4 Visual Brand Tiles */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  
                  {/* JazzCash */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('JazzCash')}
                    className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      paymentMethod === 'JazzCash'
                        ? 'bg-red-500/10 border-red-500 ring-2 ring-red-500/30'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="w-7 h-7 rounded-lg bg-red-600 font-black text-white text-[11px] flex items-center justify-center">
                        JC
                      </div>
                      {paymentMethod === 'JazzCash' && <Check className="w-4 h-4 text-red-400" />}
                    </div>
                    <div className="mt-3">
                      <span className="text-xs font-bold text-white block">JazzCash</span>
                      <span className="text-[10px] text-slate-400">(PKR Mobile Wallet)</span>
                    </div>
                  </button>

                  {/* EasyPaisa */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('EasyPaisa')}
                    className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      paymentMethod === 'EasyPaisa'
                        ? 'bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/30'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="w-7 h-7 rounded-lg bg-emerald-600 font-black text-white text-[11px] flex items-center justify-center">
                        EP
                      </div>
                      {paymentMethod === 'EasyPaisa' && <Check className="w-4 h-4 text-emerald-400" />}
                    </div>
                    <div className="mt-3">
                      <span className="text-xs font-bold text-white block">EasyPaisa</span>
                      <span className="text-[10px] text-slate-400">(PKR Mobile Wallet)</span>
                    </div>
                  </button>

                  {/* NayaPay */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('NayaPay')}
                    className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      paymentMethod === 'NayaPay'
                        ? 'bg-orange-500/10 border-orange-500 ring-2 ring-orange-500/30'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="w-7 h-7 rounded-lg bg-orange-600 font-black text-white text-[10px] flex items-center justify-center">
                        NP
                      </div>
                      {paymentMethod === 'NayaPay' && <Check className="w-4 h-4 text-orange-400" />}
                    </div>
                    <div className="mt-3">
                      <span className="text-xs font-bold text-white block">NayaPay</span>
                      <span className="text-[10px] text-slate-400">(PKR Digital Wallet)</span>
                    </div>
                  </button>

                  {/* Binance Pay */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Binance Crypto')}
                    className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      paymentMethod === 'Binance Crypto'
                        ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/30'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="w-7 h-7 rounded-lg bg-amber-500 font-black text-slate-950 text-[9px] flex items-center justify-center">
                        USDT
                      </div>
                      {paymentMethod === 'Binance Crypto' && <Check className="w-4 h-4 text-amber-400" />}
                    </div>
                    <div className="mt-3">
                      <span className="text-xs font-bold text-white block">Binance Pay</span>
                      <span className="text-[10px] text-slate-400">(Global Crypto)</span>
                    </div>
                  </button>

                </div>

                {/* Progressive Disclosure: Specific Instructions for Selected Method */}
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded border uppercase tracking-wider ${currentDetails.badgeColor}`}>
                      {currentDetails.badge} Instructions
                    </span>
                    <span className="text-[11px] text-[#22C55E] font-semibold flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      {currentDetails.fastNote}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Copyable Account Number */}
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <div className="space-y-0.5 overflow-hidden">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                          Account / Number
                        </span>
                        <span className="text-sm font-mono font-bold text-white truncate block">
                          {currentDetails.accountNumber}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(currentDetails.accountNumber, 'acc')}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-[#0D6EFD] text-slate-200 hover:text-white transition-colors cursor-pointer shrink-0 ml-2"
                        title="Copy Account Number"
                      >
                        {copiedField === 'acc' ? <Check className="w-4 h-4 text-[#22C55E]" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Account Title */}
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <div className="space-y-0.5 overflow-hidden">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                          Account Title
                        </span>
                        <span className="text-xs font-semibold text-slate-200 truncate block">
                          {currentDetails.accountTitle}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(currentDetails.accountTitle, 'title')}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-[#0D6EFD] text-slate-200 hover:text-white transition-colors cursor-pointer shrink-0 ml-2"
                        title="Copy Account Title"
                      >
                        {copiedField === 'title' ? <Check className="w-4 h-4 text-[#22C55E]" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed bg-slate-900/50 p-3 rounded-xl border border-slate-800/60">
                    💡 <strong className="text-slate-300">How it works:</strong> {currentDetails.instructions} After sending, you will simply share the screenshot on WhatsApp for instant 3-minute delivery.
                  </p>
                </div>

              </div>

              {/* ═════════════════════════════════════════════════════════════
                 STEP C: ORDER NOTE (Optional)
                 ═════════════════════════════════════════════════════════════ */}
              <div className="space-y-2">
                {!showNotesField ? (
                  <button
                    type="button"
                    onClick={() => setShowNotesField(true)}
                    className="text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-[#28B9FF]" />
                    <span>Anything we should know? (Add an optional order note)</span>
                  </button>
                ) : (
                  <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-5 space-y-2 animate-in fade-in">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-[#28B9FF]" />
                      <span>Order Note (optional)</span>
                    </label>
                    <textarea
                      rows={2}
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="e.g. Please send the link to my secondary Gmail or instructions for Mac..."
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-white text-base placeholder:text-slate-500 focus:outline-none focus:border-[#28B9FF]"
                    />
                  </div>
                )}
              </div>

              {/* ═════════════════════════════════════════════════════════════
                 FINAL CTA & TRUST SIGNALS
                 ═════════════════════════════════════════════════════════════ */}
              <div className="space-y-4 pt-2">
                <button
                  id="checkout-place-order-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#22C55E] to-[#16a34a] hover:from-[#1ebd55] hover:to-[#15803d] text-slate-950 font-extrabold text-base flex items-center justify-center gap-3 shadow-xl shadow-[#22C55E]/20 hover:shadow-[#22C55E]/30 hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="w-5 h-5 animate-spin text-slate-950" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span>Registering Order...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Place Order — {formatPrice(finalTotalPKR, finalTotalUSD)}</span>
                    </>
                  )}
                </button>

                {/* Trust Signals near CTA */}
                <div className="space-y-2 text-center text-xs text-slate-400">
                  <div className="flex items-center justify-center gap-4 flex-wrap">
                    <span className="flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-[#22C55E]" />
                      <span>Zero Risk Verified</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-[#28B9FF]" />
                      <span>WhatsApp Confirmation</span>
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500">
                    By placing your order, you agree to our{' '}
                    <button
                      type="button"
                      onClick={onOpenTerms}
                      className="text-[#28B9FF] hover:underline"
                    >
                      Terms
                    </button>{' '}
                    and{' '}
                    <button
                      type="button"
                      onClick={onOpenRefundPolicy}
                      className="text-[#28B9FF] hover:underline"
                    >
                      Refund Policy
                    </button>.
                  </p>
                </div>
              </div>

            </form>
          </div>

          {/* RIGHT COLUMN: PERSISTENT ORDER SUMMARY (Sticky Sidebar) */}
          <div className="lg:col-span-5 xl:col-span-5">
            <div className="sticky top-24 space-y-6">
              
              <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/95 border border-slate-800 shadow-2xl space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <h2 className="text-base font-extrabold text-white">Summary of Purchase</h2>
                  <span className="text-xs text-slate-400 font-medium">
                    {cartItems.length} digital {cartItems.length === 1 ? 'item' : 'items'}
                  </span>
                </div>

                {/* Itemized Cart List (Read-Only Preview) */}
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {cartItems.map((item) => (
                    <div
                      key={item.id || item.productId}
                      className="flex items-center gap-3.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80"
                    >
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-12 h-12 rounded-lg object-cover border border-slate-800 shrink-0"
                      />
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <h4 className="text-xs font-bold text-white truncate">
                          {item.title}
                        </h4>
                        <span className="text-[10px] text-[#28B9FF] block">
                          Instant Digital Download
                        </span>
                      </div>
                      <div className="text-xs font-extrabold text-white text-right shrink-0">
                        {formatPrice(getProductPriceNumber(item, 'PKR'), getProductPriceNumber(item, 'USD'))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Cost Breakdown */}
                <div className="space-y-2.5 text-xs border-t border-slate-800 pt-4">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Subtotal</span>
                    <span className="font-semibold text-white">
                      {formatPrice(subtotalPKR, subtotalUSD)}
                    </span>
                  </div>

                  {appliedCoupon && discountAmountPKR > 0 && (
                    <div className="flex items-center justify-between text-[#22C55E] font-medium">
                      <span>Discount ({appliedCoupon.code})</span>
                      <span>-{formatPrice(discountAmountPKR, discountAmountUSD)}</span>
                    </div>
                  )}

                  {/* Coupon & Referral Code Input */}
                  <div className="pt-1 pb-1">
                    {!showCouponInput && !appliedCoupon ? (
                      <button
                        type="button"
                        onClick={() => setShowCouponInput(true)}
                        className="text-xs font-semibold text-[#28B9FF] hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer py-1"
                      >
                        <Tag className="w-3.5 h-3.5" />
                        <span>Have a referral or promo code?</span>
                      </button>
                    ) : (
                      <div className="space-y-1.5 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 font-medium">Referral / Promo Code</span>
                          {appliedCoupon ? (
                            <button
                              type="button"
                              onClick={handleRemoveAppliedCoupon}
                              className="text-rose-400 hover:text-rose-300 font-bold cursor-pointer"
                            >
                              Remove
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setShowCouponInput(false)}
                              className="text-slate-500 hover:text-slate-400 cursor-pointer"
                            >
                              Cancel
                            </button>
                          )}
                        </div>

                        {!appliedCoupon ? (
                          <form onSubmit={handleApplyCouponSubmit} className="flex gap-1.5">
                            <input
                              type="text"
                              value={couponInput}
                              onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                              placeholder="e.g. ZDF-CODE or PROMO10"
                              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white uppercase placeholder-slate-500 focus:outline-none focus:border-[#28B9FF]"
                            />
                            <button
                              type="submit"
                              disabled={!couponInput.trim()}
                              className="px-3 py-1.5 bg-[#0D6EFD] hover:bg-[#0b5ed7] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                            >
                              Apply
                            </button>
                          </form>
                        ) : (
                          <div className="flex items-center gap-1.5 text-[11px] text-[#22C55E] font-medium">
                            <Tag className="w-3 h-3 shrink-0" />
                            <span>Code <strong>{appliedCoupon.code}</strong> applied ({appliedCoupon.description || 'Special Discount'})</span>
                          </div>
                        )}

                        {couponError && (
                          <p className="text-[11px] text-rose-400">{couponError}</p>
                        )}
                        {couponSuccess && !appliedCoupon && (
                          <p className="text-[11px] text-emerald-400">{couponSuccess}</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-slate-400">
                    <span>Digital Handling Fee</span>
                    <span className="text-[#22C55E] font-semibold">Free (Rs. 0)</span>
                  </div>

                  <div className="border-t border-slate-800 pt-3 flex items-baseline justify-between text-base">
                    <span className="font-bold text-white">Total Payable</span>
                    <span className="text-xl sm:text-2xl font-black text-[#22C55E]">
                      {formatPrice(finalTotalPKR, finalTotalUSD)}
                    </span>
                  </div>
                </div>

                {/* Instant Delivery Guarantee Box */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0D6EFD]/10 to-[#22C55E]/10 border border-[#0D6EFD]/20 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-[#22C55E] font-bold">
                    <Zap className="w-4 h-4" />
                    <span>Instant WhatsApp Delivery</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Immediately after placing this order, you will be redirected to WhatsApp to send your payment screenshot for 3-minute access.
                  </p>
                </div>

              </div>

            </div>
          </div>

        </div>

      </div>

      {/* FAQs Section: Payment Verification & Link Delivery */}
      <FAQSection
        title="Payment Verification & Link Delivery FAQs"
        subtitle="Checkout & Instant Verification FAQs"
        description="Learn how manual payment confirmation works and how fast your digital products are delivered."
        className="pt-6 border-t border-slate-800/80"
      />

      {/* MOBILE STICKY BOTTOM BAR (Checkout Thumb Zone) */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0A0F1D]/98 backdrop-blur-xl border-t border-slate-800 p-4 shadow-2xl flex items-center justify-between gap-4">
        <div>
          <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-bold">
            Total ({paymentMethod})
          </span>
          <span className="text-xl font-black text-white">
            {formatPrice(finalTotalPKR, finalTotalUSD)}
          </span>
        </div>

        <button
          onClick={handlePlaceOrderClick}
          disabled={isSubmitting}
          className="flex-1 py-3.5 px-5 rounded-xl bg-[#22C55E] active:bg-[#1db351] text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#22C55E]/30 disabled:opacity-50"
        >
          {isSubmitting ? <span>Processing...</span> : <span>Place Order</span>}
          <Send className="w-4 h-4" />
        </button>
      </div>

      {/* ═════════════════════════════════════════════════════════════
         ACCOUNT CREATION & TRACKING PROMPT MODAL (Checkout Gate)
         ═════════════════════════════════════════════════════════════ */}
      {showAccountPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div 
            className="relative w-full max-w-md bg-[#0F172A] border border-slate-700/80 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            {/* Close Button */}
            <button
              onClick={() => setShowAccountPrompt(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header Badge & Icon */}
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0D6EFD]/20 to-[#22C55E]/20 border border-[#0D6EFD]/40 text-[#28B9FF] flex items-center justify-center shadow-lg shadow-[#0D6EFD]/10">
                <Sparkles className="w-6 h-6 text-[#28B9FF]" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white tracking-tight">
                  Make Your Account for Proper Ordering &amp; Tracking
                </h3>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  Create your free account or sign in to get instant delivery of your download links directly on your private customer dashboard and live order tracking.
                </p>
              </div>
            </div>

            {/* Benefits List */}
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center gap-2.5 text-slate-200 font-medium">
                <Check className="w-4 h-4 text-[#22C55E] shrink-0" />
                <span>Instant delivery of product download links on your Dashboard</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-200 font-medium">
                <Check className="w-4 h-4 text-[#22C55E] shrink-0" />
                <span>Real-time WhatsApp &amp; Email order status tracking</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-200 font-medium">
                <Check className="w-4 h-4 text-[#22C55E] shrink-0" />
                <span>Lifetime access to product updates &amp; re-downloads</span>
              </div>
            </div>

            {/* Action Buttons: Sign Up / Sign In */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowAccountPrompt(false);
                  setAuthModalTab('signup');
                  setAuthModalOpen(true);
                }}
                className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-[#0D6EFD] to-[#0052cc] hover:from-[#0b5ed7] hover:to-[#0047b3] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#0D6EFD]/25 transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create Free Account (Sign Up)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowAccountPrompt(false);
                  setAuthModalTab('signin');
                  setAuthModalOpen(true);
                }}
                className="w-full py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white font-bold text-sm flex items-center justify-center gap-2 border border-slate-700 transition-colors cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-[#28B9FF]" />
                <span>Already have an account? Sign In</span>
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    executeOrderPlacement();
                  }}
                  className="text-[11px] text-slate-400 hover:text-slate-300 underline underline-offset-4 transition-colors cursor-pointer"
                >
                  Continue as Guest (Checkout without Account)
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Embedded AuthModal if customer triggers Sign Up or Sign In */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalTab}
        onSuccess={(user) => {
          setAuthModalOpen(false);
          if (user?.displayName) setCustomerName(user.displayName);
          if (user?.email) setEmail(user.email);
          if (user?.phone) setWhatsapp(user.phone);
        }}
      />

    </div>
  );
};

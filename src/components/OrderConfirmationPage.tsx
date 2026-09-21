import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Copy, 
  Check, 
  MessageCircle, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Sparkles, 
  Mail, 
  UserPlus, 
  Search, 
  ShoppingBag,
  ExternalLink,
  Lock,
  Eye,
  EyeOff,
  Share2,
  Heart,
  Star,
  AlertCircle,
  Clock,
  Layers,
  ArrowUpRight,
  HelpCircle,
  CheckCircle,
  Send,
  Download,
  Flame,
  KeyRound,
  FileText
} from 'lucide-react';
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { 
  Order, 
  Currency, 
  UserProfile, 
  BundleOffer, 
  Product 
} from '../types';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import { 
  saveCheckoutFeedbackToDb, 
  linkOrderToUserInDb, 
  syncUserProfileToDb, 
  triggerWelcomeEmail,
  getOrderByIdFromDb
} from '../services/firestoreService';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { INITIAL_BUNDLES } from '../data/mockData';

interface OrderConfirmationPageProps {
  order?: Order | null;
  orderId?: string;
  currency: Currency;
  currentUser: UserProfile | null;
  bundles?: BundleOffer[];
  products?: Product[];
  onTrackOrder: (orderId: string) => void;
  onOpenSignUp?: (prefilledEmail?: string) => void;
  onContinueShopping: () => void;
  onViewBundle?: (bundle: BundleOffer) => void;
  onViewProduct?: (product: Product) => void;
  onNavigateLegal?: (docId: 'refund' | 'privacy' | 'terms') => void;
  onNavigateContact?: () => void;
  onNavigateDashboard?: () => void;
  onUserCreated?: (user: UserProfile) => void;
}

export const OrderConfirmationPage: React.FC<OrderConfirmationPageProps> = ({
  order: propOrder,
  orderId: propOrderId,
  currency,
  currentUser,
  bundles = INITIAL_BUNDLES,
  products = [],
  onTrackOrder,
  onOpenSignUp,
  onContinueShopping,
  onViewBundle,
  onViewProduct,
  onNavigateLegal,
  onNavigateContact,
  onNavigateDashboard,
  onUserCreated
}) => {
  // Live loaded order state (if order was fetched by orderId)
  const [order, setOrder] = useState<Order | null>(propOrder || null);
  const [loadingOrder, setLoadingOrder] = useState<boolean>(!propOrder && !!propOrderId);
  const [orderNotFound, setOrderNotFound] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // UI States
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedOrderId, setCopiedOrderId] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  // Guest Account Creation States
  const [accountDismissed, setAccountDismissed] = useState(false);
  const [accountPassword, setAccountPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [accountCreating, setAccountCreating] = useState(false);
  const [accountCreatedSuccess, setAccountCreatedSuccess] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);

  // One-Tap Feedback States
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackNote, setFeedbackNote] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [noteSubmitted, setNoteSubmitted] = useState(false);

  // Fetch order if only orderId is provided
  useEffect(() => {
    if (propOrder) {
      setOrder(propOrder);
      setLoadingOrder(false);
      return;
    }

    const targetId = propOrderId || new URLSearchParams(window.location.search).get('orderId');
    if (targetId) {
      setLoadingOrder(true);
      getOrderByIdFromDb(targetId)
        .then((fetched) => {
          if (fetched) {
            setOrder(fetched);
            setOrderNotFound(false);
          } else {
            setOrderNotFound(true);
          }
        })
        .catch(() => setOrderNotFound(true))
        .finally(() => setLoadingOrder(false));
    } else {
      // Fallback: check localStorage for the most recent order
      try {
        const local = localStorage.getItem('zdf_user_orders');
        if (local) {
          const parsed: Order[] = JSON.parse(local);
          if (parsed.length > 0) {
            setOrder(parsed[0]);
          } else {
            setOrderNotFound(true);
          }
        } else {
          setOrderNotFound(true);
        }
      } catch (e) {
        setOrderNotFound(true);
      }
      setLoadingOrder(false);
    }
  }, [propOrder, propOrderId]);

  const formatPrice = (pkr: number, usd?: number) => {
    if (currency === 'USD' && usd) {
      return `$${usd.toFixed(2)}`;
    }
    return `Rs. ${pkr.toLocaleString()}`;
  };

  const handleCopy = (text: string, type: 'acc' | 'id' | 'share') => {
    navigator.clipboard.writeText(text);
    if (type === 'acc') {
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
    } else if (type === 'id') {
      setCopiedOrderId(true);
      setTimeout(() => setCopiedOrderId(false), 2000);
    } else if (type === 'share') {
      setCopiedShareLink(true);
      setTimeout(() => setCopiedShareLink(false), 2000);
    }
  };

  // Payment details helper
  const getAccountInfo = (method: string) => {
    switch (method) {
      case 'EasyPaisa':
        return {
          num: '03406070632',
          title: 'Muhammad Zohaib Shahzad',
          note: 'EasyPaisa Mobile Account'
        };
      case 'UPaisa':
        return {
          num: '03406070632',
          title: 'Muhammad Zohaib Shahzad',
          note: 'UPaisa Mobile Account'
        };
      case 'Bank Transfer':
        return {
          num: '03406070632',
          title: 'Muhammad Zohaib Shahzad',
          note: 'Meezan Bank / Raast ID: 03406070632'
        };
      case 'NayaPay':
      case 'SadaPay':
        return {
          num: '03406070632',
          title: 'Muhammad Zohaib Shahzad',
          note: `${method} Instant Wallet`
        };
      case 'Binance Crypto':
        return {
          num: '1217380568',
          title: 'Muhammad Zohaib Shahzad',
          note: 'Binance Pay ID / USDT TRC20'
        };
      case 'JazzCash':
      default:
        return {
          num: '03406070632',
          title: 'Muhammad Zohaib Shahzad',
          note: 'JazzCash Mobile Account'
        };
    }
  };

  // Handle One-Click Guest Account Creation
  const handleCreateGuestAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !order.email) return;

    if (!accountPassword || accountPassword.length < 6) {
      setAccountError('Password must be at least 6 characters.');
      return;
    }

    setAccountCreating(true);
    setAccountError(null);

    try {
      // 1. Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, order.email, accountPassword);
      const user = userCredential.user;

      // 2. Update display name
      if (order.customerName) {
        await updateProfile(user, { displayName: order.customerName });
      }

      // 3. Sync User Profile in Firestore
      const userProfile = await syncUserProfileToDb({
        uid: user.uid,
        email: order.email,
        displayName: order.customerName || order.email.split('@')[0]
      });

      // 4. Link current order to new User ID in Firestore
      await linkOrderToUserInDb(order.id, user.uid, order.email);

      // 5. Trigger welcome email
      triggerWelcomeEmail(order.email, order.customerName || 'DigiForge Member');

      // Persist session in sessionStorage
      sessionStorage.setItem('zdf_auth_user', JSON.stringify({
        uid: userProfile.uid,
        name: userProfile.displayName,
        displayName: userProfile.displayName,
        email: userProfile.email,
        role: userProfile.role,
        photoURL: userProfile.photoURL || '',
        membershipStatus: userProfile.membershipStatus || 'free',
        createdAt: userProfile.createdAt,
        lastLoginAt: new Date().toISOString(),
        ordersCount: userProfile.ordersCount || 0,
        loggedInAt: new Date().toISOString()
      }));

      setAccountCreatedSuccess(true);
      if (onUserCreated) {
        onUserCreated(userProfile);
      }
    } catch (err: any) {
      console.error('Account creation error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setAccountError('An account with this email already exists! You can sign in to view this order.');
      } else {
        setAccountError(err.message || 'Failed to create account. Please try again.');
      }
    } finally {
      setAccountCreating(false);
    }
  };

  // Handle Google Auth for guest
  const handleGoogleSignUp = async () => {
    if (!order) return;
    setAccountCreating(true);
    setAccountError(null);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      const userProfile = await syncUserProfileToDb({
        uid: user.uid,
        email: user.email || order.email,
        displayName: user.displayName || order.customerName,
        photoURL: user.photoURL || undefined
      });

      await linkOrderToUserInDb(order.id, user.uid, user.email || order.email);

      // Persist session in sessionStorage
      sessionStorage.setItem('zdf_auth_user', JSON.stringify({
        uid: userProfile.uid,
        name: userProfile.displayName,
        displayName: userProfile.displayName,
        email: userProfile.email,
        role: userProfile.role,
        photoURL: userProfile.photoURL || '',
        membershipStatus: userProfile.membershipStatus || 'free',
        createdAt: userProfile.createdAt,
        lastLoginAt: new Date().toISOString(),
        ordersCount: userProfile.ordersCount || 0,
        loggedInAt: new Date().toISOString()
      }));

      setAccountCreatedSuccess(true);
      if (onUserCreated) {
        onUserCreated(userProfile);
      }
    } catch (err: any) {
      console.error('Google Sign In error:', err);
      setAccountError(err.message || 'Google Sign In was cancelled.');
    } finally {
      setAccountCreating(false);
    }
  };

  // Handle Feedback Tap
  const handleFeedbackTap = async (rating: number, emoji: string) => {
    if (!order) return;
    setSelectedRating(rating);
    setFeedbackSubmitted(true);

    try {
      await saveCheckoutFeedbackToDb({
        orderId: order.id,
        rating,
        ratingEmoji: emoji,
        customerName: order.customerName,
        email: order.email
      });
    } catch (err) {
      console.warn('Feedback save error:', err);
    }
  };

  // Handle Optional Feedback Note Submit
  const handleNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !feedbackNote.trim()) return;

    setSubmittingNote(true);
    try {
      await saveCheckoutFeedbackToDb({
        orderId: order.id,
        rating: selectedRating || 4,
        ratingEmoji: '💬',
        customerName: order.customerName,
        email: order.email,
        notes: feedbackNote.trim()
      });
      setNoteSubmitted(true);
    } catch (err) {
      console.warn('Note save error:', err);
    } finally {
      setSubmittingNote(false);
    }
  };

  // Determine Relevant Next-Step Offer (Research-backed logic: pick ONE relevant bundle/collection or browse link)
  const getRelevantOffer = () => {
    if (!order || !order.items || order.items.length === 0) return null;

    // Check if customer already purchased a bundle, collection, or megaPass
    const hasBoughtBundleOrPass = order.items.some(
      item => item.type === 'bundle' || item.type === 'collection' || item.type === 'megaPass' || item.type === 'toolBundle' || item.title.toLowerCase().includes('bundle') || item.title.toLowerCase().includes('pass')
    );

    if (hasBoughtBundleOrPass) {
      // Customer already bought high-tier bundle; do not upsell, show explore link
      return {
        type: 'explore' as const,
        title: 'Explore More Premium Resources',
        description: 'Discover new weekly code drops, templates, and video editing assets added to the DigiForge vault.',
        ctaText: 'Browse Catalog'
      };
    }

    // Single item purchased -> Match category to best bundle
    const firstItem = order.items[0];
    const targetProd = products.find(p => p.id === firstItem.productId);
    const category = targetProd?.categoryId || '';
    const titleLower = firstItem.title.toLowerCase();

    let matchedBundle: BundleOffer | undefined;

    if (category === 'courses' || titleLower.includes('web') || titleLower.includes('dev') || titleLower.includes('code')) {
      matchedBundle = bundles.find(b => b.id === 'bundle-fullstack-dev') || bundles[0];
    } else if (category === 'video' || titleLower.includes('capcut') || titleLower.includes('lut') || titleLower.includes('video')) {
      matchedBundle = bundles.find(b => b.id === 'bundle-video-creator-vault') || bundles[0];
    } else if (category === 'templates' || titleLower.includes('notion') || titleLower.includes('framer')) {
      matchedBundle = bundles.find(b => b.id === 'bundle-freelance-os') || bundles[0];
    } else if (category === 'trading' || titleLower.includes('trade') || titleLower.includes('crypto')) {
      matchedBundle = bundles.find(b => b.id === 'bundle-trading-mastery') || bundles[0];
    } else if (category === 'graphics-assets' || titleLower.includes('ui') || titleLower.includes('figma') || titleLower.includes('icon')) {
      matchedBundle = bundles.find(b => b.id === 'bundle-uiux-arsenal') || bundles[0];
    } else {
      matchedBundle = bundles.find(b => b.id === 'bundle-freelance-os') || bundles[0];
    }

    if (!matchedBundle) return null;

    return {
      type: 'bundle' as const,
      bundle: matchedBundle
    };
  };

  const relevantOffer = getRelevantOffer();

  // Loading State
  if (loadingOrder) {
    return (
      <div className="min-h-[80vh] bg-[#0A0F1D] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-[#0D6EFD]/20 border border-[#0D6EFD]/40 flex items-center justify-center text-[#28B9FF] animate-pulse mb-4">
          <Clock className="w-8 h-8 animate-spin" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Retrieving Your Order Details...</h2>
        <p className="text-sm text-slate-400 max-w-sm">
          Please wait a moment while we synchronize your verified receipt from Firestore.
        </p>
      </div>
    );
  }

  // Not Found State
  if (orderNotFound || !order) {
    return (
      <div className="min-h-[80vh] bg-[#0A0F1D] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-2xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-white">Order Not Found</h2>
            <p className="text-xs text-slate-400">
              We couldn't locate this specific order ID. You can enter your Order ID or phone number below to look it up.
            </p>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. ZDF-884920 or 0340..."
              className="flex-1 px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-[#0D6EFD]"
            />
            <button
              onClick={() => {
                if (searchQuery.trim()) {
                  onTrackOrder(searchQuery.trim());
                }
              }}
              className="px-4 py-3 rounded-xl bg-[#0D6EFD] hover:bg-[#0b5ed7] text-white text-xs font-bold transition-all cursor-pointer"
            >
              Search
            </button>
          </div>

          <div className="pt-2">
            <button
              onClick={onContinueShopping}
              className="text-xs text-[#28B9FF] hover:underline inline-flex items-center gap-1 font-semibold"
            >
              <span>Return to Resource Store</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const accountInfo = getAccountInfo(order.paymentMethod);
  const orderDeliveryMethod = (order.items && order.items[0] && (order.items[0] as any).deliveryMethod) || 'Instant Download';
  const waText = encodeURIComponent(
    `Hi Zohaib DigiForge! I placed Order #${order.id} for Rs. ${order.totalAmountPKR.toLocaleString()} via ${order.paymentMethod}. Delivery: ${orderDeliveryMethod} (Expected within 3 hours). Here is my payment receipt screenshot to confirm access.`
  );
  const waUrl = `https://wa.me/923406070632?text=${waText}`;

  // Share message
  const shareText = `I just grabbed premium digital resources from Zohaib DigiForge! Check out their courses, templates & tool bundles: https://zohaibdigiforge.com`;
  const waShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
  const xShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;

  return (
    <div className="min-h-screen bg-[#0A0F1D] text-slate-100 pb-24 pt-6 sm:pt-10 font-sans selection:bg-[#0D6EFD]/30 selection:text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-7">

        {/* ═════════════════════════════════════════════════════════════
           1. CONFIRMATION HEADER (Above the fold — immediate reassurance)
           ═════════════════════════════════════════════════════════════ */}
        <div 
          id="confirmation-header"
          className="text-center space-y-5 bg-gradient-to-b from-slate-900/95 via-slate-950/95 to-[#0A0F1D] border border-slate-800/90 rounded-3xl p-7 sm:p-10 shadow-2xl relative overflow-hidden"
        >
          {/* Subtle Ambient Glows */}
          <div className="absolute -top-24 -right-24 w-56 h-56 bg-[#22C55E]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -top-24 -left-24 w-56 h-56 bg-[#0D6EFD]/15 rounded-full blur-3xl pointer-events-none" />

          {/* Smooth Single-Execution Success Icon */}
          <div className="relative inline-block">
            <div className="w-18 h-18 sm:w-22 sm:h-22 mx-auto rounded-3xl bg-gradient-to-tr from-[#22C55E]/20 to-[#28B9FF]/20 border-2 border-[#22C55E]/40 flex items-center justify-center text-[#22C55E] shadow-xl shadow-[#22C55E]/25 transition-transform">
              <svg className="w-11 h-11 sm:w-13 sm:h-13 text-[#22C55E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path className="animate-checkmark" d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline className="animate-checkmark" d="M22 4L12 14.01l-3-3" />
              </svg>
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#0D6EFD] border-2 border-[#0A0F1D] flex items-center justify-center text-white">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="space-y-2.5 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#22C55E] text-xs font-bold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
              <span>Order Received Successfully</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Thank You, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-[#28B9FF]">{order.customerName || 'Valued Customer'}</span>! Your Order Is In.
            </h1>

            <p className="text-sm sm:text-base text-slate-300 font-medium">
              Order <span className="text-white font-mono font-bold">#{order.id}</span> has been received — here's what happens next.
            </p>

            <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5 pt-1">
              <Mail className="w-3.5 h-3.5 text-[#28B9FF]" />
              <span>A confirmation receipt is on its way to <strong className="text-slate-200">{order.email}</strong>.</span>
            </p>
          </div>

          {/* Quick Copy Order ID & Direct Share Toolbar */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5 sm:gap-4">
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-950/90 border border-slate-700/80 flex items-center gap-2.5 shadow-inner">
              <span className="text-xs text-slate-400 font-medium">Order ID:</span>
              <span className="text-xs sm:text-sm font-mono font-bold text-white tracking-wider">#{order.id}</span>
              <button
                id="copy-order-id-btn"
                onClick={() => handleCopy(order.id, 'id')}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Copy Order ID"
              >
                {copiedOrderId ? <Check className="w-4 h-4 text-[#22C55E]" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <button
              id="header-track-order-btn"
              onClick={() => onTrackOrder(order.id)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-[#28B9FF]" />
              <span>Track Live Status</span>
            </button>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════
           2. WHAT HAPPENS NEXT — CLEAR 3-STEP TIMELINE
           (Crucial for zero uncertainty, mobile-first WhatsApp CTA)
           ═════════════════════════════════════════════════════════════ */}
        <div 
          id="what-happens-next-card"
          className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6"
        >
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#0D6EFD]/20 border border-[#0D6EFD]/30 flex items-center justify-center text-[#28B9FF]">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white">What Happens Next</h2>
                <p className="text-xs text-slate-400">Clear 3-step process to unlock your digital files</p>
              </div>
            </div>
            <span className="hidden sm:inline-flex px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-[11px] font-semibold text-slate-400">
              Average Unlock Time: 15–45 Mins
            </span>
          </div>

          {/* Numbered 3-Step Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            
            {/* Step 1 */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-[#22C55E]/30 relative flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-lg bg-[#22C55E]/20 text-[#22C55E] font-bold text-xs flex items-center justify-center border border-[#22C55E]/30">
                    1
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#22C55E]">
                    Action Required
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white">Confirm on WhatsApp</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Send payment of <strong className="text-white">Rs. {order.totalAmountPKR.toLocaleString()}</strong> to the {order.paymentMethod} account below &amp; share screenshot on WhatsApp.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-7 h-7 rounded-lg bg-[#0D6EFD]/20 text-[#28B9FF] font-bold text-xs flex items-center justify-center border border-[#0D6EFD]/30">
                  2
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Manual Verification
                </span>
              </div>
              <h3 className="text-sm font-bold text-white">Our Team Verifies</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Our support team cross-checks your transaction ID within <strong className="text-slate-200">1 hour</strong> (often under 15 minutes during business hours).
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center justify-center border border-amber-500/30">
                  3
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Direct Delivery
                </span>
              </div>
              <h3 className="text-sm font-bold text-white">Access Unlocks</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your file access will be provided via <strong className="text-[#28B9FF]">{orderDeliveryMethod}</strong> with guaranteed delivery <strong className="text-[#22C55E]">within 3 hours</strong> (and direct access on your dashboard/WhatsApp).
              </p>
            </div>

          </div>

          {/* Payment Account Transfer Information & Primary WhatsApp CTA */}
          <div className="p-5 sm:p-6 rounded-2xl bg-slate-950 border border-[#0D6EFD]/30 space-y-4 shadow-inner">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#28B9FF]" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  {order.paymentMethod} Transfer Details:
                </span>
              </div>
              <div className="text-xs font-extrabold text-[#22C55E] bg-[#22C55E]/10 px-2.5 py-1 rounded-lg border border-[#22C55E]/25">
                Total Due: {formatPrice(order.totalAmountPKR, order.totalAmountUSD)}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Account / Phone Number</span>
                  <span className="text-sm font-mono font-bold text-white tracking-wider select-all">{accountInfo.num}</span>
                </div>
                <button
                  id="copy-account-btn"
                  onClick={() => handleCopy(accountInfo.num, 'acc')}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-[#0D6EFD] text-slate-200 transition-colors cursor-pointer shrink-0 ml-2"
                  title="Copy Account Number"
                >
                  {copiedAccount ? <Check className="w-4 h-4 text-[#22C55E]" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Account Title / Beneficiary</span>
                <span className="text-xs font-bold text-slate-200 block truncate">{accountInfo.title}</span>
                <span className="text-[10px] text-slate-400">{accountInfo.note}</span>
              </div>
            </div>

            {/* The Most Prominent Action on Page (Non-negotiable requirement) */}
            <a
              id="confirm-whatsapp-btn"
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#22C55E] to-[#16a34a] hover:from-[#1eb855] hover:to-[#15803d] text-slate-950 font-black text-sm sm:text-base flex items-center justify-center gap-3 shadow-xl shadow-[#22C55E]/25 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer min-h-[52px]"
            >
              <MessageCircle className="w-5 h-5 fill-slate-950 text-slate-950" />
              <span>Confirm on WhatsApp with Order #{order.id}</span>
              <ExternalLink className="w-4 h-4 opacity-75" />
            </a>

            <p className="text-[11px] text-slate-400 text-center leading-relaxed">
              No account yet? You can still track this order — check your email for a tracking link, or create a free account below to manage it easily.
            </p>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════
           3. ORDER DETAILS (Full transparency — reduces post-purchase anxiety)
           ═════════════════════════════════════════════════════════════ */}
        <div 
          id="order-details-card"
          className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5"
        >
          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800/80 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#28B9FF]" />
                <span>Purchased Resource Details</span>
              </h3>
              <p className="text-xs text-slate-400">Order #{order.id} &bull; {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            </div>

            {/* Status Badge: Accurately reflects manual-verification flow */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/35 text-amber-300 text-xs font-bold">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Pending Payment Confirmation</span>
            </div>
          </div>

          {/* Items Purchased List */}
          <div className="space-y-3">
            {order.items.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800/80 gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {item.thumbnail ? (
                    <img 
                      src={item.thumbnail} 
                      alt={item.title} 
                      className="w-12 h-12 rounded-xl object-cover border border-slate-800 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                      <Layers className="w-5 h-5" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-white truncate">{item.title}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-[#28B9FF] font-semibold flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        <span>Instant Digital License</span>
                      </span>
                      {item.type && (
                        <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                          {item.type}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs sm:text-sm font-extrabold text-white">
                    Rs. {item.price.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Financial Breakdown */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/60 space-y-2 text-xs">
            {order.subtotalPKR && order.subtotalPKR !== order.totalAmountPKR && (
              <div className="flex justify-between text-slate-400">
                <span>Subtotal ({order.items.length} items):</span>
                <span className="font-semibold text-slate-200">Rs. {order.subtotalPKR.toLocaleString()}</span>
              </div>
            )}

            {order.discountPKR && order.discountPKR > 0 && (
              <div className="flex justify-between text-[#22C55E]">
                <span>Promo Discount ({order.couponCode || 'APPLIED'}):</span>
                <span className="font-bold">-Rs. {order.discountPKR.toLocaleString()}</span>
              </div>
            )}

            <div className="flex justify-between items-center text-sm font-extrabold text-white pt-2 border-t border-slate-800">
              <span>Total Paid / Due:</span>
              <span className="text-[#22C55E] text-base font-black">
                {formatPrice(order.totalAmountPKR, order.totalAmountUSD)}
              </span>
            </div>
          </div>

          {/* Customer Metadata Footer */}
          <div className="pt-2 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
            <span>Customer: <strong className="text-slate-200">{order.customerName}</strong> ({order.email})</span>
            <span>Selected Payment: <strong className="text-slate-200">{order.paymentMethod}</strong></span>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════
           4. ACCOUNT CREATION PROMPT (Guest checkout lowest-friction ask)
           ═════════════════════════════════════════════════════════════ */}
        {!currentUser && !accountDismissed && !accountCreatedSuccess && (
          <div 
            id="guest-account-creation-card"
            className="bg-gradient-to-br from-slate-900 via-slate-900/95 to-[#0D6EFD]/20 border border-[#0D6EFD]/40 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h3 className="text-base font-bold text-white">
                    Want to track this order and future ones easily?
                  </h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                  Set a password for <strong className="text-slate-200">{order.email}</strong> to unlock your personal Customer Dashboard, track download links, and access future updates.
                </p>
              </div>

              {/* Skip Option (never force it) */}
              <button
                id="guest-account-skip-btn"
                onClick={() => setAccountDismissed(true)}
                className="text-[11px] text-slate-500 hover:text-slate-300 font-semibold underline shrink-0 cursor-pointer pt-1"
              >
                Maybe later
              </button>
            </div>

            {/* Ultra Simple 1-Field Form (Email already known) */}
            <form onSubmit={handleCreateGuestAccount} className="space-y-3 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                
                {/* Pre-filled Email Display */}
                <div className="sm:col-span-5 relative">
                  <input
                    type="email"
                    value={order.email}
                    disabled
                    className="w-full px-3.5 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 font-mono select-none cursor-not-allowed"
                    title="Email pre-filled from checkout"
                  />
                  <span className="absolute right-3 top-3 text-[10px] text-slate-500 uppercase font-bold">
                    Pre-filled
                  </span>
                </div>

                {/* Password Field */}
                <div className="sm:col-span-4 relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={accountPassword}
                    onChange={(e) => setAccountPassword(e.target.value)}
                    placeholder="Create a password (6+ chars)"
                    required
                    minLength={6}
                    className="w-full px-3.5 py-3 rounded-xl bg-slate-950 border border-slate-700/90 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#0D6EFD] pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-3 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Single Click Submit */}
                <div className="sm:col-span-3">
                  <button
                    type="submit"
                    disabled={accountCreating}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#0D6EFD] to-[#28B9FF] hover:opacity-95 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-[#0D6EFD]/25 transition-all cursor-pointer min-h-[42px] disabled:opacity-50"
                  >
                    {accountCreating ? (
                      <Clock className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Create Account</span>
                      </>
                    )}
                  </button>
                </div>

              </div>

              <PasswordStrengthIndicator password={accountPassword} />

              {accountError && (
                <p className="text-xs text-rose-400 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{accountError}</span>
                </p>
              )}

              {/* 1-Click Google Alternative */}
              <div className="flex items-center justify-between text-xs pt-1 flex-wrap gap-2">
                <span className="text-slate-500 text-[11px]">Or sign up instantly with one click:</span>
                <button
                  type="button"
                  onClick={handleGoogleSignUp}
                  className="text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 hover:underline cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Continue with Google</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Success confirmation if account created */}
        {accountCreatedSuccess && (
          <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white">Account Created &amp; Order Linked!</h4>
                <p className="text-[11px] text-slate-300">You can now view your purchase anytime in your personal dashboard.</p>
              </div>
            </div>
            {onNavigateDashboard && (
              <button
                onClick={onNavigateDashboard}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shrink-0 cursor-pointer"
              >
                Go to Dashboard
              </button>
            )}
          </div>
        )}

        {/* If user is already logged in */}
        {currentUser && (
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#28B9FF]" />
              <span className="text-slate-300">
                Order automatically saved to account: <strong className="text-white">{currentUser.email}</strong>
              </span>
            </div>
            {onNavigateDashboard && (
              <button
                onClick={onNavigateDashboard}
                className="text-[#28B9FF] hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <span>View My Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════
           5. RELEVANT NEXT-STEP OFFER (Soft, single, relevant — NOT an annoying hard popup)
           ═════════════════════════════════════════════════════════════ */}
        {relevantOffer && (
          <div 
            id="relevant-next-step-offer"
            className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-[#0D6EFD]/15 border border-[#0D6EFD]/35 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-[#0D6EFD]/20 text-[#28B9FF] border border-[#0D6EFD]/35 text-[10px] font-extrabold uppercase tracking-wider">
                {relevantOffer.type === 'bundle' ? 'Complementary Bundle Offer' : 'Keep Learning'}
              </span>
              <span className="text-[11px] text-slate-400">
                You might also find this useful
              </span>
            </div>

            {relevantOffer.type === 'bundle' && relevantOffer.bundle && (
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 pt-1">
                <div className="flex items-start gap-4 min-w-0">
                  <img
                    src={relevantOffer.bundle.thumbnail}
                    alt={relevantOffer.bundle.title}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-slate-800 shrink-0"
                  />
                  <div className="space-y-1.5 min-w-0">
                    <h4 className="text-base font-bold text-white">{relevantOffer.bundle.title}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {relevantOffer.bundle.description}
                    </p>
                    <div className="flex items-center gap-3 pt-1">
                      <span className="text-sm font-extrabold text-[#22C55E]">
                        Rs. {relevantOffer.bundle.pricePKR.toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-500 line-through">
                        Worth Rs. {relevantOffer.bundle.worthPKR.toLocaleString()}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/25">
                        {relevantOffer.bundle.itemCount} Items Included
                      </span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 pt-2 md:pt-0">
                  <button
                    id="view-bundle-offer-btn"
                    onClick={() => {
                      if (onViewBundle) onViewBundle(relevantOffer.bundle!);
                      else onContinueShopping();
                    }}
                    className="w-full md:w-auto px-5 py-3 rounded-xl bg-slate-800 hover:bg-[#0D6EFD] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer min-h-[44px]"
                  >
                    <span>See This Bundle</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {relevantOffer.type === 'explore' && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                <div>
                  <h4 className="text-sm font-bold text-white">{relevantOffer.title}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{relevantOffer.description}</p>
                </div>
                <button
                  onClick={onContinueShopping}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <span>{relevantOffer.ctaText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════
           6. REFERRAL / SHARE PROMPT (Peak trust moment)
           ═════════════════════════════════════════════════════════════ */}
        <div 
          id="referral-share-card"
          className="p-5 sm:p-6 rounded-3xl bg-slate-900/80 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-[#28B9FF]" />
              <h4 className="text-sm font-bold text-white">Know someone who'd find this useful?</h4>
            </div>
            <p className="text-xs text-slate-400">
              Share DigiForge with fellow developers, creators, or students looking for verified tools.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* WhatsApp Share */}
            <a
              href={waShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-[#22C55E]/15 hover:bg-[#22C55E]/25 text-[#22C55E] border border-[#22C55E]/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Share on WhatsApp</span>
            </a>

            {/* X / Twitter Share */}
            <a
              href={xShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>Share on X</span>
            </a>

            {/* Copy Link */}
            <button
              onClick={() => handleCopy('https://zohaibdigiforge.com', 'share')}
              className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {copiedShareLink ? <Check className="w-3.5 h-3.5 text-[#22C55E]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedShareLink ? 'Link Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════
           7. ONE-TAP FEEDBACK (Silent Firestore save, high completion)
           ═════════════════════════════════════════════════════════════ */}
        <div 
          id="one-tap-feedback-card"
          className="p-5 sm:p-6 rounded-3xl bg-slate-900/70 border border-slate-800/80 space-y-3"
        >
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <Heart className="w-3.5 h-3.5 text-rose-400" />
              <span>How was your buying experience today?</span>
            </h4>
            <span className="text-[10px] text-slate-500">1-tap feedback</span>
          </div>

          {!feedbackSubmitted ? (
            <div className="grid grid-cols-4 gap-2 pt-1">
              {[
                { rating: 1, emoji: '😞', label: 'Needs Work' },
                { rating: 2, emoji: '😐', label: 'Okay' },
                { rating: 3, emoji: '😊', label: 'Great' },
                { rating: 4, emoji: '🚀', label: 'Loved It!' },
              ].map((item) => (
                <button
                  key={item.rating}
                  onClick={() => handleFeedbackTap(item.rating, item.emoji)}
                  className="p-3 rounded-2xl bg-slate-950/80 hover:bg-slate-800/90 border border-slate-800 hover:border-[#0D6EFD]/50 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer group hover:scale-[1.03]"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">{item.emoji}</span>
                  <span className="text-[10px] font-semibold text-slate-400 group-hover:text-white">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-3 pt-1 animate-in fade-in duration-300">
              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-400">
                <span>Thank you for your feedback! ❤️ It helps us make DigiForge even better.</span>
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              </div>

              {!noteSubmitted ? (
                <form onSubmit={handleNoteSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={feedbackNote}
                    onChange={(e) => setFeedbackNote(e.target.value)}
                    placeholder="Optional: Anything specific we can improve?"
                    className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#0D6EFD]"
                  />
                  <button
                    type="submit"
                    disabled={submittingNote || !feedbackNote.trim()}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-[#0D6EFD] text-white text-xs font-bold transition-all disabled:opacity-40 cursor-pointer"
                  >
                    Send
                  </button>
                </form>
              ) : (
                <p className="text-[11px] text-slate-400 italic">Your suggestion has been logged. Thank you!</p>
              )}
            </div>
          )}
        </div>

        {/* ═════════════════════════════════════════════════════════════
           8. HELPFUL LINKS & SUPPORT FOOTER (Reduces support tickets)
           ═════════════════════════════════════════════════════════════ */}
        <div 
          id="confirmation-footer-links"
          className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-y-3 gap-x-6 text-xs text-slate-400"
        >
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5 text-[#22C55E]" />
            <span>Questions? WhatsApp Support</span>
          </a>

          <button
            onClick={() => onTrackOrder(order.id)}
            className="hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 text-[#28B9FF]" />
            <span>Track Order Status</span>
          </button>

          {onNavigateLegal && (
            <button
              onClick={() => onNavigateLegal('refund')}
              className="hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>View Refund Policy</span>
            </button>
          )}

          <button
            onClick={onContinueShopping}
            className="hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
            <span>Browse More Resources</span>
          </button>
        </div>

      </div>
    </div>
  );
};

import React, { useState, useEffect, Suspense, lazy, Component, ReactNode, ErrorInfo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Currency, Product, Order, Category, Subcategory, LegalDocId, UserProfile, CartItem, CouponDiscount, FAQ, PurchasableItem } from './types';
import { Navbar } from './components/Navbar';
import { SEO, formatProductSEOTitle, formatProductSEODesc, formatCategorySEOTitle, formatCategorySEODesc } from './components/SEO';
import { STATIC_PAGES_SEO, SEO_KEYWORDS } from './data/seoData';
import { Hero } from './components/Hero';
import { TrustBar } from './components/TrustBar';
import { FlatPriceBanner } from './components/FlatPriceBanner';
import { CategoryShortcuts } from './components/CategoryShortcuts';
import { TopSelling } from './components/TopSelling';
import { CategorySections } from './components/CategorySections';
import { CategoryGrid } from './components/CategoryGrid';
import { HowItWorks } from './components/HowItWorks';
import { PaymentMethods } from './components/PaymentMethods';
import { FAQSection } from './components/FAQSection';
import { CommunityCallout } from './components/CommunityCallout';
import { Footer } from './components/Footer';
import { ResourcesPage } from './components/ResourcesPage';
import { isAdminSessionVerified, setAdminSessionVerified } from './services/adminOtpService';
import { DEFAULT_GLOBAL_FAQS } from './data/faqData';
import { isUserAdmin } from './lib/authHelpers';
import { 
  INITIAL_CATEGORIES, 
  INITIAL_SUBCATEGORIES 
} from './data/mockData';
import { auth } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  getProductsFromDb, 
  getCategoriesFromDb, 
  getSubcategoriesFromDb,
  subscribeToProducts,
  subscribeToCategories,
  subscribeToSubcategories,
  syncUserProfileToDb,
  getUserProfileFromDb,
  getCartFromDb,
  saveCartToDb,
  syncCartOnLogin,
  logAnalyticsEvent
} from './services/firestoreService';
import { usePricing } from './context/PricingContext';

import { GlobalPreloader } from './components/GlobalPreloader';
import { TopLoadingBar } from './components/TopLoadingBar';
import { CustomCursor } from './components/CustomCursor';
import { ContentProtection } from './components/ContentProtection';

// Resilient Lazy Loader with Automatic Retry & Fallback
function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<any>,
  exportName?: string
) {
  return lazy(async () => {
    const sessionKey = `retry-lazy-${exportName || 'module'}`;
    const pageReloaded = typeof window !== 'undefined' ? window.sessionStorage.getItem(sessionKey) : null;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const module = await factory();
        if (typeof window !== 'undefined') window.sessionStorage.removeItem(sessionKey);
        if (exportName && module && module[exportName]) {
          return { default: module[exportName] };
        }
        if (module && module.default) {
          return module;
        }
        return { default: module };
      } catch (error) {
        console.warn(`Dynamic import attempt ${attempt} for ${exportName || 'module'}:`, error);
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, attempt * 300));
        }
      }
    }

    // If still failing and haven't auto-reloaded the page yet to get fresh server assets:
    if (!pageReloaded && typeof window !== 'undefined') {
      window.sessionStorage.setItem(sessionKey, 'true');
      window.location.reload();
    }

    throw new Error(`Failed to load ${exportName || 'module'}. Please check your connection and refresh.`);
  });
}

// Lazy Loaded Components for Maximum Bundle & Performance Optimization
const ProductPage = lazyWithRetry(() => import('./components/ProductPage'), 'ProductPage');
const CheckoutModal = lazyWithRetry(() => import('./components/CheckoutModal'), 'CheckoutModal');
const OrderTrackerModal = lazyWithRetry(() => import('./components/OrderTrackerModal'), 'OrderTrackerModal');
const LegalModal = lazyWithRetry(() => import('./components/LegalModal'), 'LegalModal');
const AboutPage = lazyWithRetry(() => import('./components/AboutPage'), 'AboutPage');
const ContactPage = lazyWithRetry(() => import('./components/ContactPage'), 'ContactPage');
const LegalPage = lazyWithRetry(() => import('./components/LegalPage'), 'LegalPage');
const AuthModal = lazyWithRetry(() => import('./components/AuthModal'), 'AuthModal');
const AuthPage = lazyWithRetry(() => import('./components/AuthPage'), 'AuthPage');
const CustomerDashboard = lazyWithRetry(() => import('./components/CustomerDashboard'), 'CustomerDashboard');
const AdminDashboard = lazyWithRetry(() => import('./components/AdminDashboard'), 'AdminDashboard');
const AdminOtpModal = lazyWithRetry(() => import('./components/AdminOtpModal'), 'AdminOtpModal');
const JoinUsPage = lazyWithRetry(() => import('./components/JoinUsPage'), 'JoinUsPage');
const JoinLinksAdminModal = lazyWithRetry(() => import('./components/JoinLinksAdminModal'), 'JoinLinksAdminModal');
const FAQPage = lazyWithRetry(() => import('./components/FAQPage'), 'FAQPage');
const SitemapPage = lazyWithRetry(() => import('./components/SitemapPage'), 'SitemapPage');
const CartPage = lazyWithRetry(() => import('./components/CartPage'), 'CartPage');
const CheckoutPage = lazyWithRetry(() => import('./components/CheckoutPage'), 'CheckoutPage');
const OrderConfirmationPage = lazyWithRetry(() => import('./components/OrderConfirmationPage'), 'OrderConfirmationPage');
const NotFoundPage = lazyWithRetry(() => import('./components/NotFoundPage'), 'NotFoundPage');
const SiteSearchOverlay = lazyWithRetry(() => import('./components/SiteSearchOverlay'), 'SiteSearchOverlay');
const SearchResultsPage = lazyWithRetry(() => import('./components/SearchResultsPage'), 'SearchResultsPage');
const FloatingWhatsApp = lazyWithRetry(() => import('./components/FloatingWhatsApp'), 'FloatingWhatsApp');

interface RouteErrorBoundaryProps {
  children: ReactNode;
}

interface RouteErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RouteErrorBoundary extends (React.Component as any) {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('RouteErrorBoundary captured error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center py-16 px-4 text-center select-none">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4 text-rose-400 shadow-lg shadow-rose-500/5">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white mb-1">Notice: Content Update Available</h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mb-5 leading-relaxed">
            The app was recently updated. Please tap below to refresh and load the latest version smoothly.
          </p>
          <button
            onClick={this.handleRetry}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0D6EFD] to-[#28B9FF] text-xs sm:text-sm font-bold text-white shadow-lg shadow-[#0D6EFD]/25 hover:opacity-95 transition-opacity"
          >
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const PageLoadingFallback = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center py-12 px-4 text-center select-none">
    <div className="relative w-10 h-10 sm:w-12 sm:h-12 mb-3.5 flex items-center justify-center">
      <div className="absolute inset-0 rounded-full border-2 border-slate-800" />
      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#28B9FF] border-r-[#0D6EFD] animate-spin" />
    </div>
    <span className="text-xs sm:text-sm font-bold text-slate-300 tracking-wide">Loading content...</span>
    <span className="text-[10px] sm:text-xs text-slate-500 mt-0.5">Please wait a moment</span>
  </div>
);

const slugify = (text: string) => {
  return (text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export default function App() {
  const { getProductPriceNumber } = usePricing();

  // Global App States (Instant 0ms Hydration from Cache/Static data with Background SWR Sync)
  const [currency, setCurrency] = useState<Currency>('PKR');
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const cached = typeof window !== 'undefined' ? localStorage.getItem('zdf_cached_categories') : null;
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_CATEGORIES;
  });
  const [subcategories, setSubcategories] = useState<Subcategory[]>(() => {
    try {
      const cached = typeof window !== 'undefined' ? localStorage.getItem('zdf_cached_subcategories') : null;
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_SUBCATEGORIES;
  });
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const cached = typeof window !== 'undefined' ? localStorage.getItem('zdf_cached_products') : null;
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && !parsed.some((p: any) => p.id && p.id.startsWith('prod-'))) return parsed;
        localStorage.removeItem('zdf_cached_products');
      }
    } catch {}
    return [];
  });

  // Smooth Preloader & Top Progress Navigation States
  const [initialAppLoading, setInitialAppLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);

  // View & Routing States
  const [currentView, setCurrentView] = useState<'home' | 'resources' | 'product' | 'about' | 'contact' | 'faq' | 'sitemap' | 'legal' | 'join-us' | 'auth' | 'dashboard' | 'admin-dashboard' | 'cart' | 'checkout' | 'order-confirmation' | 'search' | 'not-found'>('home');
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false);
  const [searchViewQuery, setSearchViewQuery] = useState('');
  const [authTab, setAuthTab] = useState<'signin' | 'signup'>('signin');
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = sessionStorage.getItem('zdf_auth_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.uid || parsed.email)) {
          return {
            uid: parsed.uid || 'member',
            email: parsed.email || '',
            displayName: parsed.displayName || parsed.name || parsed.email?.split('@')[0] || 'DigiForge Member',
            photoURL: parsed.photoURL || '',
            role: parsed.role || (isUserAdmin(parsed.email) ? 'admin' : 'customer'),
            membershipStatus: parsed.membershipStatus || 'free',
            createdAt: parsed.createdAt || parsed.loggedInAt || new Date().toISOString(),
            lastLoginAt: parsed.lastLoginAt || parsed.loggedInAt || new Date().toISOString(),
            ordersCount: parsed.ordersCount || 0,
          };
        }
      }
      return null;
    } catch {
      return null;
    }
  });

  const [legalDocId, setLegalDocId] = useState<LegalDocId>('refund');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>('all');
  const [selectedSubcategorySlug, setSelectedSubcategorySlug] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & Cart / Checkout state
  const [checkoutItem, setCheckoutItem] = useState<PurchasableItem | null>(null);
  const [trackerModalOpen, setTrackerModalOpen] = useState(false);
  const [activeTrackedOrder, setActiveTrackedOrder] = useState<Order | null>(null);
  const [legalDocType, setLegalDocType] = useState<'Privacy Policy' | 'Terms & Conditions' | 'Refund Policy' | null>(null);

  const [joinLinksAdminModalOpen, setJoinLinksAdminModalOpen] = useState(false);
  const [adminOtpModalOpen, setAdminOtpModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // High-Conversion Cart & Checkout state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponDiscount | null>(null);
  const [lastRemovedItem, setLastRemovedItem] = useState<{ item: CartItem; title: string } | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null);
  const [topSellingCategory, setTopSellingCategory] = useState<string>('All');
  const [topSellingSearch, setTopSellingSearch] = useState<string>('');

  // Load and sync cart from Firestore / LocalStorage
  useEffect(() => {
    let isMounted = true;
    const loadCartData = async () => {
      try {
        const loaded = await getCartFromDb(currentUserProfile?.uid);
        if (isMounted && loaded) {
          setCartItems(loaded);
        }
      } catch (err) {
        console.warn('Cart load issue:', err);
      }
    };
    loadCartData();
    return () => { isMounted = false; };
  }, [currentUserProfile?.uid]);

  // 1. Initial Data Fetch from Firestore & Firebase Auth State Listener (Optimized Smooth Pipeline)
  useEffect(() => {
    let isMounted = true;
    const startTime = Date.now();
    const minLoadDuration = 100; // Fast initial load for instant LCP / FCP paint

    const pCats = getCategoriesFromDb().then(cats => {
      if (isMounted && cats?.length) setCategories(cats);
    }).catch(err => console.warn('Categories load error:', err));

    const pSubs = getSubcategoriesFromDb().then(subs => {
      if (isMounted && subs?.length) setSubcategories(subs);
    }).catch(err => console.warn('Subcategories load error:', err));

    const pProds = getProductsFromDb().then(prods => {
      if (isMounted) setProducts(prods || []);
    }).catch(err => console.warn('Products load error:', err));

    // Live Real-Time Firestore Synchronization Listeners
    const unsubProducts = subscribeToProducts((liveProds) => {
      if (isMounted && liveProds) {
        setProducts(liveProds);
      }
    });

    const unsubCategories = subscribeToCategories((liveCats) => {
      if (isMounted && liveCats?.length) {
        setCategories(liveCats);
      }
    });

    const unsubSubcategories = subscribeToSubcategories((liveSubs) => {
      if (isMounted && liveSubs?.length) {
        setSubcategories(liveSubs);
      }
    });

    // Fast responsive preloader cap: Never let slow network or Firestore handshakes stall the screen.
    // The initial catalog data is already present in state, and Firestore background sync seamlessly updates state.
    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        setInitialAppLoading(false);
      }
    }, 300);

    // Complete loader smoothly once critical assets are fetched or min duration expires
    Promise.allSettled([pCats, pSubs, pProds]).then(() => {
      clearTimeout(safetyTimer);
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, Math.min(200, minLoadDuration - elapsed));
      setTimeout(() => {
        if (isMounted) {
          setInitialAppLoading(false);
        }
      }, remaining);
    });

    logAnalyticsEvent('page_view');

    // Listen to Firebase Auth state
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const profile = await syncUserProfileToDb({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email?.split('@')[0],
            photoURL: user.photoURL
          });
          if (isMounted) setCurrentUserProfile(profile);
          // Persist user profile in sessionStorage so state remains instant and durable
          sessionStorage.setItem('zdf_auth_user', JSON.stringify({
            uid: profile.uid,
            name: profile.displayName,
            displayName: profile.displayName,
            email: profile.email,
            role: profile.role,
            photoURL: profile.photoURL || '',
            membershipStatus: profile.membershipStatus || 'free',
            createdAt: profile.createdAt,
            lastLoginAt: new Date().toISOString(),
            ordersCount: profile.ordersCount || 0,
            loggedInAt: new Date().toISOString()
          }));
        } catch (e) {
          console.warn('Profile sync error:', e);
        }
      } else {
        const saved = sessionStorage.getItem('zdf_auth_user');
        if (!saved && isMounted) {
          setCurrentUserProfile(null);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
      if (typeof unsubProducts === 'function') unsubProducts();
      if (typeof unsubCategories === 'function') unsubCategories();
      if (typeof unsubSubcategories === 'function') unsubSubcategories();
    };
  }, []);

  // Smooth Page Navigation Progress Bar & Scroll Top
  useEffect(() => {
    setIsNavigating(true);
    const navTimer = setTimeout(() => {
      setIsNavigating(false);
    }, 280);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return () => clearTimeout(navTimer);
  }, [currentView]);

  // 2. Read URL search params on mount & on popstate
  // 2. Read URL path & search params on mount & on popstate
  const syncFromUrl = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const view = params.get('view');
      const doc = params.get('doc');
      const slug = params.get('slug');
      const prodId = params.get('id') || params.get('product');
      const tab = params.get('tab');

      const rawPath = (window.location.pathname || '').toLowerCase();
      const pathname = rawPath.replace(/\/+$/, '') || '/';
      const hasQueryParams = Boolean(window.location.search);

      // 0. Clean Referral Link Handling (/ref/:code or /invite/:code or ?ref=...)
      if (pathname.startsWith('/ref/') || pathname.startsWith('/invite/')) {
        const segments = pathname.split('/').filter(Boolean);
        if (segments.length >= 2) {
          const cleanRef = segments[1].trim().toUpperCase();
          try {
            localStorage.setItem('zdf_active_referral', cleanRef);
          } catch (e) {}
          try {
            window.history.replaceState({}, '', '/');
          } catch (e) {}
          setCurrentView('home');
          return;
        }
      }

      // Auto-capture referral code from URL (?ref=ZDF-XXXX or ?referral=...)
      const refParam = params.get('ref') || params.get('referral');
      if (refParam) {
        const cleanRef = refParam.trim().toUpperCase();
        try {
          localStorage.setItem('zdf_active_referral', cleanRef);
        } catch (e) {}
        try {
          const cleanPath = window.location.pathname || '/';
          window.history.replaceState({}, '', cleanPath);
        } catch (e) {}
      }

      let cat = 'all';
      let sub = 'all';
      let q = params.get('q') || params.get('search') || '';

      if (pathname.startsWith('/resources')) {
        const segments = pathname.split('/').filter(Boolean);
        // segments[0] is 'resources'
        if (segments.length >= 2) {
          if (segments[1] === 'category' && segments[2]) {
            cat = segments[2];
            if (segments[3] === 'subcategory' && segments[4]) {
              sub = segments[4];
            }
          } else {
            // Clean direct URL format: /resources/:categorySlug or /resources/:categorySlug/:subcategorySlug
            cat = segments[1];
            if (segments[2] && segments[2] !== 'search') {
              sub = segments[2];
            }
          }
        }
        for (let i = 1; i < segments.length; i++) {
          if (segments[i] === 'search' && segments[i + 1]) {
            q = decodeURIComponent(segments[i + 1]);
          }
        }
      } else {
        cat = params.get('category') || 'all';
        sub = params.get('subcat') || 'all';
      }

      // Helper to clean up any messy query parameters from the browser address bar
      const cleanUrlState = (cleanPath: string) => {
        if (hasQueryParams && window.location.pathname !== cleanPath) {
          try {
            window.history.replaceState({}, '', cleanPath);
          } catch (e) {}
        }
      };

      // Explicit 404 Not Found Checks
      if (view === '404' || view === 'not-found' || view === 'error' || pathname === '/404' || pathname === '/not-found') {
        cleanUrlState('/404');
        setCurrentView('not-found');
        return;
      }

      // 1. Auth routes (/auth, /signin, /signup, /login, /register)
      if (
        view === 'auth' || view === 'signin' || view === 'signup' || view === 'login' || view === 'register' ||
        pathname === '/auth' || pathname === '/signin' || pathname === '/signup' || pathname === '/login' || pathname === '/register'
      ) {
        const isSignup = view === 'signup' || view === 'register' || tab === 'signup' || pathname === '/signup' || pathname === '/register';
        const cleanAuthPath = isSignup ? '/signup' : '/signin';
        cleanUrlState(cleanAuthPath);

        const savedUser = sessionStorage.getItem('zdf_auth_user');
        const userObj = currentUserProfile || (savedUser ? JSON.parse(savedUser) : null);
        if (userObj && (userObj.uid || userObj.email)) {
          if (userObj.role === 'admin') {
            if (!isAdminSessionVerified()) {
              setAdminOtpModalOpen(true);
              return;
            }
            cleanUrlState('/admin');
            setCurrentView('admin-dashboard');
            return;
          }
          cleanUrlState('/dashboard');
          setCurrentView('dashboard');
          return;
        }
        setAuthTab(isSignup ? 'signup' : 'signin');
        setCurrentView('auth');
        return;
      }

      // 2. Customer Dashboard routes (/dashboard, /account, /customer-dashboard)
      if (
        view === 'dashboard' || view === 'account' || view === 'customer-dashboard' ||
        pathname === '/dashboard' || pathname === '/account' || pathname === '/customer-dashboard'
      ) {
        cleanUrlState('/dashboard');
        const savedUser = sessionStorage.getItem('zdf_auth_user');
        if (!currentUserProfile && !savedUser) {
          cleanUrlState('/signin');
          setAuthTab('signin');
          setCurrentView('auth');
          return;
        }
        setCurrentView('dashboard');
        return;
      }

      // 3. Admin routes (/admin, /admin-dashboard)
      if (
        view === 'admin' || view === 'admin-dashboard' ||
        pathname === '/admin' || pathname === '/admin-dashboard'
      ) {
        cleanUrlState('/admin');
        const savedUser = sessionStorage.getItem('zdf_auth_user');
        const userObj = currentUserProfile || (savedUser ? JSON.parse(savedUser) : null);
        if (!userObj || userObj.role !== 'admin') {
          cleanUrlState('/signin');
          setAuthTab('signin');
          setCurrentView('auth');
          return;
        }
        if (!isAdminSessionVerified()) {
          setAdminOtpModalOpen(true);
          return;
        }
        setCurrentView('admin-dashboard');
        return;
      }

      // 4. Membership / Bundles
      if (view === 'membership' || pathname === '/membership' || pathname === '/bundles') {
        cleanUrlState('/membership');
        setCurrentView('membership');
        return;
      }

      // 5. Custom Services
      if (view === 'services' || view === 'service' || pathname === '/services' || pathname === '/service') {
        cleanUrlState('/resources');
        setCurrentView('resources');
        return;
      }

      // 6. Join Us / Linkinbio / Social Hub
      if (
        view === 'join' || view === 'join-us' || view === 'joinus' || view === 'bio' ||
        view === 'linkinbio' || view === 'links' || view === 'community' || view === 'linktree' ||
        pathname === '/join' || pathname === '/join-us' || pathname === '/joinus' ||
        pathname === '/bio' || pathname === '/linkinbio' || pathname === '/links' ||
        pathname === '/community' || pathname === '/linktree'
      ) {
        cleanUrlState('/join-us');
        setCurrentView('join-us');
        return;
      }

      // 7. About Us
      if (view === 'about' || pathname === '/about') {
        cleanUrlState('/about');
        setCurrentView('about');
        return;
      }

      // 8. Contact Us
      if (view === 'contact' || pathname === '/contact') {
        cleanUrlState('/contact');
        setCurrentView('contact');
        return;
      }

      // 9. FAQ
      if (view === 'faq' || pathname === '/faq') {
        cleanUrlState('/faq');
        setCurrentView('faq');
        return;
      }

      // 10. Sitemap
      if (view === 'sitemap' || pathname === '/sitemap') {
        cleanUrlState('/sitemap');
        setCurrentView('sitemap');
        return;
      }

      // 13. Order Confirmation
      let orderIdParam = params.get('orderId') || params.get('id');
      if (!orderIdParam && (pathname.includes('/order-confirmation') || pathname.includes('/order-success') || pathname.includes('/thank-you'))) {
        const rawSegments = (window.location.pathname || '').split('/').filter(Boolean);
        if (rawSegments.length >= 2) {
          orderIdParam = rawSegments[1];
        }
      }

      if (
        view === 'order-confirmation' || 
        view === 'thank-you' || 
        view === 'order-success' ||
        pathname.startsWith('/order-confirmation') ||
        pathname.startsWith('/order-success') ||
        pathname.startsWith('/thank-you')
      ) {
        if (orderIdParam) {
          cleanUrlState(`/order-confirmation/${orderIdParam}`);
          setConfirmedOrderId(orderIdParam);
          const existingOrdersRaw = localStorage.getItem('zdf_user_orders');
          const existingOrders: Order[] = existingOrdersRaw ? JSON.parse(existingOrdersRaw) : [];
          const found = existingOrders.find(o => o.id.toLowerCase() === orderIdParam!.toLowerCase());
          if (found) {
            setConfirmedOrder(found);
          }
        } else {
          cleanUrlState('/order-confirmation');
        }
        setCurrentView('order-confirmation');
        return;
      }

      // 14. Legal Pages (/refund, /privacy, /terms, /legal)
      if (view === 'refund' || view === 'refund-policy' || pathname === '/refund' || pathname === '/refund-policy' || pathname === '/legal/refund') {
        cleanUrlState('/refund');
        setLegalDocId('refund');
        setCurrentView('legal');
        return;
      }

      if (view === 'privacy' || view === 'privacy-policy' || pathname === '/privacy' || pathname === '/privacy-policy' || pathname === '/legal/privacy') {
        cleanUrlState('/privacy');
        setLegalDocId('privacy');
        setCurrentView('legal');
        return;
      }

      if (
        view === 'terms' || view === 'terms-conditions' || view === 'terms-and-conditions' ||
        pathname === '/terms' || pathname === '/terms-conditions' || pathname === '/terms-and-conditions' || pathname === '/legal/terms'
      ) {
        cleanUrlState('/terms');
        setLegalDocId('terms');
        setCurrentView('legal');
        return;
      }

      if (view === 'legal' || pathname === '/legal') {
        if (doc === 'privacy') {
          cleanUrlState('/privacy');
          setLegalDocId('privacy');
        } else if (doc === 'terms') {
          cleanUrlState('/terms');
          setLegalDocId('terms');
        } else {
          cleanUrlState('/refund');
          setLegalDocId('refund');
        }
        setCurrentView('legal');
        return;
      }

      // 15. Cart & Checkout
      if (view === 'cart' || view === 'bag' || pathname === '/cart' || pathname === '/bag') {
        cleanUrlState('/cart');
        setCurrentView('cart');
        return;
      }

      if (view === 'checkout' || view === 'pay' || pathname === '/checkout' || pathname === '/pay') {
        cleanUrlState('/checkout');
        setCurrentView('checkout');
        return;
      }

      // 16. Single Product (/product/:id or /product/:slug)
      if (pathname.startsWith('/product/')) {
        const pathProdId = pathname.replace(/^\/product\//, '').split('/')[0];
        if (pathProdId) {
          const found = products.find(p => 
            p.id.toLowerCase() === pathProdId.toLowerCase() || 
            (p.slug && p.slug.toLowerCase() === pathProdId.toLowerCase()) ||
            slugify(p.title) === pathProdId.toLowerCase()
          );
          if (found) {
            setSelectedProduct(found);
            setCurrentView('product');
            const cleanSlug = found.slug || slugify(found.title) || found.id;
            if (pathProdId !== cleanSlug) {
              try {
                window.history.replaceState({}, '', `/product/${cleanSlug}`);
              } catch (e) {}
            }
            return;
          } else {
            setCurrentView('not-found');
            return;
          }
        }
      }

      if (view === 'product' && prodId) {
        const found = products.find(p => 
          p.id.toLowerCase() === prodId.toLowerCase() || 
          (p.slug && p.slug.toLowerCase() === prodId.toLowerCase()) ||
          slugify(p.title) === prodId.toLowerCase()
        );
        if (found) {
          setSelectedProduct(found);
          setCurrentView('product');
          const cleanSlug = found.slug || slugify(found.title) || found.id;
          try {
            window.history.replaceState({}, '', `/product/${cleanSlug}`);
          } catch (e) {}
          return;
        } else {
          setCurrentView('not-found');
          return;
        }
      }

      // 17. Resources Catalog (/resources, /store, /catalog, /products)
      if (
        view === 'resources' || pathname === '/resources' || pathname === '/store' || pathname === '/catalog' || pathname === '/products' ||
        cat !== 'all' || sub !== 'all' || q !== ''
      ) {
        let cleanResPath = '/resources';
        if (cat !== 'all') {
          cleanResPath += `/${cat}`;
          if (sub !== 'all') {
            cleanResPath += `/${sub}`;
          }
        }
        if (q) {
          cleanResPath += `?q=${encodeURIComponent(q)}`;
        }
        cleanUrlState(cleanResPath);
        setCurrentView('resources');
        setSelectedCategorySlug(cat);
        setSelectedSubcategorySlug(sub);
        if (q) setSearchQuery(q);
        return;
      }

      // 18. Home Route
      if (pathname === '/' || pathname === '' || view === 'home') {
        cleanUrlState('/');
        setCurrentView('home');
        return;
      }

      // Fallback: 404
      setCurrentView('not-found');
    } catch (e) {
      // safe fallback
    }
  };

  useEffect(() => {
    syncFromUrl();
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, [products]);

  // Navigation Handlers (Clean URLs)
  const handleNavigateHome = () => {
    setCurrentView('home');
    setSelectedProduct(null);
    setSelectedCategorySlug('all');
    setSelectedSubcategorySlug('all');
    try {
      window.history.pushState({}, '', '/');
    } catch (e) {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Auth & Dashboard Navigation Handlers
  const handleNavigateAuth = (tab: 'signin' | 'signup' = 'signin') => {
    setAuthTab(tab);
    setCurrentView('auth');
    try {
      window.history.pushState({}, '', tab === 'signup' ? '/signup' : '/signin');
    } catch (e) {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateDashboard = () => {
    const saved = sessionStorage.getItem('zdf_auth_user');
    const user = currentUserProfile || (saved ? JSON.parse(saved) : null);
    if (!user) {
      handleNavigateAuth('signin');
      return;
    }
    if (user.role === 'admin') {
      if (!isAdminSessionVerified()) {
        setAdminOtpModalOpen(true);
        return;
      }
      setCurrentView('admin-dashboard');
      try {
        window.history.pushState({}, '', '/admin');
      } catch (e) {}
    } else {
      setCurrentView('dashboard');
      try {
        window.history.pushState({}, '', '/dashboard');
      } catch (e) {}
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePostAuthRedirect = (role: 'customer' | 'admin', user: UserProfile) => {
    setAuthModalOpen(false);
    setCurrentUserProfile(user);
    if (role === 'admin') {
      if (!isAdminSessionVerified()) {
        setAdminOtpModalOpen(true);
        return;
      }
      setCurrentView('admin-dashboard');
      try {
        window.history.pushState({}, '', '/admin');
      } catch (e) {}
    } else {
      setCurrentView('dashboard');
      try {
        window.history.pushState({}, '', '/dashboard');
      } catch (e) {}
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAdminOtpSuccess = () => {
    setAdminOtpModalOpen(false);
    setCurrentView('admin-dashboard');
    try {
      window.history.pushState({}, '', '/admin');
    } catch (e) {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Sign out notice:', e);
    }
    try {
      sessionStorage.removeItem('zdf_auth_user');
      setAdminSessionVerified(false);
    } catch (e) {}
    setCurrentUserProfile(null);
    handleNavigateHome();
  };

  const handleNavigateFaq = () => {
    setCurrentView("faq");
    setSelectedProduct(null);
    try {
      window.history.pushState({}, "", "/faq");
    } catch(e) {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  const handleNavigateJoinUs = () => {
    setCurrentView('join-us');
    setSelectedProduct(null);
    try {
      window.history.pushState({}, '', '/join-us');
    } catch (e) {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateAbout = () => {
    setCurrentView('about');
    setSelectedProduct(null);
    try {
      window.history.pushState({}, '', '/about');
    } catch (e) {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateContact = () => {
    setCurrentView('contact');
    setSelectedProduct(null);
    try {
      window.history.pushState({}, '', '/contact');
    } catch (e) {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateSitemap = () => {
    setCurrentView('sitemap');
    setSelectedProduct(null);
    try {
      window.history.pushState({}, '', '/sitemap');
    } catch (e) {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateLegal = (docId: LegalDocId = 'refund') => {
    setLegalDocId(docId);
    setCurrentView('legal');
    setSelectedProduct(null);
    try {
      window.history.pushState({}, '', `/${docId}`);
    } catch (e) {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateResources = (catSlug: string = 'all', subSlug: string = 'all', query?: string) => {
    setCurrentView('resources');
    setSelectedProduct(null);
    setSelectedCategorySlug(catSlug);
    setSelectedSubcategorySlug(subSlug);
    if (query !== undefined) {
      setSearchQuery(query);
    }
    try {
      let path = '/resources';
      if (catSlug && catSlug !== 'all') {
        path += `/${catSlug}`;
        if (subSlug && subSlug !== 'all') {
          path += `/${subSlug}`;
        }
      }
      if (query && query.trim()) {
        const cleanQuery = encodeURIComponent(query.trim());
        path += `?q=${cleanQuery}`;
      }
      window.history.pushState({}, '', path);
    } catch (e) {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateNotFound = () => {
    setCurrentView('not-found');
    setSelectedProduct(null);
    try {
      window.history.pushState({}, '', '/404');
    } catch (e) {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setCurrentView('product');
    logAnalyticsEvent('product_view', { productId: product.id, title: product.title });
    try {
      const cleanSlug = product.slug || slugify(product.title) || product.id;
      window.history.pushState({}, '', `/product/${cleanSlug}`);
    } catch (e) {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateCart = () => {
    setCurrentView('cart');
    setSelectedProduct(null);
    try {
      window.history.pushState({}, '', '/cart');
    } catch (e) {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateCheckout = () => {
    setCurrentView('checkout');
    setSelectedProduct(null);
    try {
      window.history.pushState({}, '', '/checkout');
    } catch (e) {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = (item: any) => {
    let cartItem: CartItem;
    if ('monthlyPricePKR' in item) {
      cartItem = {
        productId: item.id,
        title: item.name,
        thumbnail: item.logo,
        pricePKR: item.monthlyPricePKR,
        priceUSD: item.monthlyPriceUSD,
        type: 'toolBundle',
        isSubscription: !item.duration?.toLowerCase().includes('lifetime'),
        billingInterval: item.duration,
        features: item.features
      };
    } else if ('shortDescription' in item || 'categoryId' in item) {
      cartItem = {
        productId: item.id,
        title: item.title,
        thumbnail: item.thumbnail || item.image || '',
        pricePKR: getProductPriceNumber(item, 'PKR'),
        priceUSD: getProductPriceNumber(item, 'USD'),
        type: 'product',
        category: item.categoryId,
        features: item.features
      };
    } else if ('productId' in item) {
      cartItem = item as CartItem;
    } else {
      cartItem = {
        productId: item.id || 'item-1',
        title: item.title || item.name || 'Digital Resource',
        thumbnail: item.thumbnail || item.logo || '',
        pricePKR: getProductPriceNumber(item, 'PKR'),
        priceUSD: getProductPriceNumber(item, 'USD'),
        type: item.type || 'product'
      };
    }

    setCartItems(prev => {
      const exists = prev.some(i => i.productId === cartItem.productId);
      const updated = exists ? prev : [...prev, cartItem];
      saveCartToDb(updated, currentUserProfile?.uid);
      if (!exists) {
        logAnalyticsEvent('product_click', { productId: cartItem.productId, title: cartItem.title });
      }
      return updated;
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCartItems(prev => {
      const target = prev.find(i => i.productId === productId);
      if (target) {
        setLastRemovedItem({ item: target, title: target.title });
      }
      const updated = prev.filter(i => i.productId !== productId);
      saveCartToDb(updated, currentUserProfile?.uid);
      return updated;
    });
  };

  const handleUndoRemove = () => {
    if (!lastRemovedItem) return;
    setCartItems(prev => {
      const updated = [...prev, lastRemovedItem.item];
      saveCartToDb(updated, currentUserProfile?.uid);
      return updated;
    });
    setLastRemovedItem(null);
  };

  const handleApplyCoupon = (coupon: CouponDiscount) => {
    setAppliedCoupon(coupon);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
  };

  const handleOrderPlaced = (order: Order) => {
    setConfirmedOrder(order);
    setCartItems([]);
    saveCartToDb([], currentUserProfile?.uid);
    setCurrentView('order-confirmation');
    try {
      window.history.pushState({}, '', `/order-confirmation/${order.id}`);
    } catch (e) {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuickBuy = (item: PurchasableItem) => {
    handleAddToCart(item);
    handleNavigateCheckout();
  };

  const handleOrderSuccess = (order: Order) => {
    setCheckoutItem(null);
    handleOrderPlaced(order);
  };

  const scrollToSection = (id: string) => {
    if (currentView !== 'home') {
      handleNavigateHome();
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Unified SEO calculation for active view
  const seoConfig = React.useMemo(() => {
    // 1. Home
    if (currentView === 'home') {
      return {
        ...STATIC_PAGES_SEO.home,
        canonical: '/',
        faqList: DEFAULT_GLOBAL_FAQS.slice(0, 5).map(f => ({ question: f.question, answer: f.answer })),
        breadcrumbs: [{ name: 'Home', url: '/' }]
      };
    }
    // 2. Resources Catalog / Category
    if (currentView === 'resources') {
      if (selectedCategorySlug && selectedCategorySlug !== 'all') {
        const cat = categories.find(c => c.slug === selectedCategorySlug || c.id === selectedCategorySlug);
        if (cat) {
          const catKeywords = SEO_KEYWORDS.categorySpecific[cat.id] || SEO_KEYWORDS.coreProduct;
          return {
            title: formatCategorySEOTitle(cat.name),
            description: formatCategorySEODesc(cat.name, cat.description),
            keywords: [...catKeywords, ...SEO_KEYWORDS.primary],
            canonical: `/resources/${encodeURIComponent(cat.slug || cat.id)}`,
            noindex: false,
            ogType: 'website' as const,
            breadcrumbs: [
              { name: 'Home', url: '/' },
              { name: 'Digital Resources', url: '/resources' },
              { name: cat.name, url: `/resources/${encodeURIComponent(cat.slug || cat.id)}` }
            ]
          };
        }
      }
      return {
        ...STATIC_PAGES_SEO.resources,
        canonical: '/resources',
        breadcrumbs: [
          { name: 'Home', url: '/' },
          { name: 'Digital Resources', url: '/resources' }
        ]
      };
    }
    // 3. Product Details
    if (currentView === 'product' && selectedProduct) {
      const prodKeywords = [
        ...(selectedProduct.focusKeyword ? [selectedProduct.focusKeyword] : []),
        ...(selectedProduct.searchKeywords || []),
        ...(selectedProduct.tags || []),
        ...(SEO_KEYWORDS.categorySpecific[selectedProduct.categoryId] || []),
        ...SEO_KEYWORDS.coreProduct.slice(0, 4),
        ...SEO_KEYWORDS.primary
      ];
      const categoryObj = categories.find(c => c.id === selectedProduct.categoryId || c.slug === selectedProduct.categoryId);
      const cleanSlug = selectedProduct.slug || slugify(selectedProduct.title) || selectedProduct.id;
      const prodCanonical = `/product/${cleanSlug}`;
      return {
        title: selectedProduct.metaTitle?.trim() || formatProductSEOTitle(selectedProduct.title),
        description: selectedProduct.metaDescription?.trim() || formatProductSEODesc(selectedProduct.title),
        keywords: prodKeywords,
        canonical: prodCanonical,
        ogImage: selectedProduct.thumbnail || selectedProduct.image,
        ogType: 'product' as const,
        noindex: false,
        productData: {
          id: selectedProduct.id,
          title: selectedProduct.title,
          description: selectedProduct.description,
          pricePKR: selectedProduct.pricePKR,
          priceUSD: selectedProduct.priceUSD,
          rating: selectedProduct.rating,
          reviewCount: selectedProduct.reviewCount,
          image: selectedProduct.thumbnail || selectedProduct.image,
          categoryId: categoryObj?.name || selectedProduct.categoryId,
          inStock: true
        },
        breadcrumbs: [
          { name: 'Home', url: '/' },
          { name: 'Resources', url: '/resources' },
          ...(categoryObj ? [{ name: categoryObj.name, url: `/resources?category=${encodeURIComponent(categoryObj.slug || categoryObj.id)}` }] : []),
          { name: selectedProduct.title, url: prodCanonical }
        ]
      };
    }
    // 4. About Us
    if (currentView === 'about') {
      return STATIC_PAGES_SEO.about;
    }
    // 5. Contact Us
    if (currentView === 'contact') {
      return STATIC_PAGES_SEO.contact;
    }
    // 6. FAQ
    if (currentView === 'faq') {
      return {
        ...STATIC_PAGES_SEO.faq,
        faqList: DEFAULT_GLOBAL_FAQS.map(f => ({ question: f.question, answer: f.answer }))
      };
    }
    // 9. Join Us Community
    if (currentView === 'join-us') {
      return STATIC_PAGES_SEO['join-us'];
    }
    // 9.1 HTML Sitemap
    if (currentView === 'sitemap') {
      return STATIC_PAGES_SEO.sitemap;
    }
    // 10. Legal Docs
    if (currentView === 'legal') {
      if (legalDocId === 'refund') return STATIC_PAGES_SEO.refund;
      if (legalDocId === 'privacy') return STATIC_PAGES_SEO.privacy;
      return STATIC_PAGES_SEO.terms;
    }
    // 11. Auth (Sign in / Sign up) (noindex)
    if (currentView === 'auth') {
      return STATIC_PAGES_SEO.auth;
    }
    // 12. Cart (noindex)
    if (currentView === 'cart') {
      return STATIC_PAGES_SEO.cart;
    }
    // 13. Checkout (noindex)
    if (currentView === 'checkout') {
      return STATIC_PAGES_SEO.checkout;
    }
    // 14. Customer Dashboard (noindex)
    if (currentView === 'dashboard') {
      return STATIC_PAGES_SEO.dashboard;
    }
    // 15. Admin Panel (noindex)
    if (currentView === 'admin-dashboard') {
      return STATIC_PAGES_SEO.admin;
    }
    // 16. Order Confirmation (noindex)
    if (currentView === 'order-confirmation') {
      return {
        title: 'Order Confirmation | Zohaib DigiForge',
        description: 'Your Zohaib DigiForge order has been placed. Instant download delivery via Google Drive.',
        keywords: ['order confirmation'],
        canonical: '/order-confirmation',
        noindex: true
      };
    }
    // 17. Search (noindex)
    if (currentView === 'search') {
      return {
        title: 'Search Results | Zohaib DigiForge',
        description: 'Search results for digital resources, courses, templates, and software on Zohaib DigiForge.',
        keywords: ['search results'],
        canonical: `/resources?search=${encodeURIComponent(searchQuery || '')}`,
        noindex: true
      };
    }
    // 18. Not Found 404 (noindex)
    return STATIC_PAGES_SEO.notFound;
  }, [currentView, selectedProduct, selectedCategorySlug, categories, legalDocId, searchQuery]);

  return (
    <div className="min-h-screen bg-[#0A0F1D] text-white flex flex-col font-['Poppins',sans-serif] select-none relative w-full max-w-full overflow-x-hidden">
      
      {/* Anti-Theft Content, Text & Image Privacy Protection System */}
      <ContentProtection appName="Zohaib DigiForge" />

      {/* Animated Custom Cursor & Brand Preloader */}
      <CustomCursor />
      <GlobalPreloader isLoading={initialAppLoading} />
      <TopLoadingBar isNavigating={isNavigating} />

      {/* Global Standard SEO Meta Tags & Head Controller */}
      <SEO {...seoConfig} />

      {/* Top Sticky Glass Navbar with Desktop Mega Menu & Mobile Accordion */}
      <Navbar
        currency={currency}
        setCurrency={setCurrency}
        cartCount={cartItems.length}
        onOpenCart={handleNavigateCart}
        onNavigateCart={handleNavigateCart}
        onOpenTracker={() => {
          setActiveTrackedOrder(null);
          setTrackerModalOpen(true);
        }}
        onNavigateAbout={handleNavigateAbout}
        onNavigateContact={handleNavigateContact}
        onNavigateFaq={handleNavigateFaq}
        onOpenAuthModal={() => {
          const saved = sessionStorage.getItem('zdf_auth_user');
          const user = currentUserProfile || (saved ? JSON.parse(saved) : null);
          if (user) {
            handleNavigateDashboard();
          } else {
            handleNavigateAuth('signin');
          }
        }}
        onNavigateDashboard={handleNavigateDashboard}
        currentUserProfile={currentUserProfile}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        categories={categories}
        subcategories={subcategories}
        onNavigateHome={handleNavigateHome}
        onNavigateResources={handleNavigateResources}
        currentView={currentView === 'product' ? 'resources' : currentView}
      />

      {/* Main Content */}
      <main className="flex-1">
        <RouteErrorBoundary>
          <Suspense fallback={<PageLoadingFallback />}>
          {currentView === 'auth' ? (
          <AuthPage
            initialTab={authTab}
            onSuccessRedirect={handlePostAuthRedirect}
            onNavigateHome={handleNavigateHome}
            onNavigateLegal={handleNavigateLegal}
            onOpenLegalModal={(type) => setLegalDocType(type)}
          />
        ) : currentView === 'dashboard' ? (
          <CustomerDashboard
            user={currentUserProfile || {
              uid: 'guest',
              email: '',
              displayName: 'Valued Customer',
              role: 'customer',
              createdAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString()
            }}
            products={products}
            onSignOut={handleSignOut}
            onNavigateResources={(cat, sub, q) => handleNavigateResources(cat || 'all', sub || 'all', q || '')}
            onViewProduct={handleViewProduct}
          />
        ) : currentView === 'admin-dashboard' ? (
          <AdminDashboard
            user={currentUserProfile || {
              uid: 'admin',
              email: 'zohaibdigiforge@gmail.com',
              displayName: 'Store Administrator',
              role: 'admin',
              createdAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString()
            }}
            onSignOut={handleSignOut}

            onOpenOrderTracker={() => {
              setActiveTrackedOrder(null);
              setTrackerModalOpen(true);
            }}
            onOpenJoinLinksAdmin={() => setJoinLinksAdminModalOpen(true)}
            onNavigateHome={handleNavigateHome}
            onNavigateResources={() => handleNavigateResources('all')}
            onNavigateJoinUs={handleNavigateJoinUs}
          />
        ) : currentView === 'cart' ? (
          <CartPage
            cartItems={cartItems}
            currency={currency}
            appliedCoupon={appliedCoupon}
            lastRemovedItem={lastRemovedItem}
            recommendedProducts={products.slice(0, 3)}
            onRemoveItem={handleRemoveFromCart}
            onUndoRemove={handleUndoRemove}
            onApplyCoupon={handleApplyCoupon}
            onRemoveCoupon={handleRemoveCoupon}
            onProceedToCheckout={handleNavigateCheckout}
            onContinueShopping={() => handleNavigateResources('all')}
            onViewProduct={handleViewProduct}
          />
        ) : currentView === 'checkout' ? (
          <CheckoutPage
            cartItems={cartItems}
            currency={currency}
            appliedCoupon={appliedCoupon}
            currentUser={currentUserProfile}
            onBackToCart={handleNavigateCart}
            onOrderPlaced={handleOrderPlaced}
            onApplyCoupon={handleApplyCoupon}
            onRemoveCoupon={handleRemoveCoupon}
          />
        ) : currentView === 'order-confirmation' ? (
          <OrderConfirmationPage
            order={confirmedOrder}
            orderId={confirmedOrderId || undefined}
            currency={currency}
            currentUser={currentUserProfile}
            bundles={[]}
            products={products}
            onTrackOrder={(orderId) => {
              setActiveTrackedOrder(confirmedOrder || {
                id: orderId,
                customerName: 'Valued Customer',
                email: 'customer@example.com',
                whatsapp: '03406070632',
                items: [],
                totalAmountPKR: 0,
                totalAmountUSD: 0,
                paymentMethod: 'JazzCash',
                status: 'Pending Verification',
                createdAt: new Date().toISOString()
              });
              setTrackerModalOpen(true);
            }}
            onOpenSignUp={(email) => handleNavigateAuth('signup')}
            onContinueShopping={() => handleNavigateResources('all')}
            onViewBundle={(bundle) => {
              handleNavigateResources('all');
            }}
            onViewProduct={handleViewProduct}
            onNavigateLegal={handleNavigateLegal}
            onNavigateContact={handleNavigateContact}
        onNavigateFaq={handleNavigateFaq}
            onNavigateDashboard={handleNavigateDashboard}
            onUserCreated={(profile) => setCurrentUserProfile(profile)}
          />
        ) : currentView === 'join-us' ? (
          <JoinUsPage
            onNavigateHome={handleNavigateHome}
            onNavigateResources={() => handleNavigateResources('all')}
            onNavigateContact={handleNavigateContact}
        onNavigateFaq={handleNavigateFaq}
          />
        ) : currentView === 'about' ? (
          <AboutPage
            onNavigateHome={handleNavigateHome}
            onNavigateResources={handleNavigateResources}
            onNavigateJoinUs={handleNavigateJoinUs}
            onNavigateContact={handleNavigateContact}
          />
        ) : currentView === 'contact' ? (
          <ContactPage
            onNavigateHome={handleNavigateHome}
            onNavigateResources={handleNavigateResources}
            onOpenTracker={() => {
              setActiveTrackedOrder(null);
              setTrackerModalOpen(true);
            }}
            onNavigateJoinUs={handleNavigateJoinUs}
          />
        ) : currentView === "faq" ? (
          <FAQPage
            onNavigateContact={handleNavigateContact}
          />
        ) : currentView === 'sitemap' ? (
          <SitemapPage
            onNavigateHome={handleNavigateHome}
            onNavigateResources={handleNavigateResources}
            onNavigateAbout={handleNavigateAbout}
            onNavigateContact={handleNavigateContact}
            onNavigateFaq={handleNavigateFaq}
            onNavigateLegal={handleNavigateLegal}
            onNavigateJoinUs={handleNavigateJoinUs}
            onOpenTrackerModal={() => {
              setActiveTrackedOrder(null);
              setTrackerModalOpen(true);
            }}
            categories={categories}
          />
        ) : currentView === 'legal' ? (
          <LegalPage
            initialDocId={legalDocId}
            onNavigateHome={handleNavigateHome}
            onNavigateContact={handleNavigateContact}
        onNavigateFaq={handleNavigateFaq}
            onNavigateResources={handleNavigateResources}
          />
        ) : currentView === 'product' && selectedProduct ? (
          <ProductPage
            product={selectedProduct}
            allProducts={products}
            categories={categories}
            subcategories={subcategories}
            currency={currency}
            onBack={() => handleNavigateResources(selectedCategorySlug, selectedSubcategorySlug)}
            onBuyNow={handleQuickBuy}
            onAddToCart={handleAddToCart}
            onSelectRelatedProduct={(prod) => handleViewProduct(prod)}
            onNavigateCategory={(catSlug) => handleNavigateResources(catSlug, 'all')}
          />
        ) : currentView === 'resources' ? (
          <ResourcesPage
            products={products}
            categories={categories}
            subcategories={subcategories}
            currency={currency}
            onViewProduct={handleViewProduct}
            onQuickBuy={handleQuickBuy}
            onNavigateHome={handleNavigateHome}
            initialCategorySlug={selectedCategorySlug}
            initialSubcategorySlug={selectedSubcategorySlug}
            initialSearchQuery={searchQuery}
            onNavigateContact={handleNavigateContact}
            onNavigateFaq={handleNavigateFaq}
            onNavigateJoinUs={handleNavigateJoinUs}
            onNavigateResources={(catSlug) => handleNavigateResources(catSlug || 'all')}
          />
        ) : currentView === 'search' ? (
          <SearchResultsPage
            query={searchViewQuery}
            onUpdateQuery={(newQ) => setSearchViewQuery(newQ)}
            products={products}
            categories={categories}
            subcategories={subcategories}
            currency={currency}
            onViewProduct={handleViewProduct}
            onQuickBuy={handleQuickBuy}
            onNavigateResources={(catSlug) => handleNavigateResources(catSlug || 'all')}
            onNavigateHome={handleNavigateHome}
          />
        ) : currentView === 'not-found' ? (
          <NotFoundPage
            onNavigateHome={handleNavigateHome}
            onNavigateResources={handleNavigateResources}
            onNavigateAbout={handleNavigateAbout}
            onNavigateContact={handleNavigateContact}
        onNavigateFaq={handleNavigateFaq}
            onNavigateLegal={handleNavigateLegal}
          />
        ) : (
          <div>
            {/* 1. HERO SECTION */}
            <Hero
              onBrowseClick={() => handleNavigateResources('all')}
              onHowItWorksClick={() => {
                const el = document.getElementById('how-it-works');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              onJoinUsClick={handleNavigateJoinUs}
              totalAssetsCount={products.length}
            />

            {/* 2. TRUST BAR */}
            <TrustBar />

            {/* 3. FLAT PRICE BANNER */}
            <FlatPriceBanner
              currency={currency}
              onBrowseClick={() => handleNavigateResources('all')}
            />

            {/* CATEGORY SHORTCUTS */}
            <CategoryShortcuts
              categories={categories}
              products={products}
              onNavigateCategory={(catSlug) => handleNavigateResources(catSlug)}
            />

            {/* TOP SELLING & HANDPICKED DEALS */}
            <TopSelling
              products={products}
              currency={currency}
              selectedCategory={topSellingCategory}
              onSelectCategory={(cat) => setTopSellingCategory(cat)}
              searchQuery={topSellingSearch}
              setSearchQuery={setTopSellingSearch}
              onViewDetails={handleViewProduct}
              onQuickBuy={handleQuickBuy}
            />

            {/* 4. DEDICATED SECTION PER CATEGORY */}
            <CategorySections
              categories={categories}
              products={products}
              currency={currency}
              onNavigateCategory={(catSlug) => handleNavigateResources(catSlug)}
              onViewDetails={handleViewProduct}
              onQuickBuy={handleQuickBuy}
            />

            {/* CATEGORIES OVERVIEW GRID */}
            <CategoryGrid
              selectedCategory="all"
              onSelectCategory={(catName) => handleNavigateResources(catName)}
              products={products}
              categories={categories}
            />

            {/* 5. HOW IT WORKS */}
            <HowItWorks />

            {/* 6. PAYMENT METHODS */}
            <PaymentMethods />

            {/* 7. GENERAL DIGITAL ASSETS FAQS */}
            <FAQSection
              title="General Digital Assets & Support FAQs"
              subtitle="General Digital Assets FAQs"
              description="Find quick answers regarding digital resources, instant Google Drive delivery, and lifetime license access."
              onNavigateContact={handleNavigateContact}
              onNavigateFAQ={handleNavigateFaq}
            />

            {/* 8. COMMUNITY & RESOURCES CALLOUT */}
            <CommunityCallout
              onNavigateResources={handleNavigateResources}
              onNavigateJoinUs={handleNavigateJoinUs}
            />
          </div>
        )}
        </Suspense>
        </RouteErrorBoundary>
      </main>

      {/* FOOTER & FLOATING SUPPORT */}
      <Footer
        onOpenLegalModal={(type) => setLegalDocType(type)}
        onNavigateHome={handleNavigateHome}
        onNavigateResources={() => handleNavigateResources('all')}
        onNavigateAbout={handleNavigateAbout}
        onNavigateContact={handleNavigateContact}
        onNavigateFaq={handleNavigateFaq}
        onNavigateSitemap={handleNavigateSitemap}
        onNavigateLegal={handleNavigateLegal}
        onNavigateJoinUs={handleNavigateJoinUs}
        onOpenTrackerModal={() => {
          setActiveTrackedOrder(null);
          setTrackerModalOpen(true);
        }}
      />

      {/* Floating Support - WhatsApp (Mounted cleanly once preloader finishes) */}
      {!initialAppLoading && (
        <Suspense fallback={null}>
          <FloatingWhatsApp />
        </Suspense>
      )}

      {/* Modals & Overlays */}
      <Suspense fallback={null}>
        <CheckoutModal
          item={checkoutItem}
          currency={currency}
          onClose={() => setCheckoutItem(null)}
          onSuccess={handleOrderSuccess}
        />

        {trackerModalOpen && (
          <OrderTrackerModal
            initialOrder={activeTrackedOrder}
            onClose={() => {
              setTrackerModalOpen(false);
              setActiveTrackedOrder(null);
            }}
          />
        )}

        <LegalModal
          docType={legalDocType}
          onClose={() => setLegalDocType(null)}
          onOpenFullPage={handleNavigateLegal}
        />

        {/* Link-in-Bio (/join) Live Customizer & Analytics Modal */}
        <JoinLinksAdminModal
          isOpen={joinLinksAdminModalOpen}
          onClose={() => setJoinLinksAdminModalOpen(false)}
          onPreviewBioPage={handleNavigateJoinUs}
        />

        {/* Sign In / Sign Up Modal */}
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          initialMode={authTab}
          onSuccess={(user) => handlePostAuthRedirect(user.role, user)}
          onOpenFullAuthPage={() => {
            setAuthModalOpen(false);
            handleNavigateAuth('signin');
          }}
        />

        {/* Admin OTP Verification Modal */}
        <AdminOtpModal
          isOpen={adminOtpModalOpen}
          onClose={() => setAdminOtpModalOpen(false)}
          onSuccess={handleAdminOtpSuccess}
        />
      </Suspense>

    </div>
  );
}

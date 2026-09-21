import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Menu, 
  X, 
  ChevronDown, 
  ChevronRight,
  Sparkles, 
  Wrench, 
  User, 
  LogIn,
  FolderOpen,
  Sun,
  Moon,
  ShoppingBag,
  Info,
  Search,
  MessageCircle,
  ShieldCheck,
  Grid,
  Home,
  Tag,
  Globe,
  Package
} from 'lucide-react';
import { Currency, Category, Subcategory, UserProfile } from '../types';
import { MegaMenu } from './MegaMenu';
import { BRAND_ICON } from '../lib/brandAssets';

interface NavbarProps {
  currency?: Currency;
  setCurrency?: (c: Currency) => void;
  cartCount?: number;
  onOpenCart?: () => void;
  onNavigateCart?: () => void;
  onOpenSearch?: () => void;
  onOpenTracker?: () => void;
  onOpenMembership?: () => void;
  onOpenReviewModal?: (orderId: string, productId?: string, productTitle?: string) => void;
  onNavigateMembership?: () => void;
  onNavigateAbout?: () => void;
  onNavigateContact?: () => void;
  onNavigateReviews?: (productId?: string) => void;
  onOpenAuthModal?: () => void;
  onNavigateDashboard?: () => void;
  currentUserProfile?: UserProfile | null;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  categories: Category[];
  subcategories: Subcategory[];
  onNavigateHome: () => void;
  onNavigateResources: (catSlug?: string, subSlug?: string) => void;
  currentView: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currency,
  setCurrency,
  cartCount = 0,
  onNavigateCart,
  onOpenSearch,
  onOpenMembership,
  onOpenReviewModal,
  onNavigateMembership,
  onNavigateAbout,
  onNavigateContact,
  onNavigateReviews,
  onOpenAuthModal,
  onNavigateDashboard,
  currentUserProfile,
  onOpenTracker,
  categories = [],
  subcategories = [],
  onNavigateHome,
  onNavigateResources,
  currentView,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileCategoriesExpanded, setMobileCategoriesExpanded] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);

  // Intent delay for mega menu
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      setMegaMenuOpen(true);
    }, 180);
  };

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      setMegaMenuOpen(false);
    }, 220);
  };

  // Check if user is logged in
  const authUser = (() => {
    try {
      const saved = sessionStorage.getItem('zdf_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })();

  const activeUser = currentUserProfile || authUser;
  const activeUserName = activeUser?.displayName || activeUser?.name || 'Member';

  const handleUserIconClick = () => {
    if (activeUser) {
      if (onNavigateDashboard) {
        onNavigateDashboard();
      } else if (onOpenAuthModal) {
        onOpenAuthModal();
      }
    } else {
      if (onOpenAuthModal) {
        onOpenAuthModal();
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0A0F1D]/90 backdrop-blur-xl border-b border-white/10 transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Brand Logo */}
        <div 
          id="navbar-brand-logo"
          className="flex items-center gap-1.5 min-[360px]:gap-2 sm:gap-3 cursor-pointer group shrink-0" 
          onClick={onNavigateHome}
        >
          <div className="relative flex items-center justify-center w-9 h-9 min-[360px]:w-11 min-[360px]:h-11 rounded-full bg-gradient-to-br from-[#0D6EFD] to-[#28B9FF] p-0.5 shadow-lg shadow-[#0D6EFD]/30 shrink-0">
            <div className="w-full h-full bg-[#0A0F1D] rounded-full flex items-center justify-center overflow-hidden p-0.5">
              <img 
                src={BRAND_ICON} 
                alt="Zohaib DigiForge Icon" 
                width="44"
                height="44"
                loading="eager"
                decoding="async"
                className="w-full h-full object-contain rounded-full group-hover:scale-105 transition-transform"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.src !== window.location.origin + '/icon.png') {
                    target.src = '/icon.png';
                  }
                }}
              />
            </div>
            <div className="absolute top-0 right-0 w-2.5 h-2.5 min-[360px]:w-3 min-[360px]:h-3 bg-[#22C55E] rounded-full ring-2 ring-[#0A0F1D] animate-ping" />
            <div className="absolute top-0 right-0 w-2.5 h-2.5 min-[360px]:w-3 min-[360px]:h-3 bg-[#22C55E] rounded-full ring-2 ring-[#0A0F1D]" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="font-bold text-xs min-[340px]:text-sm min-[380px]:text-base sm:text-xl tracking-tight text-white whitespace-nowrap">
                Zohaib <span className="text-[#28B9FF]">DigiForge</span>
              </span>
            </div>
            <p className="hidden sm:block text-[11px] text-slate-400 font-medium">
              Empowering Learning. Powering Success.
            </p>
          </div>
        </div>

        {/* 1. Home | 2. About Us | 3. Services | 4. Resources | 5. Contact Us | 6. Track Order */}
        <nav 
          id="navbar-nav-links"
          className="hidden md:flex items-center gap-4 lg:gap-6 text-sm font-medium text-slate-300"
        >
          {/* Home */}
          <button 
            id="nav-link-home"
            onClick={onNavigateHome} 
            className="transition-colors flex items-center gap-1.5 py-1 text-slate-300 hover:text-white cursor-pointer"
          >
            <Home className="w-3.5 h-3.5 text-[#28B9FF] shrink-0" />
            <span>Home</span>
          </button>

          {/* About Us */}
          <button 
            id="nav-link-about"
            onClick={() => onNavigateAbout && onNavigateAbout()} 
            className="transition-colors flex items-center gap-1.5 py-1 text-slate-300 hover:text-white cursor-pointer"
          >
            <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>About Us</span>
          </button>

          {/* Resources with Simple List Dropdown */}
          <div 
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <button 
              id="nav-link-resources"
              onClick={() => onNavigateResources('all')} 
              className="transition-colors flex items-center gap-1.5 py-1 text-slate-300 hover:text-white cursor-pointer"
            >
              <FolderOpen className="w-3.5 h-3.5 text-[#28B9FF] shrink-0" />
              <span>Resources</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${megaMenuOpen ? 'rotate-180 text-[#28B9FF]' : 'text-slate-400'}`} />
            </button>

            {/* Desktop Simple List Dropdown for Resources */}
            {megaMenuOpen && (
              <MegaMenu
                categories={categories}
                subcategories={subcategories}
                onSelectCategory={(catSlug) => {
                  setMegaMenuOpen(false);
                  onNavigateResources(catSlug, 'all');
                }}
                onSelectSubcategory={(catSlug, subSlug) => {
                  setMegaMenuOpen(false);
                  onNavigateResources(catSlug, subSlug);
                }}
                onClose={() => setMegaMenuOpen(false)}
              />
            )}
          </div>

          {/* Contact Us */}
          <button 
            id="nav-link-contact"
            onClick={() => onNavigateContact && onNavigateContact()} 
            className="transition-colors flex items-center gap-1.5 py-1 text-slate-300 hover:text-white cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Contact Us</span>
          </button>

          {/* Track Your Order */}
          <button 
            id="nav-link-track"
            onClick={() => onOpenTracker && onOpenTracker()} 
            className="transition-colors flex items-center gap-1.5 py-1 text-slate-300 hover:text-white cursor-pointer"
          >
            <Package className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
            <span>Track Order</span>
          </button>
        </nav>

        {/* Right Icons: Shopping Cart | Auth | Mobile Menu */}
        <div id="navbar-action-icons" className="flex items-center gap-1.5 min-[360px]:gap-2 sm:gap-3">
          
          {/* Shopping Cart Button */}
          <button
            id="nav-cart-btn"
            onClick={onNavigateCart}
            aria-label={`Shopping Cart with ${cartCount} items`}
            title={`View Cart (${cartCount})`}
            className="relative p-1.5 min-[360px]:p-2 sm:p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-slate-200 hover:text-white transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#0D6EFD]/50 group cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 min-[360px]:w-5 min-[360px]:h-5 text-slate-300 group-hover:text-[#28B9FF] transition-colors" />
            {cartCount > 0 && (
              <span key={cartCount} className="absolute -top-1 -right-1 min-[360px]:-top-1.5 min-[360px]:-right-1.5 w-4 h-4 min-[360px]:w-5 min-[360px]:h-5 bg-[#22C55E] text-slate-950 text-[9px] min-[360px]:text-[10px] font-black rounded-full flex items-center justify-center shadow-md animate-pop-badge">
                {cartCount}
              </span>
            )}
          </button>


          {/* Signin / Signup / Account Dashboard Icon */}
          <button
            id="nav-auth-icon-button"
            onClick={handleUserIconClick}
            aria-label={activeUser ? 'My Account Dashboard' : 'Sign In / Sign Up'}
            title={activeUser ? `Logged in as ${activeUserName}` : 'Sign In / Sign Up'}
            className="relative p-1.5 min-[360px]:p-2 sm:p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-slate-200 hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 group"
          >
            {activeUser ? (
              <div className="w-4 h-4 min-[360px]:w-5 min-[360px]:h-5 rounded-full bg-gradient-to-br from-[#0D6EFD] to-[#22C55E] flex items-center justify-center text-[9px] min-[360px]:text-[11px] font-black text-white">
                {activeUserName.charAt(0).toUpperCase()}
              </div>
            ) : (
              <User className="w-4 h-4 min-[360px]:w-5 min-[360px]:h-5 text-slate-300 group-hover:text-[#28B9FF] transition-colors" />
            )}
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            id="nav-mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`md:hidden p-1.5 min-[360px]:p-2 rounded-xl transition-all duration-200 ${
              mobileMenuOpen 
                ? 'bg-[#0D6EFD] text-white border border-[#28B9FF]/50 shadow-lg shadow-[#0D6EFD]/30' 
                : 'bg-slate-900 border border-white/10 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            aria-label="Toggle Navigation Menu"
          >
            <motion.div
              key={mobileMenuOpen ? 'close' : 'open'}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              {mobileMenuOpen ? <X className="w-4.5 h-4.5 min-[360px]:w-5 min-[360px]:h-5" /> : <Menu className="w-4.5 h-4.5 min-[360px]:w-5 min-[360px]:h-5" />}
            </motion.div>
          </button>
        </div>
      </div>

      {/* Animated Mobile Drawer Dropdown Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Soft Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden fixed inset-0 top-20 bg-black/60 backdrop-blur-md z-40"
            />

            {/* Mobile Drawer Panel */}
            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="md:hidden fixed inset-x-0 top-20 bg-[#070C1B]/98 backdrop-blur-2xl border-b border-slate-800 shadow-2xl shadow-[#0D6EFD]/20 z-50 max-h-[calc(100vh-80px)] overflow-y-auto px-4 pt-3 pb-8 space-y-4 rounded-b-3xl"
            >
              {/* Top Accent Glowing Line */}
              <div className="h-1 -mx-4 -mt-3 mb-3 bg-gradient-to-r from-[#0D6EFD] via-[#28B9FF] to-[#22C55E]" />

              {/* User Welcome Card */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900/50 to-slate-800/40 border border-slate-800/80 backdrop-blur-md flex items-center justify-between gap-3 shadow-inner">
                <div className="flex items-center gap-3 min-w-0">
                  {activeUser ? (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0D6EFD] to-[#28B9FF] p-0.5 shrink-0 shadow-md">
                      <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center font-black text-sm text-white">
                        {activeUserName.charAt(0).toUpperCase()}
                      </div>
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-[#28B9FF] shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {activeUser ? 'Logged In As' : 'Welcome To Zohaib DigiForge'}
                    </p>
                    <h4 className="text-xs font-extrabold text-white truncate">
                      {activeUser ? activeUserName : 'Digital Assets Ecosystem'}
                    </h4>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleUserIconClick();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#0D6EFD]/20 hover:bg-[#0D6EFD]/30 border border-[#0D6EFD]/40 text-[#28B9FF] font-bold text-xs shrink-0 transition-colors flex items-center gap-1.5"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>{activeUser ? 'Dashboard' : 'Sign In'}</span>
                </button>
              </div>

              {/* Navigation Items */}
              <div className="space-y-1 text-sm font-semibold pt-1">
                {/* Home */}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onNavigateHome();
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                    currentView === 'home'
                      ? 'bg-gradient-to-r from-[#0D6EFD]/20 to-transparent text-[#28B9FF] border-l-4 border-[#28B9FF] pl-3 font-bold'
                      : 'text-slate-200 hover:bg-slate-900/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Home className="w-4 h-4 text-[#28B9FF]" />
                    <span>Home</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>

                {/* About Us */}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onNavigateAbout) onNavigateAbout();
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                    currentView === 'about'
                      ? 'bg-gradient-to-r from-[#0D6EFD]/20 to-transparent text-[#28B9FF] border-l-4 border-[#28B9FF] pl-3 font-bold'
                      : 'text-slate-200 hover:bg-slate-900/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Info className="w-4 h-4 text-indigo-400" />
                    <span>About Us</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>

                {/* Resources Accordion */}
                <div>
                  <button
                    onClick={() => {
                      setMobileCategoriesExpanded(!mobileCategoriesExpanded);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                      currentView === 'resources'
                        ? 'bg-gradient-to-r from-[#0D6EFD]/20 to-transparent text-[#28B9FF] border-l-4 border-[#28B9FF] pl-3 font-bold'
                        : 'text-slate-200 hover:bg-slate-900/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <FolderOpen className="w-4 h-4 text-[#28B9FF]" />
                      <span>Resources</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400">
                        {categories.length} Categories
                      </span>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${mobileCategoriesExpanded ? 'rotate-180 text-[#28B9FF]' : ''}`} />
                    </div>
                  </button>

                  {/* Sub-categories Accordion */}
                  <AnimatePresence>
                    {mobileCategoriesExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pl-8 pr-2 pt-1 pb-2 space-y-1 border-l-2 border-slate-800 ml-4 overflow-hidden"
                      >
                        <button
                          onClick={() => {
                            setMobileMenuOpen(false);
                            onNavigateResources('all');
                          }}
                          className="w-full text-left py-2 px-3 text-xs font-extrabold text-[#28B9FF] hover:bg-slate-900/60 rounded-lg transition-colors flex items-center justify-between"
                        >
                          <span>⚡ All Resources & Bundles</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>

                        {categories.map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => {
                              setMobileMenuOpen(false);
                              onNavigateResources(cat.slug);
                            }}
                            className="w-full text-left py-2 px-3 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900/60 rounded-lg transition-colors flex items-center justify-between"
                          >
                            <span>{cat.name}</span>
                            <span className="text-[10px] text-slate-500">{cat.itemCount || ''}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Contact Us */}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onNavigateContact) onNavigateContact();
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                    currentView === 'contact'
                      ? 'bg-gradient-to-r from-[#0D6EFD]/20 to-transparent text-[#28B9FF] border-l-4 border-[#28B9FF] pl-3 font-bold'
                      : 'text-slate-200 hover:bg-slate-900/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-4 h-4 text-emerald-400" />
                    <span>Contact Us</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>

                {/* Track Order */}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onOpenTracker) onOpenTracker();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl transition-all text-slate-200 hover:bg-slate-900/80 hover:text-white"
                >
                  <div className="flex items-center gap-3">
                    <Package className="w-4 h-4 text-yellow-400" />
                    <span>Track Order</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>

                {/* Shopping Cart */}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onNavigateCart) onNavigateCart();
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                    currentView === 'cart'
                      ? 'bg-gradient-to-r from-[#0D6EFD]/20 to-transparent text-[#28B9FF] border-l-4 border-[#28B9FF] pl-3 font-bold'
                      : 'text-slate-200 hover:bg-slate-900/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ShoppingBag className="w-4 h-4 text-[#28B9FF]" />
                    <span>Shopping Cart</span>
                  </div>
                  {cartCount > 0 ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#22C55E] text-slate-950 text-xs font-black shadow-sm">
                      {cartCount} {cartCount === 1 ? 'item' : 'items'}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500 font-medium">Empty</span>
                  )}
                </button>

                {/* WhatsApp Direct Support Button */}
                <a
                  href="https://wa.me/923406070632?text=Hi%20Zohaib%20DigiForge!%20I%20have%20a%20question%20about%20your%20digital%20assets."
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#25D366] transition-all font-bold text-xs mt-2"
                >
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-4 h-4 text-[#25D366]" />
                    <span>WhatsApp Support</span>
                  </div>
                  <span className="text-[10px] bg-[#25D366] text-slate-950 px-2 py-0.5 rounded font-black uppercase">
                    Online
                  </span>
                </a>
              </div>

              {/* Currency Selector & Quick Trust Footer */}
              {currency && setCurrency && (
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    <span>Currency:</span>
                  </div>
                  <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                    <button
                      onClick={() => setCurrency('PKR')}
                      className={`px-3 py-1 rounded-lg font-bold transition-all ${
                        currency === 'PKR'
                          ? 'bg-[#0D6EFD] text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      ₨ PKR
                    </button>
                    <button
                      onClick={() => setCurrency('USD')}
                      className={`px-3 py-1 rounded-lg font-bold transition-all ${
                        currency === 'USD'
                          ? 'bg-[#0D6EFD] text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      $ USD
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};

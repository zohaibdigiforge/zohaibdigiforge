import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Star, 
  Package, 
  LogOut, 
  ShoppingBag, 
  ExternalLink, 
  TrendingUp, 
  Users, 
  Activity,
  Clock,
  CheckCircle2,
  Sparkles, HelpCircle,
  Settings,
  Mail,
  BarChart3,
  ShoppingCart,
  Layers,
  Send,
  Lock,
  ChevronRight,
  Menu,
  X,
  ShieldAlert,
  Bot,
  FileSpreadsheet,
  Gift
} from 'lucide-react';
import { 
  UserProfile, 
  Order, 
  Review, 
  Product, 
  Category, 
  Subcategory, 
  AbandonedCart, 
  NewsletterSubscriber 
} from '../types';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

import { 
  subscribeToOrdersFromDb, 
  getProductsFromDb, 
  getCategoriesFromDb, 
  getSubcategoriesFromDb, 
  getAbandonedCartsFromDb, 
  getNewsletterSubscribersFromDb
} from '../services/firestoreService';

import { AdminOverview } from './admin/AdminOverview';
import { AdminOrders } from './admin/AdminOrders';
import { AdminCustomers } from './admin/AdminCustomers';
import { AdminAuditLogs } from './admin/AdminAuditLogs';
import { AdminCloudBackups } from './admin/AdminCloudBackups';
import { AdminCheckout } from './admin/AdminCheckout';
import { AdminResources } from './admin/AdminResources';
import { AdminNewsletter } from './admin/AdminNewsletter';
import { AdminSiteSettings } from './admin/AdminSiteSettings';
import { AdminFAQs } from './admin/AdminFAQs';
import { AdminExpiryManagement } from './admin/AdminExpiryManagement';
import { AdminAnalytics } from './admin/AdminAnalytics';
import { AdminReferrals } from './admin/AdminReferrals';
import { ReAuthModal } from './admin/ReAuthModal';

interface AdminDashboardProps {
  user: UserProfile;
  onSignOut: () => void;
  onOpenReviewAdmin?: () => void;
  onOpenOrderTracker?: () => void;
  onOpenJoinLinksAdmin?: () => void;
  onNavigateHome: () => void;
  onNavigateResources: () => void;
  onNavigateJoinUs?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  user,
  onSignOut,
  onOpenReviewAdmin,
  onOpenOrderTracker,
  onOpenJoinLinksAdmin,
  onNavigateHome,
  onNavigateResources,
  onNavigateJoinUs
}) => {
  // Navigation State
  const [activeTab, setActiveTab] = useState<
    'overview' | 'orders' | 'customers' | 'auditLogs' | 'threats' | 'backups' | 'expiry' | 'checkout' | 'resources' | 'newsletter' | 'pricing' | 'faqs' | 'analytics' | 'referrals'
  >('overview');

  const [ordersFilterParam, setOrdersFilterParam] = useState<string>('ALL');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Live Real-Time Firestore Data State
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [abandonedCarts, setAbandonedCarts] = useState<AbandonedCart[]>([]);
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);

  // Toast feedback state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Re-Authentication Security Modal State
  const [reAuthModal, setReAuthModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    actionFn: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    description: '',
    actionFn: async () => {}
  });

  // Verify Admin Guard
  const isAdmin = user && (user.role === 'admin' || user.email === 'zohaibdigiforge@gmail.com');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleRequireReAuth = (
    title: string, 
    description: string, 
    actionFn: () => Promise<void>
  ) => {
    setReAuthModal({
      isOpen: true,
      title,
      description,
      actionFn
    });
  };

  // 1. Subscribe to Live Firestore Listeners
  useEffect(() => {
    if (!isAdmin) return;

    // Real-time Orders
    const unsubOrders = subscribeToOrdersFromDb((liveOrders) => {
      setOrders(liveOrders);
    });

    // Fetch initial collections
    loadCatalogData();

    return () => {
      if (typeof unsubOrders === 'function') unsubOrders();
    };
  }, [isAdmin]);

  const loadCatalogData = async () => {
    try {
      const [prods, cats, subs, carts, subList] = await Promise.all([
        getProductsFromDb(),
        getCategoriesFromDb(),
        getSubcategoriesFromDb(),
        getAbandonedCartsFromDb(),
        getNewsletterSubscribersFromDb()
      ]);

      if (prods) setProducts(prods);
      if (cats) setCategories(cats);
      if (subs) setSubcategories(subs);
      if (carts) setAbandonedCarts(carts);
      if (subList) setSubscribers(subList);
    } catch (err) {
      console.warn('Error loading admin catalog:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {}
    sessionStorage.removeItem('zdf_auth_user');
    onSignOut();
  };

  // ACCESS DENIED GUARD
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0A0F1D] flex items-center justify-center p-4 text-slate-100">
        <div className="max-w-md w-full bg-[#0D1527] border border-rose-500/40 rounded-3xl p-8 text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Access Denied</h2>
            <p className="text-xs text-slate-400 mt-1">
              You must be logged in as an administrator (zohaibdigiforge@gmail.com) to access the Master Admin Panel.
            </p>
          </div>
          <button
            onClick={onSignOut}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#0D6EFD] to-[#28B9FF] text-white font-bold text-xs shadow-lg"
          >
            Sign In with Admin Credentials
          </button>
        </div>
      </div>
    );
  }

  // Count pending badges
  const pendingOrdersCount = orders.filter(o => o.status === 'Pending Verification').length;

  return (
    <div className="min-h-screen bg-[#0A0F1D] text-slate-100 flex flex-col md:flex-row">
      
      {/* Toast Alert Banner */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl border shadow-2xl text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-4 ${
          toast.type === 'success' 
            ? 'bg-emerald-500/20 text-[#22C55E] border-emerald-500/40' 
            : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
        }`}>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Security Re-Auth Modal */}
      <ReAuthModal
        isOpen={reAuthModal.isOpen}
        actionTitle={reAuthModal.title}
        actionDescription={reAuthModal.description}
        onClose={() => setReAuthModal({ ...reAuthModal, isOpen: false })}
        onConfirm={reAuthModal.actionFn}
      />

      {/* Mobile Top Nav Bar */}
      <div className="md:hidden p-4 bg-[#0D1527] border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#0D6EFD] flex items-center justify-center font-black text-white text-xs">
            ZDF
          </div>
          <span className="font-bold text-sm text-white">Admin Panel</span>
        </div>
        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-2 rounded-xl bg-slate-900 text-slate-300"
        >
          {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* ═════════════════════════════════════════════════════
          PERSISTENT LEFT SIDEBAR
      ═════════════════════════════════════════════════════ */}
      <aside className={`
        fixed md:sticky md:top-0 md:h-screen md:overflow-y-auto inset-y-0 left-0 z-40 w-64 bg-[#0D1527] border-r border-slate-800/80 p-5 flex flex-col justify-between shrink-0 transition-transform duration-300
        ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="space-y-6">
          
          {/* Brand & Admin Badge */}
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-[#0D6EFD] to-[#28B9FF] p-0.5 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-amber-300 text-xs font-black">
                ⚡
              </div>
            </div>
            <div className="min-w-0">
              <div className="text-xs font-black text-white truncate">Zohaib DigiForge</div>
              <div className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Admin Master</span>
              </div>
            </div>
          </div>

          {/* Sidebar Navigation Items */}
          <nav className="space-y-1">
            
            {/* Overview */}
            <button
              onClick={() => { setActiveTab('overview'); setMobileSidebarOpen(false); }}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                activeTab === 'overview' 
                  ? 'bg-gradient-to-r from-[#0D6EFD] to-[#28B9FF] text-white shadow-lg shadow-[#0D6EFD]/25' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BarChart3 className="w-4 h-4" />
                <span>Overview</span>
              </div>
            </button>

            {/* Customers & Orders (Unified Hub) */}
            <button
              onClick={() => { setActiveTab('customers'); setMobileSidebarOpen(false); }}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                activeTab === 'customers' || activeTab === 'orders'
                  ? 'bg-gradient-to-r from-[#0D6EFD] to-[#28B9FF] text-white shadow-lg shadow-[#0D6EFD]/25' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-[#28B9FF]" />
                <span>Customers &amp; Orders</span>
              </div>
              {pendingOrdersCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black animate-pulse">
                  {pendingOrdersCount}
                </span>
              )}
            </button>

            {/* Referral Payouts & Stats */}
            <button
              onClick={() => { setActiveTab('referrals'); setMobileSidebarOpen(false); }}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                activeTab === 'referrals' 
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 shadow-lg shadow-amber-500/20 font-black' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Gift className="w-4 h-4 text-amber-400 animate-bounce" />
                <span>Referrals &amp; Payouts</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            </button>

            {/* Audit Logs */}
            <button
              onClick={() => { setActiveTab('auditLogs'); setMobileSidebarOpen(false); }}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                activeTab === 'auditLogs' 
                  ? 'bg-gradient-to-r from-[#0D6EFD] to-[#28B9FF] text-white shadow-lg shadow-[#0D6EFD]/25' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Audit Logs</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </button>

            {/* Automated Cloud Backup & Excel Redundancy */}
            <button
              onClick={() => { setActiveTab('backups'); setMobileSidebarOpen(false); }}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                activeTab === 'backups' 
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-600/30' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Cloud Backups (Excel)</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Nightly Cron Active" />
            </button>

            {/* Pro Tools & Expiry Management */}
            <button
              onClick={() => { setActiveTab('expiry'); setMobileSidebarOpen(false); }}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                activeTab === 'expiry' 
                  ? 'bg-gradient-to-r from-[#0D6EFD] to-[#28B9FF] text-white shadow-lg shadow-[#0D6EFD]/25' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Pro Tools &amp; Expiry</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black">
                {orders.reduce((acc, o) => acc + (o.items?.length || 0), 0)}
              </span>
            </button>

            {/* Checkout */}
            <button
              onClick={() => { setActiveTab('checkout'); setMobileSidebarOpen(false); }}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                activeTab === 'checkout' 
                  ? 'bg-gradient-to-r from-[#0D6EFD] to-[#28B9FF] text-white shadow-lg shadow-[#0D6EFD]/25' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShoppingCart className="w-4 h-4" />
                <span>Checkout</span>
              </div>
            </button>

            {/* Resources */}
            <button
              onClick={() => { setActiveTab('resources'); setMobileSidebarOpen(false); }}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                activeTab === 'resources' 
                  ? 'bg-gradient-to-r from-[#0D6EFD] to-[#28B9FF] text-white shadow-lg shadow-[#0D6EFD]/25' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4" />
                <span>Resources</span>
              </div>
            </button>

            {/* Newsletter */}
            <button
              onClick={() => { setActiveTab('newsletter'); setMobileSidebarOpen(false); }}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                activeTab === 'newsletter' 
                  ? 'bg-gradient-to-r from-[#0D6EFD] to-[#28B9FF] text-white shadow-lg shadow-[#0D6EFD]/25' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4" />
                <span>Newsletter</span>
              </div>
            </button>

            {/* FAQs Manager */}
            <button
              onClick={() => { setActiveTab('faqs'); setMobileSidebarOpen(false); }}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                activeTab === 'faqs' 
                  ? 'bg-gradient-to-r from-[#0D6EFD] to-[#28B9FF] text-white shadow-lg shadow-[#0D6EFD]/25' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <HelpCircle className="w-4 h-4 text-[#28B9FF]" />
                <span>FAQs Manager</span>
              </div>
            </button>

            {/* Site Settings & Pricing */}
            <button
              onClick={() => { setActiveTab('pricing'); setMobileSidebarOpen(false); }}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                activeTab === 'pricing' 
                  ? 'bg-gradient-to-r from-[#0D6EFD] to-[#28B9FF] text-white shadow-lg shadow-[#0D6EFD]/25' 
                  : 'text-[#28B9FF] hover:text-white hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Settings className="w-4 h-4" />
                <span>Site Settings (Pricing)</span>
              </div>
            </button>

            {/* Analytics & Visitor Insights */}
            <button
              onClick={() => { setActiveTab('analytics'); setMobileSidebarOpen(false); }}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                activeTab === 'analytics' 
                  ? 'bg-gradient-to-r from-[#0D6EFD] to-[#28B9FF] text-white shadow-lg shadow-[#0D6EFD]/25' 
                  : 'text-emerald-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BarChart3 className="w-4 h-4" />
                <span>Store Analytics</span>
              </div>
            </button>

          </nav>
        </div>

        {/* Sidebar Footer Shortcuts */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          {onOpenJoinLinksAdmin && (
            <button
              onClick={onOpenJoinLinksAdmin}
              className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-[#28B9FF] text-xs font-bold transition-all flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Bio Page (/join)</span>
            </button>
          )}

          <button
            onClick={onNavigateHome}
            className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-all flex items-center gap-2"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-[#22C55E]" />
            <span>Storefront</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-rose-500/10 hover:text-rose-400 text-slate-400 text-xs font-semibold transition-all flex items-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ═════════════════════════════════════════════════════
          MAIN CONTENT WORKSPACE
      ═════════════════════════════════════════════════════ */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
        
        {activeTab === 'overview' && (
          <AdminOverview
            orders={orders}
            newsletterCount={subscribers.length}
            abandonedCarts={abandonedCarts}
            onNavigateTab={(tab, filter) => {
              setActiveTab(tab as any);
              if (filter) setOrdersFilterParam(filter);
            }}
          />
        )}

        {(activeTab === 'customers' || activeTab === 'orders') && (
          <AdminCustomers
            orders={orders}
            onRequireReAuth={handleRequireReAuth}
            onShowToast={showToast}
            initialTab={activeTab === 'orders' ? 'orders' : 'customers'}
            initialOrdersFilter={ordersFilterParam}
            onNavigateToOrders={(filter) => {
              setActiveTab('customers');
              if (filter) setOrdersFilterParam(filter);
            }}
          />
        )}

        {activeTab === 'auditLogs' && (
          <AdminAuditLogs
            onRequireReAuth={handleRequireReAuth}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'backups' && (
          <AdminCloudBackups />
        )}

        {activeTab === 'expiry' && (
          <AdminExpiryManagement
            orders={orders}
            onRequireReAuth={handleRequireReAuth}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'checkout' && (
          <AdminCheckout
            onRequireReAuth={handleRequireReAuth}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'resources' && (
          <AdminResources
            products={products}
            categories={categories}
            subcategories={subcategories}
            onRequireReAuth={handleRequireReAuth}
            onShowToast={showToast}
            onRefreshData={loadCatalogData}
            onNavigateTab={(tab) => setActiveTab(tab as any)}
          />
        )}

        {activeTab === 'newsletter' && (
          <AdminNewsletter
            onShowToast={showToast}
          />
        )}

        {activeTab === 'pricing' && (
          <AdminSiteSettings
            products={products}
            onRefreshData={loadCatalogData}
            onShowToast={showToast}
            onNavigateTab={(tab) => setActiveTab(tab as any)}
          />
        )}

        {activeTab === 'faqs' && (
          <AdminFAQs
            onRequireReAuth={handleRequireReAuth}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'analytics' && (
          <AdminAnalytics
            orders={orders}
            products={products}
            abandonedCarts={abandonedCarts}
            newsletterCount={subscribers.length}
          />
        )}

        {activeTab === 'referrals' && (
          <AdminReferrals
            onShowToast={showToast}
          />
        )}

      </main>

    </div>
  );
};

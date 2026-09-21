import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  ShieldCheck, 
  Download, 
  Clock, 
  ExternalLink, 
  CheckCircle2, 
  Sparkles, 
  Package, 
  LogOut, 
  ArrowRight, 
  Star, 
  Layers, 
  KeyRound,
  FileText,
  ShoppingBag,
  Zap,
  HelpCircle,
  PhoneCall,
  Lock,
  Edit3,
  Check,
  X,
  AlertTriangle,
  Bell,
  Search,
  Filter,
  Eye,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Copy,
  FolderDown,
  Trash2,
  SlidersHorizontal,
  RefreshCw,
  Code2,
  Briefcase,
  Gift,
  Share2,
  Users,
  Percent,
  Award,
  Tag
} from 'lucide-react';
import { Order, UserProfile, Product, UserReferralStats } from '../types';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import { BRAND_ICON } from '../lib/brandAssets';
import { usePricing } from '../context/PricingContext';
import { 
  getUserOrdersFromDb, 
  updateUserProfileInDb, 
  deleteUserAccountFromDb,
  subscribeNewsletterDb,
  trackOrderFromDb,
  getUserReferralStatsFromDb
} from '../services/firestoreService';
import { auth } from '../lib/firebase';
import { 
  signOut, 
  updatePassword, 
  reauthenticateWithCredential, 
  EmailAuthProvider, 
  deleteUser 
} from 'firebase/auth';

interface CustomerDashboardProps {
  user: UserProfile;
  products?: Product[];
  onSignOut: () => void;
  onNavigateResources: (categorySlug?: string, subcategorySlug?: string, searchQuery?: string) => void;
  onNavigateMembership: () => void;
  onViewProduct?: (product: Product) => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  user,
  products = [],
  onSignOut,
  onNavigateResources,
  onNavigateMembership,
  onViewProduct
}) => {
  const { formatProductPrice, formatCombinedProductPrice, getProductPriceNumber } = usePricing();

  // Real Referral System & Tier calculations
  const [referralStats, setReferralStats] = useState<UserReferralStats | null>(null);
  const [loadingReferrals, setLoadingReferrals] = useState(false);
  const [copiedRefCode, setCopiedRefCode] = useState(false);
  const [copiedRefLink, setCopiedRefLink] = useState(false);

  const getReferralTier = (totalReferredOrders: number) => {
    if (totalReferredOrders >= 16) {
      return {
        name: 'Gold Elite',
        level: 'Gold',
        icon: '🥇',
        badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        textColor: 'text-amber-400',
        color: 'from-amber-400 to-yellow-600',
        progress: 100,
        nextTier: null,
        referralsNeededForNext: 0,
        commissionRate: 20,
        friendDiscount: 15,
        perks: [
          '20% Commission on every referral sale',
          '15% Discount code for your referrals',
          'Priority WhatsApp payout requests (under 1 hour)',
          'Free monthly ZDF tool voucher worth Rs. 2,000'
        ]
      };
    } else if (totalReferredOrders >= 6) {
      const nextLimit = 16;
      const currentBase = 6;
      const progress = Math.min(100, Math.round(((totalReferredOrders - currentBase) / (nextLimit - currentBase)) * 100));
      return {
        name: 'Silver Ambassador',
        level: 'Silver',
        icon: '🥈',
        badgeColor: 'bg-slate-300/15 text-slate-300 border-slate-400/30',
        textColor: 'text-slate-300',
        color: 'from-slate-300 to-slate-500',
        progress,
        nextTier: 'Gold Elite',
        referralsNeededForNext: nextLimit - totalReferredOrders,
        commissionRate: 15,
        friendDiscount: 12,
        perks: [
          '15% Commission on every referral sale',
          '12% Discount code for your referrals',
          'Dedicated affiliate support group',
          'Direct payout processing (under 12 hours)'
        ]
      };
    } else {
      const nextLimit = 6;
      const progress = Math.min(100, Math.round((totalReferredOrders / nextLimit) * 100));
      return {
        name: 'Bronze Starter',
        level: 'Bronze',
        icon: '🥉',
        badgeColor: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
        textColor: 'text-orange-400',
        color: 'from-orange-400 to-amber-700',
        progress,
        nextTier: 'Silver Ambassador',
        referralsNeededForNext: nextLimit - totalReferredOrders,
        commissionRate: 10,
        friendDiscount: 10,
        perks: [
          '10% Commission on every referral sale',
          '10% Discount code for your referrals',
          'Standard dashboard tracking',
          'Weekly payouts via JazzCash/EasyPaisa'
        ]
      };
    }
  };

  const totalReferredCount = referralStats?.totalReferredOrders || 0;
  const currentTier = getReferralTier(totalReferredCount);

  // Navigation & Tab state
  const [activeTab, setActiveTab] = useState<'orders' | 'browse' | 'downloads' | 'subscriptions' | 'track' | 'account' | 'referrals'>('orders');

  // Browse Catalog State
  const [browseSearch, setBrowseSearch] = useState('');
  const [browseCategory, setBrowseCategory] = useState('all');
  const [browseSort, setBrowseSort] = useState<'popular' | 'price-low' | 'price-high' | 'newest'>('popular');

  // Orders & Data State
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'delivered' | 'pending'>('all');
  const [orderSortOrder, setOrderSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Account Profile Edit State
  const [currentUser, setCurrentUser] = useState<UserProfile>(user);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState(user.displayName || '');
  const [editPhone, setEditPhone] = useState(user.phone || user.whatsapp || '');
  const [editPhotoURL, setEditPhotoURL] = useState(user.photoURL || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState('');
  const [passwordErrorMsg, setPasswordErrorMsg] = useState('');

  // Preferences State
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(user.newsletterSubscribed ?? true);
  const [prefSaveMsg, setPrefSaveMsg] = useState('');

  // Delete Account Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Track Order State
  const [trackInputId, setTrackInputId] = useState('');
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackError, setTrackError] = useState('');

  // Downloads Search & Filter
  const [downloadSearch, setDownloadSearch] = useState('');
  const [downloadCategoryFilter, setDownloadCategoryFilter] = useState('all');
  const [downloadHistory, setDownloadHistory] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem('zdf_download_history') || '{}');
    } catch (e) {
      return {};
    }
  });

  // Copied feedback
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

  // Load User Orders with strict database-level security
  useEffect(() => {
    let isMounted = true;
    setLoadingOrders(true);

    getUserOrdersFromDb(user.uid, user.email)
      .then((data) => {
        if (isMounted) {
          setOrders(data || []);
          setLoadingOrders(false);
        }
      })
      .catch((err) => {
        console.warn('Customer orders fetch error:', err);
        if (isMounted) {
          setLoadingOrders(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [user.uid, user.email]);

  // Load user referral stats
  useEffect(() => {
    let isMounted = true;
    if (!currentUser?.uid) return;

    setLoadingReferrals(true);
    getUserReferralStatsFromDb(currentUser.uid, currentUser.displayName || '')
      .then((data) => {
        if (isMounted) {
          setReferralStats(data || null);
          setLoadingReferrals(false);
        }
      })
      .catch((err) => {
        console.warn('Customer referrals fetch error:', err);
        if (isMounted) {
          setLoadingReferrals(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [currentUser.uid, currentUser.displayName]);

  const handleRefreshOrders = async () => {
    setLoadingOrders(true);
    setLoadingReferrals(true);
    try {
      const data = await getUserOrdersFromDb(user.uid, user.email);
      setOrders(data || []);
      const refData = await getUserReferralStatsFromDb(user.uid, currentUser.displayName || '');
      setReferralStats(refData || null);
    } catch (e) {
      console.warn('Failed to refresh data:', e);
    } finally {
      setLoadingOrders(false);
      setLoadingReferrals(false);
    }
  };

  // Keep local user profile in sync
  useEffect(() => {
    setCurrentUser(user);
    setEditDisplayName(user.displayName || '');
    setEditPhone(user.phone || user.whatsapp || '');
    setEditPhotoURL(user.photoURL || '');
  }, [user]);

  // Extract all delivered items for My Downloads
  const deliveredDownloads: {
    orderId: string;
    orderDate: string;
    itemTitle: string;
    productId: string;
    productThumbnail?: string;
    category?: string;
    downloadLinks: string[];
    price: number;
  }[] = [];

  orders.forEach((order) => {
    const isDelivered = 
      order.status === 'Access Delivered' || 
      order.status === 'Completed' || 
      order.status === 'Payment Verified';

    if (isDelivered) {
      order.items.forEach((item) => {
        deliveredDownloads.push({
          orderId: order.id,
          orderDate: order.createdAt,
          itemTitle: item.title,
          productId: item.productId,
          productThumbnail: item.thumbnail,
          category: item.type,
          downloadLinks: order.downloadLinks && order.downloadLinks.length > 0 
            ? order.downloadLinks 
            : ['https://drive.google.com/drive/folders/zohaibdigiforge-access'],
          price: item.price
        });
      });
    }
  });

  // Filtered Downloads
  const filteredDownloads = deliveredDownloads.filter((d) => {
    const matchesSearch = d.itemTitle.toLowerCase().includes(downloadSearch.toLowerCase()) ||
                          d.orderId.toLowerCase().includes(downloadSearch.toLowerCase());
    const matchesCategory = downloadCategoryFilter === 'all' || d.category === downloadCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Filtered Orders
  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter === 'delivered') {
      return o.status === 'Access Delivered' || o.status === 'Completed' || o.status === 'Payment Verified';
    }
    if (orderStatusFilter === 'pending') {
      return o.status === 'Pending Verification';
    }
    return true;
  }).sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();
    return orderSortOrder === 'newest' ? timeB - timeA : timeA - timeB;
  });

  // Filtered & Sorted Browse Products
  const availableCategories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
  const filteredBrowseProducts = products.filter((p) => {
    const q = browseSearch.trim().toLowerCase();
    const matchesSearch = !q || p.title.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q));
    const matchesCategory = browseCategory === 'all' || p.category === browseCategory || p.categorySlug === browseCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    if (browseSort === 'price-low') return getProductPriceNumber(a, 'PKR') - getProductPriceNumber(b, 'PKR');
    if (browseSort === 'price-high') return getProductPriceNumber(b, 'PKR') - getProductPriceNumber(a, 'PKR');
    if (browseSort === 'newest') return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    return (b.salesCount || 0) - (a.salesCount || 0);
  });

  // Sign out handler
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {}
    sessionStorage.removeItem('zdf_auth_user');
    onSignOut();
  };

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedOrderId(id);
    setTimeout(() => setCopiedOrderId(null), 2000);
  };

  // Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSuccessMsg('');

    try {
      const updates: Partial<UserProfile> = {
        displayName: editDisplayName.trim() || currentUser.displayName,
        phone: editPhone.trim(),
        whatsapp: editPhone.trim(),
        photoURL: editPhotoURL.trim()
      };

      const updated = await updateUserProfileInDb(currentUser.uid, updates);
      if (updated) {
        setCurrentUser(updated);
      } else {
        setCurrentUser(prev => ({ ...prev, ...updates }));
      }

      setIsEditingProfile(false);
      setProfileSuccessMsg('Profile updated successfully!');
      setTimeout(() => setProfileSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Error updating profile:', err);
    } finally {
      setSavingProfile(false);
    }
  };

  // Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrorMsg('');
    setPasswordSuccessMsg('');

    if (newPassword.length < 6) {
      setPasswordErrorMsg('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg('Passwords do not match.');
      return;
    }

    setChangingPassword(true);

    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser || !firebaseUser.email) {
        throw new Error('No active authenticated session found.');
      }

      // If current password provided, re-authenticate first for high security
      if (currentPassword) {
        const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
        await reauthenticateWithCredential(firebaseUser, credential);
      }

      await updatePassword(firebaseUser, newPassword);
      setPasswordSuccessMsg('Your password has been changed securely!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccessMsg(''), 5000);
    } catch (err: any) {
      console.error('Password change error:', err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setPasswordErrorMsg('Current password is incorrect.');
      } else if (err.code === 'auth/requires-recent-login') {
        setPasswordErrorMsg('Please enter your current password to verify identity.');
      } else {
        setPasswordErrorMsg(err.message || 'Failed to change password.');
      }
    } finally {
      setChangingPassword(false);
    }
  };

  // Toggle Preferences
  const handleToggleNewsletter = async () => {
    const nextVal = !newsletterSubscribed;
    setNewsletterSubscribed(nextVal);
    setPrefSaveMsg('Preferences saved');
    setTimeout(() => setPrefSaveMsg(''), 3000);

    if (nextVal && currentUser.email) {
      subscribeNewsletterDb(currentUser.email);
    }
    updateUserProfileInDb(currentUser.uid, { newsletterSubscribed: nextVal });
  };

  // Track Order Handler
  const handleTrackSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!trackInputId.trim()) return;

    setTrackLoading(true);
    setTrackError('');
    setTrackedOrder(null);

    const term = trackInputId.trim();

    try {
      // 1. First check against user's already authenticated orders
      const userOrder = orders.find(
        (o) => o.id.toLowerCase() === term.toLowerCase()
      );

      if (userOrder) {
        setTrackedOrder(userOrder);
        setTrackLoading(false);
        return;
      }

      // 2. Fetch from DB
      const result = await trackOrderFromDb(term);

      // CRITICAL SECURITY CHECK: Enforce that customer sees ONLY their own order
      if (
        result &&
        (
          (result.userId && result.userId === currentUser.uid) ||
          (result.email && result.email.toLowerCase() === currentUser.email.toLowerCase())
        )
      ) {
        setTrackedOrder(result);
      } else {
        // Generic "Order not found" prevents order-ID enumeration and information leakage
        setTrackError(`Order "${term}" not found for this account. Please double-check your Order ID.`);
      }
    } catch (err) {
      setTrackError('Could not verify order status. Please try again.');
    } finally {
      setTrackLoading(false);
    }
  };

  // Quick lookup from orders table
  const handleQuickTrackOrder = (order: Order) => {
    setTrackInputId(order.id);
    setTrackedOrder(order);
    setActiveTab('track');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Record Download History
  const handleRecordDownload = (orderId: string, itemTitle: string, url: string) => {
    const now = new Date().toISOString();
    const updated = { ...downloadHistory, [`${orderId}-${itemTitle}`]: now };
    setDownloadHistory(updated);
    try {
      localStorage.setItem('zdf_download_history', JSON.stringify(updated));
    } catch (e) {}
    window.open(url, '_blank');
  };

  // Delete Account
  const handleDeleteAccount = async () => {
    if (deleteConfirmText.trim().toUpperCase() !== 'DELETE') {
      setDeleteError('Please type "DELETE" to confirm account deletion.');
      return;
    }

    setDeletingAccount(true);
    setDeleteError('');

    try {
      await deleteUserAccountFromDb(currentUser.uid);
      const firebaseUser = auth.currentUser;
      if (firebaseUser) {
        await deleteUser(firebaseUser);
      }
      onSignOut();
    } catch (err: any) {
      console.error('Delete account error:', err);
      if (err.code === 'auth/requires-recent-login') {
        setDeleteError('For security, please sign out, sign back in, and retry deletion.');
      } else {
        setDeleteError(err.message || 'Failed to delete account.');
      }
    } finally {
      setDeletingAccount(false);
    }
  };

  // Featured fallback products for empty states
  const popularRecommendations = products.slice(0, 3);

  // Status Badge Formatter
  const renderStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'Access Delivered':
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Delivered</span>
          </span>
        );
      case 'Payment Verified':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#28B9FF]/15 text-[#28B9FF] border border-[#28B9FF]/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Payment Verified</span>
          </span>
        );
      case 'Pending Verification':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Payment</span>
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F1D] text-slate-100 font-sans selection:bg-[#0D6EFD]/30 selection:text-white">
      
      {/* ═════════════════════════════════════════════════════════════
          TOP BAR (Customer Info, Avatar, Notification Bell, Sign Out)
          ═════════════════════════════════════════════════════════════ */}
      <div className="border-b border-slate-800/80 bg-[#0D1527]/90 px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Brand/Welcome Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0D6EFD] to-[#28B9FF] p-0.5 shadow-md shadow-[#0D6EFD]/20">
              <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center overflow-hidden">
                <img 
                  src={BRAND_ICON} 
                  alt="Zohaib DigiForge Icon" 
                  className="w-full h-full object-contain p-2 bg-[#0D1527] rounded-full"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src !== window.location.origin + '/icon.png') {
                      target.src = '/icon.png';
                    }
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Customer Portal</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
              </div>
              <h1 className="text-sm sm:text-base font-bold text-white tracking-tight leading-none">
                Welcome back, {currentUser.displayName || 'Creator'}
              </h1>
            </div>
          </div>

          {/* Quick Actions & User Pill */}
          <div className="flex items-center gap-2.5 sm:gap-4">

            {/* Explore Catalog CTA */}
            <button
              onClick={() => onNavigateResources('all', 'all')}
              className="hidden md:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0D6EFD]/15 hover:bg-[#0D6EFD]/25 border border-[#0D6EFD]/40 text-[#28B9FF] text-xs font-bold transition-colors cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Browse Catalog</span>
            </button>

            {/* Sign Out Button */}
            <button
              onClick={handleLogout}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-900/90 border border-slate-800 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-400 text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>

          </div>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════
          MAIN CONTAINER WITH SIDEBAR & CONTENT AREA
          ═════════════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* ─────────────────────────────────────────────────────────
              PERSISTENT SIDEBAR (Desktop) / TOP TABS (Mobile)
              ───────────────────────────────────────────────────────── */}
          <aside className="lg:col-span-3 space-y-4 lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-1 no-scrollbar">
            
            {/* User Profile Card */}
            <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center gap-3.5">
                <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0D6EFD] to-[#22C55E] p-0.5 shadow-md shrink-0">
                  <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-xl font-black text-white overflow-hidden">
                    {currentUser.photoURL ? (
                      <img 
                        src={currentUser.photoURL} 
                        alt={currentUser.displayName} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <img 
                        src="/icon.png" 
                        alt={currentUser.displayName || 'User Avatar'} 
                        className="w-full h-full object-contain p-2.5 bg-[#0D1527]" 
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                          if (e.currentTarget.parentElement) {
                            e.currentTarget.parentElement.innerHTML = `<span>${(currentUser.displayName || 'U').charAt(0).toUpperCase()}</span>`;
                          }
                        }}
                      />
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 p-0.5 bg-[#22C55E] rounded-full ring-2 ring-slate-900" title="Verified Customer">
                    <ShieldCheck className="w-3 h-3 text-slate-950 stroke-[3]" />
                  </div>
                </div>

                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-white truncate">
                    {currentUser.displayName}
                  </h2>
                  <p className="text-xs text-slate-400 truncate flex items-center gap-1 mt-0.5">
                    <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                    <span className="truncate">{currentUser.email}</span>
                  </p>
                  <span className="inline-block mt-1.5 px-2 py-0.5 rounded-md bg-[#28B9FF]/10 text-[#28B9FF] text-[10px] font-bold">
                    Verified Customer
                  </span>
                </div>
              </div>

              {/* Quick Stat Highlights */}
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/80 text-center">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/60">
                  <span className="block text-base font-extrabold text-white">
                    {orders.length}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">Orders</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/60">
                  <span className="block text-base font-extrabold text-[#22C55E]">
                    {deliveredDownloads.length}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">Assets Ready</span>
                </div>
              </div>
            </div>

            {/* Sidebar Navigation Tabs */}
            <nav className="p-2 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-1">
              
              <button
                id="tab-my-orders"
                onClick={() => setActiveTab('orders')}
                className={`w-full p-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-between transition-all cursor-pointer ${
                  activeTab === 'orders'
                    ? 'bg-gradient-to-r from-[#0D6EFD] to-[#0D6EFD]/80 text-white shadow-md shadow-[#0D6EFD]/25'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Package className="w-4 h-4 text-[#28B9FF]" />
                  <span>My Orders</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  activeTab === 'orders' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  {orders.length}
                </span>
              </button>

              <button
                id="tab-browse-products"
                onClick={() => setActiveTab('browse')}
                className={`w-full p-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-between transition-all cursor-pointer ${
                  activeTab === 'browse'
                    ? 'bg-gradient-to-r from-[#0D6EFD] to-[#0D6EFD]/80 text-white shadow-md shadow-[#0D6EFD]/25'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-4 h-4 text-[#22C55E]" />
                  <span>Browse Products</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  activeTab === 'browse' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  {products.length}
                </span>
              </button>

              <button
                id="tab-my-subscriptions"
                onClick={() => setActiveTab('subscriptions')}
                className={`w-full p-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-between transition-all cursor-pointer ${
                  activeTab === 'subscriptions'
                    ? 'bg-gradient-to-r from-[#0D6EFD] to-[#0D6EFD]/80 text-white shadow-md shadow-[#0D6EFD]/25'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Pro Tools & Expiry</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  activeTab === 'subscriptions' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  {orders.reduce((acc, o) => acc + (o.items?.length || 0), 0)}
                </span>
              </button>

              <button
                id="tab-my-downloads"
                onClick={() => setActiveTab('downloads')}
                className={`w-full p-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-between transition-all cursor-pointer ${
                  activeTab === 'downloads'
                    ? 'bg-gradient-to-r from-[#0D6EFD] to-[#0D6EFD]/80 text-white shadow-md shadow-[#0D6EFD]/25'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Download className="w-4 h-4 text-[#22C55E]" />
                  <span>My Downloads</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  activeTab === 'downloads' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  {deliveredDownloads.length}
                </span>
              </button>

              <button
                id="tab-track-order"
                onClick={() => setActiveTab('track')}
                className={`w-full p-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-between transition-all cursor-pointer ${
                  activeTab === 'track'
                    ? 'bg-gradient-to-r from-[#0D6EFD] to-[#0D6EFD]/80 text-white shadow-md shadow-[#0D6EFD]/25'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Search className="w-4 h-4 text-[#28B9FF]" />
                  <span>Track Order</span>
                </div>
                <span className="text-[10px] text-[#28B9FF] bg-[#28B9FF]/10 px-2 py-0.5 rounded-full font-bold">
                  Lookup
                </span>
              </button>

              <button
                id="tab-referrals"
                onClick={() => setActiveTab('referrals')}
                className={`w-full p-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-between transition-all cursor-pointer ${
                  activeTab === 'referrals'
                    ? 'bg-gradient-to-r from-[#0D6EFD] to-[#0D6EFD]/80 text-white shadow-md shadow-[#0D6EFD]/25'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Gift className="w-4 h-4 text-emerald-400" />
                  <span>Refer & Earn</span>
                </div>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-bold">
                  {currentTier.icon} {currentTier.level}
                </span>
              </button>

              <button
                id="tab-my-account"
                onClick={() => setActiveTab('account')}
                className={`w-full p-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-between transition-all cursor-pointer ${
                  activeTab === 'account'
                    ? 'bg-gradient-to-r from-[#0D6EFD] to-[#0D6EFD]/80 text-white shadow-md shadow-[#0D6EFD]/25'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-amber-400" />
                  <span>My Account</span>
                </div>
                <span className="text-[10px] text-slate-400">Settings</span>
              </button>

            </nav>

            {/* Need Direct Help Box */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-[#0A1628] border border-slate-800/90 text-xs space-y-2.5">
              <div className="flex items-center gap-2 text-[#22C55E] font-bold">
                <MessageCircle className="w-4 h-4" />
                <span>Priority WhatsApp Line</span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Questions about payment verification or Google Drive access? Message Founder M Zohaib Shahzad directly.
              </p>
              <a
                href="https://wa.me/923406070632?text=Hi%20Zohaib%20DigiForge!%20I%20am%20logged%20into%20my%20customer%20dashboard%20and%20need%20help."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 px-3 rounded-xl bg-[#22C55E]/15 hover:bg-[#22C55E]/25 border border-[#22C55E]/30 text-[#22C55E] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-xs"
              >
                <span>+92 340 6070632</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

          </aside>

          {/* ─────────────────────────────────────────────────────────
              MAIN CONTENT TABS (Lazy Loaded / Progressive Disclosure)
              ───────────────────────────────────────────────────────── */}
          <main className="lg:col-span-9 space-y-6">

            {/* Mobile Touch Navigation Tab Bar */}
            <div className="lg:hidden sticky top-[61px] z-20 bg-[#0A0F1D]/95 backdrop-blur-md border-b border-slate-800/80 -mx-4 px-4 py-2.5 overflow-x-auto no-scrollbar flex items-center gap-2">
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'orders'
                    ? 'bg-[#0D6EFD] text-white shadow-md shadow-[#0D6EFD]/30'
                    : 'bg-slate-900 border border-slate-800 text-slate-300'
                }`}
              >
                <Package className="w-3.5 h-3.5 text-[#28B9FF]" />
                <span>My Orders ({orders.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('browse')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'browse'
                    ? 'bg-[#0D6EFD] text-white shadow-md shadow-[#0D6EFD]/30'
                    : 'bg-slate-900 border border-slate-800 text-slate-300'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5 text-[#22C55E]" />
                <span>Browse ({products.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('downloads')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'downloads'
                    ? 'bg-[#0D6EFD] text-white shadow-md shadow-[#0D6EFD]/30'
                    : 'bg-slate-900 border border-slate-800 text-slate-300'
                }`}
              >
                <Download className="w-3.5 h-3.5 text-[#22C55E]" />
                <span>Downloads ({deliveredDownloads.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('subscriptions')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'subscriptions'
                    ? 'bg-[#0D6EFD] text-white shadow-md shadow-[#0D6EFD]/30'
                    : 'bg-slate-900 border border-slate-800 text-slate-300'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Pro Tools</span>
              </button>

              <button
                onClick={() => setActiveTab('track')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'track'
                    ? 'bg-[#0D6EFD] text-white shadow-md shadow-[#0D6EFD]/30'
                    : 'bg-slate-900 border border-slate-800 text-slate-300'
                }`}
              >
                <Search className="w-3.5 h-3.5 text-[#28B9FF]" />
                <span>Track Order</span>
              </button>

              <button
                onClick={() => setActiveTab('referrals')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'referrals'
                    ? 'bg-[#0D6EFD] text-white shadow-md shadow-[#0D6EFD]/30'
                    : 'bg-slate-900 border border-slate-800 text-slate-300'
                }`}
              >
                <Gift className="w-3.5 h-3.5 text-emerald-400" />
                <span>Refer & Earn ({currentTier.icon} {currentTier.level})</span>
              </button>

              <button
                onClick={() => setActiveTab('account')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'account'
                    ? 'bg-[#0D6EFD] text-white shadow-md shadow-[#0D6EFD]/30'
                    : 'bg-slate-900 border border-slate-800 text-slate-300'
                }`}
              >
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>Account</span>
              </button>
            </div>

            {/* ═════════════════════════════════════════════════════════
                SECTION 1: MY ORDERS
                ═════════════════════════════════════════════════════════ */}
            {activeTab === 'orders' && (
              <div className="space-y-5">
                
                {/* Orders Header & Filters */}
                <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                      <Package className="w-5 h-5 text-[#28B9FF]" />
                      <span>Order History</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">
                      View your digital receipts, verification statuses, and download links.
                    </p>
                  </div>

                  {/* Filter & Sort Controls */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={orderStatusFilter}
                      onChange={(e) => setOrderStatusFilter(e.target.value as any)}
                      className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 focus:outline-none focus:border-[#0D6EFD]"
                    >
                      <option value="all">All Statuses</option>
                      <option value="delivered">Delivered Only</option>
                      <option value="pending">Pending Payment</option>
                    </select>

                    <select
                      value={orderSortOrder}
                      onChange={(e) => setOrderSortOrder(e.target.value as any)}
                      className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 focus:outline-none focus:border-[#0D6EFD]"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                    </select>

                    <button
                      onClick={handleRefreshOrders}
                      title="Sync / Refresh Orders"
                      className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-[#28B9FF] flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingOrders ? 'animate-spin' : ''}`} />
                      <span>Sync Orders</span>
                    </button>
                  </div>
                </div>

                {/* Orders List */}
                {loadingOrders ? (
                  <div className="p-12 text-center rounded-3xl bg-slate-900/60 border border-slate-800/80">
                    <div className="w-7 h-7 border-2 border-[#28B9FF] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm text-slate-300 font-semibold">Loading your verified orders...</p>
                    <p className="text-xs text-slate-500 mt-1">Checking secure database access</p>
                  </div>
                ) : filteredOrders.length > 0 ? (
                  <div className="space-y-4">
                    {filteredOrders.map((order) => {
                      const isExpanded = expandedOrderId === order.id;
                      const isDelivered = order.status === 'Access Delivered' || order.status === 'Completed' || order.status === 'Payment Verified';
                      const firstItem = order.items && order.items.length > 0 ? order.items[0] : null;

                      return (
                        <div
                          key={order.id}
                          className="rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-slate-700/90 transition-all overflow-hidden shadow-lg"
                        >
                          {/* Order Header Summary */}
                          <div className="p-5 sm:p-6 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                              <div className="flex items-center gap-3 flex-wrap">
                                <span className="font-mono text-sm sm:text-base font-extrabold text-white">
                                  #{order.id}
                                </span>
                                <button
                                  onClick={() => handleCopy(order.id, `order-${order.id}`)}
                                  className="text-xs text-slate-400 hover:text-[#28B9FF] flex items-center gap-1 transition-colors"
                                  title="Copy Order ID"
                                >
                                  <Copy className="w-3 h-3" />
                                  <span>{copiedOrderId === `order-${order.id}` ? 'Copied!' : 'Copy'}</span>
                                </button>
                                <span className="text-slate-600">•</span>
                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                                  {new Date(order.createdAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                {renderStatusBadge(order.status)}
                              </div>
                            </div>

                            {/* Main Items Preview */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="space-y-2 min-w-0">
                                <div className="flex items-center gap-3">
                                  {firstItem?.thumbnail && (
                                    <img
                                      src={firstItem.thumbnail}
                                      alt={firstItem.title}
                                      className="w-12 h-12 rounded-xl object-cover border border-slate-800 shrink-0"
                                      referrerPolicy="no-referrer"
                                    />
                                  )}
                                  <div className="min-w-0">
                                    <h3 className="text-sm sm:text-base font-bold text-white truncate">
                                      {firstItem?.title || 'Digital Asset Package'}
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                      {order.items.length > 1
                                        ? `+ ${order.items.length - 1} additional item(s)`
                                        : `Payment via ${order.paymentMethod}`}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Amount & Actions */}
                              <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                                <div className="text-left sm:text-right">
                                  <span className="text-base sm:text-lg font-black text-white block">
                                    Rs. {order.totalAmountPKR.toLocaleString()}
                                  </span>
                                  <span className="text-xs text-slate-400">
                                    (${order.totalAmountUSD.toFixed(2)})
                                  </span>
                                </div>

                                <button
                                  onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                                  className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                                >
                                  <span>{isExpanded ? 'Less' : 'Details'}</span>
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Expanded Details Panel */}
                          {isExpanded && (
                            <div className="p-5 sm:p-6 bg-slate-950/90 border-t border-slate-800/80 space-y-5">
                              
                              {/* Item List */}
                              <div className="space-y-3">
                                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                                  Purchased Items ({order.items.length})
                                </h4>
                                <div className="space-y-2">
                                  {order.items.map((item, idx) => (
                                    <div
                                      key={idx}
                                      className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                                    >
                                      <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 rounded-lg bg-[#0D6EFD]/10 border border-[#0D6EFD]/20 flex items-center justify-center text-[#28B9FF] shrink-0 font-bold">
                                          {idx + 1}
                                        </div>
                                        <div className="min-w-0">
                                          <span className="font-bold text-white block truncate">{item.title}</span>
                                          <span className="text-[11px] text-slate-400 capitalize">{item.type}</span>
                                        </div>
                                      </div>
                                      <span className="font-bold text-white shrink-0">
                                        Rs. {item.price.toLocaleString()}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Action Buttons for Delivered or Pending Order */}
                              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/60">
                                
                                <div className="flex items-center gap-2 flex-wrap">
                                  {/* Quick Track Step Button */}
                                  <button
                                    onClick={() => handleQuickTrackOrder(order)}
                                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                                  >
                                    <Search className="w-3.5 h-3.5 text-[#28B9FF]" />
                                    <span>Track Steps</span>
                                  </button>

                                  {/* WhatsApp Confirmation if still pending */}
                                  {!isDelivered && (
                                    <a
                                      href={`https://wa.me/923406070632?text=${encodeURIComponent(
                                        `Hi Zohaib DigiForge! I placed Order #${order.id} for Rs. ${order.totalAmountPKR} via ${order.paymentMethod} and would like to confirm my payment.`
                                      )}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-3.5 py-2 rounded-xl bg-[#22C55E]/15 hover:bg-[#22C55E]/25 border border-[#22C55E]/30 text-[#22C55E] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                                    >
                                      <MessageCircle className="w-3.5 h-3.5" />
                                      <span>Confirm Payment on WhatsApp</span>
                                    </a>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 flex-wrap">
                                  {/* If Delivered: Download & Review buttons */}
                                  {isDelivered && (
                                    <>
                                      <button
                                        onClick={() => {
                                          setActiveTab('downloads');
                                          setDownloadSearch(order.id);
                                        }}
                                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0D6EFD] to-[#28B9FF] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#0D6EFD]/20 cursor-pointer"
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                        <span>Go to Downloads</span>
                                      </button>
                                    </>
                                  )}
                                </div>

                              </div>

                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Progressive Disclosure Empty State (Guiding to Action) */
                  <div className="p-8 sm:p-10 rounded-3xl bg-slate-900/90 border border-slate-800 text-center space-y-6">
                    <div className="w-14 h-14 rounded-2xl bg-[#0D6EFD]/10 border border-[#0D6EFD]/20 flex items-center justify-center text-[#28B9FF] mx-auto">
                      <ShoppingBag className="w-7 h-7" />
                    </div>
                    <div className="space-y-1.5 max-w-md mx-auto">
                      <h3 className="text-lg font-bold text-white">You haven't ordered yet</h3>
                      <p className="text-xs sm:text-sm text-slate-400">
                        Explore our curated developer toolkits, CapCut bundles &amp; student resources. Here is what is trending right now:
                      </p>
                    </div>

                    {/* 3 Featured Products */}
                    {popularRecommendations.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 max-w-3xl mx-auto text-left">
                        {popularRecommendations.map((prod) => (
                          <div
                            key={prod.id}
                            className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-[#0D6EFD]/50 transition-all flex flex-col justify-between"
                          >
                            <div>
                              <img
                                src={prod.thumbnail}
                                alt={prod.title}
                                className="w-full h-24 object-cover rounded-xl mb-2.5 border border-slate-800"
                                referrerPolicy="no-referrer"
                              />
                              <h4 className="font-bold text-xs text-white line-clamp-2">{prod.title}</h4>
                              <span className="text-xs font-black text-[#28B9FF] block mt-1.5">
                                {formatCombinedProductPrice(prod)}
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                if (onViewProduct) onViewProduct(prod);
                                else onNavigateResources('all', 'all');
                              }}
                              className="mt-3 w-full py-1.5 rounded-lg bg-slate-900 hover:bg-[#0D6EFD] text-slate-300 hover:text-white text-[11px] font-bold transition-colors text-center cursor-pointer"
                            >
                              View Product
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="pt-2">
                      <button
                        onClick={() => onNavigateResources('all', 'all')}
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#0D6EFD] to-[#28B9FF] text-white text-xs sm:text-sm font-bold shadow-lg shadow-[#0D6EFD]/25 hover:shadow-[#0D6EFD]/40 transition-all inline-flex items-center gap-2 cursor-pointer"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>Browse Our Resources</span>
                      </button>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* ═════════════════════════════════════════════════════════
                SECTION: BROWSE PRODUCTS (Real Live Store Catalog)
                ═════════════════════════════════════════════════════════ */}
            {activeTab === 'browse' && (
              <div className="space-y-5">
                {/* Catalog Header & Filters */}
                <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-[#22C55E]" />
                        <span>Browse Store Catalog</span>
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-400 mt-1">
                        Explore developer kits, graphic bundles, premium themes &amp; video assets.
                      </p>
                    </div>

                    <span className="self-start sm:self-auto px-3 py-1 rounded-full text-xs font-extrabold bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30">
                      {filteredBrowseProducts.length} Products Available
                    </span>
                  </div>

                  {/* Search & Category Filter Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-slate-800/80">
                    {/* Search Input */}
                    <div className="sm:col-span-6 relative">
                      <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={browseSearch}
                        onChange={(e) => setBrowseSearch(e.target.value)}
                        placeholder="Search products, templates, bundles..."
                        className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-[#0D6EFD]"
                      />
                      {browseSearch && (
                        <button
                          onClick={() => setBrowseSearch('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Category Filter */}
                    <div className="sm:col-span-3">
                      <select
                        value={browseCategory}
                        onChange={(e) => setBrowseCategory(e.target.value)}
                        className="w-full py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 focus:outline-none focus:border-[#0D6EFD]"
                      >
                        <option value="all">All Categories</option>
                        {availableCategories.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    {/* Sort Order */}
                    <div className="sm:col-span-3">
                      <select
                        value={browseSort}
                        onChange={(e) => setBrowseSort(e.target.value as any)}
                        className="w-full py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 focus:outline-none focus:border-[#0D6EFD]"
                      >
                        <option value="popular">Most Popular</option>
                        <option value="price-low">Price: Low to High</option>
                        <option value="price-high">Price: High to Low</option>
                        <option value="newest">Newest Released</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Product Grid */}
                {filteredBrowseProducts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {filteredBrowseProducts.map((prod) => (
                      <div
                        key={prod.id}
                        className="rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-[#0D6EFD]/60 transition-all flex flex-col justify-between overflow-hidden group shadow-lg"
                      >
                        <div>
                          {/* Image Thumbnail */}
                          <div className="relative aspect-video bg-slate-950 overflow-hidden">
                            <img
                              src={prod.thumbnail || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80'}
                              alt={prod.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              referrerPolicy="no-referrer"
                            />
                            {prod.category && (
                              <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-950/80 backdrop-blur-md text-[#28B9FF] border border-[#28B9FF]/30">
                                {prod.category}
                              </span>
                            )}
                            {prod.isBestseller && (
                              <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-500/90 text-slate-950 shadow-md">
                                Bestseller
                              </span>
                            )}
                          </div>

                          {/* Product Info */}
                          <div className="p-4 sm:p-5 space-y-2">
                            <h3 className="font-extrabold text-sm sm:text-base text-white group-hover:text-[#28B9FF] transition-colors line-clamp-2">
                              {prod.title}
                            </h3>
                            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                              {prod.description}
                            </p>

                            {/* Ratings & Sales count */}
                            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                              <span className="flex items-center gap-1 text-amber-400 font-bold">
                                <Star className="w-3.5 h-3.5 fill-amber-400" />
                                <span>{prod.rating || '4.9'} ({prod.reviewCount || 18})</span>
                              </span>
                              <span>{prod.salesCount || 85}+ Delivered</span>
                            </div>
                          </div>
                        </div>

                        {/* Price & Actions Footer */}
                        <div className="p-4 sm:p-5 pt-0 border-t border-slate-800/60 mt-3 flex items-center justify-between gap-3">
                          <div>
                            <span className="text-sm font-black text-white block">
                              {formatCombinedProductPrice(prod)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                if (onViewProduct) {
                                  onViewProduct(prod);
                                } else {
                                  onNavigateResources('all', 'all', prod.title);
                                }
                              }}
                              className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-200 hover:text-white transition-colors cursor-pointer"
                            >
                              View
                            </button>
                            <button
                              onClick={() => {
                                if (onViewProduct) {
                                  onViewProduct(prod);
                                } else {
                                  onNavigateResources('all', 'all', prod.title);
                                }
                              }}
                              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#0D6EFD] to-[#28B9FF] text-white text-xs font-extrabold shadow-md shadow-[#0D6EFD]/25 hover:shadow-[#0D6EFD]/40 transition-all cursor-pointer flex items-center gap-1"
                            >
                              <ShoppingBag className="w-3.5 h-3.5" />
                              <span>Get Access</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3">
                    <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
                    <h3 className="text-base font-bold text-white">No products match your search</h3>
                    <p className="text-xs text-slate-400">Try adjusting your category filter or search keywords.</p>
                    <button
                      onClick={() => {
                        setBrowseSearch('');
                        setBrowseCategory('all');
                      }}
                      className="mt-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors cursor-pointer"
                    >
                      Reset All Filters
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ═════════════════════════════════════════════════════════
                SECTION: PRO TOOLS & EXPIRY TIMERS
                ═════════════════════════════════════════════════════════ */}
            {activeTab === 'subscriptions' && (
              <div className="space-y-5">
                <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                      <Clock className="w-5 h-5 text-amber-400" />
                      <span>Pro Tools & Expiry Timers</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">
                      Monitor your active tools, subscription expiry dates, and automated 3-day reminder notices.
                    </p>
                  </div>
                  <div className="px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center gap-2">
                    <span>⚡ Live Timer Active</span>
                  </div>
                </div>

                {orders.length === 0 ? (
                  <div className="p-12 text-center rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
                    <Clock className="w-12 h-12 text-slate-600 mx-auto" />
                    <div className="text-slate-300 font-bold text-sm">No Active Pro Tools Found</div>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Purchase a Pro Tool or Bundle to start tracking subscription expiry dates and timers here.
                    </p>
                    <button
                      onClick={() => onNavigateMembership()}
                      className="px-6 py-3 rounded-xl bg-[#0D6EFD] text-white text-xs font-bold shadow-md hover:bg-[#0b5ed7] transition-all cursor-pointer"
                    >
                      Explore Membership & Tools
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {orders.flatMap(order => (order.items || []).map((item, idx) => {
                      const expiresAt = item.expiresAt ? new Date(item.expiresAt) : new Date(Date.now() + 30*24*3600*1000);
                      const now = new Date();
                      const diffMs = expiresAt.getTime() - now.getTime();
                      const diffDays = Math.ceil(diffMs / (1000 * 3600 * 24));
                      const isExpired = diffMs <= 0;
                      const isExpiringSoon = diffDays <= 3 && !isExpired;

                      return (
                        <div key={`${order.id}-${idx}`} className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              {item.thumbnail ? (
                                <img src={item.thumbnail} alt="" className="w-10 h-10 rounded-xl object-cover bg-slate-950 border border-slate-800" />
                              ) : (
                                <div className="w-10 h-10 rounded-xl bg-[#0D6EFD]/10 border border-[#0D6EFD]/30 flex items-center justify-center text-[#28B9FF] font-bold">
                                  {item.title.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <div className="text-xs sm:text-sm font-bold text-white line-clamp-1">{item.title}</div>
                                <div className="text-[10px] text-slate-400 uppercase font-semibold">Order #{order.id.slice(-6)}</div>
                              </div>
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                              isExpired ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' :
                              isExpiringSoon ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse' :
                              'bg-emerald-500/10 text-[#22C55E] border border-emerald-500/30'
                            }`}>
                              {isExpired ? 'Expired' : isExpiringSoon ? `⚠️ Expiring in ${diffDays}d` : 'Active'}
                            </span>
                          </div>

                          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs">
                            <div className="flex items-center justify-between text-slate-400">
                              <span>Expiry Date:</span>
                              <span className="text-white font-bold">{expiresAt.toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-400">
                              <span>Time Remaining:</span>
                              <span className={`font-mono font-bold ${isExpired ? 'text-rose-400' : isExpiringSoon ? 'text-amber-400' : 'text-[#22C55E]'}`}>
                                {isExpired ? 'Access Expired' : `${diffDays} Days Remaining`}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2">
                            <button
                              onClick={() => onViewProduct(item.productId)}
                              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
                            >
                              View Details
                            </button>
                            <button
                              onClick={() => onNavigateMembership()}
                              className="px-3.5 py-2 rounded-xl bg-[#0D6EFD] hover:bg-[#0b5ed7] text-white text-xs font-bold shadow-md shadow-[#0D6EFD]/20 transition-all cursor-pointer"
                            >
                              Renew / Extend
                            </button>
                          </div>
                        </div>
                      );
                    }))}
                  </div>
                )}
              </div>
            )}

            {/* ═════════════════════════════════════════════════════════
                SECTION 2: MY DOWNLOADS
                ═════════════════════════════════════════════════════════ */}
            {activeTab === 'downloads' && (
              <div className="space-y-5">
                
                {/* Downloads Header & Search */}
                <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                      <Download className="w-5 h-5 text-[#22C55E]" />
                      <span>My Digital Downloads</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">
                      Direct cloud access links &amp; license keys for your verified purchases.
                    </p>
                  </div>

                  {/* Search / Filter Input */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={downloadSearch}
                        onChange={(e) => setDownloadSearch(e.target.value)}
                        placeholder="Search your downloads..."
                        className="w-full py-2 pl-9 pr-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#0D6EFD]"
                      />
                    </div>
                  </div>
                </div>

                {/* Downloads Grid */}
                {filteredDownloads.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredDownloads.map((item, idx) => {
                      const historyKey = `${item.orderId}-${item.itemTitle}`;
                      const lastDownloaded = downloadHistory[historyKey];

                      return (
                        <div
                          key={idx}
                          className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 shadow-lg"
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] font-extrabold text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Access Ready</span>
                              </span>
                              <span className="text-[11px] text-slate-500 font-mono">
                                Order #{item.orderId}
                              </span>
                            </div>

                            <div className="flex items-start gap-3">
                              {item.productThumbnail && (
                                <img
                                  src={item.productThumbnail}
                                  alt={item.itemTitle}
                                  className="w-14 h-14 rounded-2xl object-cover border border-slate-800 shrink-0"
                                  referrerPolicy="no-referrer"
                                />
                              )}
                              <div className="min-w-0">
                                <h3 className="font-bold text-sm text-white leading-snug">
                                  {item.itemTitle}
                                </h3>
                                <p className="text-xs text-slate-400 mt-1">
                                  Unlocked {new Date(item.orderDate).toLocaleDateString()}
                                </p>
                              </div>
                            </div>

                            {lastDownloaded && (
                              <p className="text-[11px] text-slate-400 flex items-center gap-1 bg-slate-950/60 px-2.5 py-1 rounded-lg border border-slate-800/60">
                                <Clock className="w-3 h-3 text-slate-500" />
                                <span>Last accessed: {new Date(lastDownloaded).toLocaleDateString()}</span>
                              </p>
                            )}
                          </div>

                          {/* Download Buttons */}
                          <div className="pt-3 border-t border-slate-800/80 space-y-2">
                            {item.downloadLinks.map((link, lIdx) => (
                              <button
                                key={lIdx}
                                onClick={() => handleRecordDownload(item.orderId, item.itemTitle, link)}
                                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#0D6EFD] to-[#28B9FF] hover:opacity-95 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-[#0D6EFD]/20 transition-all cursor-pointer"
                              >
                                <Download className="w-4 h-4" />
                                <span>{item.downloadLinks.length > 1 ? `Open Download Link ${lIdx + 1}` : 'Access Google Drive / Download Asset'}</span>
                                <ExternalLink className="w-3 h-3 ml-auto opacity-70" />
                              </button>
                            ))}
                          </div>

                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Empty State */
                  <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/90 border border-slate-800 text-center space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#22C55E]/10 border border-[#22C55E]/20 flex items-center justify-center text-[#22C55E] mx-auto">
                      <Download className="w-7 h-7" />
                    </div>
                    <div className="space-y-1.5 max-w-md mx-auto">
                      <h3 className="text-lg font-bold text-white">No downloads yet</h3>
                      <p className="text-xs sm:text-sm text-slate-400">
                        Purchased templates, developer kits, and Google Drive links will appear here immediately once payment is verified.
                      </p>
                    </div>
                    <button
                      onClick={() => onNavigateResources('all', 'all')}
                      className="mt-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0D6EFD] to-[#28B9FF] text-white text-xs sm:text-sm font-bold shadow-md shadow-[#0D6EFD]/20 transition-all inline-flex items-center gap-2 cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>Explore Digital Catalog</span>
                    </button>
                  </div>
                )}

              </div>
            )}

            {/* ═════════════════════════════════════════════════════════
                SECTION 3: TRACK ORDER BY ID
                ═════════════════════════════════════════════════════════ */}
            {activeTab === 'track' && (
              <div className="space-y-6">
                
                {/* Search / Input Box */}
                <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-5">
                  <div>
                    <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                      <Search className="w-5 h-5 text-[#28B9FF]" />
                      <span>Track Order Status</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">
                      Check live manual verification progress for any order under your account.
                    </p>
                  </div>

                  <form onSubmit={handleTrackSubmit} className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={trackInputId}
                        onChange={(e) => setTrackInputId(e.target.value)}
                        placeholder="Enter Order ID (e.g. ZDF-102938)..."
                        className="w-full py-3.5 px-4 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#0D6EFD] focus:ring-2 focus:ring-[#0D6EFD]/30"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={trackLoading || !trackInputId.trim()}
                      className="py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#0D6EFD] to-[#28B9FF] hover:opacity-95 disabled:opacity-50 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#0D6EFD]/25 transition-all cursor-pointer"
                    >
                      {trackLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                      <span>Track Order</span>
                    </button>
                  </form>

                  {/* Quick Pills of User's Orders */}
                  {orders.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      <span className="text-[11px] text-slate-400 font-medium">Your recent orders:</span>
                      {orders.slice(0, 4).map((o) => (
                        <button
                          key={o.id}
                          type="button"
                          onClick={() => {
                            setTrackInputId(o.id);
                            setTrackedOrder(o);
                            setTrackError('');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-[#28B9FF] font-mono transition-colors cursor-pointer"
                        >
                          #{o.id}
                        </button>
                      ))}
                    </div>
                  )}

                  {trackError && (
                    <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{trackError}</span>
                    </div>
                  )}
                </div>

                {/* Tracked Result View */}
                {trackedOrder && (
                  <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-6">
                    
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">Order ID:</span>
                          <span className="font-mono text-base font-extrabold text-white">#{trackedOrder.id}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Placed on {new Date(trackedOrder.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        {renderStatusBadge(trackedOrder.status)}
                      </div>
                    </div>

                    {/* 4-Step Verification Timeline (Store's Real Manual Verification Flow) */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                        Manual Verification Step Tracker
                      </h3>

                      {(() => {
                        const isPending = trackedOrder.status === 'Pending Verification';
                        const isVerified = trackedOrder.status === 'Payment Verified';
                        const isDelivered = trackedOrder.status === 'Access Delivered' || trackedOrder.status === 'Completed';

                        const steps = [
                          {
                            title: '1. Order Placed',
                            desc: 'Order registered & checkout receipt generated',
                            completed: true,
                            active: false
                          },
                          {
                            title: '2. Payment Pending',
                            desc: 'Customer transfers amount via JazzCash / EasyPaisa / Bank',
                            completed: !isPending,
                            active: isPending
                          },
                          {
                            title: '3. Payment Verified',
                            desc: 'Payment receipt matched within 15–45 mins',
                            completed: isDelivered,
                            active: isVerified
                          },
                          {
                            title: '4. Access Delivered',
                            desc: 'Google Drive cloud folder unlocked & emailed',
                            completed: isDelivered,
                            active: false
                          }
                        ];

                        return (
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                            {steps.map((s, idx) => (
                              <div
                                key={idx}
                                className={`p-4 rounded-2xl border transition-all ${
                                  s.completed
                                    ? 'bg-[#22C55E]/10 border-[#22C55E]/30 text-white'
                                    : s.active
                                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-200 ring-2 ring-amber-500/20'
                                    : 'bg-slate-950 border-slate-800/80 text-slate-400 opacity-60'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                  <span className="font-bold text-xs">{s.title}</span>
                                  {s.completed ? (
                                    <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
                                  ) : s.active ? (
                                    <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                                  ) : (
                                    <div className="w-3 h-3 rounded-full border border-slate-700" />
                                  )}
                                </div>
                                <p className="text-[11px] leading-relaxed opacity-90">{s.desc}</p>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Items & Payment Info */}
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Payment Method:</span>
                        <span className="font-bold text-white">{trackedOrder.paymentMethod}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Total Amount:</span>
                        <span className="font-extrabold text-[#28B9FF]">
                          Rs. {trackedOrder.totalAmountPKR.toLocaleString()} (${trackedOrder.totalAmountUSD.toFixed(2)})
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-800/60">
                        <span className="text-slate-400">Items:</span>
                        <span className="font-medium text-slate-300">
                          {trackedOrder.items.map(i => i.title).join(', ')}
                        </span>
                      </div>
                    </div>

                    {/* WhatsApp Action */}
                    <div className="pt-2 flex items-center justify-between gap-3 flex-wrap">
                      <a
                        href={`https://wa.me/923406070632?text=${encodeURIComponent(
                          `Hi Zohaib DigiForge! Checking status for my Order #${trackedOrder.id} (Status: ${trackedOrder.status}).`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2.5 rounded-xl bg-[#22C55E]/15 hover:bg-[#22C55E]/25 border border-[#22C55E]/30 text-[#22C55E] text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Message on WhatsApp for Instant Update</span>
                      </a>

                      {(trackedOrder.status === 'Access Delivered' || trackedOrder.status === 'Completed') && (
                        <button
                          onClick={() => {
                            setActiveTab('downloads');
                            setDownloadSearch(trackedOrder.id);
                          }}
                          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0D6EFD] to-[#28B9FF] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#0D6EFD]/20 cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                          <span>View Unlocked Downloads</span>
                        </button>
                      )}
                    </div>

                  </div>
                )}

              </div>
            )}

            {/* ═════════════════════════════════════════════════════════
                SECTION 6: REFERRAL & AFFILIATE PROGRAM (REFER & EARN)
                ═════════════════════════════════════════════════════════ */}
            {activeTab === 'referrals' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                
                {/* Hero Header Banner with Tier Recognition */}
                <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-[#0D1B36] to-[#0A1628] border border-slate-800 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-[#0D6EFD]/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-3.5 max-w-xl">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                        <Award className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Zohaib DigiForge Ambassador &amp; Partner Program</span>
                      </div>

                      <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
                        Double-Sided Rewards: Give <span className="text-emerald-400">{currentTier.friendDiscount}% OFF</span>, Earn <span className="text-[#28B9FF]">{currentTier.commissionRate}% Commission</span>!
                      </h2>

                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                        Share your personalized code with fellow developers, students, or colleagues. They save money instantly, and you earn verified cash rewards sent directly to your JazzCash, EasyPaisa, or Bank Account.
                      </p>
                    </div>

                    {/* Interactive Level Badge */}
                    <div className="shrink-0 p-5 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-center space-y-3 min-w-[200px]">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Your Current Tier</span>
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-900 border border-slate-700/80 text-3xl shadow-inner">
                        {currentTier.icon}
                      </div>
                      <div>
                        <span className={`block font-black text-sm tracking-tight ${currentTier.textColor}`}>
                          {currentTier.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                          {totalReferredCount} Verified Referral{totalReferredCount !== 1 && 's'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tier Progress Roadmap Slider */}
                <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300">Ambassador Progress Timeline</span>
                    </div>
                    {currentTier.nextTier ? (
                      <span className="text-[11px] font-bold text-slate-400">
                        Only <strong className="text-emerald-400 font-black">{currentTier.referralsNeededForNext}</strong> more referral{currentTier.referralsNeededForNext !== 1 && 's'} to unlock <span className="text-[#28B9FF]">{currentTier.nextTier}</span>!
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                        🏆 You are at the absolute peak tier! Keep earning maximum benefits.
                      </span>
                    )}
                  </div>

                  {/* Custom Progress Bar */}
                  <div className="relative">
                    <div className="h-2.5 rounded-full bg-slate-950 border border-slate-800/60 overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r ${currentTier.color} transition-all duration-500 rounded-full`}
                        style={{ width: `${currentTier.progress}%` }}
                      />
                    </div>
                    
                    {/* Milepost Indicators */}
                    <div className="flex items-center justify-between mt-2.5 text-[10px] font-bold text-slate-500 px-1">
                      <span className={totalReferredCount < 6 ? 'text-orange-400' : 'text-slate-400'}>🥉 Bronze Starter (0)</span>
                      <span className={totalReferredCount >= 6 && totalReferredCount < 16 ? 'text-slate-200' : 'text-slate-400'}>🥈 Silver Ambassador (6)</span>
                      <span className={totalReferredCount >= 16 ? 'text-amber-400 font-extrabold' : 'text-slate-400'}>🥇 Gold Elite (16)</span>
                    </div>
                  </div>
                </div>

                {/* Referral Code & Share Link Action Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  
                  {/* Card 1: Referral Code */}
                  <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-[#28B9FF]" />
                        <span>Your Promo Referral Code</span>
                      </span>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        {currentTier.friendDiscount}% OFF Coupon Active
                      </span>
                    </div>

                    {loadingReferrals ? (
                      <div className="h-14 rounded-2xl bg-slate-950 animate-pulse border border-slate-850 flex items-center justify-center">
                        <span className="text-xs text-slate-500">Generating promo code...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80">
                        <span className="font-mono text-lg sm:text-xl font-black text-[#28B9FF] tracking-wider truncate">
                          {referralStats?.referralCode || `ZDF-${currentUser.displayName?.replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase() || 'PRO'}`}
                        </span>
                        <button
                          onClick={() => {
                            const code = referralStats?.referralCode || `ZDF-${currentUser.displayName?.replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase() || 'PRO'}`;
                            navigator.clipboard.writeText(code);
                            setCopiedRefCode(true);
                            setTimeout(() => setCopiedRefCode(false), 2000);
                          }}
                          className="px-3.5 py-2 rounded-xl bg-[#0D6EFD] hover:bg-[#0b5ed7] text-white text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 shadow-md cursor-pointer"
                        >
                          {copiedRefCode ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-white" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Code</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Give this code to friends. When they paste it in their checkout cart, they get an instant <strong className="text-emerald-400">{currentTier.friendDiscount}% discount</strong> on any purchase.
                    </p>
                  </div>

                  {/* Card 2: Shareable Link & WhatsApp */}
                  <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Share2 className="w-3.5 h-3.5 text-[#22C55E]" />
                        <span>Direct Invite Link</span>
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#0D6EFD]/15 text-[#28B9FF] border border-[#0D6EFD]/30">
                        1-Click Share
                      </span>
                    </div>

                    {(() => {
                      const code = referralStats?.referralCode || `ZDF-${currentUser.displayName?.replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase() || 'PRO'}`;
                      const shareUrl = `${window.location.origin}/ref/${code}`;
                      const waText = encodeURIComponent(
                        `🚀 Assalam-o-Alaikum! Mujhe Zohaib DigiForge par bohot kamal ke Premium video courses, dev tools aur source code templates mile hain!\n\nMera personal referral code *${code}* use karo checkout par aur payo instant *${currentTier.friendDiscount}% flat discount* pure order par:\n👉 Link: ${shareUrl}`
                      );

                      return (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-slate-950 border border-slate-800/80">
                            <span className="text-xs text-slate-300 truncate font-mono select-all px-1">
                              {shareUrl}
                            </span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(shareUrl);
                                setCopiedRefLink(true);
                                setTimeout(() => setCopiedRefLink(false), 2000);
                              }}
                              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold shrink-0 cursor-pointer"
                              title="Copy Link"
                            >
                              {copiedRefLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>

                          <div className="flex gap-2">
                            <a
                              href={`https://wa.me/?text=${waText}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 py-2.5 px-3 rounded-xl bg-[#22C55E] hover:bg-[#1eb054] text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                            >
                              <MessageCircle className="w-4 h-4 fill-slate-950" />
                              <span>Share on WhatsApp</span>
                            </a>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                </div>

                {/* Key Referral Statistics Grid */}
                {(() => {
                  let localPendingPKR = 0;
                  let localPaidPKR = 0;
                  let localCanceledPKR = 0;
                  let localActiveTotalPKR = 0;

                  if (referralStats && referralStats.referredOrders) {
                    referralStats.referredOrders.forEach(ro => {
                      const reward = ro.rewardPKR || ro.rewardEarnedPKR || 0;
                      const status = ro.status || 'pending';
                      if (status === 'pending') {
                        localPendingPKR += reward;
                        localActiveTotalPKR += reward;
                      } else if (status === 'paid') {
                        localPaidPKR += reward;
                        localActiveTotalPKR += reward;
                      } else if (status === 'canceled') {
                        localCanceledPKR += reward;
                      }
                    });
                  } else {
                    localActiveTotalPKR = referralStats?.totalEarnedPKR || 0;
                  }

                  return (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 text-center space-y-1">
                        <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto mb-2">
                          <Users className="w-4 h-4" />
                        </div>
                        <span className="block text-2xl font-black text-white">
                          {totalReferredCount}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400">Total Referrals</span>
                      </div>

                      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 text-center space-y-1">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-2">
                          <Clock className={`w-4 h-4 ${localPendingPKR > 0 ? 'animate-pulse' : ''}`} />
                        </div>
                        <span className={`block text-xl sm:text-2xl font-black ${localPendingPKR > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-300'}`}>
                          Rs. {localPendingPKR.toLocaleString()}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400">Pending Balance</span>
                      </div>

                      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 text-center space-y-1">
                        <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto mb-2">
                          <Award className="w-4 h-4" />
                        </div>
                        <span className="block text-xl sm:text-2xl font-black text-purple-300 truncate">
                          Rs. {localActiveTotalPKR.toLocaleString()}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400">Total Commissions</span>
                      </div>

                      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 text-center space-y-1 animate-in zoom-in-95 duration-200">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-2">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <span className="block text-xl sm:text-2xl font-black text-[#22C55E]">
                          Rs. {localPaidPKR.toLocaleString()}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400">Paid Out</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Premium Tier Comparison & Perks Details */}
                <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-6 shadow-xl">
                  <div>
                    <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                      <Award className="w-4 h-4 text-emerald-400" />
                      <span>DigiForge Ambassador Tiers Comparison</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Increase referrals to boost your commission rates and unlock VIP rewards</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                    
                    {/* Tier 1: Bronze */}
                    <div className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                      currentTier.level === 'Bronze' 
                        ? 'bg-orange-500/5 border-orange-500/40 shadow-lg ring-1 ring-orange-500/20' 
                        : 'bg-slate-950/60 border-slate-800/80 opacity-60'
                    }`}>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                            <span>🥉 Bronze Starter</span>
                          </span>
                          {currentTier.level === 'Bronze' && (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300">Current</span>
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          <span className="block text-2xl font-black text-white">10% Commission</span>
                          <span className="text-[11px] text-slate-400 block">Offers 10% discount for referred friends</span>
                        </div>

                        <ul className="space-y-2 text-[11px] text-slate-300 border-t border-slate-800/80 pt-3">
                          <li className="flex items-start gap-1.5">
                            <span className="text-emerald-400 font-extrabold">✓</span>
                            <span>Standard dashboard logs</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-emerald-400 font-extrabold">✓</span>
                            <span>JazzCash/EasyPaisa payouts</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-emerald-400 font-extrabold">✓</span>
                            <span>Payout requests processed weekly</span>
                          </li>
                        </ul>
                      </div>
                      <div className="pt-4 mt-4 border-t border-slate-800/40 text-[10px] font-bold text-orange-400 text-center uppercase tracking-wider">
                        Level (0 - 5 referrals)
                      </div>
                    </div>

                    {/* Tier 2: Silver */}
                    <div className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                      currentTier.level === 'Silver' 
                        ? 'bg-slate-300/5 border-slate-400/40 shadow-lg ring-1 ring-slate-400/20' 
                        : 'bg-slate-950/60 border-slate-800/80 opacity-60'
                    }`}>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                            <span>🥈 Silver Ambassador</span>
                          </span>
                          {currentTier.level === 'Silver' && (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-300/20 text-slate-300">Current</span>
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          <span className="block text-2xl font-black text-white">15% Commission</span>
                          <span className="text-[11px] text-slate-400 block">Offers 12% discount for referred friends</span>
                        </div>

                        <ul className="space-y-2 text-[11px] text-slate-300 border-t border-slate-800/80 pt-3">
                          <li className="flex items-start gap-1.5">
                            <span className="text-emerald-400 font-extrabold">✓</span>
                            <span>Increased 15% reward rate</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-emerald-400 font-extrabold">✓</span>
                            <span>Dedicated partner support group</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-emerald-400 font-extrabold">✓</span>
                            <span>Payouts processed inside 12 hours</span>
                          </li>
                        </ul>
                      </div>
                      <div className="pt-4 mt-4 border-t border-slate-800/40 text-[10px] font-bold text-slate-300 text-center uppercase tracking-wider">
                        Level (6 - 15 referrals)
                      </div>
                    </div>

                    {/* Tier 3: Gold */}
                    <div className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                      currentTier.level === 'Gold' 
                        ? 'bg-amber-500/5 border-amber-500/40 shadow-lg ring-1 ring-amber-500/20' 
                        : 'bg-slate-950/60 border-slate-800/80 opacity-60'
                    }`}>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                            <span>🥇 Gold Elite Partner</span>
                          </span>
                          {currentTier.level === 'Gold' && (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">Current</span>
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          <span className="block text-2xl font-black text-white">20% Commission</span>
                          <span className="text-[11px] text-slate-400 block">Offers 15% discount for referred friends</span>
                        </div>

                        <ul className="space-y-2 text-[11px] text-slate-300 border-t border-slate-800/80 pt-3">
                          <li className="flex items-start gap-1.5">
                            <span className="text-emerald-400 font-extrabold">✓</span>
                            <span>Massive 20% reward rate</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-emerald-400 font-extrabold">✓</span>
                            <span>Priority payout requests (&lt; 1 hour)</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-emerald-400 font-extrabold">✓</span>
                            <span>Free monthly ZDF tool voucher (Rs. 2,000)</span>
                          </li>
                        </ul>
                      </div>
                      <div className="pt-4 mt-4 border-t border-slate-800/40 text-[10px] font-bold text-amber-400 text-center uppercase tracking-wider">
                        Level (16+ referrals)
                      </div>
                    </div>

                  </div>
                </div>

                {/* Referred Orders History Logs */}
                <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#28B9FF]" />
                      <span>Your Referred Orders History Log</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Real-time status tracking of all customers using your personal promo code</p>
                  </div>

                  {!referralStats?.referredOrders || referralStats.referredOrders.length === 0 ? (
                    <div className="p-10 text-center rounded-2xl bg-slate-950 border border-slate-850 space-y-2.5">
                      <Users className="w-8 h-8 text-slate-700 mx-auto" />
                      <span className="block text-xs text-slate-400 font-bold">No Referrals Registered Yet</span>
                      <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                        Copy your promo code or invite link above and share it on WhatsApp, programming groups, or with classmates to secure your first cash commission!
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-slate-800">
                      <table className="w-full text-left text-xs text-slate-300 border-collapse">
                        <thead>
                          <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                            <th className="p-4 font-bold">Ref ID / Client</th>
                            <th className="p-4 font-bold">Date</th>
                            <th className="p-4 font-bold">Order Amount</th>
                            <th className="p-4 font-bold">Payout Status</th>
                            <th className="p-4 font-bold text-right">Commission Earned</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 bg-slate-900/30">
                          {referralStats.referredOrders.map((ro, idx) => {
                            const status = ro.status || 'pending';
                            const reward = ro.rewardPKR || ro.rewardEarnedPKR || 0;
                            return (
                              <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                                <td className="p-4 font-semibold text-white">
                                  <div className="flex flex-col">
                                    <span>{ro.customerName || 'ZDF Customer'}</span>
                                    <span className="text-[10px] font-mono text-slate-500">{ro.orderId ? `Order #${ro.orderId.substring(0, 8)}...` : 'N/A'}</span>
                                  </div>
                                </td>
                                <td className="p-4 text-slate-400">
                                  {ro.date ? new Date(ro.date).toLocaleDateString('en-US', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                  }) : 'N/A'}
                                </td>
                                <td className="p-4 text-slate-300 font-mono font-bold">
                                  Rs. {(ro.amountPKR || 0).toLocaleString()}
                                </td>
                                <td className="p-4">
                                  {status === 'pending' && (
                                    <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 text-[10px] font-black border border-amber-500/20">
                                      ⏳ Pending Payout
                                    </span>
                                  )}
                                  {status === 'paid' && (
                                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-black border border-emerald-500/20">
                                      ✅ Paid Out
                                    </span>
                                  )}
                                  {status === 'canceled' && (
                                    <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 text-[10px] font-black border border-rose-500/20">
                                      ❌ Canceled
                                    </span>
                                  )}
                                </td>
                                <td className="p-4 text-right text-[#22C55E] font-black font-mono">
                                  + Rs. {reward.toLocaleString()}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Direct Payout WhatsApp CTA */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-950 to-slate-950 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-emerald-300">Ready to Cash Out?</h4>
                      <p className="text-[11px] text-slate-400">
                        Message Muhammad Zohaib Shahzad on WhatsApp with your Referral Code to request immediate payout transfer to JazzCash, EasyPaisa, or any Pakistani Bank Account.
                      </p>
                    </div>
                    <a
                      href={`https://wa.me/923406070632?text=Hi%20Zohaib!%20I%20want%20to%20request%20a%20payout%20for%20my%20referrals.%20My%20referral%2520code%20is%20${referralStats?.referralCode || 'ZDF-CODE'}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs whitespace-nowrap transition-all shadow-md shrink-0 cursor-pointer"
                    >
                      Request Payout
                    </a>
                  </div>
                </div>

              </div>
            )}

            {/* ═════════════════════════════════════════════════════════
                SECTION 4: MY ACCOUNT (Profile, Security, Preferences, Danger Zone)
                ═════════════════════════════════════════════════════════ */}
            {activeTab === 'account' && (
              <div className="space-y-6">
                
                {/* 1. Profile Section */}
                <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                        <User className="w-5 h-5 text-amber-400" />
                        <span>Profile Details</span>
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-400 mt-1">
                        Manage your customer name and WhatsApp contact number.
                      </p>
                    </div>

                    {!isEditingProfile ? (
                      <button
                        onClick={() => setIsEditingProfile(true)}
                        className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#28B9FF]" />
                        <span>Edit Profile</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setIsEditingProfile(false)}
                        className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-xs font-semibold text-slate-400 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                  {profileSuccessMsg && (
                    <div className="p-3.5 rounded-2xl bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#22C55E] text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{profileSuccessMsg}</span>
                    </div>
                  )}

                  {!isEditingProfile ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
                        <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
                          Full Name
                        </span>
                        <span className="text-sm font-bold text-white block">
                          {currentUser.displayName || 'Not specified'}
                        </span>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
                        <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
                          Email Address (Read-only)
                        </span>
                        <span className="text-sm font-bold text-white block truncate">
                          {currentUser.email}
                        </span>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
                        <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
                          WhatsApp / Phone
                        </span>
                        <span className="text-sm font-bold text-white block">
                          {currentUser.phone || currentUser.whatsapp || '03406070632 (Default)'}
                        </span>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
                        <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
                          Account Role
                        </span>
                        <span className="text-sm font-bold text-[#22C55E] flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4" />
                          <span>Verified Customer</span>
                        </span>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSaveProfile} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-300 mb-1.5">Full Name</label>
                          <input
                            type="text"
                            value={editDisplayName || ''}
                            onChange={(e) => setEditDisplayName(e.target.value)}
                            className="w-full py-2.5 px-3.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-[#0D6EFD]"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-300 mb-1.5">
                            Email (Tied to Auth - Read-only)
                          </label>
                          <input
                            type="email"
                            value={currentUser.email}
                            disabled
                            className="w-full py-2.5 px-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-slate-500 cursor-not-allowed"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-300 mb-1.5">WhatsApp / Phone</label>
                          <input
                            type="text"
                            value={editPhone || ''}
                            onChange={(e) => setEditPhone(e.target.value)}
                            placeholder="03406070632"
                            className="w-full py-2.5 px-3.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-[#0D6EFD]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-300 mb-1.5">Avatar Image URL (Optional)</label>
                          <input
                            type="url"
                            value={editPhotoURL || ''}
                            onChange={(e) => setEditPhotoURL(e.target.value)}
                            placeholder="https://..."
                            className="w-full py-2.5 px-3.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-[#0D6EFD]"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        <button
                          type="submit"
                          disabled={savingProfile}
                          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0D6EFD] to-[#28B9FF] hover:opacity-95 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md shadow-[#0D6EFD]/20"
                        >
                          {savingProfile ? (
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                          <span>Save Changes</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditingProfile(false)}
                          className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-400 hover:text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* 2. Security Section (Password Change & Timestamps) */}
                <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-5">
                  <div>
                    <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                      <Lock className="w-5 h-5 text-[#28B9FF]" />
                      <span>Security &amp; Password</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">
                      Update your login password and review your account creation history.
                    </p>
                  </div>

                  {passwordSuccessMsg && (
                    <div className="p-3.5 rounded-2xl bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#22C55E] text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{passwordSuccessMsg}</span>
                    </div>
                  )}

                  {passwordErrorMsg && (
                    <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{passwordErrorMsg}</span>
                    </div>
                  )}

                  <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">Current Password</label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password..."
                        className="w-full py-2.5 px-3.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-[#0D6EFD]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1.5">New Password</label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Min 6 characters..."
                          className="w-full py-2.5 px-3.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-[#0D6EFD]"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1.5">Confirm Password</label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repeat new password..."
                          className="w-full py-2.5 px-3.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-[#0D6EFD]"
                          required
                        />
                      </div>
                    </div>

                    <PasswordStrengthIndicator password={newPassword} />

                    <button
                      type="submit"
                      disabled={changingPassword || !newPassword}
                      className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-[#0D6EFD] text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                    >
                      {changingPassword && (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      )}
                      <span>Update Password</span>
                    </button>
                  </form>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>Account Created: {new Date(currentUser.createdAt || Date.now()).toLocaleDateString()}</span>
                    </span>
                    <span className="text-slate-600">•</span>
                    <span>Last Sign In: {new Date(currentUser.lastLoginAt || Date.now()).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* 3. Preferences Section (Newsletter) */}
                <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                        <Bell className="w-5 h-5 text-[#22C55E]" />
                        <span>Newsletter Preferences</span>
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-400 mt-1">
                        Control what updates you receive by email.
                      </p>
                    </div>

                    {prefSaveMsg && (
                      <span className="text-xs font-bold text-[#22C55E] bg-[#22C55E]/10 px-2.5 py-1 rounded-lg">
                        {prefSaveMsg}
                      </span>
                    )}
                  </div>

                  <div className="space-y-3 max-w-2xl">
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-white">Digital Resource Newsletter</h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Weekly free cloud asset drops, CapCut tips &amp; course discounts.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleToggleNewsletter}
                        className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                          newsletterSubscribed ? 'bg-[#22C55E]' : 'bg-slate-800'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                            newsletterSubscribed ? 'left-6.5' : 'left-0.5'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 4. Danger Zone (Visually De-emphasized at Bottom) */}
                <div className="p-6 sm:p-8 rounded-3xl bg-slate-950/60 border border-rose-500/20 space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider">
                      Danger Zone
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Permanently delete your user profile. Per our Privacy Policy, past receipts remain securely archived for tax records.
                    </p>
                  </div>

                  <button
                    onClick={() => setDeleteModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Account</span>
                  </button>
                </div>

              </div>
            )}

          </main>

        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════
          DELETE ACCOUNT CONFIRMATION MODAL
          ═════════════════════════════════════════════════════════════ */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-rose-500/30 shadow-2xl space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">Delete Customer Account?</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                This action is irreversible. You will lose dashboard access to your saved downloads. Type <strong className="text-rose-400">DELETE</strong> below to confirm.
              </p>
            </div>

            {deleteError && (
              <p className="text-xs text-rose-400 font-bold">{deleteError}</p>
            )}

            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder='Type "DELETE" to confirm'
              className="w-full py-2.5 px-3.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-rose-500"
            />

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deletingAccount || deleteConfirmText.trim().toUpperCase() !== 'DELETE'}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                {deletingAccount ? 'Deleting...' : 'Confirm Delete'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setDeleteConfirmText('');
                  setDeleteError('');
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          MOBILE BOTTOM TAB BAR (One-Thumb Quick Access)
          ═════════════════════════════════════════════════════════ */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0D1527]/95 backdrop-blur-lg border-t border-slate-800 px-2 py-1.5">
        <div className="grid grid-cols-4 gap-1 text-center">
          
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-1.5 px-0.5 rounded-xl flex flex-col items-center gap-1 text-[10px] font-bold transition-all ${
              activeTab === 'orders' ? 'text-[#28B9FF] bg-slate-900' : 'text-slate-400'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Orders</span>
          </button>

          <button
            onClick={() => setActiveTab('downloads')}
            className={`py-1.5 px-0.5 rounded-xl flex flex-col items-center gap-1 text-[10px] font-bold transition-all ${
              activeTab === 'downloads' ? 'text-[#22C55E] bg-slate-900' : 'text-slate-400'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Downloads</span>
          </button>

          <button
            onClick={() => setActiveTab('track')}
            className={`py-1.5 px-0.5 rounded-xl flex flex-col items-center gap-1 text-[10px] font-bold transition-all ${
              activeTab === 'track' ? 'text-[#28B9FF] bg-slate-900' : 'text-slate-400'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Track</span>
          </button>

          <button
            onClick={() => setActiveTab('account')}
            className={`py-1.5 px-0.5 rounded-xl flex flex-col items-center gap-1 text-[10px] font-bold transition-all ${
              activeTab === 'account' ? 'text-amber-400 bg-slate-900' : 'text-slate-400'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Account</span>
          </button>

        </div>
      </div>

    </div>
  );
};

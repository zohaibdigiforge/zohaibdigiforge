import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Download, 
  Filter, 
  ShieldCheck, 
  Crown, 
  Package, 
  Mail, 
  Phone, 
  ExternalLink, 
  KeyRound, 
  Calendar, 
  Clock, 
  Laptop, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Sparkles, 
  Copy, 
  Check, 
  RefreshCw, 
  MessageSquare, 
  Eye, 
  X, 
  Edit3, 
  UserCheck, 
  UserX,
  ChevronDown,
  ArrowUpDown,
  Lock,
  DollarSign
} from 'lucide-react';
import { 
  UserProfile, 
  Order, 
  UserRole, 
  UserMembershipStatus, 
  UserAccountStatus 
} from '../../types';
import { 
  subscribeToUsersFromDb, 
  getAllUsersFromDb, 
  updateUserRoleAndStatusInDb, 
  recordAuditEvent 
} from '../../services/firestoreService';
import { AdminOrders } from './AdminOrders';

interface AdminCustomersProps {
  orders: Order[];
  onRequireReAuth: (title: string, description: string, actionFn: () => Promise<void>) => void;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
  onNavigateToOrders?: (filter?: string) => void;
  initialTab?: 'customers' | 'orders';
  initialOrdersFilter?: string;
}

export const AdminCustomers: React.FC<AdminCustomersProps> = ({
  orders,
  onRequireReAuth,
  onShowToast,
  onNavigateToOrders,
  initialTab = 'customers',
  initialOrdersFilter = 'ALL'
}) => {
  // Main Sub-Tab Switcher State (Unified Hub)
  const [viewMode, setViewMode] = useState<'customers' | 'orders'>(initialTab);
  const [currentOrdersFilter, setCurrentOrdersFilter] = useState<string>(initialOrdersFilter);

  // State
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'customer' | 'admin'>('ALL');
  const [tierFilter, setTierFilter] = useState<'ALL' | 'free' | 'bundle' | 'collection' | 'mega_pass' | 'pro'>('ALL');
  const [providerFilter, setProviderFilter] = useState<'ALL' | 'google.com' | 'password' | 'guest'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'active' | 'suspended'>('ALL');
  const [sortBy, setSortBy] = useState<'lastLogin' | 'joined' | 'spend' | 'orders' | 'name'>('lastLogin');
  
  // Selected Customer for Detailed Modal
  const [selectedCustomer, setSelectedCustomer] = useState<UserProfile | null>(null);
  const [modalActiveTab, setModalActiveTab] = useState<'credentials' | 'orders' | 'raw'>('credentials');
  
  // Copied state indicator
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Edit Role & Tier in Modal State
  const [editingRole, setEditingRole] = useState<UserRole>('customer');
  const [editingTier, setEditingTier] = useState<UserMembershipStatus>('free');
  const [editingStatus, setEditingStatus] = useState<UserAccountStatus>('active');
  const [savingPermissions, setSavingPermissions] = useState(false);

  // 1. Subscribe to Live Users Collection
  useEffect(() => {
    setLoading(true);
    const unsub = subscribeToUsersFromDb((liveUsers) => {
      setUsers(liveUsers);
      setLoading(false);
    });

    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  // 2. Synthesize all customers: Merge explicit User profiles with buyers found in Orders
  const mergedCustomers = useMemo(() => {
    const userMap = new Map<string, UserProfile>();

    // Add all registered users
    users.forEach(u => {
      if (u.uid || u.email) {
        const key = (u.email || u.uid).toLowerCase();
        userMap.set(key, { ...u });
      }
    });

    // Add customers from orders who may not have logged in yet
    orders.forEach(order => {
      const emailKey = (order.email || '').trim().toLowerCase();
      if (!emailKey) return;

      if (!userMap.has(emailKey)) {
        // Create an implicit customer profile from their order
        userMap.set(emailKey, {
          uid: order.userId || `guest_${order.id.slice(-6)}`,
          email: order.email,
          displayName: order.customerName || order.email.split('@')[0],
          role: 'customer',
          membershipStatus: order.items?.some(i => i.type === 'megaPass') ? 'mega_pass' : 
                            order.items?.some(i => i.type === 'bundle') ? 'bundle' : 'free',
          status: 'active',
          createdAt: order.createdAt || new Date().toISOString(),
          lastLoginAt: order.createdAt || new Date().toISOString(),
          phone: order.whatsapp || order.phone,
          whatsapp: order.whatsapp,
          authProvider: 'guest',
          lastLoginMethod: 'Checkout Order',
          loginCount: 1,
          ordersCount: 1,
          deviceInfo: 'Web Checkout'
        });
      }
    });

    // Calculate aggregated orders and spend for each customer
    const list = Array.from(userMap.values()).map(user => {
      const userOrders = orders.filter(o => 
        (user.uid && o.userId === user.uid) || 
        (user.email && o.email?.toLowerCase() === user.email.toLowerCase())
      );

      const totalSpentPKR = userOrders.reduce((sum, o) => sum + (o.totalAmountPKR || 0), 0);
      const totalSpentUSD = userOrders.reduce((sum, o) => sum + (o.totalAmountUSD || 0), 0);

      // Determine highest membership tier from orders if not set
      let derivedTier: UserMembershipStatus = user.membershipStatus || 'free';
      if (userOrders.some(o => o.items?.some(i => i.type === 'megaPass'))) {
        derivedTier = 'mega_pass';
      } else if (userOrders.some(o => o.items?.some(i => i.type === 'bundle'))) {
        derivedTier = 'bundle';
      } else if (userOrders.some(o => o.items?.some(i => i.type === 'collection'))) {
        derivedTier = 'collection';
      }

      return {
        ...user,
        ordersCount: Math.max(user.ordersCount || 0, userOrders.length),
        totalSpentPKR,
        totalSpentUSD,
        membershipStatus: derivedTier
      };
    });

    return list;
  }, [users, orders]);

  // 3. Filter and Sort
  const filteredCustomers = useMemo(() => {
    return mergedCustomers.filter(customer => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = customer.displayName?.toLowerCase().includes(q);
        const matchesEmail = customer.email?.toLowerCase().includes(q);
        const matchesUid = customer.uid?.toLowerCase().includes(q);
        const matchesPhone = customer.phone?.toLowerCase().includes(q) || customer.whatsapp?.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesUid && !matchesPhone) return false;
      }

      // Role Filter
      if (roleFilter !== 'ALL' && customer.role !== roleFilter) return false;

      // Tier Filter
      if (tierFilter !== 'ALL' && customer.membershipFilter !== tierFilter && customer.membershipStatus !== tierFilter) return false;

      // Provider Filter
      if (providerFilter !== 'ALL') {
        const prov = customer.authProvider?.toLowerCase() || '';
        if (providerFilter === 'google.com' && !prov.includes('google')) return false;
        if (providerFilter === 'password' && !prov.includes('password')) return false;
        if (providerFilter === 'guest' && !prov.includes('guest')) return false;
      }

      // Status Filter
      if (statusFilter !== 'ALL' && (customer.status || 'active') !== statusFilter) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'lastLogin') {
        return new Date(b.lastLoginAt || 0).getTime() - new Date(a.lastLoginAt || 0).getTime();
      }
      if (sortBy === 'joined') {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      if (sortBy === 'spend') {
        return (b.totalSpentPKR || 0) - (a.totalSpentPKR || 0);
      }
      if (sortBy === 'orders') {
        return (b.ordersCount || 0) - (a.ordersCount || 0);
      }
      if (sortBy === 'name') {
        return (a.displayName || '').localeCompare(b.displayName || '');
      }
      return 0;
    });
  }, [mergedCustomers, searchQuery, roleFilter, tierFilter, providerFilter, statusFilter, sortBy]);

  // KPI Summary
  const stats = useMemo(() => {
    const total = mergedCustomers.length;
    const activeCount = mergedCustomers.filter(c => (c.status || 'active') === 'active').length;
    const googleAuthCount = mergedCustomers.filter(c => c.authProvider?.includes('google')).length;
    const emailAuthCount = mergedCustomers.filter(c => c.authProvider?.includes('password')).length;
    const buyersCount = mergedCustomers.filter(c => (c.ordersCount || 0) > 0).length;
    const totalLtvPKR = mergedCustomers.reduce((sum, c) => sum + (c.totalSpentPKR || 0), 0);

    return {
      total,
      activeCount,
      googleAuthCount,
      emailAuthCount,
      buyersCount,
      totalLtvPKR
    };
  }, [mergedCustomers]);

  // Copy helper
  const handleCopy = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    onShowToast(`Copied ${keyId} to clipboard!`, 'success');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Open Customer Dossier
  const handleInspectCustomer = (customer: UserProfile) => {
    setSelectedCustomer(customer);
    setEditingRole(customer.role || 'customer');
    setEditingTier(customer.membershipStatus || 'free');
    setEditingStatus(customer.status || 'active');
    setModalActiveTab('credentials');
  };

  // Save Permissions & Role
  const handleSaveCustomerSettings = async () => {
    if (!selectedCustomer) return;

    onRequireReAuth(
      'Update Customer Permissions & Role',
      `You are modifying the role to "${editingRole.toUpperCase()}" and membership tier to "${editingTier.toUpperCase()}" for ${selectedCustomer.email}.`,
      async () => {
        setSavingPermissions(true);
        try {
          const success = await updateUserRoleAndStatusInDb(selectedCustomer.uid, {
            role: editingRole,
            membershipStatus: editingTier,
            status: editingStatus
          });

          if (success) {
            onShowToast('Customer credentials and permissions updated successfully!', 'success');
            setSelectedCustomer({
              ...selectedCustomer,
              role: editingRole,
              membershipStatus: editingTier,
              status: editingStatus
            });
            // Update local state list
            setUsers(prev => prev.map(u => u.uid === selectedCustomer.uid ? {
              ...u,
              role: editingRole,
              membershipStatus: editingTier,
              status: editingStatus
            } : u));
          } else {
            onShowToast('Failed to update customer in database.', 'error');
          }
        } finally {
          setSavingPermissions(false);
        }
      }
    );
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredCustomers.length === 0) {
      onShowToast('No customer records to export', 'error');
      return;
    }

    const headers = [
      'UID',
      'Name',
      'Email',
      'Role',
      'Membership Tier',
      'Status',
      'Auth Provider',
      'Login Count',
      'Last Login',
      'Created At',
      'Total Orders',
      'Total Spent PKR',
      'Phone / WhatsApp'
    ];

    const rows = filteredCustomers.map(c => [
      `"${c.uid}"`,
      `"${(c.displayName || '').replace(/"/g, '""')}"`,
      `"${c.email}"`,
      `"${c.role}"`,
      `"${c.membershipStatus || 'free'}"`,
      `"${c.status || 'active'}"`,
      `"${c.authProvider || 'password'}"`,
      c.loginCount || 1,
      `"${c.lastLoginAt || ''}"`,
      `"${c.createdAt || ''}"`,
      c.ordersCount || 0,
      c.totalSpentPKR || 0,
      `"${c.phone || c.whatsapp || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `zdf_customers_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    recordAuditEvent({
      action: 'Exported Customers CSV',
      category: 'admin',
      severity: 'info',
      details: { count: filteredCustomers.length }
    });

    onShowToast(`Exported ${filteredCustomers.length} customers to CSV`, 'success');
  };

  // Export to JSON
  const handleExportJSON = () => {
    if (filteredCustomers.length === 0) return;
    const jsonStr = JSON.stringify(filteredCustomers, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zdf_customers_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast('Exported customer records to JSON', 'success');
  };

  // Get orders linked to selected customer
  const selectedCustomerOrders = useMemo(() => {
    if (!selectedCustomer) return [];
    return orders.filter(o => 
      (selectedCustomer.uid && o.userId === selectedCustomer.uid) || 
      (selectedCustomer.email && o.email?.toLowerCase() === selectedCustomer.email.toLowerCase())
    );
  }, [selectedCustomer, orders]);

  // Pending orders badge count
  const pendingOrdersCount = useMemo(() => {
    return orders.filter(o => o.status === 'Pending Verification').length;
  }, [orders]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* ═════════════════════════════════════════════════════
          UNIFIED NAVIGATION BAR: CUSTOMERS & ORDERS
      ═════════════════════════════════════════════════════ */}
      <div className="p-2 bg-[#0D1527] border border-slate-800/80 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('customers')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
              viewMode === 'customers'
                ? 'bg-gradient-to-r from-[#0D6EFD] to-[#28B9FF] text-white shadow-lg shadow-[#0D6EFD]/25'
                : 'bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800/70 border border-slate-800'
            }`}
          >
            <Users className="w-4 h-4 text-[#28B9FF]" />
            <span>Customers &amp; Accounts ({stats.total})</span>
          </button>

          <button
            onClick={() => setViewMode('orders')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
              viewMode === 'orders'
                ? 'bg-gradient-to-r from-[#0D6EFD] to-[#28B9FF] text-white shadow-lg shadow-[#0D6EFD]/25'
                : 'bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800/70 border border-slate-800'
            }`}
          >
            <Package className="w-4 h-4 text-amber-400" />
            <span>Orders &amp; Verification ({orders.length})</span>
            {pendingOrdersCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black animate-pulse">
                {pendingOrdersCount} Pending
              </span>
            )}
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Unified Commerce &amp; User Intelligence</span>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════
          SUB-VIEW 1: ORDERS & VERIFICATION
      ═════════════════════════════════════════════════════ */}
      {viewMode === 'orders' ? (
        <AdminOrders
          orders={orders}
          initialStatusFilter={currentOrdersFilter}
          onRequireReAuth={onRequireReAuth}
          onShowToast={onShowToast}
        />
      ) : (
        <>
          {/* ═════════════════════════════════════════════════════
              SUB-VIEW 2: CUSTOMERS & CREDENTIALS
          ═════════════════════════════════════════════════════ */}
          {/* HEADER & METRICS BAR */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0D1527] via-[#102242] to-[#0A0F1D] border border-slate-800 p-6 sm:p-8 shadow-2xl">
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#0D6EFD]/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0D6EFD]/15 border border-[#0D6EFD]/30 text-[#28B9FF] text-xs font-bold">
                  <Users className="w-3.5 h-3.5 text-[#28B9FF]" />
                  <span>Customer Intelligence &amp; Credentials Center</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Customer Accounts &amp; Logins
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                  Real-time monitoring of all registered buyers, login authentication credentials (Google OAuth / Passwords), session activity, order history, and membership access permissions.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  onClick={handleExportCSV}
                  className="py-2.5 px-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg"
                  title="Download CSV"
                >
                  <Download className="w-4 h-4 text-[#28B9FF]" />
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={handleExportJSON}
                  className="py-2.5 px-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold transition-all flex items-center gap-2 shadow-lg"
                  title="Download JSON"
                >
                  <Copy className="w-4 h-4 text-emerald-400" />
                  <span>JSON</span>
                </button>
              </div>
            </div>
          </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        
        {/* Total Users */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#28B9FF]" />
            <span>Total Accounts</span>
          </div>
          <div className="text-2xl font-black text-white">{stats.total}</div>
          <div className="text-[10px] text-slate-400">All registered &amp; buyers</div>
        </div>

        {/* Active Accounts */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/30 space-y-1">
          <div className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Active Status</span>
          </div>
          <div className="text-2xl font-black text-emerald-400">{stats.activeCount}</div>
          <div className="text-[10px] text-slate-400">100% operational</div>
        </div>

        {/* Verified Buyers */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/30 space-y-1">
          <div className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-amber-400" />
            <span>Paid Buyers</span>
          </div>
          <div className="text-2xl font-black text-amber-300">{stats.buyersCount}</div>
          <div className="text-[10px] text-slate-400">Have completed orders</div>
        </div>

        {/* Google OAuth Logins */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-blue-500/30 space-y-1">
          <div className="text-[10px] uppercase font-bold text-[#28B9FF] flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-[#28B9FF]" />
            <span>Google Auth</span>
          </div>
          <div className="text-2xl font-black text-white">{stats.googleAuthCount}</div>
          <div className="text-[10px] text-slate-400">1-click Google Sign-in</div>
        </div>

        {/* Password Logins */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-purple-500/30 space-y-1">
          <div className="text-[10px] uppercase font-bold text-purple-400 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-purple-400" />
            <span>Email/Password</span>
          </div>
          <div className="text-2xl font-black text-white">{stats.emailAuthCount}</div>
          <div className="text-[10px] text-slate-400">Direct credentials</div>
        </div>

        {/* Total Lifetime Value */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-teal-500/30 space-y-1">
          <div className="text-[10px] uppercase font-bold text-teal-400 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-teal-400" />
            <span>Total LTV (PKR)</span>
          </div>
          <div className="text-xl font-black text-teal-300 truncate">
            Rs. {stats.totalLtvPKR.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400">Cumulative revenue</div>
        </div>

      </div>

      {/* ═════════════════════════════════════════════════════
          SEARCH & FILTER TOOLBAR
      ═════════════════════════════════════════════════════ */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Name, Email, UID, or Phone..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#0D6EFD]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
            
            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              aria-label="Filter customer accounts by role"
              className="py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 focus:outline-none focus:border-[#0D6EFD]"
            >
              <option value="ALL">All Roles</option>
              <option value="customer">Customer Only</option>
              <option value="admin">Admins Only</option>
            </select>

            {/* Auth Provider */}
            <select
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value as any)}
              aria-label="Filter customer accounts by auth provider"
              className="py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 focus:outline-none focus:border-[#0D6EFD]"
            >
              <option value="ALL">All Auth Methods</option>
              <option value="google.com">Google OAuth</option>
              <option value="password">Password Credentials</option>
              <option value="guest">Guest Checkout</option>
            </select>

            {/* Membership Tier */}
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value as any)}
              aria-label="Filter customer accounts by membership tier"
              className="py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 focus:outline-none focus:border-[#0D6EFD]"
            >
              <option value="ALL">All Membership Tiers</option>
              <option value="free">Free Tier</option>
              <option value="bundle">Bundle Pass</option>
              <option value="collection">Collection Pass</option>
              <option value="mega_pass">Mega Pass Lifetime</option>
              <option value="pro">Pro Tools</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              aria-label="Sort customer accounts"
              className="py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 focus:outline-none focus:border-[#0D6EFD]"
            >
              <option value="lastLogin">Sort: Recent Login</option>
              <option value="joined">Sort: Joined Date</option>
              <option value="spend">Sort: High Spend</option>
              <option value="orders">Sort: Most Orders</option>
              <option value="name">Sort: Name (A-Z)</option>
            </select>

          </div>

        </div>

        {/* Results Counter Bar */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
          <div>
            Showing <span className="font-bold text-white">{filteredCustomers.length}</span> of {mergedCustomers.length} customer records
          </div>
          {(searchQuery || roleFilter !== 'ALL' || tierFilter !== 'ALL' || providerFilter !== 'ALL' || statusFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setRoleFilter('ALL');
                setTierFilter('ALL');
                setProviderFilter('ALL');
                setStatusFilter('ALL');
              }}
              className="text-[#28B9FF] hover:underline font-bold text-[11px]"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════
          CUSTOMERS TABLE / LIST
      ═════════════════════════════════════════════════════ */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
        {filteredCustomers.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Users className="w-12 h-12 text-slate-600 mx-auto" />
            <div className="text-sm font-bold text-white">No customer records found</div>
            <p className="text-xs text-slate-400">Try adjusting your search criteria or filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Authentication &amp; Credentials</th>
                  <th className="py-3.5 px-4">Role &amp; Tier</th>
                  <th className="py-3.5 px-4">Last Login / Activity</th>
                  <th className="py-3.5 px-4 text-right">Orders &amp; Spend</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredCustomers.map((customer) => {
                  const isCustomerAdmin = customer.role === 'admin' || customer.email === 'zohaibdigiforge@gmail.com';
                  const isGoogleAuth = customer.authProvider?.includes('google');
                  const isGuest = customer.authProvider?.includes('guest');
                  const hasOrders = (customer.ordersCount || 0) > 0;

                  return (
                    <tr 
                      key={customer.uid || customer.email}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Customer Name & Email */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {customer.photoURL ? (
                            <img
                              src={customer.photoURL}
                              alt={customer.displayName}
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 rounded-full object-cover border border-slate-700 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0D6EFD] to-[#28B9FF] flex items-center justify-center text-white font-bold text-sm shrink-0">
                              {(customer.displayName || customer.email || 'U').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white text-xs truncate max-w-[150px] sm:max-w-[200px]">
                                {customer.displayName || 'DigiForge Customer'}
                              </span>
                              {isCustomerAdmin && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[9px] font-black uppercase">
                                  Admin
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <span className="truncate max-w-[180px]">{customer.email}</span>
                              <button
                                onClick={() => handleCopy(customer.email, `email_${customer.uid}`)}
                                className="text-slate-500 hover:text-[#28B9FF] transition-colors p-0.5"
                                title="Copy Email"
                              >
                                {copiedKey === `email_${customer.uid}` ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                            {(customer.phone || customer.whatsapp) && (
                              <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                                <Phone className="w-2.5 h-2.5" />
                                <span>{customer.whatsapp || customer.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Authentication & Credentials */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {/* Auth Method Badge */}
                          <div className="flex items-center gap-1.5">
                            {isGoogleAuth ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-[#28B9FF] text-[10px] font-bold">
                                <span>🔵</span> Google OAuth
                              </span>
                            ) : isGuest ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-[10px] font-bold">
                                <span>👤</span> Guest Buyer
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[10px] font-bold">
                                <KeyRound className="w-3 h-3 text-purple-400" />
                                Password Auth
                              </span>
                            )}

                            {customer.loginCount && customer.loginCount > 1 && (
                              <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-300 font-semibold" title="Total times logged in">
                                {customer.loginCount} logins
                              </span>
                            )}
                          </div>

                          {/* UID preview */}
                          <div className="flex items-center gap-1 font-mono text-[10px] text-slate-500">
                            <span>UID:</span>
                            <span className="text-slate-400 truncate max-w-[110px]">{customer.uid}</span>
                            <button
                              onClick={() => handleCopy(customer.uid, `uid_${customer.uid}`)}
                              className="text-slate-500 hover:text-white"
                              title="Copy UID"
                            >
                              {copiedKey === `uid_${customer.uid}` ? (
                                <Check className="w-2.5 h-2.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-2.5 h-2.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Role & Membership Tier */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div>
                            <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                              customer.membershipStatus === 'mega_pass'
                                ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/40'
                                : customer.membershipStatus === 'bundle'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : customer.membershipStatus === 'collection'
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                : customer.membershipStatus === 'pro'
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}>
                              {customer.membershipStatus === 'mega_pass' ? '⭐ Mega Pass' : 
                               customer.membershipStatus === 'bundle' ? '📦 Bundle Pass' :
                               customer.membershipStatus === 'collection' ? '🗂️ Collection' :
                               customer.membershipStatus === 'pro' ? '⚡ Pro Tools' : 'Free Member'}
                            </span>
                          </div>
                          
                          <div className="text-[10px] text-slate-400 flex items-center gap-1">
                            <span>Status:</span>
                            <span className={`font-semibold ${customer.status === 'suspended' ? 'text-rose-400' : 'text-emerald-400'}`}>
                              {customer.status === 'suspended' ? 'Suspended' : 'Active'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Last Login & Joined Activity */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="text-xs font-semibold text-slate-200 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>
                              {customer.lastLoginAt ? new Date(customer.lastLoginAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : 'Never'}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Joined {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : 'N/A'}
                          </div>
                        </div>
                      </td>

                      {/* Orders & Total Spend */}
                      <td className="py-3.5 px-4 text-right">
                        <div>
                          <div className="text-xs font-bold text-white">
                            Rs. {(customer.totalSpentPKR || 0).toLocaleString()}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {customer.ordersCount || 0} {(customer.ordersCount || 0) === 1 ? 'Order' : 'Orders'}
                          </div>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleInspectCustomer(customer)}
                          className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-[#0D6EFD] text-slate-300 hover:text-white font-bold text-xs transition-all inline-flex items-center gap-1.5 shadow"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═════════════════════════════════════════════════════
          CUSTOMER DOSSIER & CREDENTIALS MODAL
      ═════════════════════════════════════════════════════ */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl rounded-3xl bg-[#0D1527] border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-3.5">
                {selectedCustomer.photoURL ? (
                  <img
                    src={selectedCustomer.photoURL}
                    alt={selectedCustomer.displayName}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-full object-cover border border-slate-700"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0D6EFD] to-[#28B9FF] flex items-center justify-center text-white font-black text-lg">
                    {(selectedCustomer.displayName || selectedCustomer.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-white">{selectedCustomer.displayName || 'Customer Details'}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-bold text-[#28B9FF] border border-slate-700">
                      {selectedCustomer.role.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{selectedCustomer.email}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="px-6 border-b border-slate-800 flex items-center gap-6 bg-slate-950/30">
              <button
                onClick={() => setModalActiveTab('credentials')}
                className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                  modalActiveTab === 'credentials'
                    ? 'border-[#28B9FF] text-[#28B9FF]'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Credentials &amp; Permissions</span>
              </button>

              <button
                onClick={() => setModalActiveTab('orders')}
                className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                  modalActiveTab === 'orders'
                    ? 'border-[#28B9FF] text-[#28B9FF]'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Orders History ({selectedCustomerOrders.length})</span>
              </button>

              <button
                onClick={() => setModalActiveTab('raw')}
                className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                  modalActiveTab === 'raw'
                    ? 'border-[#28B9FF] text-[#28B9FF]'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Raw JSON Metadata</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              
              {/* TAB 1: CREDENTIALS & PERMISSIONS */}
              {modalActiveTab === 'credentials' && (
                <div className="space-y-6">
                  
                  {/* Credentials Intelligence Box */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <h4 className="font-bold text-white text-xs flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-[#28B9FF]" />
                      <span>Authentication &amp; Session Credentials</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      
                      {/* UID */}
                      <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Firebase Auth UID</div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs text-white truncate">{selectedCustomer.uid}</span>
                          <button
                            onClick={() => handleCopy(selectedCustomer.uid, 'modal_uid')}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                            title="Copy UID"
                          >
                            {copiedKey === 'modal_uid' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>

                      {/* Auth Provider */}
                      <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Login Provider / Protocol</div>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>{selectedCustomer.authProvider?.includes('google') ? '🔵 Google OAuth 2.0' : '🔑 Email & Password'}</span>
                        </div>
                      </div>

                      {/* Login Count */}
                      <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Login Count</div>
                        <div className="font-bold text-white">{selectedCustomer.loginCount || 1} Sessions Recorded</div>
                      </div>

                      {/* Last Login Time */}
                      <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Last Sign-In Timestamp</div>
                        <div className="font-bold text-white">
                          {selectedCustomer.lastLoginAt ? new Date(selectedCustomer.lastLoginAt).toLocaleString() : 'N/A'}
                        </div>
                      </div>

                      {/* Device User-Agent */}
                      <div className="sm:col-span-2 p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Last Device / User-Agent</div>
                        <div className="font-mono text-[11px] text-slate-300 break-all">
                          {selectedCustomer.deviceInfo || 'Standard Web Browser (Desktop/Mobile)'}
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Direct Contact Shortcuts */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <h4 className="font-bold text-white text-xs flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-emerald-400" />
                      <span>Direct Customer Support Channels</span>
                    </h4>

                    <div className="flex items-center gap-3 flex-wrap">
                      <a
                        href={`mailto:${selectedCustomer.email}?subject=Message from Zohaib DigiForge Support`}
                        className="py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold text-xs flex items-center gap-2"
                      >
                        <Mail className="w-4 h-4 text-[#28B9FF]" />
                        <span>Send Email to {selectedCustomer.email}</span>
                      </a>

                      {(selectedCustomer.phone || selectedCustomer.whatsapp) && (
                        <a
                          href={`https://wa.me/${(selectedCustomer.whatsapp || selectedCustomer.phone || '').replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(selectedCustomer.displayName || 'Customer')},%20this%20is%20Zohaib%20DigiForge%20Support.`}
                          target="_blank"
                          rel="noreferrer"
                          className="py-2 px-4 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-2"
                        >
                          <Phone className="w-4 h-4 text-emerald-400" />
                          <span>WhatsApp Message</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Permissions & Role Manager */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-white text-xs flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-amber-400" />
                          <span>Admin Role &amp; Membership Overrides</span>
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Grant administrative access or modify membership tiers directly.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      
                      {/* Role Switcher */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                          Account Role
                        </label>
                        <select
                          value={editingRole}
                          onChange={(e) => setEditingRole(e.target.value as any)}
                          className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400 font-semibold"
                        >
                          <option value="customer">Customer</option>
                          <option value="admin">Administrator (Admin)</option>
                          <option value="super_admin">Super Administrator</option>
                        </select>
                      </div>

                      {/* Membership Tier */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                          Membership Access Tier
                        </label>
                        <select
                          value={editingTier}
                          onChange={(e) => setEditingTier(e.target.value as any)}
                          className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400 font-semibold"
                        >
                          <option value="free">Free Tier</option>
                          <option value="bundle">Bundle Pass</option>
                          <option value="collection">Daily Drop Collection</option>
                          <option value="mega_pass">Mega Pass Lifetime</option>
                          <option value="pro">Pro Tools Access</option>
                        </select>
                      </div>

                      {/* Account Status */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                          Account Status
                        </label>
                        <select
                          value={editingStatus}
                          onChange={(e) => setEditingStatus(e.target.value as any)}
                          className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400 font-semibold"
                        >
                          <option value="active">Active (Normal)</option>
                          <option value="suspended">Suspended (Blocked)</option>
                        </select>
                      </div>

                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={handleSaveCustomerSettings}
                        disabled={savingPermissions}
                        className="py-2 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>{savingPermissions ? 'Saving Changes...' : 'Save Permissions'}</span>
                      </button>
                    </div>

                  </div>

                </div>
              )}

              {/* TAB 2: ORDERS HISTORY */}
              {modalActiveTab === 'orders' && (
                <div className="space-y-4">
                  {selectedCustomerOrders.length === 0 ? (
                    <div className="p-8 text-center bg-slate-950 rounded-2xl border border-slate-800 text-slate-400">
                      No orders placed yet by this customer.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedCustomerOrders.map((order) => (
                        <div key={order.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-[#28B9FF]">#{order.id.slice(-8)}</span>
                              <span className="text-[10px] text-slate-400">
                                {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ''}
                              </span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              order.status === 'Completed' || order.status === 'Access Delivered'
                                ? 'bg-emerald-500/20 text-[#22C55E]'
                                : 'bg-amber-500/20 text-amber-300'
                            }`}>
                              {order.status}
                            </span>
                          </div>

                          <div className="text-xs text-white">
                            {order.items?.map(i => i.title).join(', ') || 'Digital Products'}
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                            <div className="text-xs font-bold text-white">
                              Total: Rs. {(order.totalAmountPKR || 0).toLocaleString()}
                            </div>
                            {order.downloadLinks && Object.keys(order.downloadLinks).length > 0 && (
                              <button
                                onClick={() => {
                                  const links = Object.values(order.downloadLinks!).join('\n');
                                  handleCopy(links, `links_${order.id}`);
                                }}
                                className="text-[10px] font-bold text-[#28B9FF] hover:underline flex items-center gap-1"
                              >
                                <Copy className="w-3 h-3" />
                                <span>Copy Access Links</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: RAW JSON METADATA */}
              {modalActiveTab === 'raw' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Full Firestore document payload:</span>
                    <button
                      onClick={() => handleCopy(JSON.stringify(selectedCustomer, null, 2), 'raw_json')}
                      className="py-1 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-[#28B9FF] font-bold text-xs flex items-center gap-1"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy JSON</span>
                    </button>
                  </div>
                  <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-96">
                    {JSON.stringify(selectedCustomer, null, 2)}
                  </pre>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Zohaib DigiForge Customer Record</span>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
              >
                Close Dossier
              </button>
            </div>

          </div>
        </div>
      )}
        </>
      )}

    </div>
  );
};

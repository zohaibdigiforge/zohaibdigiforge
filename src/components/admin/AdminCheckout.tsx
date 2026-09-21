import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingCart, 
  CreditCard, 
  Tag, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  XCircle, 
  MessageSquare, 
  Mail, 
  RefreshCw, 
  Save, 
  ToggleLeft, 
  ToggleRight,
  AlertCircle,
  Search,
  Check,
  Layers,
  Sparkles,
  Package,
  FolderOpen
} from 'lucide-react';
import { AbandonedCart, PaymentMethodSetting, CouponDiscount, Product, Category } from '../../types';
import { 
  getAbandonedCartsFromDb, 
  deleteAbandonedCartFromDb, 
  getPaymentMethodSettingsFromDb, 
  savePaymentMethodSettingToDb, 
  getCouponsFromDb, 
  saveCouponToDb, 
  deleteCouponFromDb,
  getProductsFromDb,
  getCategoriesFromDb
} from '../../services/firestoreService';

interface AdminCheckoutProps {
  onRequireReAuth: (actionTitle: string, actionDesc: string, actionFn: () => Promise<void>) => void;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
}

export const AdminCheckout: React.FC<AdminCheckoutProps> = ({
  onRequireReAuth,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<'abandoned' | 'payments' | 'coupons'>('abandoned');

  // Abandoned Carts State
  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [loadingCarts, setLoadingCarts] = useState(false);

  // Payment Methods Settings State
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodSetting[]>([]);
  const [savingMethods, setSavingMethods] = useState(false);

  // Catalog Products & Categories for targeting
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [productSearchQuery, setProductSearchQuery] = useState('');

  // Coupons State
  const [coupons, setCoupons] = useState<CouponDiscount[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [newCoupon, setNewCoupon] = useState<{
    code: string;
    percentage?: number;
    fixedPKR?: number;
    fixedUSD?: number;
    description: string;
    applicableScope: 'all' | 'specific_products' | 'specific_categories';
    applicableProductIds: string[];
    applicableCategoryIds: string[];
    minOrderAmountPKR?: number;
  }>({
    code: '',
    percentage: 15,
    description: '',
    applicableScope: 'all',
    applicableProductIds: [],
    applicableCategoryIds: [],
    minOrderAmountPKR: undefined
  });

  // Load Data
  useEffect(() => {
    fetchCarts();
    fetchPaymentMethods();
    fetchCoupons();
    loadCatalogItems();
  }, []);

  const loadCatalogItems = async () => {
    try {
      const [prods, cats] = await Promise.all([
        getProductsFromDb(),
        getCategoriesFromDb()
      ]);
      setAllProducts(prods || []);
      setAllCategories(cats || []);
    } catch (e) {
      console.warn('Failed loading catalog items for admin coupons:', e);
    }
  };

  const fetchCarts = async () => {
    setLoadingCarts(true);
    try {
      const list = await getAbandonedCartsFromDb();
      setCarts(list);
    } catch (e) {
      console.warn('Error carts:', e);
    } finally {
      setLoadingCarts(false);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const methods = await getPaymentMethodSettingsFromDb();
      setPaymentMethods(methods);
    } catch (e) {
      console.warn('Error payment methods:', e);
    }
  };

  const fetchCoupons = async () => {
    setLoadingCoupons(true);
    try {
      const list = await getCouponsFromDb();
      setCoupons(list);
    } catch (e) {
      console.warn('Error coupons:', e);
    } finally {
      setLoadingCoupons(false);
    }
  };

  // Actions
  const handleDismissCart = async (cartId: string) => {
    try {
      await deleteAbandonedCartFromDb(cartId);
      setCarts(carts.filter(c => c.id !== cartId));
      onShowToast('Abandoned cart dismissed', 'success');
    } catch (e) {
      onShowToast('Failed to dismiss cart', 'error');
    }
  };

  const handleTogglePaymentMethod = (id: string) => {
    setPaymentMethods(paymentMethods.map(m => 
      m.id === id ? { ...m, isActive: !m.isActive } : m
    ));
  };

  const handleUpdatePaymentMethodField = (id: string, field: keyof PaymentMethodSetting, val: string) => {
    setPaymentMethods(paymentMethods.map(m => 
      m.id === id ? { ...m, [field]: val } : m
    ));
  };

  const handleSavePaymentMethods = async () => {
    setSavingMethods(true);
    try {
      await savePaymentMethodSettingToDb(paymentMethods);
      onShowToast('Payment methods configuration saved!', 'success');
    } catch (e) {
      onShowToast('Failed to save payment settings.', 'error');
    } finally {
      setSavingMethods(false);
    }
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoupon.code.trim()) {
      onShowToast('Coupon code is required.', 'error');
      return;
    }

    if (newCoupon.applicableScope === 'specific_products' && newCoupon.applicableProductIds.length === 0) {
      onShowToast('Please select at least 1 product for this specific offer.', 'error');
      return;
    }

    if (newCoupon.applicableScope === 'specific_categories' && newCoupon.applicableCategoryIds.length === 0) {
      onShowToast('Please select at least 1 category for this category offer.', 'error');
      return;
    }

    try {
      const selectedTitles = newCoupon.applicableProductIds
        .map(id => allProducts.find(p => p.id === id)?.title)
        .filter(Boolean) as string[];

      const couponToSave: CouponDiscount = {
        code: newCoupon.code.toUpperCase().trim(),
        percentage: newCoupon.percentage ? Number(newCoupon.percentage) : undefined,
        fixedPKR: newCoupon.fixedPKR ? Number(newCoupon.fixedPKR) : undefined,
        fixedUSD: newCoupon.fixedUSD ? Number(newCoupon.fixedUSD) : undefined,
        description: newCoupon.description.trim() || `${newCoupon.percentage || 'Special'}% Discount Offer`,
        applicableScope: newCoupon.applicableScope,
        applicableProductIds: newCoupon.applicableScope === 'specific_products' ? newCoupon.applicableProductIds : undefined,
        applicableProductTitles: newCoupon.applicableScope === 'specific_products' ? selectedTitles : undefined,
        applicableCategoryIds: newCoupon.applicableScope === 'specific_categories' ? newCoupon.applicableCategoryIds : undefined,
        minOrderAmountPKR: newCoupon.minOrderAmountPKR ? Number(newCoupon.minOrderAmountPKR) : undefined
      };

      await saveCouponToDb(couponToSave);
      onShowToast(`Coupon ${couponToSave.code} saved successfully!`, 'success');
      setCouponModalOpen(false);
      setNewCoupon({ 
        code: '', 
        percentage: 15, 
        description: '', 
        applicableScope: 'all', 
        applicableProductIds: [], 
        applicableCategoryIds: [],
        minOrderAmountPKR: undefined 
      });
      fetchCoupons();
    } catch (e) {
      onShowToast('Error saving coupon.', 'error');
    }
  };

  const handleDeleteCoupon = (code: string) => {
    onRequireReAuth(
      `Delete Coupon ${code}`,
      `Are you sure you want to permanently delete the promo coupon code "${code}"?`,
      async () => {
        try {
          await deleteCouponFromDb(code);
          onShowToast(`Coupon ${code} deleted`, 'success');
          fetchCoupons();
        } catch (e) {
          onShowToast('Failed to delete coupon', 'error');
        }
      }
    );
  };

  const toggleProductSelection = (productId: string) => {
    setNewCoupon(prev => {
      const exists = prev.applicableProductIds.includes(productId);
      return {
        ...prev,
        applicableProductIds: exists
          ? prev.applicableProductIds.filter(id => id !== productId)
          : [...prev.applicableProductIds, productId]
      };
    });
  };

  const toggleCategorySelection = (catId: string) => {
    setNewCoupon(prev => {
      const exists = prev.applicableCategoryIds.includes(catId);
      return {
        ...prev,
        applicableCategoryIds: exists
          ? prev.applicableCategoryIds.filter(id => id !== catId)
          : [...prev.applicableCategoryIds, catId]
      };
    });
  };

  const filteredProductsForCoupon = useMemo(() => {
    if (!productSearchQuery.trim()) return allProducts.slice(0, 30);
    const q = productSearchQuery.toLowerCase();
    return allProducts.filter(p => 
      p.title.toLowerCase().includes(q) || 
      (p.category && p.category.toLowerCase().includes(q))
    ).slice(0, 30);
  }, [allProducts, productSearchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header & Sub-Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/90 border border-slate-800">
        <div>
          <h2 className="text-xl font-black text-white">Checkout Management</h2>
          <p className="text-xs text-slate-400 mt-0.5">Abandoned cart revenue recovery, payment gateway controls &amp; discount codes</p>
        </div>

        {/* Navigation Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950 border border-slate-800">
          <button
            onClick={() => setActiveTab('abandoned')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'abandoned' ? 'bg-[#0D6EFD] text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Abandoned Carts ({carts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'payments' ? 'bg-[#0D6EFD] text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Payment Gateways</span>
          </button>

          <button
            onClick={() => setActiveTab('coupons')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'coupons' ? 'bg-[#0D6EFD] text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Coupons ({coupons.length})</span>
          </button>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════
          SUB-TAB 1: ABANDONED CARTS
      ═════════════════════════════════════════════════════ */}
      {activeTab === 'abandoned' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#0D6EFD]/10 border border-[#0D6EFD]/30 flex items-center justify-between">
            <p className="text-xs text-slate-300">
              Shoppers who added items to their cart but did not complete checkout. Reach out directly via WhatsApp or Email to recover abandoned orders.
            </p>
            <button
              onClick={fetchCarts}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold flex items-center gap-1.5 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingCarts ? 'animate-spin' : ''}`} />
              <span>Refresh Carts</span>
            </button>
          </div>

          <div className="rounded-3xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950/80 text-slate-400 font-bold border-b border-slate-800">
                    <th className="p-4">Customer</th>
                    <th className="p-4">Cart Item(s)</th>
                    <th className="p-4">Value</th>
                    <th className="p-4">Last Active</th>
                    <th className="p-4 text-right">Direct Recovery</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {carts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">
                        No active abandoned carts found in Firestore.
                      </td>
                    </tr>
                  ) : (
                    carts.map((cart) => {
                      const itemsStr = cart.items?.map(i => i.title).join(', ') || 'Cart Items';
                      const phone = cart.whatsapp || '03406070632';

                      return (
                        <tr key={cart.id} className="hover:bg-slate-800/50 transition-colors">
                          <td className="p-4">
                            <div className="font-bold text-white">{cart.customerName || 'Guest Visitor'}</div>
                            <div className="text-[11px] text-slate-400">{cart.email || 'No email saved'}</div>
                          </td>

                          <td className="p-4 max-w-xs truncate text-slate-300">
                            {itemsStr}
                          </td>

                          <td className="p-4 font-black text-amber-300">
                            Rs. {cart.totalAmountPKR?.toLocaleString()}
                          </td>

                          <td className="p-4 text-slate-400 text-[11px]">
                            {cart.updatedAt ? new Date(cart.updatedAt).toLocaleString() : 'Recently'}
                          </td>

                          <td className="p-4 text-right space-x-2">
                            <a
                              href={`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=Hi!%20You%20left%20items%20in%20your%20cart%20at%20Zohaib%20DigiForge.%20Use%20code%20DIGI10%20for%2010%25%20OFF%20to%20complete%20your%20order!`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#22C55E]/20 text-[#22C55E] hover:bg-[#22C55E]/30 text-xs font-bold transition-all"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Recover WA</span>
                            </a>

                            <button
                              onClick={() => handleDismissCart(cart.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 text-xs transition-colors"
                              title="Dismiss Cart"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════
          SUB-TAB 2: PAYMENT METHOD SETTINGS
      ═════════════════════════════════════════════════════ */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
            <p className="text-xs text-amber-200">
              Configure local manual payment gateways (EasyPaisa, JazzCash, Bank Transfer, Binance Crypto, NayaPay). Toggling a method inactive hides it from the live Checkout page.
            </p>
            <button
              onClick={handleSavePaymentMethods}
              disabled={savingMethods}
              className="px-4 py-2 rounded-xl bg-[#0D6EFD] hover:bg-[#0b5ed7] text-white font-bold text-xs shadow-md flex items-center gap-1.5 shrink-0"
            >
              <Save className="w-4 h-4" />
              <span>{savingMethods ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {paymentMethods.map((method) => (
              <div key={method.id} className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CreditCard className="w-5 h-5 text-[#28B9FF]" />
                    <h3 className="text-sm font-bold text-white">{method.name}</h3>
                  </div>

                  {/* Toggle Active Button */}
                  <button
                    onClick={() => handleTogglePaymentMethod(method.id)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                      method.isActive 
                        ? 'bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/40'
                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}
                  >
                    {method.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                    <span>{method.isActive ? 'Active' : 'Disabled'}</span>
                  </button>
                </div>

                <div className="space-y-3 pt-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400">Account Name</label>
                    <input
                      type="text"
                      value={method.accountName || ''}
                      onChange={(e) => handleUpdatePaymentMethodField(method.id, 'accountName', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs mt-1 focus:outline-none focus:border-[#0D6EFD]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-400">Account Number / Address</label>
                    <input
                      type="text"
                      value={method.accountNumber || ''}
                      onChange={(e) => handleUpdatePaymentMethodField(method.id, 'accountNumber', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs mt-1 focus:outline-none focus:border-[#0D6EFD]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-400">Payment Instructions</label>
                    <textarea
                      value={method.instructions || ''}
                      onChange={(e) => handleUpdatePaymentMethodField(method.id, 'instructions', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs mt-1 focus:outline-none focus:border-[#0D6EFD]"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════
          SUB-TAB 3: COUPONS & TARGETED OFFERS MANAGEMENT
      ═════════════════════════════════════════════════════ */}
      {activeTab === 'coupons' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#28B9FF]" />
                <span>Promo Codes &amp; Targeted Offers</span>
              </h3>
              <p className="text-xs text-slate-400">Create storewide discounts or targeted offers for specific products &amp; categories</p>
            </div>
            <button
              onClick={() => setCouponModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#0D6EFD] hover:bg-[#0b5ed7] text-white font-bold text-xs transition-all shadow-md flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Offer / Coupon</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {coupons.map((coupon) => {
              const isSpecificProducts = coupon.applicableScope === 'specific_products' && coupon.applicableProductIds && coupon.applicableProductIds.length > 0;
              const isSpecificCategories = coupon.applicableScope === 'specific_categories' && coupon.applicableCategoryIds && coupon.applicableCategoryIds.length > 0;

              return (
                <div key={coupon.code} className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3 relative group transition-all hover:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-base font-black text-[#28B9FF] tracking-wider px-3 py-1 rounded-xl bg-[#0D6EFD]/15 border border-[#0D6EFD]/30">
                        {coupon.code}
                      </span>
                      {coupon.isReferral && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Referral
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteCoupon(coupon.code)}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Delete Coupon"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-xl font-black text-white flex items-baseline gap-2">
                      <span>{coupon.percentage ? `${coupon.percentage}% OFF` : `Rs. ${coupon.fixedPKR} OFF`}</span>
                      {coupon.minOrderAmountPKR ? (
                        <span className="text-[10px] font-medium text-amber-400/90">
                          (Min Rs. {coupon.minOrderAmountPKR})
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-slate-300 font-medium">{coupon.description || 'Special Discount Offer'}</p>
                  </div>

                  {/* Scope Badge */}
                  <div className="pt-2 border-t border-slate-800/80 text-xs">
                    {isSpecificProducts ? (
                      <div className="space-y-1">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
                          <Package className="w-3 h-3 text-purple-400" />
                          <span>Specific: {coupon.applicableProductIds?.length} Item(s)</span>
                        </span>
                        {coupon.applicableProductTitles && coupon.applicableProductTitles.length > 0 && (
                          <p className="text-[11px] text-slate-400 line-clamp-1 italic">
                            {coupon.applicableProductTitles.join(', ')}
                          </p>
                        )}
                      </div>
                    ) : isSpecificCategories ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                        <FolderOpen className="w-3 h-3 text-cyan-400" />
                        <span>Category: {coupon.applicableCategoryIds?.join(', ')}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        <Sparkles className="w-3 h-3 text-emerald-400" />
                        <span>All Store Products (Storewide)</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CREATE / EDIT COUPON MODAL */}
      {couponModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-lg bg-[#0D1527] border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl my-8 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#28B9FF]" />
                <span>Create Offer / Promo Coupon</span>
              </h3>
              <button 
                onClick={() => setCouponModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveCoupon} className="space-y-4 overflow-y-auto pr-1 flex-1">
              <div>
                <label className="text-xs font-semibold text-slate-300">Coupon / Offer Code</label>
                <input
                  type="text"
                  value={newCoupon.code}
                  onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase().replace(/\s+/g, '') })}
                  placeholder="e.g. FLASH30, NEXTJS50, STUDENT20"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold text-xs mt-1 focus:outline-none focus:border-[#0D6EFD]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Percentage OFF (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newCoupon.percentage || ''}
                    onChange={(e) => setNewCoupon({ ...newCoupon, percentage: Number(e.target.value), fixedPKR: undefined })}
                    placeholder="20"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs mt-1 focus:outline-none focus:border-[#0D6EFD]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">Fixed Discount (PKR)</label>
                  <input
                    type="number"
                    min="10"
                    value={newCoupon.fixedPKR || ''}
                    onChange={(e) => setNewCoupon({ ...newCoupon, fixedPKR: Number(e.target.value), percentage: undefined })}
                    placeholder="100"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs mt-1 focus:outline-none focus:border-[#0D6EFD]"
                  />
                </div>
              </div>

              {/* Scope Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Applicable On (Target Scope)</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewCoupon({ ...newCoupon, applicableScope: 'all' })}
                    className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all flex flex-col items-center gap-1 ${
                      newCoupon.applicableScope === 'all'
                        ? 'bg-[#0D6EFD]/20 border-[#0D6EFD] text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#28B9FF]" />
                    <span>All Products</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewCoupon({ ...newCoupon, applicableScope: 'specific_products' })}
                    className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all flex flex-col items-center gap-1 ${
                      newCoupon.applicableScope === 'specific_products'
                        ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Package className="w-3.5 h-3.5 text-purple-400" />
                    <span>Specific Products</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewCoupon({ ...newCoupon, applicableScope: 'specific_categories' })}
                    className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all flex flex-col items-center gap-1 ${
                      newCoupon.applicableScope === 'specific_categories'
                        ? 'bg-cyan-600/20 border-cyan-500 text-cyan-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Categories</span>
                  </button>
                </div>
              </div>

              {/* SPECIFIC PRODUCTS SELECTOR */}
              {newCoupon.applicableScope === 'specific_products' && (
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-purple-300">
                      Select Target Products ({newCoupon.applicableProductIds.length} Selected)
                    </span>
                    {newCoupon.applicableProductIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setNewCoupon({ ...newCoupon, applicableProductIds: [] })}
                        className="text-[11px] text-rose-400 hover:underline"
                      >
                        Clear Selection
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={productSearchQuery}
                      onChange={(e) => setProductSearchQuery(e.target.value)}
                      placeholder="Search store products by title..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                    {filteredProductsForCoupon.map((prod) => {
                      const isSelected = newCoupon.applicableProductIds.includes(prod.id);
                      return (
                        <div
                          key={prod.id}
                          onClick={() => toggleProductSelection(prod.id)}
                          className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-purple-950/40 border-purple-500/50 text-white'
                              : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-900'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate pr-2">
                            <div className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                              isSelected ? 'bg-purple-500 border-purple-400 text-white' : 'border-slate-700 bg-slate-800'
                            }`}>
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span className="truncate font-medium">{prod.title}</span>
                          </div>
                          <span className="text-[10px] text-purple-300 shrink-0 font-mono">
                            Rs. {prod.pricePKR?.toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SPECIFIC CATEGORIES SELECTOR */}
              {newCoupon.applicableScope === 'specific_categories' && (
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="text-xs font-semibold text-cyan-300">
                    Select Eligible Categories ({newCoupon.applicableCategoryIds.length} Selected)
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {[
                      { id: 'courses', name: 'Courses' },
                      { id: 'templates', name: 'Templates' },
                      { id: 'graphics', name: 'Graphics Assets' },
                      { id: 'softwares', name: 'Softwares' },
                      { id: 'ebooks', name: 'E-Books' },
                      { id: 'tools', name: 'Pro Tools' }
                    ].map((cat) => {
                      const isSelected = newCoupon.applicableCategoryIds.includes(cat.id);
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => toggleCategorySelection(cat.id)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                            isSelected
                              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {cat.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Min Cart Amount (PKR - Optional)</label>
                  <input
                    type="number"
                    value={newCoupon.minOrderAmountPKR || ''}
                    onChange={(e) => setNewCoupon({ ...newCoupon, minOrderAmountPKR: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="e.g. 500"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs mt-1 focus:outline-none focus:border-[#0D6EFD]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">Public Description</label>
                  <input
                    type="text"
                    value={newCoupon.description}
                    onChange={(e) => setNewCoupon({ ...newCoupon, description: e.target.value })}
                    placeholder="e.g. 30% OFF on Next.js Pack"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs mt-1 focus:outline-none focus:border-[#0D6EFD]"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCouponModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#0D6EFD] hover:bg-[#0b5ed7] text-white text-xs font-bold transition-all shadow-md"
                >
                  Save Offer / Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

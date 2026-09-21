import React, { useState } from 'react';
import { Clock, Search, Filter, Calendar, Mail, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';
import { Order } from '../../types';
import { updateOrderExpiryInDb } from '../../services/firestoreService';

interface AdminExpiryManagementProps {
  orders: Order[];
  onRequireReAuth: (title: string, desc: string, fn: () => Promise<void>) => void;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
}

export const AdminExpiryManagement: React.FC<AdminExpiryManagementProps> = ({
  orders,
  onRequireReAuth,
  onShowToast
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED'>('ALL');
  
  // Custom date editing modal state
  const [editingItem, setEditingItem] = useState<{
    orderId: string;
    itemIndex: number;
    currentExpiry: string;
    productTitle: string;
    customerName: string;
  } | null>(null);
  const [customDateInput, setCustomDateInput] = useState('');

  // Flatten orders into individual purchased items with order reference
  const allPurchasedItems: Array<{
    orderId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    item: {
      productId: string;
      title: string;
      thumbnail?: string;
      price?: number;
      expiresAt?: string;
    };
    itemIndex: number;
    createdAt: string;
  }> = [];

  orders.forEach(order => {
    (order.items || []).forEach((item, itemIndex) => {
      allPurchasedItems.push({
        orderId: order.id,
        customerName: order.customerName || 'Guest Customer',
        customerEmail: order.email || 'N/A',
        customerPhone: order.whatsapp || 'N/A',
        item,
        itemIndex,
        createdAt: order.createdAt || new Date().toISOString()
      });
    });
  });

  // Filter items
  const filteredItems = allPurchasedItems.filter(entry => {
    const term = searchTerm.toLowerCase().trim();
    if (term) {
      const matchTitle = entry.item.title.toLowerCase().includes(term);
      const matchName = entry.customerName.toLowerCase().includes(term);
      const matchEmail = entry.customerEmail.toLowerCase().includes(term);
      const matchOrderId = entry.orderId.toLowerCase().includes(term);
      if (!matchTitle && !matchName && !matchEmail && !matchOrderId) return false;
    }

    const expiresAt = entry.item.expiresAt ? new Date(entry.item.expiresAt) : new Date(Date.now() + 30*24*3600*1000);
    const now = new Date();
    const diffDays = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 3600 * 24));
    const isExpired = expiresAt.getTime() <= now.getTime();
    const isExpiringSoon = diffDays <= 3 && !isExpired;

    if (filterStatus === 'ACTIVE' && isExpired) return false;
    if (filterStatus === 'EXPIRING_SOON' && !isExpiringSoon) return false;
    if (filterStatus === 'EXPIRED' && !isExpired) return false;

    return true;
  });

  const handleExtendExpiry = async (orderId: string, itemIndex: number, daysToAdd: number, productTitle: string) => {
    onRequireReAuth(
      `Extend Expiry for "${productTitle}"`,
      `Are you sure you want to extend this tool's access by ${daysToAdd} days? This will update Firebase in real-time.`,
      async () => {
        const item = allPurchasedItems.find(e => e.orderId === orderId && e.itemIndex === itemIndex);
        const currentExpires = item?.item.expiresAt ? new Date(item.item.expiresAt) : new Date();
        const baseTime = currentExpires.getTime() > Date.now() ? currentExpires.getTime() : Date.now();
        const newExpiry = new Date(baseTime + daysToAdd * 24 * 3600 * 1000).toISOString();

        const success = await updateOrderExpiryInDb(orderId, itemIndex, newExpiry);
        if (success) {
          onShowToast(`Successfully extended expiry by ${daysToAdd} days!`, 'success');
        } else {
          onShowToast('Failed to update expiry in database.', 'error');
        }
      }
    );
  };

  const handleSaveCustomExpiry = async () => {
    if (!editingItem || !customDateInput) return;
    const iso = new Date(customDateInput).toISOString();
    const success = await updateOrderExpiryInDb(editingItem.orderId, editingItem.itemIndex, iso);
    if (success) {
      onShowToast(`Expiry date updated for ${editingItem.productTitle}!`, 'success');
      setEditingItem(null);
      setCustomDateInput('');
    } else {
      onShowToast('Failed to update expiry date.', 'error');
    }
  };

  const handleSendReminderManual = async (email: string, toolName: string) => {
    try {
      const res = await fetch('/api/send-expiry-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerEmail: email, toolName })
      });
      const data = await res.json();
      if (data.success) {
        onShowToast(`Expiry reminder notice sent to ${email}`, 'success');
      } else {
        onShowToast(data.error || 'Failed to send reminder email', 'error');
      }
    } catch (err) {
      onShowToast('Network error sending reminder email', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-[#0D1527] border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Firebase Master Management</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Pro Tools &amp; Expiry Timers Control
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage subscription expiry dates, extend user access in real-time, and monitor active Pro Tools across all customer accounts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>{allPurchasedItems.length} Total Active Items</span>
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="p-4 rounded-2xl bg-[#0D1527] border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by tool name, customer, or email..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-[#0D6EFD]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'ACTIVE', 'EXPIRING_SOON', 'EXPIRED'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilterStatus(tab)}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                filterStatus === tab
                  ? 'bg-[#0D6EFD] text-white shadow-md shadow-[#0D6EFD]/25'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tab === 'ALL' ? 'All Items' : tab === 'ACTIVE' ? 'Active' : tab === 'EXPIRING_SOON' ? '⚠️ Expiring Soon' : '❌ Expired'}
            </button>
          ))}
        </div>
      </div>

      {/* Items Grid / Table */}
      {filteredItems.length === 0 ? (
        <div className="p-16 text-center rounded-3xl bg-[#0D1527] border border-slate-800 space-y-4">
          <Clock className="w-12 h-12 text-slate-600 mx-auto" />
          <div className="text-white font-bold text-sm">No Pro Tools Found</div>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No items match your search or filter criteria in the Firebase database.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((entry, idx) => {
            const expiresAt = entry.item.expiresAt ? new Date(entry.item.expiresAt) : new Date(Date.now() + 30*24*3600*1000);
            const now = new Date();
            const diffDays = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 3600 * 24));
            const isExpired = expiresAt.getTime() <= now.getTime();
            const isExpiringSoon = diffDays <= 3 && !isExpired;

            return (
              <div key={`${entry.orderId}-${entry.itemIndex}-${idx}`} className="p-5 rounded-3xl bg-[#0D1527] border border-slate-800 space-y-4 shadow-xl flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      {entry.item.thumbnail ? (
                        <img src={entry.item.thumbnail} alt="" className="w-10 h-10 rounded-xl object-cover bg-slate-950 border border-slate-800" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-[#0D6EFD]/10 border border-[#0D6EFD]/30 flex items-center justify-center text-[#28B9FF] font-bold text-xs">
                          {entry.item.title.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-1">{entry.item.title}</h3>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Order #{entry.orderId.slice(-6)}</div>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase shrink-0 ${
                      isExpired ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' :
                      isExpiringSoon ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse' :
                      'bg-emerald-500/10 text-[#22C55E] border border-emerald-500/30'
                    }`}>
                      {isExpired ? 'Expired' : isExpiringSoon ? `⚠️ ${diffDays}d left` : 'Active'}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Customer:</span>
                      <span className="text-white font-bold truncate max-w-[160px]">{entry.customerName}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Email:</span>
                      <span className="text-[#28B9FF] truncate max-w-[160px]">{entry.customerEmail}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Expiry Date:</span>
                      <span className="text-white font-mono font-bold">{expiresAt.toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleExtendExpiry(entry.orderId, entry.itemIndex, 30, entry.item.title)}
                      className="flex-1 py-2 rounded-xl bg-[#0D6EFD]/10 hover:bg-[#0D6EFD]/20 text-[#28B9FF] text-[11px] font-bold border border-[#0D6EFD]/30 transition-all cursor-pointer"
                    >
                      +30 Days
                    </button>
                    <button
                      onClick={() => handleExtendExpiry(entry.orderId, entry.itemIndex, 365, entry.item.title)}
                      className="flex-1 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[11px] font-bold border border-amber-500/30 transition-all cursor-pointer"
                    >
                      +1 Year
                    </button>
                    <button
                      onClick={() => {
                        setEditingItem({
                          orderId: entry.orderId,
                          itemIndex: entry.itemIndex,
                          currentExpiry: entry.item.expiresAt || new Date().toISOString(),
                          productTitle: entry.item.title,
                          customerName: entry.customerName
                        });
                        setCustomDateInput(expiresAt.toISOString().split('T')[0]);
                      }}
                      className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-[11px] font-bold border border-slate-800 transition-all cursor-pointer"
                    >
                      Custom
                    </button>
                  </div>

                  <button
                    onClick={() => handleSendReminderManual(entry.customerEmail, entry.item.title)}
                    className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-[11px] font-bold border border-slate-800 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5 text-amber-400" />
                    <span>Send Expiry Reminder Notice</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Custom Expiry Date Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#0D1527] border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Set Custom Expiry Date</h3>
            <p className="text-xs text-slate-400">
              Update expiry date for <span className="text-white font-bold">{editingItem.productTitle}</span> ({editingItem.customerName}).
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">New Expiry Date</label>
              <input
                type="date"
                value={customDateInput}
                onChange={(e) => setCustomDateInput(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-[#0D6EFD]"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setEditingItem(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCustomExpiry}
                className="flex-1 py-2.5 rounded-xl bg-[#0D6EFD] hover:bg-[#0b5ed7] text-white text-xs font-bold shadow-md shadow-[#0D6EFD]/30"
              >
                Save Expiry Date
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

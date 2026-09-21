import React, { useState } from 'react';
import { 
  Package, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Send, 
  MessageSquare, 
  Mail, 
  ExternalLink, 
  Eye, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  AlertTriangle,
  Link as LinkIcon,
  X,
  CheckSquare,
  Square,
  FileSpreadsheet,
  Trash2
} from 'lucide-react';
import { Order } from '../../types';
import { getSavedSheetsConfig } from '../../services/googleSheetsService';
import { 
  updateOrderStatusInDb, 
  bulkVerifyOrdersInDb, 
  attachDownloadLinkAndDeliverOrderInDb, 
  cancelOrderInDb,
  updateOrderExpiryInDb,
  clearAllOrdersFromDb,
  deleteOrderFromDb
} from '../../services/firestoreService';

interface AdminOrdersProps {
  orders: Order[];
  initialStatusFilter?: string;
  onRequireReAuth: (actionTitle: string, actionDesc: string, actionFn: () => Promise<void>) => void;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
}

export const AdminOrders: React.FC<AdminOrdersProps> = ({
  orders,
  initialStatusFilter,
  onRequireReAuth,
  onShowToast
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter || 'ALL');
  const [dateFilter, setDateFilter] = useState<string>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');
  
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const sheetsConfig = getSavedSheetsConfig();

  // Deliver modal state
  const [deliverModalOpen, setDeliverModalOpen] = useState(false);
  const [customDownloadUrl, setCustomDownloadUrl] = useState('');

  // Cancel modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Expiry Edit state
  const [editingExpiryIdx, setEditingExpiryIdx] = useState<number | null>(null);
  const [newExpiryDateInput, setNewExpiryDateInput] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  // Filter logic
  const filteredOrders = orders.filter((order) => {
    // Search
    const term = searchTerm.toLowerCase().trim();
    if (term) {
      const matchId = order.id.toLowerCase().includes(term);
      const matchName = order.customerName?.toLowerCase().includes(term);
      const matchEmail = order.email?.toLowerCase().includes(term);
      const matchPhone = order.whatsapp?.toLowerCase().includes(term);
      if (!matchId && !matchName && !matchEmail && !matchPhone) return false;
    }

    // Status Filter
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'Pending Verification' && order.status !== 'Pending Verification') return false;
      if (statusFilter === 'Payment Verified' && order.status !== 'Payment Verified') return false;
      if (statusFilter === 'Access Delivered' && order.status !== 'Access Delivered' && order.status !== 'Completed') return false;
      if (statusFilter === 'Cancelled' && !order.status?.toLowerCase().includes('cancel')) return false;
    }

    // Date Filter
    if (dateFilter !== 'ALL' && order.createdAt) {
      const orderDate = new Date(order.createdAt);
      const now = new Date();
      if (dateFilter === 'TODAY') {
        if (orderDate.toDateString() !== now.toDateString()) return false;
      } else if (dateFilter === 'WEEK') {
        const diffDays = (now.getTime() - orderDate.getTime()) / (1000 * 3600 * 24);
        if (diffDays > 7) return false;
      } else if (dateFilter === 'MONTH') {
        const diffDays = (now.getTime() - orderDate.getTime()) / (1000 * 3600 * 24);
        if (diffDays > 30) return false;
      }
    }

    // Payment Method Filter
    if (paymentFilter !== 'ALL') {
      if (order.paymentMethod?.toLowerCase() !== paymentFilter.toLowerCase()) return false;
    }

    return true;
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredOrders.length / pageSize) || 1;
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Selection handlers
  const handleToggleSelectAll = () => {
    if (selectedOrderIds.length === paginatedOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(paginatedOrders.map(o => o.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    if (selectedOrderIds.includes(id)) {
      setSelectedOrderIds(selectedOrderIds.filter(i => i !== id));
    } else {
      setSelectedOrderIds([...selectedOrderIds, id]);
    }
  };

  // Admin Actions
  const handleVerifyPayment = async (order: Order) => {
    try {
      await updateOrderStatusInDb(order.id, 'Payment Verified');
      onShowToast(`Order #${order.id.slice(-6)} payment verified!`, 'success');
      if (activeOrder?.id === order.id) {
        setActiveOrder({ ...activeOrder, status: 'Payment Verified' });
      }
    } catch (err) {
      onShowToast('Failed to verify payment.', 'error');
    }
  };

  const handleDeliverAccess = async () => {
    if (!activeOrder) return;
    const link = customDownloadUrl.trim() || activeOrder.downloadLinks?.[0] || 'https://drive.google.com/drive/u/0/my-drive';
    try {
      await attachDownloadLinkAndDeliverOrderInDb(activeOrder, link);
      onShowToast(`Order #${activeOrder.id.slice(-6)} access delivered! Review request sent.`, 'success');
      setDeliverModalOpen(false);
      setCustomDownloadUrl('');
      setActiveOrder({
        ...activeOrder,
        status: 'Access Delivered',
        downloadLinks: Array.from(new Set([...(activeOrder.downloadLinks || []), link]))
      });
    } catch (err) {
      onShowToast('Failed to deliver order access.', 'error');
    }
  };

  const handleConfirmCancel = async () => {
    if (!activeOrder) return;
    const reason = cancelReason.trim() || 'Admin cancelled order';
    
    onRequireReAuth(
      `Cancel Order #${activeOrder.id.slice(-6)}`,
      `Are you sure you want to cancel this order for customer ${activeOrder.customerName}? Reason: ${reason}`,
      async () => {
        try {
          await cancelOrderInDb(activeOrder.id, reason);
          onShowToast(`Order #${activeOrder.id.slice(-6)} cancelled.`, 'success');
          setCancelModalOpen(false);
          setCancelReason('');
          setActiveOrder({
            ...activeOrder,
            status: 'Pending Verification',
            notes: `Cancelled: ${reason}`
          });
        } catch (err) {
          onShowToast('Failed to cancel order.', 'error');
        }
      }
    );
  };

  const handleBulkVerify = async () => {
    if (selectedOrderIds.length === 0) return;
    try {
      await bulkVerifyOrdersInDb(selectedOrderIds);
      onShowToast(`Bulk verified ${selectedOrderIds.length} orders!`, 'success');
      setSelectedOrderIds([]);
    } catch (err) {
      onShowToast('Failed bulk verification.', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/90 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-white">Order Management</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-[#0D6EFD]/20 text-[#28B9FF] text-xs font-bold border border-[#0D6EFD]/30">
              {filteredOrders.length} Orders
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Real-time Firestore sync • Live dispatch and payment verification</p>
        </div>

        {/* Action Group */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {sheetsConfig && (
            <a
              href={sheetsConfig.spreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Live Google Sheet</span>
            </a>
          )}

          {/* Bulk Action Button */}
          {selectedOrderIds.length > 0 && (
            <button
              onClick={handleBulkVerify}
              className="px-4 py-2 rounded-xl bg-[#22C55E] hover:bg-emerald-600 text-slate-950 font-extrabold text-xs transition-all shadow-md shadow-[#22C55E]/20 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Bulk Verify ({selectedOrderIds.length})</span>
            </button>
          )}

          {/* Clean All Orders Button */}
          {orders.length > 0 && (
            <button
              onClick={() => {
                onRequireReAuth(
                  'Clean & Clear All Orders',
                  'Are you sure you want to permanently delete all orders from the database and server? This cannot be undone.',
                  async () => {
                    try {
                      await clearAllOrdersFromDb();
                      setSelectedOrderIds([]);
                      setActiveOrder(null);
                      onShowToast('All orders cleared and database cleaned successfully.', 'success');
                    } catch (e) {
                      onShowToast('Failed to clean orders.', 'error');
                    }
                  }
                );
              }}
              className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
              title="Clean all orders from database"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clean All Orders</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Order ID, Name, Email..."
            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#0D6EFD]"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-[#0D6EFD]"
        >
          <option value="ALL">All Statuses</option>
          <option value="Pending Verification">Pending Verification</option>
          <option value="Payment Verified">Payment Verified</option>
          <option value="Access Delivered">Access Delivered / Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        {/* Date Filter */}
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-[#0D6EFD]"
        >
          <option value="ALL">All Dates</option>
          <option value="TODAY">Today</option>
          <option value="WEEK">Last 7 Days</option>
          <option value="MONTH">Last 30 Days</option>
        </select>

        {/* Payment Method Filter */}
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-[#0D6EFD]"
        >
          <option value="ALL">All Payment Methods</option>
          <option value="EasyPaisa">EasyPaisa</option>
          <option value="JazzCash">JazzCash</option>
          <option value="Bank Transfer">Bank Transfer</option>
          <option value="Binance Crypto">Binance Crypto</option>
          <option value="NayaPay">NayaPay / SadaPay</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 font-bold border-b border-slate-800">
                <th className="p-4 w-10">
                  <button onClick={handleToggleSelectAll} className="text-slate-400 hover:text-white">
                    {selectedOrderIds.length === paginatedOrders.length && paginatedOrders.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-[#0D6EFD]" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="p-4">Order ID</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Item(s)</th>
                <th className="p-4">Total</th>
                <th className="p-4">Payment</th>
                <th className="p-4">Status</th>
                <th className="p-4">Date</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    No orders match the selected filters.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => {
                  const isSelected = selectedOrderIds.includes(order.id);
                  const itemsSummary = order.items?.map(i => i.title).join(', ') || 'Digital Resource';

                  return (
                    <tr 
                      key={order.id} 
                      className={`hover:bg-slate-800/50 transition-colors cursor-pointer ${isSelected ? 'bg-[#0D6EFD]/10' : ''}`}
                      onClick={() => setActiveOrder(order)}
                    >
                      <td className="p-4" onClick={(e) => { e.stopPropagation(); handleToggleSelect(order.id); }}>
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-[#0D6EFD]" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-600" />
                        )}
                      </td>

                      <td className="p-4 font-mono font-bold text-[#28B9FF]">
                        #{order.id.slice(-6)}
                      </td>

                      <td className="p-4">
                        <div className="font-bold text-white">{order.customerName}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[140px]">{order.email}</div>
                      </td>

                      <td className="p-4 max-w-[180px] truncate text-slate-300">
                        {itemsSummary}
                      </td>

                      <td className="p-4 font-black text-white">
                        Rs. {order.totalAmountPKR?.toLocaleString()}
                      </td>

                      <td className="p-4 text-slate-300">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-[11px] font-semibold">
                          {order.paymentMethod || 'JazzCash'}
                        </span>
                      </td>

                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          order.status === 'Completed' || order.status === 'Access Delivered'
                            ? 'bg-emerald-500/20 text-[#22C55E] border border-emerald-500/30'
                            : order.status === 'Payment Verified'
                            ? 'bg-blue-500/20 text-[#28B9FF] border border-blue-500/30'
                            : order.status?.toLowerCase().includes('cancel')
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {order.status === 'Access Delivered' ? 'Delivered' : order.status}
                        </span>
                      </td>

                      <td className="p-4 text-slate-400 text-[11px]">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Today'}
                      </td>

                      <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setActiveOrder(order)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-[#0D6EFD] text-slate-200 hover:text-white font-semibold transition-all flex items-center gap-1 ml-auto"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>Showing page {currentPage} of {totalPages}</div>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ═════════════════════════════════════════════════════
          ORDER DETAIL MODAL / DRAWER
      ═════════════════════════════════════════════════════ */}
      {activeOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-2xl bg-[#0D1527] border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100 space-y-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-white">Order Detail #{activeOrder.id.slice(-6)}</h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#0D6EFD]/20 text-[#28B9FF] text-xs font-bold">
                    {activeOrder.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400">Placed on {new Date(activeOrder.createdAt).toLocaleString()}</p>
              </div>
              <button
                onClick={() => setActiveOrder(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer Info & Quick Contact Buttons */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="text-xs font-semibold text-slate-400">Customer</div>
                  <div className="text-sm font-bold text-white">{activeOrder.customerName}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-400">Payment Method</div>
                  <div className="text-sm font-bold text-amber-300">{activeOrder.paymentMethod}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-slate-800/80">
                <a
                  href={`https://wa.me/${activeOrder.whatsapp?.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(activeOrder.customerName)}!%20Regarding%20your%20Zohaib%20DigiForge%20order%20%23${activeOrder.id.slice(-6)}...`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-xl bg-[#22C55E]/20 text-[#22C55E] hover:bg-[#22C55E]/30 text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>WhatsApp ({activeOrder.whatsapp})</span>
                </a>

                <a
                  href={`mailto:${activeOrder.email}?subject=Zohaib%20DigiForge%20Order%20%23${activeOrder.id.slice(-6)}`}
                  className="px-3 py-2 rounded-xl bg-[#0D6EFD]/20 text-[#28B9FF] hover:bg-[#0D6EFD]/30 text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Mail className="w-4 h-4" />
                  <span>Email ({activeOrder.email})</span>
                </a>
              </div>
            </div>

            {/* Order Items */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-300">Purchased Resources</div>
              <div className="space-y-2">
                {activeOrder.items?.map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">{item.title}</div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">{item.type}</div>
                      </div>
                      <div className="text-xs font-black text-white shrink-0">
                        Rs. {item.price?.toLocaleString()}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-900 text-xs text-slate-400">
                      <div>
                        ⏳ Expires: <span className="text-amber-400 font-semibold">{item.expiresAt ? new Date(item.expiresAt).toLocaleDateString() : 'Not Set'}</span>
                      </div>
                      {editingExpiryIdx === idx ? (
                        <div className="flex items-center gap-1.5">
                          <input 
                            type="date"
                            className="px-2 py-1 bg-slate-900 border border-slate-700 text-xs text-white rounded-lg"
                            value={newExpiryDateInput}
                            onChange={(e) => setNewExpiryDateInput(e.target.value)}
                          />
                          <button 
                            onClick={async () => {
                              if (!newExpiryDateInput) return;
                              const iso = new Date(newExpiryDateInput).toISOString();
                              await updateOrderExpiryInDb(activeOrder.id, idx, iso);
                              onShowToast('Expiry date updated successfully!', 'success');
                              setEditingExpiryIdx(null);
                              const updatedItems = [...activeOrder.items];
                              updatedItems[idx].expiresAt = iso;
                              setActiveOrder({ ...activeOrder, items: updatedItems });
                            }}
                            className="px-2.5 py-1 bg-[#22C55E] text-slate-950 font-bold text-xs rounded-lg hover:bg-emerald-600 transition-all"
                          >
                            Save
                          </button>
                          <button 
                            onClick={() => setEditingExpiryIdx(null)}
                            className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded-lg hover:bg-slate-700 transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingExpiryIdx(idx);
                            setNewExpiryDateInput(item.expiresAt ? item.expiresAt.split('T')[0] : new Date(Date.now() + 30*24*3600*1000).toISOString().split('T')[0]);
                          }}
                          className="text-[11px] text-[#28B9FF] hover:underline font-semibold"
                        >
                          ⚙️ Edit Expiry Date
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Existing Download Links */}
            {activeOrder.downloadLinks && activeOrder.downloadLinks.length > 0 && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                <div className="text-xs font-bold text-[#22C55E]">Attached Access Links</div>
                {activeOrder.downloadLinks.map((link, idx) => (
                  <a
                    key={idx}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#28B9FF] hover:underline flex items-center gap-1.5 break-all"
                  >
                    <LinkIcon className="w-3.5 h-3.5 shrink-0" />
                    <span>{link}</span>
                  </a>
                ))}
              </div>
            )}

            {/* Admin Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={() => handleVerifyPayment(activeOrder)}
                className="w-full sm:w-auto flex-1 py-3 rounded-xl bg-[#0D6EFD] hover:bg-[#0b5ed7] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Verify Payment</span>
              </button>

              <button
                onClick={() => setDeliverModalOpen(true)}
                className="w-full sm:w-auto flex-1 py-3 rounded-xl bg-[#22C55E] hover:bg-emerald-600 text-slate-950 text-xs font-black transition-all flex items-center justify-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span>Attach Link &amp; Deliver</span>
              </button>

              <button
                onClick={() => setCancelModalOpen(true)}
                className="w-full sm:w-auto px-4 py-3 rounded-xl bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30 text-xs font-bold transition-all"
              >
                Cancel Order
              </button>

              <button
                onClick={() => {
                  onRequireReAuth(
                    `Delete Order #${activeOrder.id}`,
                    `Are you sure you want to permanently delete order #${activeOrder.id} for ${activeOrder.customerName}?`,
                    async () => {
                      try {
                        await deleteOrderFromDb(activeOrder.id);
                        onShowToast(`Order #${activeOrder.id} permanently deleted.`, 'success');
                        setActiveOrder(null);
                      } catch (err) {
                        onShowToast('Failed to delete order.', 'error');
                      }
                    }
                  );
                }}
                className="w-full sm:w-auto px-4 py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                title="Delete order"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Order</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Attach Download Link Modal */}
      {deliverModalOpen && activeOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#0D1527] border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Attach Download Drive Link</h3>
            <p className="text-xs text-slate-400">
              Paste the Google Drive or license key link for order #{activeOrder.id.slice(-6)}.
            </p>
            <input
              type="text"
              value={customDownloadUrl}
              onChange={(e) => setCustomDownloadUrl(e.target.value)}
              placeholder="https://drive.google.com/drive/folders/..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#0D6EFD]"
            />
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeliverModalOpen(false)}
                className="flex-1 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold"
              >
                Back
              </button>
              <button
                onClick={handleDeliverAccess}
                className="flex-1 py-2 rounded-xl bg-[#22C55E] text-slate-950 text-xs font-bold"
              >
                Confirm Delivery
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      {cancelModalOpen && activeOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#0D1527] border border-rose-500/40 rounded-3xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Cancel Order #{activeOrder.id.slice(-6)}</h3>
            <p className="text-xs text-slate-400">Specify an internal reason for record keeping:</p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason (e.g. Payment receipt not received or duplicate order)..."
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-rose-500"
            />
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setCancelModalOpen(false)}
                className="flex-1 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold"
              >
                Back
              </button>
              <button
                onClick={handleConfirmCancel}
                className="flex-1 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold"
              >
                Proceed Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

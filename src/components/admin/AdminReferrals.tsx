import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Award, 
  DollarSign, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Search, 
  Gift, 
  RefreshCw, 
  Clock, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink,
  Mail,
  Phone
} from 'lucide-react';
import { ReferralProfile, subscribeToReferralProfilesFromDb, updateReferralOrderStatusInDb, deleteReferralOrderFromDb, getAllReferralProfilesFromDb } from '../../services/firestoreService';

interface AdminReferralsProps {
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
}

export const AdminReferrals: React.FC<AdminReferralsProps> = ({ onShowToast }) => {
  const [profiles, setProfiles] = useState<ReferralProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedProfile, setExpandedProfile] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // holds "profileUid-orderId-action"
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid' | 'canceled'>('all');

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToReferralProfilesFromDb((list) => {
      setProfiles(list);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchReferrals = async () => {
    setLoading(true);
    try {
      const list = await getAllReferralProfilesFromDb();
      setProfiles(list);
    } catch (e) {
      console.warn('Error fetching referrals:', e);
      onShowToast('Failed to load referral profiles.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Status Handlers
  const handleUpdateStatus = async (referrerUid: string, orderId: string, newStatus: 'pending' | 'paid' | 'canceled') => {
    const actionKey = `${referrerUid}-${orderId}-${newStatus}`;
    setActionLoading(actionKey);
    try {
      const success = await updateReferralOrderStatusInDb(referrerUid, orderId, newStatus);
      if (success) {
        onShowToast(`Commission marked as ${newStatus} successfully!`, 'success');
        // Refresh local state to avoid slow reload
        setProfiles(prev => prev.map(p => {
          if (p.uid === referrerUid && p.referredOrders) {
            const updatedOrders = p.referredOrders.map(ro => {
              if (ro.orderId === orderId) {
                return { ...ro, status: newStatus };
              }
              return ro;
            });
            // Recalculate totals
            let totalEarnedPKR = 0;
            let totalReferredOrders = 0;
            updatedOrders.forEach(ro => {
              const reward = ro.rewardPKR || ro.rewardEarnedPKR || 0;
              if (ro.status !== 'canceled') {
                totalEarnedPKR += reward;
                totalReferredOrders += 1;
              }
            });
            return {
              ...p,
              referredOrders: updatedOrders,
              totalEarnedPKR,
              totalReferredOrders
            };
          }
          return p;
        }));
      } else {
        onShowToast('Could not update status.', 'error');
      }
    } catch (err) {
      console.error(err);
      onShowToast('An error occurred while updating status.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteReferralOrder = async (referrerUid: string, orderId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this referred order entry?')) {
      return;
    }
    const actionKey = `${referrerUid}-${orderId}-delete`;
    setActionLoading(actionKey);
    try {
      const success = await deleteReferralOrderFromDb(referrerUid, orderId);
      if (success) {
        onShowToast('Referred order deleted successfully!', 'success');
        setProfiles(prev => prev.map(p => {
          if (p.uid === referrerUid && p.referredOrders) {
            const updatedOrders = p.referredOrders.filter(ro => ro.orderId !== orderId);
            // Recalculate totals
            let totalEarnedPKR = 0;
            let totalReferredOrders = 0;
            updatedOrders.forEach(ro => {
              const reward = ro.rewardPKR || ro.rewardEarnedPKR || 0;
              if (ro.status !== 'canceled') {
                totalEarnedPKR += reward;
                totalReferredOrders += 1;
              }
            });
            return {
              ...p,
              referredOrders: updatedOrders,
              totalEarnedPKR,
              totalReferredOrders
            };
          }
          return p;
        }));
      } else {
        onShowToast('Could not delete referred order.', 'error');
      }
    } catch (err) {
      console.error(err);
      onShowToast('An error occurred during deletion.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // Calculate Metrics
  let totalPendingPKR = 0;
  let totalPaidPKR = 0;
  let totalCanceledPKR = 0;
  let totalAmbassadors = profiles.length;

  profiles.forEach(p => {
    if (p.referredOrders) {
      p.referredOrders.forEach(ro => {
        const reward = ro.rewardPKR || ro.rewardEarnedPKR || 0;
        const status = ro.status || 'pending';
        if (status === 'pending') {
          totalPendingPKR += reward;
        } else if (status === 'paid') {
          totalPaidPKR += reward;
        } else if (status === 'canceled') {
          totalCanceledPKR += reward;
        }
      });
    }
  });

  // Filter and Search profiles
  const filteredProfiles = profiles.filter(p => {
    const codeMatch = p.referralCode?.toLowerCase().includes(searchTerm.toLowerCase());
    const uidMatch = p.uid?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Check if any referred orders match the status filter if status filter is active
    let matchesStatus = true;
    if (filterStatus !== 'all') {
      matchesStatus = p.referredOrders?.some(ro => {
        const s = ro.status || 'pending';
        return s === filterStatus;
      }) ?? false;
    }

    return (codeMatch || uidMatch) && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Title Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60 p-6 rounded-3xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Award className="w-6 h-6 text-[#28B9FF]" />
            <span>Referral Tier &amp; Affiliate Commission Payouts</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage your brand ambassadors, track referral codes, and handle JazzCash/EasyPaisa payout approvals.
          </p>
        </div>
        <button 
          onClick={fetchReferrals}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all flex items-center gap-2 border border-slate-750 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5 shadow-md">
          <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">Total Ambassadors</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-mono">{totalAmbassadors}</span>
            <Users className="w-4 h-4 text-[#28B9FF] self-center ml-auto" />
          </div>
          <span className="text-[10px] text-[#28B9FF] block">Active referral profiles</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5 shadow-md">
          <span className="text-[11px] font-bold text-amber-400 block uppercase tracking-wider">Pending Payouts</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-300 font-mono">Rs. {totalPendingPKR.toLocaleString()}</span>
            <DollarSign className="w-4 h-4 text-amber-400 self-center ml-auto" />
          </div>
          <span className="text-[10px] text-amber-500 block">Needs JazzCash / EasyPaisa</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5 shadow-md">
          <span className="text-[11px] font-bold text-emerald-400 block uppercase tracking-wider">Paid Commission</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400 font-mono">Rs. {totalPaidPKR.toLocaleString()}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400 self-center ml-auto" />
          </div>
          <span className="text-[10px] text-emerald-500 block">Transfers completed</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5 shadow-md">
          <span className="text-[11px] font-bold text-rose-400 block uppercase tracking-wider">Canceled / Refunded</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-400 font-mono">Rs. {totalCanceledPKR.toLocaleString()}</span>
            <XCircle className="w-4 h-4 text-rose-400 self-center ml-auto" />
          </div>
          <span className="text-[10px] text-rose-500 block">Excluded from active rewards</span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 bg-slate-900/40 p-4 rounded-2xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text"
            placeholder="Search by Referral Code or Referrer UID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#28B9FF]"
          />
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-400 mr-1">Filter by status:</span>
          <div className="flex bg-slate-950 p-0.5 rounded-xl border border-slate-850">
            {(['all', 'pending', 'paid', 'canceled'] as const).map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${
                  filterStatus === status 
                    ? 'bg-slate-850 text-[#28B9FF] border border-slate-750' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Table List */}
      <div className="bg-slate-900/20 border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-[#28B9FF] animate-spin mx-auto" />
            <span className="block text-xs text-slate-400 font-bold">Scanning Referral database...</span>
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="p-20 text-center space-y-2">
            <Users className="w-10 h-10 text-slate-750 mx-auto" />
            <span className="block text-xs text-slate-400 font-bold">No Referral Profiles Found</span>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              Try adjusting your filters or search term. Profiles are automatically registered once a customer views their Refer page.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filteredProfiles.map((p) => {
              const totalOrders = p.referredOrders?.length || 0;
              const hasUnpaid = p.referredOrders?.some(ro => (ro.status || 'pending') === 'pending') ?? false;
              const isExpanded = expandedProfile === p.uid;

              // Local sums
              let localPending = 0;
              let localPaid = 0;
              p.referredOrders?.forEach(ro => {
                const reward = ro.rewardPKR || ro.rewardEarnedPKR || 0;
                const status = ro.status || 'pending';
                if (status === 'pending') localPending += reward;
                if (status === 'paid') localPaid += reward;
              });

              return (
                <div key={p.uid} className={`bg-slate-900/10 ${isExpanded ? 'bg-slate-900/30' : ''} transition-all`}>
                  {/* Top Header Card */}
                  <div 
                    onClick={() => setExpandedProfile(isExpanded ? null : p.uid)}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-800/20 transition-all"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-xl bg-[#28B9FF]/10 text-[#28B9FF] text-xs font-black tracking-wider">
                          {p.referralCode}
                        </span>
                        {hasUnpaid && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400 text-[10px] font-black animate-pulse flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            <span>Action Required</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-mono text-slate-500">
                        UID: <span className="text-slate-400">{p.uid}</span>
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-6 sm:gap-10 text-xs text-slate-300">
                      <div className="text-center sm:text-left">
                        <span className="text-[10px] text-slate-500 block uppercase">Referred Sales</span>
                        <span className="font-bold font-mono text-white text-sm">{totalOrders}</span>
                      </div>
                      <div className="text-center sm:text-left">
                        <span className="text-[10px] text-slate-500 block uppercase">Earned Active</span>
                        <span className="font-bold font-mono text-emerald-400 text-sm">Rs. {(p.totalEarnedPKR || 0).toLocaleString()}</span>
                      </div>
                      <div className="text-center sm:text-left">
                        <span className="text-[10px] text-amber-500/80 block uppercase">Unpaid Pending</span>
                        <span className="font-bold font-mono text-amber-400 text-sm">Rs. {localPending.toLocaleString()}</span>
                      </div>
                      <div className="text-center sm:text-left">
                        <span className="text-[10px] text-emerald-500/80 block uppercase">Paid Out</span>
                        <span className="font-bold font-mono text-emerald-500 text-sm">Rs. {localPaid.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 ml-auto sm:ml-0">
                      <span className="text-[10px] font-bold text-[#28B9FF] hover:underline">
                        {isExpanded ? 'Hide Transactions' : 'View & Manage Payouts'}
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                    </div>
                  </div>

                  {/* Expanded Order History & Admin Operations */}
                  {isExpanded && (
                    <div className="p-4 sm:p-6 bg-slate-950/80 border-t border-slate-850 space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Gift className="w-3.5 h-3.5 text-[#28B9FF]" />
                          <span>Detailed Referred Orders Log for {p.referralCode}</span>
                        </h4>
                        
                        {/* Instant Quick WhatsApp communication link */}
                        <a 
                          href={`https://wa.me/923406070632?text=Hi%20Ambassador!%20I%20have%20reviewed%20your%20referral%20payout%20for%20code%20${p.referralCode}.`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-[#22C55E]/10 hover:bg-[#22C55E]/20 text-[#22C55E] text-[10px] font-black flex items-center gap-1 transition-all"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Message Ambassador</span>
                        </a>
                      </div>

                      {!p.referredOrders || p.referredOrders.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-500">
                          No logged orders recorded for this profile.
                        </div>
                      ) : (
                        <div className="overflow-x-auto rounded-xl border border-slate-800">
                          <table className="w-full text-left text-xs text-slate-300 border-collapse">
                            <thead>
                              <tr className="bg-slate-900/60 text-slate-400 border-b border-slate-800">
                                <th className="p-3 font-bold">Client / Buyer Details</th>
                                <th className="p-3 font-bold">Order Reference</th>
                                <th className="p-3 font-bold">Sale Amount</th>
                                <th className="p-3 font-bold">Reward (Comm.)</th>
                                <th className="p-3 font-bold">Status Badge</th>
                                <th className="p-3 font-bold text-center">Payout Admin Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-850 bg-slate-950/40">
                              {p.referredOrders.map((ro, oIdx) => {
                                const currentStatus = ro.status || 'pending';
                                const rewardAmt = ro.rewardPKR || ro.rewardEarnedPKR || 0;
                                const isRowLoading = actionLoading?.startsWith(`${p.uid}-${ro.orderId}`);

                                return (
                                  <tr key={oIdx} className="hover:bg-slate-900/20 transition-all">
                                    <td className="p-3 space-y-1">
                                      <div className="font-bold text-white">
                                        {ro.customerName || 'ZDF Customer'}
                                      </div>
                                      {/* Buyer contact details */}
                                      <div className="flex flex-col gap-1 text-[10px] text-slate-400">
                                        {ro.customerEmail && (
                                          <a 
                                            href={`mailto:${ro.customerEmail}`} 
                                            className="flex items-center gap-1 hover:text-[#28B9FF] transition-all"
                                            title="Send email to buyer"
                                          >
                                            <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                            <span className="truncate max-w-[150px]">{ro.customerEmail}</span>
                                          </a>
                                        )}
                                        {ro.customerWhatsapp && (
                                          <a 
                                            href={`https://wa.me/${ro.customerWhatsapp.replace(/[^0-9]/g, '')}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="flex items-center gap-1 hover:text-[#22C55E] transition-all"
                                            title="Chat with buyer on WhatsApp"
                                          >
                                            <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                            <span>{ro.customerWhatsapp}</span>
                                          </a>
                                        )}
                                      </div>
                                    </td>
                                    <td className="p-3 font-mono text-[10px] text-slate-400">
                                      {ro.orderId ? `Order #${ro.orderId.substring(0, 10)}...` : 'N/A'}
                                    </td>
                                    <td className="p-3 font-bold font-mono text-slate-300">
                                      Rs. {ro.amountPKR?.toLocaleString() || 0}
                                    </td>
                                    <td className="p-3 font-black font-mono text-[#28B9FF]">
                                      Rs. {rewardAmt.toLocaleString()}
                                    </td>
                                    <td className="p-3">
                                      {currentStatus === 'pending' && (
                                        <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 text-[10px] font-black border border-amber-500/20">
                                          ⏳ Pending Payout
                                        </span>
                                      )}
                                      {currentStatus === 'paid' && (
                                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-black border border-emerald-500/20">
                                          ✅ Paid Out
                                        </span>
                                      )}
                                      {currentStatus === 'canceled' && (
                                        <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 text-[10px] font-black border border-rose-500/20">
                                          ❌ Canceled
                                        </span>
                                      )}
                                    </td>
                                    <td className="p-3 text-center">
                                      <div className="flex items-center justify-center gap-2">
                                        {/* Mark as Paid Action */}
                                        <button
                                          onClick={() => handleUpdateStatus(p.uid, ro.orderId, 'paid')}
                                          disabled={isRowLoading || currentStatus === 'paid'}
                                          className={`p-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1 transition-all ${
                                            currentStatus === 'paid'
                                              ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                                              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-700/10'
                                          }`}
                                          title="Commission Paid to JazzCash/EasyPaisa"
                                        >
                                          <CheckCircle2 className="w-3.5 h-3.5" />
                                          <span className="text-[10px] px-0.5">Paid</span>
                                        </button>

                                        {/* Mark as Canceled Action */}
                                        <button
                                          onClick={() => handleUpdateStatus(p.uid, ro.orderId, 'canceled')}
                                          disabled={isRowLoading || currentStatus === 'canceled'}
                                          className={`p-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1 transition-all ${
                                            currentStatus === 'canceled'
                                              ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                                              : 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-700/10'
                                          }`}
                                          title="Cancel and Exclude Commission"
                                        >
                                          <XCircle className="w-3.5 h-3.5" />
                                          <span className="text-[10px] px-0.5">Cancel</span>
                                        </button>

                                        {/* Delete completely */}
                                        <button
                                          onClick={() => handleDeleteReferralOrder(p.uid, ro.orderId)}
                                          disabled={isRowLoading}
                                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-rose-400 transition-all border border-slate-750"
                                          title="Delete Referral Entry Completely"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

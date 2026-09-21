import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, 
  Search, 
  Download, 
  Filter, 
  Trash2, 
  RefreshCw, 
  ShieldAlert, 
  ShieldCheck, 
  KeyRound, 
  Package, 
  Settings, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  XCircle, 
  Sparkles, 
  Clock, 
  User, 
  Laptop, 
  Globe, 
  Copy, 
  Check, 
  Eye, 
  X, 
  Calendar,
  Layers
} from 'lucide-react';
import { AuditLog, AuditLogCategory, AuditLogSeverity } from '../../types';
import { 
  subscribeToAuditLogsFromDb, 
  getAuditLogsFromDb, 
  clearAuditLogsFromDb, 
  recordAuditEvent 
} from '../../services/firestoreService';

interface AdminAuditLogsProps {
  onRequireReAuth: (title: string, description: string, actionFn: () => Promise<void>) => void;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
}

export const AdminAuditLogs: React.FC<AdminAuditLogsProps> = ({
  onRequireReAuth,
  onShowToast
}) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | AuditLogCategory>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<'ALL' | AuditLogSeverity>('ALL');
  const [timeRange, setTimeRange] = useState<'ALL' | 'today' | 'week' | 'month'>('ALL');
  
  // Inspect single log modal
  const [inspectLog, setInspectLog] = useState<AuditLog | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [clearingLogs, setClearingLogs] = useState(false);

  // 1. Subscribe to Live Firestore Audit Logs
  useEffect(() => {
    setLoading(true);
    const unsub = subscribeToAuditLogsFromDb((liveLogs) => {
      setLogs(liveLogs);
      setLoading(false);
    });

    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  // 2. Refresh manual trigger
  const handleRefresh = async () => {
    setLoading(true);
    try {
      const freshLogs = await getAuditLogsFromDb(200);
      setLogs(freshLogs);
      onShowToast('Audit logs refreshed from database', 'success');
    } catch (e) {
      console.warn('Error refreshing logs:', e);
    } finally {
      setLoading(false);
    }
  };

  // 3. Filtered Logs Computation
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inAction = log.action?.toLowerCase().includes(q);
        const inActorEmail = log.actorEmail?.toLowerCase().includes(q);
        const inActorName = log.actorName?.toLowerCase().includes(q);
        const inActorUid = log.actorUid?.toLowerCase().includes(q);
        const inTargetId = log.targetId?.toLowerCase().includes(q);
        const inDetails = (typeof log.details === 'string' ? log.details : JSON.stringify(log.details || {})).toLowerCase().includes(q);
        const inDevice = log.deviceInfo?.toLowerCase().includes(q);
        if (!inAction && !inActorEmail && !inActorName && !inActorUid && !inTargetId && !inDetails && !inDevice) {
          return false;
        }
      }

      // Category filter
      if (selectedCategory !== 'ALL' && log.category !== selectedCategory) {
        return false;
      }

      // Severity filter
      if (selectedSeverity !== 'ALL' && log.severity !== selectedSeverity) {
        return false;
      }

      // Time range filter
      if (timeRange !== 'ALL' && log.timestamp) {
        const logDate = new Date(log.timestamp).getTime();
        const now = Date.now();
        if (timeRange === 'today') {
          const oneDayAgo = now - 24 * 60 * 60 * 1000;
          if (logDate < oneDayAgo) return false;
        } else if (timeRange === 'week') {
          const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
          if (logDate < sevenDaysAgo) return false;
        } else if (timeRange === 'month') {
          const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
          if (logDate < thirtyDaysAgo) return false;
        }
      }

      return true;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [logs, searchQuery, selectedCategory, selectedSeverity, timeRange]);

  // Statistics Summary
  const stats = useMemo(() => {
    const total = logs.length;
    const authCount = logs.filter(l => l.category === 'auth').length;
    const orderCount = logs.filter(l => l.category === 'order').length;
    const adminCount = logs.filter(l => l.category === 'admin').length;
    const securityCount = logs.filter(l => l.category === 'security' || l.severity === 'danger' || l.severity === 'warning').length;

    return {
      total,
      authCount,
      orderCount,
      adminCount,
      securityCount
    };
  }, [logs]);

  // Copy helper
  const handleCopy = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    onShowToast(`Copied ${keyId} to clipboard!`, 'success');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Clear Audit Logs Action with Admin Re-Auth
  const handleClearLogs = () => {
    onRequireReAuth(
      'Purge Historical Audit Trail',
      'This will permanently delete all stored audit log records from Firestore. This action is irreversible.',
      async () => {
        setClearingLogs(true);
        try {
          const ok = await clearAuditLogsFromDb();
          if (ok) {
            setLogs([]);
            onShowToast('Audit logs successfully cleared', 'success');
          } else {
            onShowToast('Failed to clear audit logs', 'error');
          }
        } finally {
          setClearingLogs(false);
        }
      }
    );
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      onShowToast('No logs to export', 'error');
      return;
    }

    const headers = [
      'Timestamp',
      'Category',
      'Severity',
      'Action',
      'Actor Email',
      'Actor Role',
      'Actor UID',
      'Target ID',
      'Device Info',
      'Details'
    ];

    const rows = filteredLogs.map(l => [
      `"${l.timestamp}"`,
      `"${l.category}"`,
      `"${l.severity}"`,
      `"${(l.action || '').replace(/"/g, '""')}"`,
      `"${l.actorEmail || ''}"`,
      `"${l.actorRole || ''}"`,
      `"${l.actorUid || ''}"`,
      `"${l.targetId || ''}"`,
      `"${(l.deviceInfo || '').replace(/"/g, '""')}"`,
      `"${(typeof l.details === 'string' ? l.details : JSON.stringify(l.details || {})).replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `zdf_audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onShowToast(`Exported ${filteredLogs.length} audit logs to CSV`, 'success');
  };

  // Export to JSON
  const handleExportJSON = () => {
    if (filteredLogs.length === 0) return;
    const jsonStr = JSON.stringify(filteredLogs, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zdf_audit_logs_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast('Exported audit logs to JSON', 'success');
  };

  // Helper for category badge icons
  const getCategoryIcon = (category: AuditLogCategory) => {
    switch (category) {
      case 'auth':
        return <KeyRound className="w-3.5 h-3.5 text-[#28B9FF]" />;
      case 'order':
        return <Package className="w-3.5 h-3.5 text-emerald-400" />;
      case 'admin':
        return <Settings className="w-3.5 h-3.5 text-amber-400" />;
      case 'security':
        return <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />;
      case 'catalog':
        return <Layers className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <Activity className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  // Helper for severity styling
  const getSeverityBadge = (severity: AuditLogSeverity) => {
    switch (severity) {
      case 'danger':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'warning':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'success':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      default:
        return 'bg-blue-500/20 text-[#28B9FF] border-blue-500/40';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* ═════════════════════════════════════════════════════
          HEADER & METRICS
      ═════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0D1527] via-[#102242] to-[#0A0F1D] border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Real-Time Audit Stream Active</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              System &amp; Security Audit Logs
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Comprehensive event logging capturing customer login authentication events, order transitions, catalog and pricing edits, admin operations, and security triggers in real time.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="py-2.5 px-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold transition-all flex items-center gap-2 shadow-lg"
              title="Refresh Logs"
            >
              <RefreshCw className={`w-4 h-4 text-[#28B9FF] ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="py-2.5 px-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleClearLogs}
              disabled={clearingLogs || logs.length === 0}
              className="py-2.5 px-3.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-bold transition-all flex items-center gap-2 shadow-lg disabled:opacity-40"
              title="Purge Logs"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>Clear Logs</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        
        {/* Total Events */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-[#28B9FF]" />
            <span>Total Events</span>
          </div>
          <div className="text-2xl font-black text-white">{stats.total}</div>
          <div className="text-[10px] text-slate-400">All recorded audit logs</div>
        </div>

        {/* Auth & Logins */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-blue-500/30 space-y-1">
          <div className="text-[10px] uppercase font-bold text-[#28B9FF] flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-[#28B9FF]" />
            <span>Auth &amp; Sign-ins</span>
          </div>
          <div className="text-2xl font-black text-white">{stats.authCount}</div>
          <div className="text-[10px] text-slate-400">Logins, sign-ups, resets</div>
        </div>

        {/* Order Lifecycle */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/30 space-y-1">
          <div className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-emerald-400" />
            <span>Order Actions</span>
          </div>
          <div className="text-2xl font-black text-emerald-300">{stats.orderCount}</div>
          <div className="text-[10px] text-slate-400">Purchases &amp; verifications</div>
        </div>

        {/* Admin Updates */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/30 space-y-1">
          <div className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1.5">
            <Settings className="w-3.5 h-3.5 text-amber-400" />
            <span>Admin Edits</span>
          </div>
          <div className="text-2xl font-black text-amber-300">{stats.adminCount}</div>
          <div className="text-[10px] text-slate-400">Price, product, role changes</div>
        </div>

        {/* Security Triggers */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-rose-500/30 space-y-1">
          <div className="text-[10px] uppercase font-bold text-rose-400 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>Security &amp; OTP</span>
          </div>
          <div className="text-2xl font-black text-rose-300">{stats.securityCount}</div>
          <div className="text-[10px] text-slate-400">Verifications &amp; warnings</div>
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
              placeholder="Search by Action, Actor Email, UID, or Details..."
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

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
            
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              aria-label="Filter audit logs by category"
              className="py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 focus:outline-none focus:border-[#0D6EFD]"
            >
              <option value="ALL">All Categories</option>
              <option value="auth">Auth &amp; Sign-ins</option>
              <option value="order">Order Lifecycle</option>
              <option value="admin">Admin Operations</option>
              <option value="security">Security &amp; Re-Auth</option>
              <option value="catalog">Catalog &amp; Products</option>
              <option value="system">System &amp; Network</option>
            </select>

            {/* Severity Filter */}
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value as any)}
              aria-label="Filter audit logs by severity"
              className="py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 focus:outline-none focus:border-[#0D6EFD]"
            >
              <option value="ALL">All Severities</option>
              <option value="info">Info (Normal)</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="danger">Critical / Danger</option>
            </select>

            {/* Time Range Filter */}
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              aria-label="Filter audit logs by time range"
              className="py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 focus:outline-none focus:border-[#0D6EFD]"
            >
              <option value="ALL">All Time</option>
              <option value="today">Past 24 Hours</option>
              <option value="week">Past 7 Days</option>
              <option value="month">Past 30 Days</option>
            </select>

          </div>

        </div>

        {/* Counter footer */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
          <div>
            Showing <span className="font-bold text-white">{filteredLogs.length}</span> of {logs.length} audit logs
          </div>
          {(searchQuery || selectedCategory !== 'ALL' || selectedSeverity !== 'ALL' || timeRange !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
                setSelectedSeverity('ALL');
                setTimeRange('ALL');
              }}
              className="text-[#28B9FF] hover:underline font-bold text-[11px]"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════
          AUDIT LOGS TABLE / FEED
      ═════════════════════════════════════════════════════ */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Activity className="w-12 h-12 text-slate-600 mx-auto" />
            <div className="text-sm font-bold text-white">No audit logs match criteria</div>
            <p className="text-xs text-slate-400">Events will appear here in real time as actions occur.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Event Action</th>
                  <th className="py-3.5 px-4">Actor</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Severity</th>
                  <th className="py-3.5 px-4 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {filteredLogs.map((log) => {
                  const dateObj = new Date(log.timestamp);
                  const isRecent = Date.now() - dateObj.getTime() < 5 * 60 * 1000; // < 5 mins

                  return (
                    <tr 
                      key={log.id}
                      className="hover:bg-slate-800/40 transition-colors font-sans"
                    >
                      {/* Timestamp */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                            <span>
                              {dateObj.toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                              })}, {dateObj.toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit'
                              })}
                            </span>
                            {isRecent && (
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Just now" />
                            )}
                          </div>
                          <div className="text-[10px] font-mono text-slate-500">
                            {log.id}
                          </div>
                        </div>
                      </td>

                      {/* Event Action */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="font-bold text-white text-xs flex items-center gap-1.5">
                            {getCategoryIcon(log.category)}
                            <span>{log.action}</span>
                          </div>
                          {log.targetId && (
                            <div className="text-[10px] text-slate-400 font-mono">
                              Target: <span className="text-[#28B9FF]">{log.targetId}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Actor */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="font-semibold text-slate-200 text-xs flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" />
                            <span className="truncate max-w-[150px]">{log.actorEmail || 'System'}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                            <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-bold uppercase text-[9px]">
                              {log.actorRole || 'customer'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-bold uppercase">
                          {log.category}
                        </span>
                      </td>

                      {/* Severity */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase ${getSeverityBadge(log.severity)}`}>
                          {log.severity}
                        </span>
                      </td>

                      {/* Inspect Button */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setInspectLog(log)}
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
          LOG INSPECTION MODAL
      ═════════════════════════════════════════════════════ */}
      {inspectLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl rounded-3xl bg-[#0D1527] border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                  {getCategoryIcon(inspectLog.category)}
                </div>
                <div>
                  <h3 className="text-base font-black text-white">{inspectLog.action}</h3>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">
                    ID: {inspectLog.id} • {new Date(inspectLog.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setInspectLog(null)}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Category</div>
                  <div className="font-bold text-white uppercase mt-0.5">{inspectLog.category}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Severity</div>
                  <div className="font-bold text-white uppercase mt-0.5">{inspectLog.severity}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Actor Role</div>
                  <div className="font-bold text-white uppercase mt-0.5">{inspectLog.actorRole || 'customer'}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Target ID</div>
                  <div className="font-mono text-white text-[11px] truncate mt-0.5">{inspectLog.targetId || 'N/A'}</div>
                </div>
              </div>

              {/* Actor & Device Metadata */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="text-[11px] font-bold text-slate-300">Actor &amp; Client Metadata</div>
                <div className="space-y-1.5 text-[11px] font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Actor Email:</span>
                    <span className="text-white">{inspectLog.actorEmail || 'N/A'}</span>
                  </div>
                  {inspectLog.actorUid && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Actor UID:</span>
                      <span className="text-[#28B9FF]">{inspectLog.actorUid}</span>
                    </div>
                  )}
                  {inspectLog.deviceInfo && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Device User-Agent:</span>
                      <span className="text-slate-300 max-w-[280px] sm:max-w-md truncate">{inspectLog.deviceInfo}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Raw Details JSON */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-300">Event Details Payload:</span>
                  <button
                    onClick={() => handleCopy(JSON.stringify(inspectLog, null, 2), 'log_json')}
                    className="py-1 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-[#28B9FF] font-bold text-xs flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedKey === 'log_json' ? 'Copied' : 'Copy Full Payload'}</span>
                  </button>
                </div>
                <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-emerald-400 overflow-x-auto max-h-60">
                  {JSON.stringify(inspectLog, null, 2)}
                </pre>
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-end">
              <button
                onClick={() => setInspectLog(null)}
                className="py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
              >
                Close Inspector
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

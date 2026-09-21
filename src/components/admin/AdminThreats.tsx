import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Flame, 
  Terminal, 
  Database, 
  Search, 
  Lock, 
  Unlock, 
  RefreshCw, 
  Play, 
  CheckCircle2, 
  X, 
  Copy, 
  Check, 
  Eye, 
  Ban, 
  Filter, 
  Activity, 
  Server, 
  Zap, 
  Bug, 
  Radio, 
  Globe, 
  CheckCheck
} from 'lucide-react';
import { SecurityThreat, ThreatSeverity, ThreatCategory, SecurityStats } from '../../types';
import { 
  subscribeToSecurityThreats, 
  banAttackerIp, 
  unbanAttackerIp, 
  resolveSecurityThreatAction, 
  simulateThreatAttackTest 
} from '../../services/firestoreService';

interface AdminThreatsProps {
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
  onRequireReAuth?: (title: string, description: string, actionFn: () => Promise<void>) => void;
}

export const AdminThreats: React.FC<AdminThreatsProps> = ({
  onShowToast,
  onRequireReAuth
}) => {
  const [threats, setThreats] = useState<SecurityThreat[]>([]);
  const [stats, setStats] = useState<SecurityStats>({
    totalThreatsBlocked: 0,
    criticalExploits: 0,
    sqlInjectionsBlocked: 0,
    xssBlocked: 0,
    scannersBlocked: 0,
    bannedIpsCount: 0,
    wafActive: true
  });
  const [bannedIps, setBannedIps] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<'ALL' | ThreatSeverity>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | ThreatCategory>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'active' | 'resolved' | 'banned_ip'>('ALL');

  // Inspection modal
  const [inspectThreat, setInspectThreat] = useState<SecurityThreat | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Manual IP Ban modal
  const [showBanModal, setShowBanModal] = useState(false);
  const [manualIpInput, setManualIpInput] = useState('');
  const [manualIpReason, setManualIpReason] = useState('');

  // 1. Subscribe to Live Security Threats & WAF Engine
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToSecurityThreats((data) => {
      setThreats(data.threats);
      setStats(data.stats);
      setBannedIps(data.bannedIps);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Handle Copy to clipboard
  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Filtered threats
  const filteredThreats = useMemo(() => {
    return threats.filter((threat) => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchIp = threat.ipAddress?.toLowerCase().includes(query);
        const matchType = threat.threatType?.toLowerCase().includes(query);
        const matchPath = threat.path?.toLowerCase().includes(query);
        const matchPayload = threat.offendingPayload?.toLowerCase().includes(query);
        if (!matchIp && !matchType && !matchPath && !matchPayload) return false;
      }

      // Severity
      if (selectedSeverity !== 'ALL' && threat.severity !== selectedSeverity) {
        return false;
      }

      // Category
      if (selectedCategory !== 'ALL' && threat.category !== selectedCategory) {
        return false;
      }

      // Status
      if (statusFilter !== 'ALL' && threat.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [threats, searchQuery, selectedSeverity, selectedCategory, statusFilter]);

  // Handle Simulation Test
  const handleSimulateTest = async (type: 'sql' | 'xss' | 'path_traversal' | 'scanner') => {
    setIsSimulating(true);
    try {
      const res = await simulateThreatAttackTest(type);
      if (res.success) {
        onShowToast(`🛡️ Threat Blocked & Logged: ${res.threat?.threatType || 'Attack Intercepted'}`, 'success');
      } else {
        onShowToast(res.error || 'Failed to trigger test simulation', 'error');
      }
    } catch (err: any) {
      onShowToast(err.message || 'Error executing simulation', 'error');
    } finally {
      setIsSimulating(false);
    }
  };

  // Handle Ban IP
  const handleBanIp = async (ip: string, reason?: string) => {
    const runBan = async () => {
      const ok = await banAttackerIp(ip, reason || 'Blacklisted by administrator');
      if (ok) {
        setBannedIps(prev => Array.from(new Set([...prev, ip])));
        setThreats(prev => prev.map(t => t.ipAddress === ip ? { ...t, status: 'banned_ip' } : t));
        onShowToast(`Attacker IP ${ip} has been permanently blocked by Cyber Shield`, 'success');
        setShowBanModal(false);
        setManualIpInput('');
        setManualIpReason('');
      } else {
        onShowToast('Failed to ban IP address', 'error');
      }
    };

    if (onRequireReAuth) {
      onRequireReAuth(
        `Ban Attacker IP: ${ip}`,
        `This will permanently block all incoming HTTP/HTTPS traffic from IP ${ip} across the entire store.`,
        runBan
      );
    } else {
      await runBan();
    }
  };

  // Handle Unban IP
  const handleUnbanIp = async (ip: string) => {
    const ok = await unbanAttackerIp(ip);
    if (ok) {
      setBannedIps(prev => prev.filter(item => item !== ip));
      setThreats(prev => prev.map(t => t.ipAddress === ip && t.status === 'banned_ip' ? { ...t, status: 'resolved' } : t));
      onShowToast(`IP ${ip} removed from blocklist`, 'success');
    } else {
      onShowToast('Failed to unban IP', 'error');
    }
  };

  // Handle Resolve Single Threat
  const handleResolveThreat = async (threatId: string) => {
    const ok = await resolveSecurityThreatAction(threatId);
    if (ok) {
      setThreats(prev => prev.map(t => t.id === threatId ? { ...t, status: 'resolved' } : t));
      onShowToast('Threat marked as resolved', 'success');
      if (inspectThreat?.id === threatId) {
        setInspectThreat(prev => prev ? { ...prev, status: 'resolved' } : null);
      }
    } else {
      onShowToast('Failed to resolve threat', 'error');
    }
  };

  // Handle Resolve All Threats
  const handleResolveAll = async () => {
    const ok = await resolveSecurityThreatAction(undefined, true);
    if (ok) {
      setThreats(prev => prev.map(t => ({ ...t, status: 'resolved' })));
      onShowToast('All active threats marked resolved', 'success');
    } else {
      onShowToast('Failed to resolve threats', 'error');
    }
  };

  // Helper for Severity Color Badge
  const getSeverityBadge = (severity: ThreatSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
            <Flame className="w-3.5 h-3.5 text-rose-400" /> CRITICAL
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
            <ShieldAlert className="w-3.5 h-3.5 text-yellow-400" /> MEDIUM
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
            <Radio className="w-3.5 h-3.5 text-blue-400" /> LOW
          </span>
        );
    }
  };

  // Helper for Category Label
  const getCategoryBadge = (category: ThreatCategory) => {
    switch (category) {
      case 'SQL_INJECTION':
        return <span className="text-xs font-mono text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/50 flex items-center gap-1"><Database className="w-3 h-3" /> SQL Injection</span>;
      case 'NOSQL_INJECTION':
        return <span className="text-xs font-mono text-fuchsia-300 bg-fuchsia-950/60 px-2 py-0.5 rounded border border-fuchsia-800/50 flex items-center gap-1"><Terminal className="w-3 h-3" /> NoSQL Operator</span>;
      case 'XSS_ATTACK':
        return <span className="text-xs font-mono text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/50 flex items-center gap-1"><Terminal className="w-3 h-3" /> XSS Script</span>;
      case 'PATH_TRAVERSAL':
        return <span className="text-xs font-mono text-red-300 bg-red-950/60 px-2 py-0.5 rounded border border-red-800/50 flex items-center gap-1"><Bug className="w-3 h-3" /> LFI / Traversal</span>;
      case 'VULNERABILITY_SCANNER':
        return <span className="text-xs font-mono text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50 flex items-center gap-1"><Radio className="w-3 h-3" /> Bot Scanner</span>;
      case 'DOS_FLOOD':
        return <span className="text-xs font-mono text-rose-300 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/50 flex items-center gap-1"><Zap className="w-3 h-3" /> DoS / Flood</span>;
      default:
        return <span className="text-xs font-mono text-slate-300 bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700">{category}</span>;
    }
  };

  const activeThreatsCount = threats.filter(t => t.status === 'active').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 1. Main Security Shield Status Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B1528] via-[#0E1E3A] to-[#0A1020] border border-cyan-900/40 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#28B9FF]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              CYBER DEFENSE SHIELD & ANTI-CRASH WAF ARMED
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <ShieldAlert className="w-8 h-8 text-[#28B9FF]" />
              Threat Interceptor & Crash Defense
            </h1>

            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Real-time deep packet inspection protecting Zohaib DigiForge from crashes, DDoS floods, SQL injections, malicious bots, and arbitrary code attacks. Any attack attempt is blocked with HTTP 403 and logged here automatically.
            </p>
          </div>

          {/* Quick Simulation & Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleSimulateTest('sql')}
              disabled={isSimulating}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white font-semibold text-xs transition-all shadow-lg shadow-rose-900/40 active:scale-95 disabled:opacity-50"
              title="Test threat detection live by simulating a safe SQL injection exploit"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {isSimulating ? 'Simulating...' : 'Test SQL Attack'}
            </button>

            <button
              onClick={() => handleSimulateTest('xss')}
              disabled={isSimulating}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/40 text-amber-200 font-semibold text-xs transition-all active:scale-95 disabled:opacity-50"
              title="Test threat detection live by simulating an XSS payload"
            >
              <Terminal className="w-3.5 h-3.5" />
              Test XSS Attack
            </button>

            <button
              onClick={() => handleSimulateTest('scanner')}
              disabled={isSimulating}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/40 text-cyan-200 font-semibold text-xs transition-all active:scale-95 disabled:opacity-50"
              title="Test threat detection live by simulating a vulnerability bot scanner"
            >
              <Radio className="w-3.5 h-3.5" />
              Test Scanner Bot
            </button>

            <button
              onClick={() => setShowBanModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs transition-all active:scale-95"
            >
              <Ban className="w-3.5 h-3.5 text-rose-400" />
              Manage Blacklist ({bannedIps.length})
            </button>
          </div>
        </div>
      </div>

      {/* 2. Real-time Security KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        
        {/* Total Blocked Threats */}
        <div className="bg-[#0B132B]/80 border border-slate-800 rounded-2xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-medium">Total Blocked</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">
            {stats.totalThreatsBlocked}
          </div>
          <div className="text-[11px] text-rose-400/90 mt-1 font-medium flex items-center gap-1">
            <Activity className="w-3 h-3" /> Attacks stopped
          </div>
        </div>

        {/* Critical Exploits */}
        <div className="bg-[#0B132B]/80 border border-slate-800 rounded-2xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-medium">Critical Exploits</span>
            <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-400 mt-2">
            {stats.criticalExploits}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Immediate block
          </div>
        </div>

        {/* SQL & NoSQL Injections */}
        <div className="bg-[#0B132B]/80 border border-slate-800 rounded-2xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-medium">SQL & NoSQL</span>
            <Database className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-300 mt-2">
            {stats.sqlInjectionsBlocked}
          </div>
          <div className="text-[11px] text-purple-400/80 mt-1">
            Database defended
          </div>
        </div>

        {/* XSS & Scripts */}
        <div className="bg-[#0B132B]/80 border border-slate-800 rounded-2xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-medium">XSS & Scripts</span>
            <Terminal className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300 mt-2">
            {stats.xssBlocked}
          </div>
          <div className="text-[11px] text-amber-400/80 mt-1">
            Payloads neutralized
          </div>
        </div>

        {/* Scanners & Recon Bots */}
        <div className="bg-[#0B132B]/80 border border-slate-800 rounded-2xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-medium">Scanners Blocked</span>
            <Radio className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-300 mt-2">
            {stats.scannersBlocked}
          </div>
          <div className="text-[11px] text-cyan-400/80 mt-1">
            Recon probes killed
          </div>
        </div>

        {/* Crash-Proof Server Safeguard */}
        <div className="bg-[#0B132B]/80 border border-emerald-900/40 rounded-2xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-medium">Crash Shield</span>
            <Server className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-black text-emerald-300 mt-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" /> 100% Online
          </div>
          <div className="text-[11px] text-emerald-400/80 mt-1">
            Exception guard active
          </div>
        </div>

      </div>

      {/* 3. Active Threat Alert Banner (if active threats exist) */}
      {activeThreatsCount > 0 && (
        <div className="rounded-2xl bg-rose-950/40 border border-rose-600/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in slide-in-from-top duration-300">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <ShieldAlert className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm flex items-center gap-2">
                <span>{activeThreatsCount} Active Threat Event{activeThreatsCount > 1 ? 's' : ''} Detected</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500 text-white font-black">ACTION REQUIRED</span>
              </h4>
              <p className="text-slate-300 text-xs mt-0.5">
                Malicious requests were intercepted and denied with HTTP 403 Forbidden. Inspect the offending payloads or permanently ban attacker IP addresses below.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleResolveAll}
              className="px-3 py-1.5 rounded-lg bg-rose-800/60 hover:bg-rose-700/80 border border-rose-600/50 text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark All Resolved
            </button>
          </div>
        </div>
      )}

      {/* 4. Controls: Search, Filters, Refresh */}
      <div className="bg-[#0B1528] border border-slate-800 rounded-2xl p-4 space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Attacker IP, Route, Threat Type, or Payload snippet..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-[#28B9FF] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Severity & Category Filters */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Severity Filter */}
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value as any)}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-[#28B9FF]"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical Only</option>
              <option value="HIGH">High Only</option>
              <option value="MEDIUM">Medium Only</option>
              <option value="LOW">Low Only</option>
            </select>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-[#28B9FF]"
            >
              <option value="ALL">All Categories</option>
              <option value="SQL_INJECTION">SQL Injection</option>
              <option value="NOSQL_INJECTION">NoSQL Injection</option>
              <option value="XSS_ATTACK">XSS Script</option>
              <option value="PATH_TRAVERSAL">Path Traversal / LFI</option>
              <option value="VULNERABILITY_SCANNER">Vulnerability Scanners</option>
              <option value="DOS_FLOOD">DoS / Rate Limit Flood</option>
              <option value="SUSPICIOUS_PROBE">Honeypot Probes</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-[#28B9FF]"
            >
              <option value="ALL">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="resolved">Resolved</option>
              <option value="banned_ip">Banned IP</option>
            </select>

            {/* Refresh */}
            <button
              onClick={async () => {
                setIsRefreshing(true);
                // Trigger quick reload
                await new Promise(r => setTimeout(r, 600));
                setIsRefreshing(false);
                onShowToast('Threat feed refreshed from WAF', 'success');
              }}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all"
              title="Refresh Threats"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#28B9FF]' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 5. Live Threats Feed Table / List */}
      <div className="bg-[#0B1528] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-[#28B9FF]" />
            <h3 className="text-white font-bold text-base">
              Live Threat Interceptor Feed
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-xs font-medium">
              {filteredThreats.length} logged
            </span>
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Automatic 403 Interception Enabled
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-[#28B9FF]" />
            <p className="text-sm font-medium">Syncing live cyber defense state...</p>
          </div>
        ) : filteredThreats.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h4 className="text-white font-bold text-base">No Attacks Detected Right Now</h4>
            <p className="text-slate-400 text-xs max-w-md mx-auto mt-1">
              Your storefront is clean, stable, and protected by the crash-proof WAF. Click the <span className="text-rose-400 font-bold">"Test SQL Attack"</span> button above to trigger a live diagnostic simulation!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Severity & Time</th>
                  <th className="py-3 px-4">Threat Type & Vector</th>
                  <th className="py-3 px-4">Attacker IP</th>
                  <th className="py-3 px-4">Target Endpoint</th>
                  <th className="py-3 px-4">Action Taken</th>
                  <th className="py-3 px-4 text-right">Shield Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
                {filteredThreats.map((threat) => {
                  const isBanned = bannedIps.includes(threat.ipAddress) || threat.status === 'banned_ip';
                  const timeFormatted = new Date(threat.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    second: '2-digit' 
                  });
                  const dateFormatted = new Date(threat.timestamp).toLocaleDateString([], { 
                    month: 'short', 
                    day: 'numeric' 
                  });

                  return (
                    <tr 
                      key={threat.id} 
                      className={`hover:bg-slate-900/70 transition-colors ${
                        threat.status === 'active' ? 'bg-rose-950/10' : ''
                      }`}
                    >
                      {/* Severity & Time */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          {getSeverityBadge(threat.severity)}
                          <span className="text-[11px] text-slate-400">
                            {dateFormatted} at {timeFormatted}
                          </span>
                        </div>
                      </td>

                      {/* Threat Type & Category */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="space-y-1">
                          <div className="font-semibold text-white flex items-center gap-2">
                            {threat.threatType}
                          </div>
                          <div>{getCategoryBadge(threat.category)}</div>
                          {threat.offendingPayload && (
                            <div className="font-mono text-[11px] text-rose-300/90 bg-slate-950/80 px-2 py-1 rounded border border-rose-950/50 truncate max-w-xs">
                              {threat.offendingPayload}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Attacker IP */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-mono text-slate-200">
                          <Globe className="w-3.5 h-3.5 text-slate-400" />
                          <span>{threat.ipAddress}</span>
                          <button
                            onClick={() => copyToClipboard(threat.ipAddress, `ip_${threat.id}`)}
                            className="text-slate-400 hover:text-white p-0.5"
                            title="Copy IP"
                          >
                            {copiedKey === `ip_${threat.id}` ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        {isBanned && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 mt-1">
                            <Ban className="w-3 h-3" /> BANNED IP
                          </span>
                        )}
                      </td>

                      {/* Target Endpoint */}
                      <td className="py-3.5 px-4 max-w-[200px]">
                        <div className="font-mono text-[11px] text-cyan-300 truncate">
                          <span className="text-slate-400 font-bold mr-1">{threat.method}</span>
                          {threat.path}
                        </div>
                      </td>

                      {/* Action Taken */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          {threat.actionTaken || 'BLOCKED_403'}
                        </span>
                      </td>

                      {/* Controls */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right space-x-1.5">
                        {/* Inspect Details */}
                        <button
                          onClick={() => setInspectThreat(threat)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold inline-flex items-center gap-1 transition-all"
                          title="View complete attack payload & headers"
                        >
                          <Eye className="w-3 h-3 text-[#28B9FF]" />
                          Inspect
                        </button>

                        {/* Ban / Unban IP */}
                        {isBanned ? (
                          <button
                            onClick={() => handleUnbanIp(threat.ipAddress)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold inline-flex items-center gap-1 transition-all"
                            title="Unban this IP"
                          >
                            <Unlock className="w-3 h-3 text-emerald-400" />
                            Unban
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBanIp(threat.ipAddress, `Threat: ${threat.threatType}`)}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 text-xs font-semibold inline-flex items-center gap-1 transition-all"
                            title="Block this IP address from accessing the site permanently"
                          >
                            <Ban className="w-3 h-3 text-rose-400" />
                            Ban IP
                          </button>
                        )}

                        {/* Mark Resolved */}
                        {threat.status === 'active' && (
                          <button
                            onClick={() => handleResolveThreat(threat.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs inline-flex items-center gap-1 transition-all"
                            title="Mark as reviewed and resolved"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            Resolve
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 6. Modal: Inspect Attack Payload & Headers */}
      {inspectThreat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0B1528] border border-slate-700 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  {getSeverityBadge(inspectThreat.severity)}
                  {getCategoryBadge(inspectThreat.category)}
                </div>
                <h3 className="text-xl font-bold text-white mt-2">
                  {inspectThreat.threatType}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Logged at {new Date(inspectThreat.timestamp).toLocaleString()}
                </p>
              </div>

              <button
                onClick={() => setInspectThreat(null)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Attack Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Attacker IP Address</span>
                <div className="font-mono text-white text-sm flex items-center gap-2">
                  {inspectThreat.ipAddress}
                  <button
                    onClick={() => copyToClipboard(inspectThreat.ipAddress, 'modal_ip')}
                    className="text-slate-400 hover:text-white"
                  >
                    {copiedKey === 'modal_ip' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Action Taken by WAF</span>
                <div className="font-bold text-rose-400 text-sm">
                  {inspectThreat.actionTaken || 'BLOCKED_403'} (Interception Active)
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1 col-span-full">
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Target Method & Route</span>
                <div className="font-mono text-cyan-300 text-xs break-all">
                  <span className="font-bold text-white mr-2">{inspectThreat.method}</span>
                  {inspectThreat.path}
                </div>
              </div>

              {inspectThreat.userAgent && (
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1 col-span-full">
                  <span className="text-slate-400 font-semibold uppercase text-[10px]">Client User-Agent</span>
                  <div className="font-mono text-slate-300 text-xs break-all">
                    {inspectThreat.userAgent}
                  </div>
                </div>
              )}
            </div>

            {/* Offending Malicious Payload Snippet */}
            {inspectThreat.offendingPayload && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5" /> Intercepted Attack Payload
                  </span>
                  <button
                    onClick={() => copyToClipboard(inspectThreat.offendingPayload || '', 'payload')}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    {copiedKey === 'payload' ? (
                      <span className="text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" /> Copied</span>
                    ) : (
                      <span className="flex items-center gap-1"><Copy className="w-3 h-3" /> Copy Payload</span>
                    )}
                  </button>
                </div>
                <pre className="p-4 rounded-xl bg-black border border-rose-900/60 font-mono text-xs text-rose-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {inspectThreat.offendingPayload}
                </pre>
              </div>
            )}

            {/* Details or Explanation */}
            {inspectThreat.details && (
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 space-y-1">
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Threat Intelligence</span>
                <p>{inspectThreat.details}</p>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              {bannedIps.includes(inspectThreat.ipAddress) ? (
                <button
                  onClick={() => handleUnbanIp(inspectThreat.ipAddress)}
                  className="px-4 py-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5"
                >
                  <Unlock className="w-4 h-4" /> Unban IP Address
                </button>
              ) : (
                <button
                  onClick={() => handleBanIp(inspectThreat.ipAddress, `Threat: ${inspectThreat.threatType}`)}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-rose-900/50"
                >
                  <Ban className="w-4 h-4" /> Blacklist Attacker IP
                </button>
              )}

              <div className="flex items-center gap-2">
                {inspectThreat.status === 'active' && (
                  <button
                    onClick={() => handleResolveThreat(inspectThreat.id)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Mark Resolved
                  </button>
                )}
                <button
                  onClick={() => setInspectThreat(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 7. Modal: Manage Blacklisted IPs */}
      {showBanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0B1528] border border-slate-700 rounded-3xl max-w-lg w-full shadow-2xl p-6 space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Ban className="w-5 h-5 text-rose-400" />
                Permanent IP Blacklist ({bannedIps.length})
              </h3>
              <button
                onClick={() => setShowBanModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Add New IP to Blacklist */}
            <div className="space-y-3 bg-slate-900/70 p-4 rounded-2xl border border-slate-800">
              <span className="text-xs font-bold text-white">Add Suspect IP to Blacklist</span>
              <div className="space-y-2">
                <input
                  type="text"
                  value={manualIpInput}
                  onChange={(e) => setManualIpInput(e.target.value)}
                  placeholder="e.g. 192.168.1.100"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
                />
                <input
                  type="text"
                  value={manualIpReason}
                  onChange={(e) => setManualIpReason(e.target.value)}
                  placeholder="Reason (e.g. Malicious credential stuffing)"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
                />
                <button
                  onClick={() => {
                    if (manualIpInput.trim()) {
                      handleBanIp(manualIpInput.trim(), manualIpReason.trim());
                    }
                  }}
                  disabled={!manualIpInput.trim()}
                  className="w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all disabled:opacity-50"
                >
                  Block This IP Address
                </button>
              </div>
            </div>

            {/* Currently Banned IPs List */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Currently Blocked IP Addresses
              </span>

              {bannedIps.length === 0 ? (
                <p className="text-xs text-slate-500 py-3 text-center">
                  No IPs are currently blacklisted.
                </p>
              ) : (
                <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                  {bannedIps.map((bannedIp) => (
                    <div 
                      key={bannedIp}
                      className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs font-mono"
                    >
                      <div className="flex items-center gap-2 text-rose-300">
                        <Lock className="w-3.5 h-3.5 text-rose-400" />
                        <span>{bannedIp}</span>
                      </div>

                      <button
                        onClick={() => handleUnbanIp(bannedIp)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-sans transition-all"
                      >
                        Unban
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowBanModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

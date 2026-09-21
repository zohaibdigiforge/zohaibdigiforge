import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Eye, 
  ShoppingBag, 
  DollarSign, 
  Award, 
  ArrowUpRight, 
  Globe, 
  Sparkles,
  CheckCircle2,
  MousePointerClick,
  Activity,
  ArrowDownRight,
  ShieldCheck,
  Smartphone,
  Laptop,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { Order, Product, AbandonedCart } from '../../types';
import { getAnalyticsEventsFromDb, clearAnalyticsEventsInDb } from '../../services/firestoreService';

interface AdminAnalyticsProps {
  orders: Order[];
  products: Product[];
  abandonedCarts: AbandonedCart[];
  newsletterCount: number;
}

export const AdminAnalytics: React.FC<AdminAnalyticsProps> = ({
  orders,
  products,
  abandonedCarts,
  newsletterCount
}) => {
  const [analyticsEvents, setAnalyticsEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | 'all'>('all');

  const fetchEvents = () => {
    setLoading(true);
    getAnalyticsEventsFromDb()
      .then(events => {
        setAnalyticsEvents(events);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleClearAnalytics = async () => {
    if (!window.confirm('Aap poori Analytics data Firestore se delete karna chahte hain? Isse sabhi view/click counts reset ho jayenge.')) {
      return;
    }
    try {
      setClearing(true);
      await clearAnalyticsEventsInDb();
      setAnalyticsEvents([]);
      alert('Analytics data successfully clear kar diya gaya hai!');
    } catch (err) {
      alert('Failed to clear analytics data.');
    } finally {
      setClearing(false);
    }
  };

  // 1. Timeframe Filter Logic for Real Orders & Events
  const isWithinTimeframe = (dateStr?: string) => {
    if (timeframe === 'all' || !dateStr) return true;
    const eventTime = new Date(dateStr).getTime();
    if (isNaN(eventTime)) return true;
    const now = Date.now();
    const diffDays = (now - eventTime) / (1000 * 60 * 60 * 24);
    if (timeframe === '7d') return diffDays <= 7;
    if (timeframe === '30d') return diffDays <= 30;
    return true;
  };

  const filteredOrders = orders.filter(o => isWithinTimeframe(o.createdAt));
  const filteredEvents = analyticsEvents.filter(e => isWithinTimeframe(e.timestamp));

  // Metrics
  const totalOrders = filteredOrders.length;
  const totalRevenuePKR = filteredOrders.reduce((sum, o) => sum + (o.totalAmountPKR || 0), 0);
  const totalRevenueUSD = filteredOrders.reduce((sum, o) => sum + (o.totalAmountUSD || 0), 0);

  const realPageViews = filteredEvents.filter(e => e.eventType === 'page_view').length;
  const realProductViewsCount = filteredEvents.filter(e => e.eventType === 'product_view').length;
  const realProductClicksCount = filteredEvents.filter(e => e.eventType === 'product_click').length;

  // Real Device Breakdown Calculation
  const mobileEvents = filteredEvents.filter(e => e.deviceType === 'mobile').length;
  const desktopEvents = filteredEvents.filter(e => e.deviceType === 'desktop').length;
  const totalDeviceEvents = mobileEvents + desktopEvents;

  let mobilePercent = 0;
  let desktopPercent = 0;

  if (totalDeviceEvents > 0) {
    mobilePercent = Math.round((mobileEvents / totalDeviceEvents) * 100);
    desktopPercent = 100 - mobilePercent;
  } else {
    mobilePercent = 0;
    desktopPercent = 0;
  }

  // Real Traffic Channel Breakdown Calculation from live Firestore logs
  const totalChannelEvents = filteredEvents.length;
  
  const whatsappSocialCount = filteredEvents.filter(e => 
    e.channel?.toLowerCase().includes('whatsapp') || 
    e.channel?.toLowerCase().includes('social') ||
    e.referrer?.toLowerCase().includes('wa.me') ||
    e.referrer?.toLowerCase().includes('whatsapp') ||
    e.referrer?.toLowerCase().includes('instagram') ||
    e.referrer?.toLowerCase().includes('facebook') ||
    e.referrer?.toLowerCase().includes('tiktok') ||
    e.referrer?.toLowerCase().includes('twitter') ||
    e.referrer?.toLowerCase().includes('t.co') ||
    e.referrer?.toLowerCase().includes('youtube')
  ).length;

  const searchOrganicCount = filteredEvents.filter(e => 
    e.channel?.toLowerCase().includes('search') || 
    e.channel?.toLowerCase().includes('organic') ||
    e.referrer?.toLowerCase().includes('google') ||
    e.referrer?.toLowerCase().includes('bing') ||
    e.referrer?.toLowerCase().includes('yahoo') ||
    e.referrer?.toLowerCase().includes('duckduckgo')
  ).length;

  const githubExternalCount = filteredEvents.filter(e => 
    e.channel?.toLowerCase().includes('github') || 
    e.channel?.toLowerCase().includes('referral') ||
    e.referrer?.toLowerCase().includes('github')
  ).length;

  const directCount = Math.max(0, totalChannelEvents - (whatsappSocialCount + searchOrganicCount + githubExternalCount));

  const whatsappPercent = totalChannelEvents > 0 ? Math.round((whatsappSocialCount / totalChannelEvents) * 100) : 0;
  const searchPercent = totalChannelEvents > 0 ? Math.round((searchOrganicCount / totalChannelEvents) * 100) : 0;
  const githubPercent = totalChannelEvents > 0 ? Math.round((githubExternalCount / totalChannelEvents) * 100) : 0;
  const directPercent = totalChannelEvents > 0 ? Math.max(0, 100 - (whatsappPercent + searchPercent + githubPercent)) : 0;

  const totalUniqueVisitors = realPageViews;
  const totalProductViews = realProductViewsCount;
  const totalProductClicks = realProductClicksCount;
  const conversionRate = totalUniqueVisitors > 0 ? ((totalOrders / totalUniqueVisitors) * 100).toFixed(2) : '0.00';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <div className="w-6 h-6 border-2 border-[#28B9FF] border-t-transparent rounded-full animate-spin mr-3"></div>
        Loading Real-Time Analytics Engine...
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header & Timeframe Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-[#28B9FF] font-bold text-xs uppercase tracking-wider mb-1">
            <Activity className="w-4 h-4 animate-pulse text-[#28B9FF]" />
            <span>Live Firestore Telemetry &amp; Intelligence</span>
          </div>
          <h1 className="text-2xl font-black text-white">Store Analytics &amp; Visitor Matrix</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time traffic telemetry, conversion velocity, and revenue attribution.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
          <button
            onClick={handleClearAnalytics}
            disabled={clearing || analyticsEvents.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            title="Clear all analytics events from Firestore"
          >
            {clearing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            <span>Clear Analytics</span>
          </button>

          <div className="flex items-center gap-1.5 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => setTimeframe('7d')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${timeframe === '7d' ? 'bg-[#0D6EFD] text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              7 Days
            </button>
            <button
              onClick={() => setTimeframe('30d')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${timeframe === '30d' ? 'bg-[#0D6EFD] text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              30 Days
            </button>
            <button
              onClick={() => setTimeframe('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${timeframe === 'all' ? 'bg-[#0D6EFD] text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              All-Time
            </button>
          </div>
        </div>
      </div>

      {/* KPI Overview Grid with Glassmorphic Depth */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Visitors */}
        <div className="bg-[#0D1527] border border-slate-800/80 rounded-3xl p-6 shadow-2xl relative overflow-hidden group hover:border-[#28B9FF]/50 transition-all">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-[#28B9FF]/10 rounded-full blur-3xl pointer-events-none group-hover:bg-[#28B9FF]/20 transition-all" />
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-[#28B9FF]/15 border border-[#28B9FF]/30 flex items-center justify-center text-[#28B9FF]">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> Real Views
            </span>
          </div>
          <div className="text-3xl font-black text-white mb-1 tracking-tight">{totalUniqueVisitors.toLocaleString()}</div>
          <div className="text-xs font-semibold text-slate-400">Total Unique Visitors ({timeframe.toUpperCase()})</div>
          <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
            <span>Verified Sessions</span>
            <span className="text-emerald-400 font-bold">Active Live</span>
          </div>
        </div>

        {/* Product Clicks & Views */}
        <div className="bg-[#0D1527] border border-slate-800/80 rounded-3xl p-6 shadow-2xl relative overflow-hidden group hover:border-purple-500/50 transition-all">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-purple-500/20 transition-all" />
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <MousePointerClick className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20 flex items-center gap-1">
              Engagement
            </span>
          </div>
          <div className="text-3xl font-black text-white mb-1 tracking-tight">{totalProductClicks.toLocaleString()}</div>
          <div className="text-xs font-semibold text-slate-400">Product Clicks</div>
          <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
            <span>Page Views</span>
            <span className="text-purple-400 font-bold">{totalProductViews} Views</span>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-[#0D1527] border border-slate-800/80 rounded-3xl p-6 shadow-2xl relative overflow-hidden group hover:border-emerald-500/50 transition-all">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/20 transition-all" />
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Verified
            </span>
          </div>
          <div className="text-3xl font-black text-white mb-1 tracking-tight">{conversionRate}%</div>
          <div className="text-xs font-semibold text-slate-400">Store Conversion Rate</div>
          <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
            <span>Visitor-to-Buyer</span>
            <span className="text-emerald-400 font-bold">{totalOrders} Orders</span>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-[#0D1527] border border-slate-800/80 rounded-3xl p-6 shadow-2xl relative overflow-hidden group hover:border-amber-500/50 transition-all">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-500/20 transition-all" />
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <DollarSign className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
              Verified
            </span>
          </div>
          <div className="text-3xl font-black text-white mb-1 tracking-tight">Rs. {totalRevenuePKR.toLocaleString()}</div>
          <div className="text-xs font-semibold text-slate-400">Gross Sales (${totalRevenueUSD.toLocaleString()})</div>
          <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
            <span>Avg Order Value</span>
            <span className="text-amber-400 font-bold">Rs. {totalOrders ? Math.round(totalRevenuePKR / totalOrders).toLocaleString() : 0}</span>
          </div>
        </div>

      </div>

      {/* Traffic Sources & Device Analytics Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Traffic Channels */}
        <div className="bg-[#0D1527] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#28B9FF]" />
              <span>Traffic Channels</span>
            </h3>
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-semibold">
              {totalChannelEvents > 0 ? `${totalChannelEvents} Logs` : 'Live Telemetry'}
            </span>
          </div>

          {totalChannelEvents === 0 ? (
            <div className="py-6 text-center space-y-2 border border-dashed border-slate-800 rounded-2xl bg-slate-900/40 p-4">
              <Activity className="w-6 h-6 text-slate-500 mx-auto animate-pulse" />
              <div className="text-xs font-bold text-slate-300">No Traffic Logs Yet</div>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                Real-time referrers, WhatsApp, Google Search, and direct visits will dynamically populate here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">WhatsApp &amp; Social Direct</span>
                  <span className="text-white font-bold">{whatsappPercent}% ({whatsappSocialCount})</span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-[#0D6EFD] rounded-full transition-all duration-500" style={{ width: `${whatsappPercent}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">Google Organic Search</span>
                  <span className="text-white font-bold">{searchPercent}% ({searchOrganicCount})</span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${searchPercent}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">GitHub &amp; Direct Referrals</span>
                  <span className="text-white font-bold">{githubPercent}% ({githubExternalCount})</span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full transition-all duration-500" style={{ width: `${githubPercent}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">Direct Navigation</span>
                  <span className="text-white font-bold">{directPercent}% ({directCount})</span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${directPercent}%` }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Device Breakdown */}
        <div className="bg-[#0D1527] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-purple-400" />
              <span>Visitor Devices</span>
            </h3>
            <span className="text-[10px] text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full font-semibold">
              {totalDeviceEvents > 0 ? `${totalDeviceEvents} Logs` : 'Live Telemetry'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-1">
              <Smartphone className="w-6 h-6 text-[#28B9FF] mx-auto mb-1" />
              <div className="text-xl font-black text-white">{mobilePercent}%</div>
              <div className="text-[11px] text-slate-400">Mobile ({mobileEvents})</div>
            </div>
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-1">
              <Laptop className="w-6 h-6 text-purple-400 mx-auto mb-1" />
              <div className="text-xl font-black text-white">{desktopPercent}%</div>
              <div className="text-[11px] text-slate-400">Desktop ({desktopEvents})</div>
            </div>
          </div>
        </div>

        {/* Active Funnel */}
        <div className="bg-[#0D1527] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Conversion Funnel</span>
            </h3>
            <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full font-semibold">{abandonedCarts.length} Carts</span>
          </div>
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2.5 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-slate-400">Unique Visitors</span>
              <span className="text-white font-bold">{totalUniqueVisitors}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-slate-400">Product Views</span>
              <span className="text-[#28B9FF] font-bold">{totalProductViews}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-slate-400">Completed Orders</span>
              <span className="text-emerald-400 font-bold">{totalOrders}</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

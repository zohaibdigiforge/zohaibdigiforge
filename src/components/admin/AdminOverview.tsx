import React from 'react';
import { 
  Package, 
  TrendingUp, 
  Star, 
  Mail, 
  ShoppingCart, 
  BarChart3, 
  ArrowRight, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';
import { Order, NewsletterSubscriber, AbandonedCart } from '../../types';

interface AdminOverviewProps {
  orders: Order[];
  newsletterCount: number;
  abandonedCarts: AbandonedCart[];
  onNavigateTab: (tab: string, filter?: string) => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({
  orders,
  newsletterCount,
  abandonedCarts,
  onNavigateTab
}) => {
  // Compute real KPI metrics from live Firestore state
  const pendingOrders = orders.filter(o => o.status === 'Pending Verification');
  
  // Today's revenue calculation
  const todayStr = new Date().toISOString().split('T')[0];
  const todayOrders = orders.filter(o => o.createdAt && o.createdAt.startsWith(todayStr));
  const todayRevenuePKR = todayOrders.reduce((sum, o) => sum + (o.totalAmountPKR || 0), 0);

  // Active Abandoned Carts
  const activeAbandonedCarts = abandonedCarts.filter(c => c.status === 'abandoned' || !c.status);

  // Completed Orders
  const completedOrders = orders.filter(o => 
    o.status === 'Completed' || o.status === 'Access Delivered' || o.status === 'Payment Verified'
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Banner / Welcome Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0D1527] via-[#102242] to-[#0A0F1D] border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#28B9FF]/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Real-Time Command Center Active
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Store Engine Online</span>
              </div>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Zohaib DigiForge Store Overview
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Live metrics powered by real Firestore collections. Click any KPI card below to navigate directly to its module with pre-applied filters.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="py-2.5 px-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-right">
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Total Lifetime Orders</div>
              <div className="text-lg font-black text-[#28B9FF]">{orders.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid - Maximum 6 Cards per Dashboard Research */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* KPI 1: Pending Orders */}
        <div
          onClick={() => onNavigateTab('orders', 'Pending Verification')}
          className="group relative p-6 rounded-3xl bg-slate-900/90 border border-amber-500/30 hover:border-amber-400/80 transition-all cursor-pointer shadow-xl hover:-translate-y-1"
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <Clock className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-amber-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
              <span>View Orders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="mt-4 space-y-1">
            <div className="text-3xl font-black text-white flex items-center gap-2">
              <span>{pendingOrders.length}</span>
              {pendingOrders.length > 0 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Action Needed
                </span>
              )}
            </div>
            <div className="text-xs font-semibold text-slate-300">Pending Orders</div>
            <p className="text-[11px] text-slate-400">Awaiting payment verification or download dispatch</p>
          </div>
        </div>

        {/* KPI 2: Today's Revenue */}
        <div
          onClick={() => onNavigateTab('orders', 'today')}
          className="group relative p-6 rounded-3xl bg-slate-900/90 border border-emerald-500/30 hover:border-emerald-400/80 transition-all cursor-pointer shadow-xl hover:-translate-y-1"
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-[#22C55E] group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-[#22C55E] group-hover:translate-x-1 transition-transform flex items-center gap-1">
              <span>Today&apos;s Revenue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="mt-4 space-y-1">
            <div className="text-3xl font-black text-white">
              Rs. {todayRevenuePKR.toLocaleString()}
            </div>
            <div className="text-xs font-semibold text-slate-300">Today&apos;s Sales Volume</div>
            <p className="text-[11px] text-slate-400">{todayOrders.length} new orders placed today</p>
          </div>
        </div>

        {/* KPI 3: Completed Deliveries */}
        <div
          onClick={() => onNavigateTab('orders', 'Completed')}
          className="group relative p-6 rounded-3xl bg-slate-900/90 border border-[#28B9FF]/30 hover:border-[#28B9FF]/80 transition-all cursor-pointer shadow-xl hover:-translate-y-1"
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-[#0D6EFD]/15 border border-[#0D6EFD]/30 flex items-center justify-center text-[#28B9FF] group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-[#28B9FF] group-hover:translate-x-1 transition-transform flex items-center gap-1">
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="mt-4 space-y-1">
            <div className="text-3xl font-black text-white flex items-center gap-2">
              <span>{completedOrders.length}</span>
              {completedOrders.length > 0 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  Delivered
                </span>
              )}
            </div>
            <div className="text-xs font-semibold text-slate-300">Completed Orders</div>
            <p className="text-[11px] text-slate-400">Verified and delivered access codes</p>
          </div>
        </div>

        {/* KPI 4: Newsletter Subscribers */}
        <div
          onClick={() => onNavigateTab('newsletter')}
          className="group relative p-6 rounded-3xl bg-slate-900/90 border border-purple-500/30 hover:border-purple-400/80 transition-all cursor-pointer shadow-xl hover:-translate-y-1"
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
              <Mail className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-purple-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
              <span>List &amp; Broadcast</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="mt-4 space-y-1">
            <div className="text-3xl font-black text-white">
              {newsletterCount}
            </div>
            <div className="text-xs font-semibold text-slate-300">Newsletter Subscribers</div>
            <p className="text-[11px] text-slate-400">Real Firestore list ready for email campaigns</p>
          </div>
        </div>

        {/* KPI 5: Abandoned Carts */}
        <div
          onClick={() => onNavigateTab('checkout', 'abandoned')}
          className="group relative p-6 rounded-3xl bg-slate-900/90 border border-rose-500/30 hover:border-rose-400/80 transition-all cursor-pointer shadow-xl hover:-translate-y-1"
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-rose-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
              <span>Recover Revenue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="mt-4 space-y-1">
            <div className="text-3xl font-black text-white">
              {activeAbandonedCarts.length}
            </div>
            <div className="text-xs font-semibold text-slate-300">Abandoned Carts</div>
            <p className="text-[11px] text-slate-400">Carts created but not converted to orders</p>
          </div>
        </div>

        {/* KPI 6: Store Analytics */}
        <div
          onClick={() => onNavigateTab('analytics')}
          className="group relative p-6 rounded-3xl bg-slate-900/90 border border-cyan-500/30 hover:border-cyan-400/80 transition-all cursor-pointer shadow-xl hover:-translate-y-1"
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-cyan-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
              <span>View Analytics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="mt-4 space-y-1">
            <div className="text-3xl font-black text-white">
              {completedOrders.length}
            </div>
            <div className="text-xs font-semibold text-slate-300">Completed Orders</div>
            <p className="text-[11px] text-slate-400">View detailed conversion and performance metrics</p>
          </div>
        </div>

      </div>

      {/* Recent Orders Quick Preview */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Latest Real Orders</h3>
            <p className="text-xs text-slate-400">Most recent customer transactions from Firestore</p>
          </div>
          <button
            onClick={() => onNavigateTab('orders')}
            className="text-xs font-bold text-[#28B9FF] hover:underline flex items-center gap-1"
          >
            <span>View All Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            No orders placed yet. Orders will appear here live when placed.
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#28B9FF]">#{order.id.slice(-6)}</span>
                    <span className="text-xs font-semibold text-white truncate">{order.customerName}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate mt-0.5">
                    {order.items?.map(i => i.title).join(', ') || 'Digital Resource'}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-white">Rs. {order.totalAmountPKR?.toLocaleString()}</div>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mt-0.5 ${
                    order.status === 'Completed' || order.status === 'Access Delivered'
                      ? 'bg-emerald-500/20 text-[#22C55E]'
                      : order.status === 'Payment Verified'
                      ? 'bg-blue-500/20 text-[#28B9FF]'
                      : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

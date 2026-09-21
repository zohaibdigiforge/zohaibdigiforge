import React, { useState } from 'react';
import { Order, ServiceInquiry } from '../types';
import { 
  X, 
  Search, 
  ShieldCheck, 
  Download, 
  CheckCircle2, 
  Clock, 
  PhoneCall, 
  ExternalLink,
  Star,
  Sparkles,
  MessageSquarePlus,
  ArrowRight,
  Code2,
  Calendar,
  Layers
} from 'lucide-react';
import { trackOrderFromDb, trackServiceInquiryDb } from '../services/firestoreService';

interface OrderTrackerModalProps {
  initialOrder?: Order | null;
  onClose: () => void;
}

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({
  initialOrder,
  onClose
}) => {
  const [searchTerm, setSearchTerm] = useState(initialOrder ? initialOrder.id : '');
  const [order, setOrder] = useState<Order | null>(initialOrder || null);
  const [serviceInquiry, setServiceInquiry] = useState<ServiceInquiry | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm) return;

    setIsSearching(true);
    setSearched(true);
    setOrder(null);
    setServiceInquiry(null);

    const cleanTerm = searchTerm.trim();

    // If query starts with SRV- or user is searching custom project
    if (cleanTerm.toUpperCase().startsWith('SRV-')) {
      const srvResult = await trackServiceInquiryDb(cleanTerm);
      if (srvResult) {
        setServiceInquiry(srvResult);
        setIsSearching(false);
        return;
      }
    }

    // Try store order search first
    const orderResult = await trackOrderFromDb(cleanTerm);
    if (orderResult) {
      setOrder(orderResult);
      setIsSearching(false);
      return;
    }

    // Try service inquiry fallback if not found in orders
    const srvResult = await trackServiceInquiryDb(cleanTerm);
    if (srvResult) {
      setServiceInquiry(srvResult);
    }

    setIsSearching(false);
  };

  const isDelivered = order && (order.status === 'Access Delivered' || order.status === 'Completed' || order.status === 'Payment Verified');

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative my-8">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors z-10 cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-[#0D6EFD]/20 text-[#28B9FF] border border-[#0D6EFD]/30">
              Live Fulfillment &amp; Project Lookup
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-white">
            Track Order &amp; Custom Project
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Enter your Order ID (<span className="text-white font-mono">ZDF-884920</span>), Service Quote Ref (<span className="text-[#38BDF8] font-mono">SRV-123456</span>), or WhatsApp number to track status in real-time.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              required
              placeholder="e.g. ZDF-121738, SRV-892104, or 03406070632"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#0D6EFD]"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#0D6EFD] to-[#28B9FF] hover:opacity-90 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shadow-lg shadow-blue-500/20"
          >
            {isSearching ? 'Searching...' : 'Track Now'}
          </button>
        </form>

        {/* Custom Service Project Result Card */}
        {serviceInquiry ? (
          <div className="space-y-5 text-xs">
            
            {/* Status Header */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-amber-400 text-[10px] uppercase font-bold tracking-wider block">Custom Service Inquiry</span>
                <span className="font-extrabold text-sm text-white font-mono">{serviceInquiry.id}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 text-[11px] block">Project Status</span>
                <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] border inline-flex items-center gap-1.5 ${
                  serviceInquiry.status === 'Completed'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : serviceInquiry.status === 'In Progress'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                    : serviceInquiry.status === 'Quoted'
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{serviceInquiry.status}</span>
                </span>
              </div>
            </div>

            {/* Project Milestones Visual Timeline */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
              <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#28B9FF]" />
                <span>Project Progression Roadmap</span>
              </h4>
              
              <div className="space-y-3 pl-2.5 border-l-2 border-[#0D6EFD]">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-white font-bold block">1. Scope &amp; Specifications Received</span>
                    <span className="text-[11px] text-slate-400">Category: {serviceInquiry.serviceType}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${
                    ['Contacted', 'Quoted', 'In Progress', 'Completed'].includes(serviceInquiry.status)
                      ? 'text-[#22C55E]'
                      : 'text-slate-600'
                  }`} />
                  <div>
                    <span className={`block font-bold ${
                      ['Contacted', 'Quoted', 'In Progress', 'Completed'].includes(serviceInquiry.status)
                        ? 'text-white'
                        : 'text-slate-500'
                    }`}>2. Architecture &amp; Quote Review</span>
                    <span className="text-[11px] text-slate-400">Estimated Budget: {serviceInquiry.budgetRange}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${
                    ['In Progress', 'Completed'].includes(serviceInquiry.status)
                      ? 'text-[#22C55E]'
                      : 'text-slate-600'
                  }`} />
                  <div>
                    <span className={`block font-bold ${
                      ['In Progress', 'Completed'].includes(serviceInquiry.status)
                        ? 'text-white'
                        : 'text-slate-500'
                    }`}>3. Engineering &amp; Development</span>
                    <span className="text-[11px] text-slate-400">Timeline Target: {serviceInquiry.timeline}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${
                    serviceInquiry.status === 'Completed' ? 'text-[#22C55E]' : 'text-slate-600'
                  }`} />
                  <div>
                    <span className={`block font-bold ${
                      serviceInquiry.status === 'Completed' ? 'text-emerald-400' : 'text-slate-500'
                    }`}>4. Final Delivery &amp; Deployment</span>
                    <span className="text-[11px] text-slate-400">Full source code &amp; production deployment</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Scope / Admin Notes Card */}
            <div className="p-4 rounded-xl bg-[#0D1527] border border-slate-800 space-y-2">
              <span className="text-[11px] font-bold text-[#28B9FF] uppercase tracking-wider block">
                📋 Project Description &amp; Scope
              </span>
              <p className="text-slate-300 text-xs leading-relaxed line-clamp-3">
                {serviceInquiry.projectDescription}
              </p>
              {serviceInquiry.adminNotes && (
                <div className="mt-3 p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] font-bold text-amber-400 block mb-1">Founder Engineering Note:</span>
                  <p className="text-slate-300 text-xs">{serviceInquiry.adminNotes}</p>
                </div>
              )}
            </div>

            {/* Direct WhatsApp Callout */}
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs">
              <span className="text-emerald-300 font-medium">Discuss project with lead engineer:</span>
              <a
                href={`https://wa.me/923406070632?text=${encodeURIComponent(`Hi Zohaib DigiForge! I am tracking Custom Service Inquiry ${serviceInquiry.id} for ${serviceInquiry.serviceType}.`)}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-[#22C55E] hover:bg-emerald-600 text-slate-950 font-bold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <PhoneCall className="w-3.5 h-3.5" /> WhatsApp Support
              </a>
            </div>

          </div>
        ) : order ? (
          <div className="space-y-6 text-xs">
            
            {/* Status Header */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-[11px] block">Order ID</span>
                <span className="font-extrabold text-sm text-white font-mono">{order.id}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 text-[11px] block">Status</span>
                <span className="px-2.5 py-1 rounded-full bg-[#22C55E]/20 text-[#22C55E] font-bold text-[11px] border border-[#22C55E]/30 inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {order.status}
                </span>
              </div>
            </div>

            {/* 3-Step Timeline */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <h4 className="font-bold text-white text-xs">Fulfillment Timeline</h4>
              
              <div className="space-y-3 pl-2 border-l-2 border-[#22C55E]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0" />
                  <span className="text-slate-200 font-medium">Order Placed ({order.items[0]?.title})</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0" />
                  <span className="text-slate-200 font-medium">Payment Verified ({order.paymentMethod})</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0" />
                  <span className="text-[#22C55E] font-bold">Instant Download Links Active</span>
                </div>
              </div>
            </div>

            {/* Access Download Links */}
            <div className="p-4 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/30 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-[#22C55E]" />
                  <span>Your Delivered Access Links</span>
                </h4>
                <span className="text-[10px] text-[#22C55E] font-semibold">Ready to Download</span>
              </div>

              {order.downloadLinks && order.downloadLinks.length > 0 ? (
                <div className="space-y-2">
                  {order.downloadLinks.map((link, idx) => (
                    <a
                      key={idx}
                      href={link}
                      target="_blank"
                      rel="noreferrer"
                      className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-[#22C55E] text-slate-200 hover:text-white font-medium text-xs flex items-center justify-between transition-all group"
                    >
                      <span className="truncate pr-2">Access Resource Link #{idx + 1}</span>
                      <ExternalLink className="w-4 h-4 text-[#22C55E] group-hover:scale-110 transition-transform" />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-xs">Your access code has been dispatched to your WhatsApp ({order.whatsapp}).</p>
              )}
            </div>

            {/* Direct WhatsApp Confirmation Callout */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-[11px] text-slate-300">
              <span>Need help or replacement link?</span>
              <a
                href={`https://wa.me/923406070632?text=Hi%20Zohaib%20DigiForge!%20I%20need%20help%20with%20Order%20${order.id}`}
                target="_blank"
                rel="noreferrer"
                className="text-[#22C55E] font-bold flex items-center gap-1 hover:underline"
              >
                <PhoneCall className="w-3.5 h-3.5" /> WhatsApp Support
              </a>
            </div>

          </div>
        ) : searched ? (
          <div className="py-8 text-center space-y-2 bg-slate-950 rounded-2xl border border-slate-800">
            <Clock className="w-8 h-8 text-amber-400 mx-auto" />
            <p className="text-white font-semibold text-xs">No active order or custom service found for &quot;{searchTerm}&quot;.</p>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
              Please check your Reference ID (e.g. ZDF-121738 or SRV-892104) or contact founder support directly on WhatsApp (03406070632).
            </p>
          </div>
        ) : null}

        {/* Bottom Close Button */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs transition-all cursor-pointer text-center"
          >
            Close Tracker
          </button>
        </div>

      </div>
    </div>
  );
};

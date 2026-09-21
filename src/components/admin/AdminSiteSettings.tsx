import React, { useState, useEffect } from 'react';
import { Tag, DollarSign, Save, AlertTriangle, Sparkles, CheckCircle2, RefreshCw, Trash2, ShieldCheck, ArrowRight, Mail, Send, AlertCircle, KeyRound, ExternalLink, HelpCircle, Wrench, Edit3 } from 'lucide-react';
import { usePricing } from '../../context/PricingContext';
import { Product } from '../../types';
import { saveProductToDb, getProductsFromDb } from '../../services/firestoreService';
import { PRO_TOOLS_DATA } from '../../data/mockData';

interface AdminSiteSettingsProps {
  products?: Product[];
  onRefreshData?: () => void;
  onShowToast: (message: string, type?: 'success' | 'error') => void;
  onNavigateTab?: (tab: string) => void;
}

export const AdminSiteSettings: React.FC<AdminSiteSettingsProps> = ({ products, onRefreshData, onShowToast, onNavigateTab }) => {
  const { flatPricePKR, flatPriceUSD, pricing, updatePricing, cleanUpLegacyPrices } = usePricing();

  const [pkrInput, setPkrInput] = useState<number>(flatPricePKR);
  const [usdInput, setUsdInput] = useState<number>(flatPriceUSD);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);

  // Category 6 Pro Tools live price management states
  const [proToolsList, setProToolsList] = useState<Product[]>([]);
  const [proToolPrices, setProToolPrices] = useState<Record<string, { pkr: number; usd: number }>>({});
  const [savingToolId, setSavingToolId] = useState<string | null>(null);

  // Email diagnostic states
  const [testEmail, setTestEmail] = useState('zohaibdigiforge@gmail.com');
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  // Sync inputs with live pricing
  useEffect(() => {
    setPkrInput(flatPricePKR);
    setUsdInput(flatPriceUSD);
  }, [flatPricePKR, flatPriceUSD]);

  // Load and sync Category 6 pro tools
  useEffect(() => {
    const list = (products && products.length > 0)
      ? products.filter(p => p.categoryId === 'pro-tools')
      : PRO_TOOLS_DATA;

    setProToolsList(list);

    const initialPrices: Record<string, { pkr: number; usd: number }> = {};
    list.forEach(item => {
      const pkr = item.pricePKR || 499;
      const rate = flatPricePKR || 279;
      const usd = item.priceUSD || Number((pkr / rate).toFixed(2));
      initialPrices[item.id] = { pkr, usd };
    });
    setProToolPrices(initialPrices);
  }, [products, flatPricePKR]);

  const handleUpdateProToolPrice = async (tool: Product) => {
    const prices = proToolPrices[tool.id];
    if (!prices || prices.pkr <= 0) {
      onShowToast('Please enter a valid price in PKR.', 'error');
      return;
    }

    setSavingToolId(tool.id);
    try {
      const updatedProduct: Product = {
        ...tool,
        pricePKR: prices.pkr,
        priceUSD: prices.usd,
        updatedAt: new Date().toISOString()
      };

      await saveProductToDb(updatedProduct);
      onShowToast(`Updated ${tool.title} rate to Rs. ${prices.pkr} / $${prices.usd}!`, 'success');
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error('Failed to update Pro Tool rate:', err);
      onShowToast('Failed to save price to Firestore.', 'error');
    } finally {
      setSavingToolId(null);
    }
  };

  const hasChanges = pkrInput !== flatPricePKR || usdInput !== flatPriceUSD;

  const handleTestEmailDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail || !testEmail.includes('@')) {
      onShowToast('Please enter a valid recipient email.', 'error');
      return;
    }

    setIsTestingEmail(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/notifications/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetEmail: testEmail.trim() })
      });

      const data = await response.json();
      setTestResult(data);

      if (data.success && data.liveDelivered) {
        onShowToast(`Test email successfully sent to ${testEmail}!`, 'success');
      } else if (data.status === 'CONFIG_REQUIRED') {
        onShowToast('Gmail App Password required in settings to deliver live emails.', 'error');
      } else {
        onShowToast(data.error || 'SMTP delivery issue detected.', 'error');
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        liveDelivered: false,
        error: err.message || 'Failed to connect to backend test endpoint'
      });
      onShowToast('Network error testing email dispatch.', 'error');
    } finally {
      setIsTestingEmail(false);
    }
  };

  const handleSaveClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (pkrInput <= 0 || usdInput <= 0) {
      onShowToast('Price values must be greater than zero.', 'error');
      return;
    }
    setIsConfirmModalOpen(true);
  };

  const handleConfirmSave = async () => {
    setIsSaving(true);
    try {
      await updatePricing(Number(pkrInput), Number(usdInput));
      onShowToast(`Global flat price updated to Rs. ${pkrInput} / $${usdInput} across the entire site!`, 'success');
      setIsConfirmModalOpen(false);
    } catch (err) {
      onShowToast('Failed to save global pricing settings.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCleanUpLegacy = async () => {
    if (!window.confirm('Are you sure you want to clean up legacy price fields from all product documents in Firestore?')) {
      return;
    }
    setIsCleaning(true);
    try {
      const count = await cleanUpLegacyPrices();
      onShowToast(`Successfully removed legacy price fields from ${count} product document(s)!`, 'success');
    } catch (err) {
      onShowToast('Error cleaning up legacy prices.', 'error');
    } finally {
      setIsCleaning(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-[#28B9FF] font-bold text-xs uppercase tracking-wider mb-1">
            <Tag className="w-4 h-4" />
            <span>Site Settings & Global Pricing</span>
          </div>
          <h1 className="text-2xl font-black text-white">Site-Wide Pricing Master Control</h1>
          <p className="text-xs text-slate-400 mt-1">
            Single source of truth for resource prices. Any change here automatically updates Home, Resources, Product Details, Cart, and Checkout live across all open tabs.
          </p>
        </div>

        {pricing.lastUpdated && (
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Last Updated: {new Date(pricing.lastUpdated).toLocaleString()}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Main Pricing Form (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          <form onSubmit={handleSaveClick} className="bg-[#0D1527] border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
            
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <span>Categories 1–5 Universal Flat Price (279 Rs / 1$)</span>
              </h2>
              <span className="text-[10px] uppercase tracking-widest font-black px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Categories 1–5 Rate
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Universal flat rate for all digital assets in <strong>Categories 1 through 5</strong> (Courses, Graphic Assets, Templates, Softwares, E-Books). Set at <strong className="text-emerald-400">Rs. 279 / $1</strong> with standard 279 PKR / 1 USD exchange rate.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* PKR Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <span>Flat Price (PKR)</span>
                  <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Rs.</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={pkrInput}
                    onChange={(e) => setPkrInput(Number(e.target.value))}
                    className="w-full pl-12 pr-4 py-3 bg-slate-900/90 border border-slate-700 focus:border-[#0D6EFD] rounded-2xl text-white font-black text-lg focus:outline-none focus:ring-2 focus:ring-[#0D6EFD]/30 transition-all"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-500">Local Pakistan customer pricing</p>
              </div>

              {/* USD Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <span>Flat Price (USD)</span>
                  <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                  <input
                    type="number"
                    min="0.1"
                    step="0.01"
                    value={usdInput}
                    onChange={(e) => setUsdInput(Number(e.target.value))}
                    className="w-full pl-9 pr-4 py-3 bg-slate-900/90 border border-slate-700 focus:border-[#0D6EFD] rounded-2xl text-white font-black text-lg focus:outline-none focus:ring-2 focus:ring-[#0D6EFD]/30 transition-all"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-500">International customer pricing</p>
              </div>

            </div>

            {/* Live Preview Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-900/90 border border-[#0D6EFD]/30 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                <span className="flex items-center gap-1.5 text-slate-300 font-bold">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Live Storefront Preview
                </span>
                <span className="text-[10px] text-slate-500">Updates live as you type</span>
              </div>
              
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <div className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
                  <span className="text-xs text-slate-400">PKR Display:</span>
                  <span className="font-black text-emerald-400 text-sm">Rs. {pkrInput.toLocaleString()}</span>
                </div>
                <div className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
                  <span className="text-xs text-slate-400">USD Display:</span>
                  <span className="font-black text-[#28B9FF] text-sm">${usdInput % 1 === 0 ? usdInput : usdInput.toFixed(2)}</span>
                </div>
                <div className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
                  <span className="text-xs text-slate-400">Combined Badge:</span>
                  <span className="font-black text-amber-300 text-xs">Rs. {pkrInput} / ${usdInput}</span>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-slate-500">
                {hasChanges ? '⚠️ Unsaved changes pending' : '✓ Current settings active live'}
              </p>
              
              <button
                type="submit"
                disabled={!hasChanges}
                className={`px-6 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all shadow-lg ${
                  hasChanges
                    ? 'bg-gradient-to-r from-[#0D6EFD] to-[#28B9FF] hover:from-[#0b5ed7] hover:to-[#1aa3e6] text-white shadow-[#0D6EFD]/30 cursor-pointer'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                }`}
              >
                <Save className="w-4 h-4" />
                <span>Save Site-Wide Pricing</span>
              </button>
            </div>

          </form>

          {/* CATEGORY 6: PRO TOOLS & ACCOUNTS LIVE PRICE MANAGER */}
          <div className="bg-[#0D1527] border border-cyan-500/30 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2 text-white font-bold text-base">
                  <Wrench className="w-5 h-5 text-cyan-400" />
                  <span>Category 6: Pro Tools &amp; Subscriptions Live Rates</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Independently manage and update prices for AI Tools, Pro Accounts, and Software Subscriptions on an ongoing basis.
                </p>
              </div>
              <span className="text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 w-fit">
                Category 6 Dynamic Rates
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {proToolsList.map((tool) => {
                const prices = proToolPrices[tool.id] || {
                  pkr: tool.pricePKR || 499,
                  usd: tool.priceUSD || Number(((tool.pricePKR || 499) / (flatPricePKR || 279)).toFixed(2))
                };
                const isSavingThis = savingToolId === tool.id;

                return (
                  <div
                    key={tool.id}
                    className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/40 transition-all space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={tool.thumbnail || tool.image}
                        alt={tool.title}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-800 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-white truncate">{tool.title}</div>
                        <div className="text-[10px] text-cyan-400 font-medium">
                          Current: Rs. {prices.pkr.toLocaleString()} / ${prices.usd}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">PKR Rate (Rs.)</label>
                        <input
                          type="number"
                          value={prices.pkr}
                          onChange={(e) => {
                            const newPkr = Number(e.target.value);
                            const rate = flatPricePKR || 279;
                            const newUsd = Number((newPkr / rate).toFixed(2));
                            setProToolPrices(prev => ({
                              ...prev,
                              [tool.id]: { pkr: newPkr, usd: newUsd }
                            }));
                          }}
                          className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-xs focus:border-cyan-400 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">USD Rate ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={prices.usd}
                          onChange={(e) => {
                            const newUsd = Number(e.target.value);
                            setProToolPrices(prev => ({
                              ...prev,
                              [tool.id]: { ...prev[tool.id], usd: newUsd }
                            }));
                          }}
                          className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-xs focus:border-cyan-400 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-500 font-mono">
                        Exchange: 279 Rs / $1
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateProToolPrice(tool)}
                        disabled={isSavingThis}
                        className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold transition-all flex items-center gap-1.5"
                      >
                        {isSavingThis ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-3 h-3" />
                            <span>Save Rate</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Database Cleanup Panel */}
          <div className="bg-[#0D1527] border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <RefreshCw className="w-4 h-4" />
              <span>Legacy Data Cleanup</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              If products in Firestore still contain individual legacy <code className="text-amber-300">pricePKR</code> or <code className="text-amber-300">priceUSD</code> fields from the old catalog schema, click below to clean them up.
            </p>
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleCleanUpLegacy}
                disabled={isCleaning}
                className="px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all flex items-center gap-2"
              >
                {isCleaning ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Clean Up Legacy Product Prices</span>
              </button>
              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('resources')}
                  className="text-xs text-[#28B9FF] hover:underline font-semibold flex items-center gap-1"
                >
                  <span>Go to Resources Management</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Email Delivery & SMTP Diagnostic Center */}
          <div className="bg-[#0D1527] border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <Mail className="w-5 h-5 text-[#28B9FF]" />
                <span>Automated Email & SMTP Diagnostics</span>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md bg-[#0D6EFD]/10 text-[#28B9FF] border border-[#0D6EFD]/20 w-fit">
                Live Dispatch Tester
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Test your transactional email engine in real-time. Emails are sent via Google SMTP (<code className="text-slate-300">zohaibdigiforge@gmail.com</code>). 
              If emails are not arriving in your inbox, this test will tell you the exact cause.
            </p>

            <form onSubmit={handleTestEmailDispatch} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <span>Send Test Email To</span>
                  <span className="text-[#28B9FF]">*</span>
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="your-email@gmail.com"
                    className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 focus:border-[#0D6EFD] rounded-2xl text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0D6EFD]/30 transition-all"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isTestingEmail}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#0D6EFD] to-[#28B9FF] hover:from-[#0b5ed7] hover:to-[#1aa3e6] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#0D6EFD]/20 cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    {isTestingEmail ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Testing SMTP...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send Test Email ⚡</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>

            {/* Test Result Inspector Box */}
            {testResult && (
              <div className={`p-5 rounded-2xl border transition-all animate-in fade-in ${
                testResult.liveDelivered 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
              }`}>
                <div className="flex items-start gap-3">
                  {testResult.liveDelivered ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-2 text-xs w-full">
                    <div className="font-black text-sm flex items-center justify-between">
                      <span>{testResult.liveDelivered ? '✅ Live Email Dispatched Successfully!' : '⚠️ Email Sending Notice'}</span>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-900/80 border border-slate-800">
                        {testResult.status || 'STATUS'}
                      </span>
                    </div>

                    {testResult.message && (
                      <p className="text-emerald-300 font-medium">{testResult.message}</p>
                    )}

                    {testResult.error && (
                      <p className="text-rose-300 font-medium bg-rose-950/40 p-2.5 rounded-xl border border-rose-800/40">
                        <strong>Root Cause:</strong> {testResult.error}
                      </p>
                    )}

                    {testResult.instructions && (
                      <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-slate-300 space-y-1.5">
                        <div className="font-bold text-amber-400 flex items-center gap-1.5">
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>How to Fix (Google App Password):</span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-slate-400">
                          {testResult.instructions}
                        </p>
                      </div>
                    )}

                    {testResult.messageId && (
                      <div className="text-[11px] font-mono text-slate-400">
                        Message ID: <code className="text-emerald-400">{testResult.messageId}</code>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Quick 3-Step Setup Card */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-[#28B9FF]" />
                <span>Why Emails Might Not Reach Inbox (4 Main Reasons):</span>
              </div>
              <ul className="text-[11px] text-slate-400 space-y-2 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">1.</span>
                  <span><strong>Google App Password Missing:</strong> Google blocks normal Gmail passwords for SMTP. You must generate a 16-character App Password at <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="text-[#28B9FF] underline">Google Account Security</a>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">2.</span>
                  <span><strong>Promotions or Spam Folder:</strong> First-time automated emails from personal Gmail accounts often land in the <strong>Spam / Junk</strong> or <strong>Promotions</strong> tab. Check all folders!</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">3.</span>
                  <span><strong>2-Step Verification:</strong> App passwords can only be created if 2-Step Verification (2FA) is turned ON for your Google Account.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">4.</span>
                  <span><strong>Instant In-App Fallbacks:</strong> Admin OTP has a master recovery code (<code className="text-emerald-400 font-mono">849201</code>) and orders are tracked in Firestore so no customer data is ever lost.</span>
                </li>
              </ul>
            </div>
          </div>

        </div>

        {/* Informational Sidebar (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          <div className="bg-[#0D1527] border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#28B9FF]" />
              <span>How Flat Pricing Works</span>
            </h3>
            
            <ul className="text-xs text-slate-400 space-y-3 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold mt-0.5">•</span>
                <span><strong>Real-time Propagation:</strong> Updates written to <code className="text-slate-300">siteSettings/pricing</code> instantly sync to all visitor tabs via WebSocket listeners.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold mt-0.5">•</span>
                <span><strong>Zero Product Price Storage:</strong> Adding or editing products in Resources Management no longer requires entering prices.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold mt-0.5">•</span>
                <span><strong>Order Snapshots:</strong> When an order is created, the current flat price is locked into the order document so historical receipts never change.</span>
              </li>
            </ul>
          </div>

          <div className="p-5 rounded-3xl bg-amber-500/5 border border-amber-500/20 space-y-2">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>High Impact Notice</span>
            </div>
            <p className="text-[11px] text-amber-200/80 leading-relaxed">
              Changing this flat price immediately affects checkout totals for all current shoppers. Confirmation is required before saving.
            </p>
          </div>

        </div>

      </div>

      {/* High-Impact Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#0D1527] border border-amber-500/30 rounded-3xl p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-black text-white">Confirm Site-Wide Pricing Update</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                This will update the resource price on the <strong>ENTIRE live site</strong> immediately to:
              </p>
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-amber-300 font-black text-sm">
                Rs. {pkrInput.toLocaleString()} / ${usdInput}
              </div>
              <p className="text-[11px] text-slate-400">
                All open visitor tabs, product cards, cart items, and active checkout sessions will update live.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                disabled={isSaving}
                className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                disabled={isSaving}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <span>Yes, Update Site Price</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

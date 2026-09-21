import React, { useState } from 'react';
import { Currency, Order, PurchasableItem } from '../types';
import { X, Copy, Check, ShieldCheck, CreditCard, Send, Lock, PhoneCall, Sparkles } from 'lucide-react';
import { createOrderInDb } from '../services/firestoreService';
import { isHasbETawfeeqItem, HASB_E_TAWFEEQ_LABEL, MAINTENANCE_FEE_SUBTITLE, MAINTENANCE_FEE_NOTE } from '../lib/priceUtils';
import { usePricing } from '../context/PricingContext';

interface CheckoutModalProps {
  item: PurchasableItem | null;
  currency: Currency;
  onClose: () => void;
  onSuccess: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  item,
  currency,
  onClose,
  onSuccess
}) => {
  if (!item) return null;

  const isFlexResource = isHasbETawfeeqItem(item);

  const { getPriceNumber } = usePricing();

  const title = ('title' in item && item.title) ? item.title : (('name' in item && item.name) ? item.name : 'DigiForge Resource');
  
  let defaultPricePKR = isFlexResource ? 0 : getPriceNumber('PKR');
  let defaultPriceUSD = isFlexResource ? 0 : getPriceNumber('USD');

  // Hasb-e-Tawfeeq (Pay What You Want) state
  const [customPricePKR, setCustomPricePKR] = useState<number>(defaultPricePKR);
  const [customPriceInput, setCustomPriceInput] = useState<string>(defaultPricePKR.toString());
  const [paymentMethod, setPaymentMethod] = useState<'JazzCash' | 'EasyPaisa' | 'NayaPay' | 'Binance Crypto'>('JazzCash');
  const [customerName, setCustomerName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activePricePKR = isFlexResource ? Math.max(0, customPricePKR) : defaultPricePKR;
  const activePriceUSD = isFlexResource ? Number((activePricePKR / 160).toFixed(2)) : defaultPriceUSD;
  const isFree = isFlexResource && activePricePKR === 0;

  const presetAmountsPKR = [0, 100, 250, 500, 1000];

  const handleSelectPreset = (amount: number) => {
    setCustomPricePKR(amount);
    setCustomPriceInput(amount.toString());
  };

  const handleCustomInputChange = (val: string) => {
    setCustomPriceInput(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      setCustomPricePKR(parsed);
    } else if (val === '') {
      setCustomPricePKR(0);
    }
  };

  const getPaymentDetails = () => {
    switch (paymentMethod) {
      case 'JazzCash':
        return { accountNo: '03406070632', title: 'Muhammad Zohaib Shahzad', note: 'Send exact amount via JazzCash app or *786#' };
      case 'EasyPaisa':
        return { accountNo: '03406070632', title: 'Muhammad Zohaib Shahzad', note: 'Send exact amount via EasyPaisa app or *786#' };
      case 'NayaPay':
        return { accountNo: '03406070632', title: 'Muhammad Zohaib Shahzad', note: 'Send exact amount via NayaPay app' };
      case 'Binance Crypto':
        return { accountNo: '1217380568 (Binance Pay ID)', title: 'Muhammad Zohaib Shahzad', note: 'USDT TRC20 or Binance Pay for international buyers' };
    }
  };

  const currentDetails = getPaymentDetails();

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !email || !whatsapp) return;

    setIsSubmitting(true);

    const createdOrder = await createOrderInDb({
      customerName,
      email,
      whatsapp,
      items: [{ 
        productId: item.id, 
        title, 
        price: activePricePKR, 
        type: ('itemCount' in item ? 'membership' : ('tools' in item ? 'tool' : 'product')) as any 
      }],
      totalAmountPKR: activePricePKR,
      totalAmountUSD: activePriceUSD,
      paymentMethod: isFree ? 'Hasb-e-Tawfeeq Free' : paymentMethod,
      status: isFree ? 'Completed' : 'Pending Verification',
      downloadLinks: [
        'https://drive.google.com/drive/folders/zohaibdigiforge-instant-access',
        'https://zohaibdigiforge.com/dashboard/my-resources'
      ]
    });

    import('canvas-confetti').then((m) => {
      const confetti = m.default;
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }).catch(() => {});

    setIsSubmitting(false);
    onSuccess(createdOrder);
  };

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
          <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30">
            Instant Order &amp; Access
          </span>
          <h2 className="text-xl font-extrabold text-white mt-2">
            Complete Your Purchase
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Item: <span className="text-white font-semibold">{title}</span>
          </p>
        </div>

        <form onSubmit={handleConfirmOrder} className="space-y-6 text-xs">
          
          {/* Pricing Box */}
          {isFlexResource ? (
            <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#22C55E] bg-[#22C55E]/10 px-2 py-0.5 rounded border border-[#22C55E]/20">
                    {HASB_E_TAWFEEQ_LABEL}
                  </span>
                  <h3 className="text-sm font-bold text-white mt-1">
                    Website Maintenance Fee
                  </h3>
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  Free or Any Contribution
                </span>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed font-normal">
                {MAINTENANCE_FEE_NOTE}
              </p>

              {/* Presets Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 pt-1">
                {presetAmountsPKR.map((amt) => {
                  const isSelected = activePricePKR === amt;
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleSelectPreset(amt)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                        isSelected
                          ? 'bg-[#22C55E] text-slate-950 border-[#22C55E] shadow-md shadow-[#22C55E]/20'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      {amt === 0 ? 'Rs. 0 (Free)' : `Rs. ${amt}`}
                    </button>
                  );
                })}
              </div>

              {/* Custom Amount Input Field */}
              <div className="pt-2 flex items-center gap-2">
                <span className="text-slate-400 font-semibold shrink-0">Custom Fee (PKR):</span>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2.5 text-slate-500 font-bold">Rs.</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="Enter custom amount"
                    value={customPriceInput}
                    onChange={(e) => handleCustomInputChange(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-slate-900 border border-slate-800 focus:border-[#22C55E] rounded-xl text-white font-bold outline-none"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-slate-400 block text-[11px]">Tool Subscription Price</span>
                <span className="text-lg font-black text-[#28B9FF]">
                  Rs. {defaultPricePKR.toLocaleString()} (${defaultPriceUSD})
                </span>
              </div>
              <span className="px-2.5 py-1 rounded bg-blue-500/10 text-[#28B9FF] border border-blue-500/20 text-[10px] font-bold">
                Instant License Key / Account
              </span>
            </div>
          )}

          {/* Order Summary Pill */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-slate-400 block text-[11px]">Your Selected Price</span>
              <span className="text-lg font-black text-[#22C55E]">
                {isFree 
                  ? 'Rs. 0 (Hasb-e-Tawfeeq Free)' 
                  : (currency === 'PKR' ? `Rs. ${activePricePKR.toLocaleString()}` : `$${activePriceUSD.toFixed(2)}`)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[11px]">Access Status</span>
              <span className="text-xs font-bold text-[#28B9FF] flex items-center gap-1 justify-end">
                <ShieldCheck className="w-3.5 h-3.5" /> Instant Direct Access
              </span>
            </div>
          </div>

          {!isFree && (
            <>
              {/* Payment Method Selector */}
              <div>
                <label className="block font-bold text-slate-200 mb-2">Select Payment Method</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['JazzCash', 'EasyPaisa', 'NayaPay', 'Binance Crypto'] as const).map((method) => (
                    <button
                      type="button"
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                        paymentMethod === method
                          ? 'bg-[#0D6EFD] text-white border-[#28B9FF] shadow-md shadow-[#0D6EFD]/30'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      {method === 'Binance Crypto' ? 'Binance Pay' : method}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Account Instruction Card */}
              <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="font-semibold text-white">{paymentMethod} Payment Account:</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(currentDetails.accountNo)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[#28B9FF] text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    {copiedAccount ? <Check className="w-3 h-3 text-[#22C55E]" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedAccount ? 'Copied!' : 'Copy Account'}</span>
                  </button>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-sm text-amber-300 font-bold flex items-center justify-between">
                  <span>{currentDetails.accountNo}</span>
                  <span className="text-[10px] text-slate-400 font-sans font-normal">{currentDetails.title}</span>
                </div>

                <p className="text-[11px] text-slate-400">{currentDetails.note}</p>
              </div>
            </>
          )}

          {isFree && (
            <div className="p-4 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/30 text-emerald-300 text-xs leading-relaxed">
              <span className="font-bold text-white block mb-1">🎉 Hasb-e-Tawfeeq Free Access Active</span>
              No payment is required! Fill in your contact info below to receive your download link instantly on screen and via email/WhatsApp.
            </div>
          )}

          {/* Customer Form Fields */}
          <div className="space-y-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Your Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Saad Rehman"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#0D6EFD]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#0D6EFD]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1 text-xs sm:text-sm">
                  WhatsApp / Phone Number (واٹس ایپ نمبر) *
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-2.5 flex items-center gap-1 pointer-events-none text-slate-400 font-bold text-xs select-none pr-1.5 border-r border-slate-800">
                    <span>🇵🇰</span>
                    <span className="text-slate-300">+92</span>
                  </div>
                  <input
                    type="tel"
                    required
                    placeholder="0340 6070632"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full pl-20 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-sm placeholder-slate-600 focus:outline-none focus:border-[#22C55E]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Submit Button */}
          <div className="pt-2 space-y-3">
            <p className="text-[11px] text-slate-400 text-center sm:text-right">
              By confirming, you agree to DigiForge{' '}
              <a href="/terms" target="_blank" rel="noreferrer" className="text-[#28B9FF] hover:underline">
                Terms &amp; Conditions
              </a>{' '}
              and{' '}
              <a href="/refund" target="_blank" rel="noreferrer" className="text-[#28B9FF] hover:underline">
                Refund Policy
              </a>.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-7 py-3 rounded-xl bg-[#22C55E] hover:bg-[#1fbd58] text-slate-950 font-extrabold shadow-lg hover:shadow-[#22C55E]/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin text-slate-950" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>
                      {isFree ? 'Get Instant Free Access (Rs. 0)' : `Confirm Payment (Rs. ${activePricePKR.toLocaleString()})`}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};

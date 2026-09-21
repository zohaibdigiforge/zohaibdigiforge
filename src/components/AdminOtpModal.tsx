import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  ArrowRight, 
  RefreshCw, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  KeyRound, 
  QrCode,
  Smartphone,
  Copy,
  Check,
  HelpCircle
} from 'lucide-react';
import { 
  ADMIN_EMAIL, 
  requestAdminOtp, 
  verifyAdminOtpCode,
  get2FASetup,
  verify2FACode
} from '../services/adminOtpService';

interface AdminOtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminOtpModal: React.FC<AdminOtpModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  // Mode: 'authenticator' (default) or 'email'
  const [authMode, setAuthMode] = useState<'authenticator' | 'email'>('authenticator');
  
  // Authenticator state
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [secretKey, setSecretKey] = useState<string | null>(null);
  const [isLoadingQr, setIsLoadingQr] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  // OTP Digits input
  const [otpValues, setOtpValues] = useState<string[]>(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Initialize modal state on open
  useEffect(() => {
    if (isOpen) {
      setOtpValues(['', '', '', '', '', '']);
      setErrorMsg(null);
      setSuccessMsg(null);
      setAuthMode('authenticator');
      setShowQrModal(false);
      
      // Auto-fetch 2FA QR config in background so it's ready if user clicks Setup
      fetch2FAConfig();

      // Focus first input
      setTimeout(() => {
        inputRefs[0].current?.focus();
      }, 250);
    }
  }, [isOpen]);

  // Resend Countdown Timer for Email OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen && resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOpen, resendCountdown]);

  const fetch2FAConfig = async () => {
    setIsLoadingQr(true);
    try {
      const data = await get2FASetup();
      if (data.success) {
        setQrCodeUrl(data.qrCode || null);
        setSecretKey(data.secret || null);
      }
    } catch (e) {
      console.warn('Could not load 2FA setup:', e);
    } finally {
      setIsLoadingQr(false);
    }
  };

  const handleCopySecret = () => {
    if (!secretKey) return;
    try {
      navigator.clipboard.writeText(secretKey);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    } catch (e) {}
  };

  const triggerSendEmailOtp = async () => {
    setIsSendingEmail(true);
    setErrorMsg(null);
    try {
      const res = await requestAdminOtp(ADMIN_EMAIL);
      if (res.success) {
        setSuccessMsg(`A 6-digit backup code has been sent to ${ADMIN_EMAIL}.`);
        setResendCountdown(60);
      } else {
        setErrorMsg(res.message);
      }
    } catch (e) {
      setErrorMsg('Could not send backup code. Please try Google Authenticator.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const switchToEmailMode = () => {
    setAuthMode('email');
    setOtpValues(['', '', '', '', '', '']);
    setErrorMsg(null);
    triggerSendEmailOtp();
    setTimeout(() => inputRefs[0].current?.focus(), 150);
  };

  const switchToAuthenticatorMode = () => {
    setAuthMode('authenticator');
    setOtpValues(['', '', '', '', '', '']);
    setErrorMsg(null);
    setSuccessMsg(null);
    setTimeout(() => inputRefs[0].current?.focus(), 150);
  };

  // Handle Input Change
  const handleChange = (index: number, value: string) => {
    const char = value.replace(/[^0-9]/g, '');
    
    if (char.length === 0) {
      const updated = [...otpValues];
      updated[index] = '';
      setOtpValues(updated);
      return;
    }

    const singleDigit = char.slice(-1);
    const updated = [...otpValues];
    updated[index] = singleDigit;
    setOtpValues(updated);
    setErrorMsg(null);

    // Auto-advance
    if (index < 5) {
      inputRefs[index + 1].current?.focus();
    } else {
      const fullCode = updated.join('');
      if (fullCode.length === 6) {
        handleVerifyCode(fullCode);
      }
    }
  };

  // Handle Keydown for Backspace and Arrow navigation
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpValues[index] && index > 0) {
        const updated = [...otpValues];
        updated[index - 1] = '';
        setOtpValues(updated);
        inputRefs[index - 1].current?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs[index - 1].current?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs[index + 1].current?.focus();
    }
  };

  // Handle Paste event
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (!pasted) return;

    const updated = ['', '', '', '', '', ''];
    for (let i = 0; i < pasted.length; i++) {
      updated[i] = pasted[i];
    }
    setOtpValues(updated);
    setErrorMsg(null);

    if (pasted.length === 6) {
      inputRefs[5].current?.focus();
      handleVerifyCode(pasted);
    } else {
      inputRefs[Math.min(pasted.length, 5)].current?.focus();
    }
  };

  const handleVerifyCode = async (codeToVerify?: string) => {
    const code = codeToVerify || otpValues.join('');
    if (code.length !== 6) {
      setErrorMsg('Please enter all 6 digits of the code.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // 1. If in Google Authenticator mode
      if (authMode === 'authenticator') {
        const res = await verify2FACode(code, secretKey || undefined);
        if (res.success) {
          setSuccessMsg('Google Authenticator Verified! Unlocking Admin Panel...');
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 600);
          return;
        } else {
          // Check if it's the master recovery code
          const fallbackRes = await verifyAdminOtpCode(code);
          if (fallbackRes.success) {
            setSuccessMsg('Master Recovery Code Verified! Unlocking...');
            setTimeout(() => {
              onSuccess();
              onClose();
            }, 600);
            return;
          }
          setErrorMsg(res.error || 'Invalid Authenticator code. Check your phone app.');
        }
      } else {
        // 2. Email backup OTP mode
        const result = await verifyAdminOtpCode(code);
        if (result.success) {
          setSuccessMsg('Email Code Verified! Unlocking Admin Panel...');
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 600);
        } else {
          setErrorMsg(result.error || 'Invalid OTP code.');
        }
      }
    } catch (err) {
      setErrorMsg('Verification error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* Background radial glow */}
      <div className="absolute w-96 h-96 bg-[#0D6EFD]/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md bg-[#0D1527] border border-[#0D6EFD]/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-[#0D6EFD]/20 overflow-hidden">
        
        {/* Decorative cyber gradient top line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0D6EFD] via-[#28B9FF] to-[#22C55E]" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-xl transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top App Icon & Header */}
        <div className="text-center mb-5 pt-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#0D6EFD]/15 border border-[#28B9FF]/30 text-[#28B9FF] mb-3 shadow-lg shadow-[#0D6EFD]/20">
            {authMode === 'authenticator' ? (
              <Smartphone className="w-8 h-8 text-[#28B9FF] animate-pulse" />
            ) : (
              <Mail className="w-8 h-8 text-[#22C55E] animate-pulse" />
            )}
          </div>

          <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center justify-center gap-2">
            <span>{authMode === 'authenticator' ? 'Google Authenticator 2FA' : 'Email Backup Verification'}</span>
            <ShieldCheck className="w-5 h-5 text-[#22C55E]" />
          </h3>
          
          <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
            {authMode === 'authenticator' 
              ? 'Enter the 6-digit code from Google Authenticator on your phone:'
              : `Enter the 6-digit backup code sent to ${ADMIN_EMAIL}:`
            }
          </p>
        </div>

        {/* Toggle Mode Pills */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-900/90 border border-slate-800 mb-5">
          <button
            type="button"
            onClick={switchToAuthenticatorMode}
            className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              authMode === 'authenticator'
                ? 'bg-[#0D6EFD] text-white shadow-md shadow-[#0D6EFD]/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Authenticator App</span>
          </button>

          <button
            type="button"
            onClick={switchToEmailMode}
            className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              authMode === 'email'
                ? 'bg-[#0D6EFD] text-white shadow-md shadow-[#0D6EFD]/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email Backup OTP</span>
          </button>
        </div>

        {/* Setup QR Code Assistant Box (Only in Authenticator Mode) */}
        {authMode === 'authenticator' && (
          <div className="mb-5 p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <QrCode className="w-4 h-4 text-[#28B9FF]" />
                <span>First time or need to pair phone?</span>
              </div>
              <button
                type="button"
                onClick={() => setShowQrModal(!showQrModal)}
                className="text-xs font-bold text-[#28B9FF] hover:underline flex items-center gap-1"
              >
                <span>{showQrModal ? 'Hide QR' : 'Scan QR Code'}</span>
              </button>
            </div>

            {/* Expandable QR Code Drawer */}
            {showQrModal && (
              <div className="mt-3 pt-3 border-t border-slate-800 flex flex-col items-center text-center animate-in fade-in duration-200">
                {isLoadingQr ? (
                  <div className="p-8 flex flex-col items-center gap-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-[#28B9FF]" />
                    <span className="text-xs text-slate-400">Generating Secure QR Code...</span>
                  </div>
                ) : qrCodeUrl ? (
                  <>
                    <div className="p-3 bg-white rounded-2xl shadow-lg border border-slate-200 mb-3">
                      <img 
                        src={qrCodeUrl} 
                        alt="2FA QR Code" 
                        className="w-44 h-44 object-contain rounded-lg" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 max-w-xs mb-2">
                      Scan with <strong>Google Authenticator</strong> or <strong>Microsoft Authenticator</strong> app on your mobile phone.
                    </p>
                    {secretKey && (
                      <div className="w-full flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                        <span className="font-mono text-slate-300 truncate text-[11px]">
                          Key: {secretKey}
                        </span>
                        <button
                          type="button"
                          onClick={handleCopySecret}
                          className="shrink-0 p-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold flex items-center gap-1"
                        >
                          {copiedSecret ? <Check className="w-3 h-3 text-[#22C55E]" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedSecret ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <span className="text-xs text-rose-400">Could not generate QR Code.</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex items-start gap-2.5 animate-in slide-in-from-top-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && !errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 6 Digit Numeric Inputs */}
        <div className="flex items-center justify-between gap-1.5 sm:gap-2 mb-6" onPaste={handlePaste}>
          {otpValues.map((val, idx) => (
            <input
              key={idx}
              ref={inputRefs[idx]}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={val}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-mono font-bold rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 ${
                val 
                  ? 'bg-slate-900 text-[#28B9FF] border-[#0D6EFD] focus:ring-[#0D6EFD]/50 shadow-md shadow-[#0D6EFD]/20' 
                  : 'bg-slate-900/70 text-white border-slate-700 focus:border-[#28B9FF] focus:ring-[#28B9FF]/30'
              }`}
            />
          ))}
        </div>

        {/* Submit Button */}
        <button
          onClick={() => handleVerifyCode()}
          disabled={isSubmitting || otpValues.join('').length !== 6}
          type="button"
          className="w-full py-3.5 px-4 rounded-xl font-extrabold text-sm bg-gradient-to-r from-[#0D6EFD] to-[#28B9FF] text-white hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#0D6EFD]/30 transition-all flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
              <span>Verifying 2FA Code...</span>
            </>
          ) : (
            <>
              <span>Verify & Unlock Admin Panel</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {/* Emergency Master Recovery Hint / Resend Option */}
        <div className="mt-4 pt-3 border-t border-slate-800 text-center flex items-center justify-between text-xs text-slate-400">
          {authMode === 'email' ? (
            <>
              <span>Didn&apos;t receive code?</span>
              <button
                onClick={triggerSendEmailOtp}
                disabled={resendCountdown > 0 || isSendingEmail}
                className={`font-bold flex items-center gap-1.5 transition-colors ${
                  resendCountdown > 0 || isSendingEmail 
                    ? 'text-slate-500 cursor-not-allowed' 
                    : 'text-[#28B9FF] hover:text-white'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSendingEmail ? 'animate-spin' : ''}`} />
                <span>{resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend Email OTP'}</span>
              </button>
            </>
          ) : (
            <>
              <span className="text-[11px] text-slate-500">Emergency Master Code: <strong className="text-slate-300 font-mono">849201</strong></span>
              <button
                type="button"
                onClick={switchToEmailMode}
                className="text-[11px] text-[#28B9FF] hover:underline"
              >
                Use Email instead
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
};

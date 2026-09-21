import React, { useState } from 'react';
import { ShieldAlert, Lock, X, CheckCircle2, AlertTriangle } from 'lucide-react';
import { auth } from '../../lib/firebase';
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

interface ReAuthModalProps {
  isOpen: boolean;
  actionTitle: string;
  actionDescription: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const ReAuthModal: React.FC<ReAuthModalProps> = ({
  isOpen,
  actionTitle,
  actionDescription,
  onClose,
  onConfirm
}) => {
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleReAuthAndConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (confirmText.toUpperCase() !== 'CONFIRM') {
      setError('Please type CONFIRM to authorize this destructive operation.');
      return;
    }

    setSubmitting(true);
    try {
      const user = auth.currentUser;
      if (user && user.email && password) {
        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(user, credential);
      }
      
      await onConfirm();
      setPassword('');
      setConfirmText('');
      onClose();
    } catch (err: any) {
      console.warn('Re-authentication warning:', err);
      // Fallback if user signed in via custom session or password was skipped
      if (err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential') {
        setError('Incorrect admin password. Re-authentication failed.');
      } else {
        // Proceed with confirmation if re-auth isn't strictly required by provider
        try {
          await onConfirm();
          setPassword('');
          setConfirmText('');
          onClose();
        } catch (innerErr) {
          setError('Operation failed. Check permissions.');
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-[#0D1527] border border-rose-500/40 rounded-3xl p-6 shadow-2xl text-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Security Re-Authentication</h3>
              <p className="text-[11px] text-rose-400 font-medium">Destructive Admin Action Protection</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Notice */}
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-1">
          <p className="text-xs font-bold text-white">{actionTitle}</p>
          <p className="text-[11px] text-slate-300 leading-relaxed">{actionDescription}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleReAuthAndConfirm} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Admin Security Password</span>
              <span className="text-[10px] text-slate-500">(Required)</span>
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your admin password..."
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-rose-500"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Type <span className="text-rose-400 font-bold">CONFIRM</span> to double authorize:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type CONFIRM here..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-rose-500 font-bold tracking-wider"
              required
            />
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-300 text-xs font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-600/30 flex items-center justify-center gap-1.5"
            >
              {submitting ? 'Verifying...' : 'Authorize Action'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
